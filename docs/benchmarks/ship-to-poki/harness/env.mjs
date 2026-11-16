// A fake browser for scoring a small canvas game without a real browser.
// It records what the game does (SDK calls, audio, listeners, console, draw calls) and lets a
// driver step time, fire input, and flip conditions (ad blocker, no storage, blocked requests).
// No dependencies. One process per scenario, because the game's modules are cached per process.
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

export async function createEnv(gameDir, opt = {}) {
  const real = { setImmediate, setTimeout, clearTimeout, log: console.log.bind(console) };
  const log = { sdk: [], audio: [], listeners: [], console: [], warn: 0, errors: [], fetches: [], notes: [] };
  let now = 1000;
  let frameNo = 0;
  let firstInputFrame = null;
  let lastFrameCalls = [];
  const drawCalls = [];
  const allEls = [];
  const audioEls = [];
  const audioCtxs = [];
  const breaks = [];
  const err = (where, e) => log.errors.push({ where, frame: frameNo, msg: String((e && e.stack) || e).split("\n").slice(0, 3).join(" | ") });

  // ---------- timers on the fake clock
  const timers = new Map();
  let timerId = 1;
  const fakeSetTimeout = (fn, ms = 0, ...a) => { const id = timerId++; timers.set(id, { at: now + Math.max(0, Number(ms) || 0), fn, a, every: 0 }); return id; };
  const fakeSetInterval = (fn, ms = 0, ...a) => { const id = timerId++; const every = Math.max(1, Number(ms) || 1); timers.set(id, { at: now + every, fn, a, every }); return id; };
  const fakeClear = (id) => { timers.delete(id); };
  function runTimers() {
    for (let guard = 0; guard < 2000; guard++) {
      let next = null, nid = null;
      for (const [id, t] of timers) if (t.at <= now && (!next || t.at < next.at)) { next = t; nid = id; }
      if (!next) break;
      if (next.every) next.at += next.every; else timers.delete(nid);
      try { if (typeof next.fn === "function") next.fn(...next.a); } catch (e) { err("timer", e); }
    }
  }

  // ---------- events
  class FakeEvent {
    constructor(type, init = {}) {
      this.type = type; this.bubbles = true; this.cancelable = true; this.defaultPrevented = false;
      this._stopped = false; this._stoppedNow = false; this.timeStamp = now; this.detail = undefined;
      this.isTrusted = true; this.repeat = false;
      Object.assign(this, init);
    }
    preventDefault() { this.defaultPrevented = true; }
    stopPropagation() { this._stopped = true; }
    stopImmediatePropagation() { this._stopped = true; this._stoppedNow = true; }
    composedPath() { return []; }
    getModifierState() { return false; }
  }
  class Target {
    constructor(name) { this._name = name; this._listeners = new Map(); this._parent = null; }
    addEventListener(type, fn, o) {
      if (!fn) return;
      log.listeners.push({ t: this._name, type, op: "add", frame: frameNo });
      const arr = this._listeners.get(type) || [];
      if (!arr.some((l) => l.fn === fn)) arr.push({ fn, once: !!(o && typeof o === "object" && o.once) });
      this._listeners.set(type, arr);
    }
    removeEventListener(type, fn) {
      log.listeners.push({ t: this._name, type, op: "remove", frame: frameNo });
      this._listeners.set(type, (this._listeners.get(type) || []).filter((l) => l.fn !== fn));
    }
    _fire(evt) {
      if (this instanceof El && this.tagName === "AUDIO" && ["loadedmetadata", "loadeddata", "canplay", "canplaythrough"].includes(evt.type)) { for (const l of [...(this._listeners.get(evt.type) || [])]) { if (l.once) this._listeners.set(evt.type, (this._listeners.get(evt.type) || []).filter((x) => x !== l)); try { l.fn.call ? l.fn.call(this, evt) : l.fn.handleEvent(evt); } catch (e) { err("listener:" + evt.type, e); } } return; }
      for (const l of [...(this._listeners.get(evt.type) || [])]) {
        if (l.once) this._listeners.set(evt.type, (this._listeners.get(evt.type) || []).filter((x) => x !== l));
        try { if (typeof l.fn === "function") l.fn.call(this, evt); else if (l.fn && typeof l.fn.handleEvent === "function") l.fn.handleEvent(evt); } catch (e) { err("listener:" + evt.type, e); }
        if (evt._stoppedNow) break;
      }
      const h = this["on" + evt.type];
      if (typeof h === "function") { try { h.call(this, evt); } catch (e) { err("on" + evt.type, e); } }
    }
    dispatchEvent(evt) {
      if (!evt.target) evt.target = this;
      evt.srcElement = evt.target;
      let node = this;
      while (node) { evt.currentTarget = node; node._fire(evt); if (evt._stopped || evt.bubbles === false) break; node = node._parent; }
      return !evt.defaultPrevented;
    }
    _count(type) { return (this._listeners.get(type) || []).length; }
  }

  // ---------- elements
  const makeStyle = () => new Proxy({ setProperty(k, v) { this[k] = v; }, removeProperty(k) { delete this[k]; }, getPropertyValue(k) { return this[k] ?? ""; } },
    { get(t, k) { return k in t ? t[k] : ""; }, set(t, k, v) { t[k] = v; return true; } });
  function makeCtx(canvas) {
    const state = { fillStyle: "#000", strokeStyle: "#000", font: "10px sans-serif", globalAlpha: 1, lineWidth: 1, textAlign: "start", textBaseline: "alphabetic",
      imageSmoothingEnabled: true, shadowBlur: 0, shadowColor: "rgba(0,0,0,0)", shadowOffsetX: 0, shadowOffsetY: 0, lineCap: "butt", lineJoin: "miter",
      globalCompositeOperation: "source-over", filter: "none", direction: "ltr", letterSpacing: "0px", lineDashOffset: 0, miterLimit: 10 };
    const special = {
      measureText: (s) => ({ width: String(s).length * 8, actualBoundingBoxAscent: 10, actualBoundingBoxDescent: 2, fontBoundingBoxAscent: 10, fontBoundingBoxDescent: 2 }),
      createLinearGradient: () => ({ addColorStop() {} }), createRadialGradient: () => ({ addColorStop() {} }), createConicGradient: () => ({ addColorStop() {} }),
      createPattern: () => ({ setTransform() {} }),
      getImageData: (x, y, w = 1, h = 1) => ({ data: new Uint8ClampedArray(Math.max(4, w * h * 4)), width: w, height: h }),
      createImageData: (w = 1, h = 1) => ({ data: new Uint8ClampedArray(Math.max(4, w * h * 4)), width: w, height: h }),
      getTransform: () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0, inverse() { return this; } }),
      isPointInPath: () => false, isPointInStroke: () => false, getLineDash: () => [], getContextAttributes: () => ({}),
    };
    return new Proxy(state, {
      get(t, k) {
        if (k === "canvas") return canvas;
        if (typeof k === "symbol") return undefined;
        if (k in t) return t[k];
        if (k in special) return special[k];
        return (...args) => { drawCalls.push([k, args.map((a) => (typeof a === "number" ? Math.round(a * 100) / 100 : typeof a === "string" ? a : typeof a))]); };
      },
      set(t, k, v) { t[k] = v; return true; },
    });
  }
  class El extends Target {
    constructor(tag, attrs = {}) {
      super(String(tag).toLowerCase());
      this.tagName = String(tag).toUpperCase(); this.nodeName = this.tagName; this.nodeType = 1;
      this.attributes = { ...attrs }; this.id = attrs.id || ""; this.className = attrs.class || "";
      this.style = makeStyle(); this.children = []; this.childNodes = this.children; this.dataset = {};
      this.textContent = ""; this.innerHTML = ""; this.innerText = ""; this.hidden = false; this.disabled = false; this.value = "";
      this.width = Number(attrs.width) || 300; this.height = Number(attrs.height) || 150;
      this.src = attrs.src || ""; this.href = attrs.href || "";
      const self = this;
      this.classList = {
        _s: new Set(String(this.className).split(/\s+/).filter(Boolean)),
        add(...c) { c.forEach((x) => this._s.add(x)); self.className = [...this._s].join(" "); },
        remove(...c) { c.forEach((x) => this._s.delete(x)); self.className = [...this._s].join(" "); },
        toggle(c, f) { const on = f === undefined ? !this._s.has(c) : !!f; on ? this._s.add(c) : this._s.delete(c); self.className = [...this._s].join(" "); return on; },
        contains(c) { return this._s.has(c); },
      };
      allEls.push(this);
    }
    get parentNode() { return this._parent; }
    get parentElement() { return this._parent instanceof El ? this._parent : null; }
    get firstChild() { return this.children[0] || null; }
    get lastChild() { return this.children[this.children.length - 1] || null; }
    get clientWidth() { return this.tagName === "CANVAS" ? globalThis.innerWidth : Number(this.width) || globalThis.innerWidth; }
    get clientHeight() { return this.tagName === "CANVAS" ? globalThis.innerHeight : Number(this.height) || globalThis.innerHeight; }
    get offsetWidth() { return this.clientWidth; }
    get offsetHeight() { return this.clientHeight; }
    get isConnected() { return true; }
    get ownerDocument() { return globalThis.document; }
    setAttribute(k, v) { this.attributes[k] = String(v); if (k === "id") this.id = String(v); if (k === "class") { this.className = String(v); this.classList._s = new Set(String(v).split(/\s+/).filter(Boolean)); } if (k === "width" || k === "height") this[k] = Number(v); if (k === "src" || k === "href") this[k] = String(v); }
    getAttribute(k) { return k in this.attributes ? this.attributes[k] : null; }
    hasAttribute(k) { return k in this.attributes; }
    removeAttribute(k) { delete this.attributes[k]; }
    toggleAttribute(k, f) { const on = f === undefined ? !(k in this.attributes) : !!f; if (on) this.attributes[k] = ""; else delete this.attributes[k]; return on; }
    appendChild(c) { if (c && typeof c === "object") { c._parent = this; this.children.push(c); onAttach(c); } return c; }
    append(...cs) { cs.forEach((c) => typeof c === "object" && this.appendChild(c)); }
    prepend(...cs) { cs.forEach((c) => typeof c === "object" && this.appendChild(c)); }
    insertBefore(c) { return this.appendChild(c); }
    insertAdjacentElement(_, c) { return this.appendChild(c); }
    insertAdjacentHTML() {}
    replaceChildren(...cs) { this.children.length = 0; this.append(...cs); }
    removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); return c; }
    remove() { if (this._parent && this._parent.removeChild) this._parent.removeChild(this); this._removed = true; }
    querySelector(sel) { return find(sel)[0] || null; }
    querySelectorAll(sel) { return find(sel); }
    getElementsByTagName(t) { return find(t); }
    getElementsByClassName(c) { return find("." + c); }
    getBoundingClientRect() { const w = this.clientWidth, h = this.clientHeight; return { left: 0, top: 0, x: 0, y: 0, width: w, height: h, right: w, bottom: h }; }
    getClientRects() { return [this.getBoundingClientRect()]; }
    focus() { globalThis.document.activeElement = this; } blur() {} scrollIntoView() {} setPointerCapture() {} releasePointerCapture() {} hasPointerCapture() { return false; }
    click() { this.dispatchEvent(new FakeEvent("click", { clientX: 10, clientY: 10, button: 0 })); }
    requestFullscreen() { return Promise.resolve(); } requestPointerLock() {}
    animate() { return { finished: Promise.resolve(), cancel() {}, play() {}, pause() {} }; }
    closest() { return null; } matches() { return false; } contains() { return true; }
    cloneNode() { return this.tagName === "CANVAS" ? makeCanvas(this.attributes) : new El(this.tagName, this.attributes); }
    getContext(kind) { if (this.tagName !== "CANVAS" || kind !== "2d") return null; return (this._ctx ||= makeCtx(this)); }
    toDataURL() { return "data:,"; } toBlob(cb) { cb && cb({}); } captureStream() { return {}; } transferControlToOffscreen() { return this; }
  }
  const makeCanvas = (attrs = {}) => new El("canvas", attrs);
  function find(sel) {
    const out = [];
    for (const part of String(sel).split(",")) {
      const last = part.trim().split(/[\s>+~]+/).pop() || "";
      const m = last.match(/^([a-zA-Z][\w-]*)?(?:#([\w-]+))?((?:\.[\w-]+)*)(?:\[([\w-]+)(?:[~|^$*]?=["']?([^"'\]]*)["']?)?\])?/);
      if (!m) continue;
      const [, tag, id, classes, attr, val] = m;
      const cls = (classes || "").split(".").filter(Boolean);
      for (const el of allEls) {
        if (el._removed || el.tagName === "FRAGMENT") continue;
        if (tag && el.tagName !== tag.toUpperCase()) continue;
        if (id && el.id !== id) continue;
        if (cls.some((c) => !el.classList.contains(c))) continue;
        if (attr && (!(attr in el.attributes) || (val !== undefined && el.attributes[attr] !== val))) continue;
        if (!tag && !id && !cls.length && !attr) continue;
        if (!out.includes(el)) out.push(el);
      }
    }
    return out;
  }
  function onAttach(c) {
    if (c.tagName === "SCRIPT" && c.src) {
      const isPoki = /poki/i.test(c.src);
      Promise.resolve().then(() => {
        if (isPoki && opt.sdk === "missing") { c.dispatchEvent(new FakeEvent("error", { bubbles: false })); return; }
        if (isPoki && !("PokiSDK" in globalThis)) globalThis.PokiSDK = makeSdk();
        c.dispatchEvent(new FakeEvent("load", { bubbles: false }));
      });
    }
    if ((c.tagName === "LINK" || c.tagName === "IMG") && (c.href || c.src)) Promise.resolve().then(() => c.dispatchEvent(new FakeEvent("load", { bubbles: false })));
  }

  // ---------- window and document
  const win = new Target("window");
  const doc = new Target("document");
  doc._parent = win;
  const html = new El("html"), head = new El("head"), body = new El("body");
  html._parent = doc; head._parent = html; body._parent = html;
  Object.assign(doc, {
    documentElement: html, head, body, hidden: false, visibilityState: "visible", readyState: "complete", activeElement: body,
    fullscreenElement: null, title: "", cookie: "", referrer: "", currentScript: null, scrollingElement: html,
    fonts: { ready: Promise.resolve(), load: async () => [], add() {}, check: () => true },
    createElement: (tag) => (String(tag).toLowerCase() === "canvas" ? makeCanvas() : String(tag).toLowerCase() === "audio" ? new FakeAudio() : new El(tag)),
    createElementNS: (_, tag) => new El(tag),
    createTextNode: (t) => ({ nodeType: 3, textContent: String(t) }),
    createDocumentFragment: () => new El("fragment"),
    createEvent: (t) => new FakeEvent(t),
    getElementById: (id) => allEls.find((e) => e.id === id && !e._removed) || null,
    querySelector: (s) => find(s)[0] || null, querySelectorAll: (s) => find(s),
    getElementsByTagName: (t) => find(t), getElementsByClassName: (c) => find("." + c),
    hasFocus: () => true, exitFullscreen: () => Promise.resolve(), elementFromPoint: () => canvasEl, exitPointerLock() {},
  });

  // elements from index.html
  const indexPath = join(gameDir, "index.html");
  const indexHtml = existsSync(indexPath) ? readFileSync(indexPath, "utf8") : "";
  let canvasEl = null;
  const skip = new Set(["html", "head", "body", "script", "meta", "title", "style", "link", "br", "base"]);
  for (const m of indexHtml.replace(/<!--[\s\S]*?-->/g, "").replace(/<script[\s\S]*?<\/script>/gi, (s) => s.match(/^<script[^>]*>/i)[0]).matchAll(/<([a-zA-Z][\w-]*)\b([^>]*)>/g)) {
    const tag = m[1].toLowerCase();
    if (skip.has(tag)) continue;
    const attrs = {};
    for (const a of m[2].matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) attrs[a[1]] = a[2] ?? a[3] ?? a[4] ?? "";
    const el = tag === "canvas" ? makeCanvas(attrs) : new El(tag, attrs);
    el._parent = body; body.children.push(el);
    if (tag === "canvas" && !canvasEl) canvasEl = el;
  }
  const entryMatch = indexHtml.match(/<script[^>]*type\s*=\s*["']module["'][^>]*src\s*=\s*["']([^"']+)["']/i) || indexHtml.match(/<script[^>]*src\s*=\s*["']([^"']+)["'][^>]*type\s*=\s*["']module["']/i);
  const sdkTagInHtml = /<script[^>]*src\s*=\s*["'][^"']*poki-sdk[^"']*["']/i.test(indexHtml);

  // ---------- audio
  const READY = ["loadedmetadata", "loadeddata", "canplay", "canplaythrough"];
  class FakeAudio extends El {
    constructor(src = "") {
      super("audio");
      this.src = src || ""; this.loop = false; this.volume = 1; this.muted = false; this.paused = true; this.currentTime = 0; this.duration = 10;
      this.readyState = 4; this.preload = ""; this.autoplay = false; this.ended = false; this.playbackRate = 1; this._startedAt = -1e9;
      this._i = audioEls.push(this) - 1;
      for (const t of READY) { let h = null; Object.defineProperty(this, "on" + t, { configurable: true, get: () => h, set: (fn) => { h = fn; if (typeof fn === "function") Promise.resolve().then(() => { if (h === fn) { try { fn.call(this, new FakeEvent(t, { bubbles: false, target: this })); } catch (e) { err("on" + t, e); } } }); } }); }
    }
    play() {
      log.audio.push({ op: "play", i: this._i, src: String(this.src).split("/").pop(), loop: !!this.loop, frame: frameNo, beforeInput: firstInputFrame === null });
      if (opt.audio === "blocked" && firstInputFrame === null) return Promise.reject(Object.assign(new Error("play() failed because the user didn't interact with the document first."), { name: "NotAllowedError" }));
      this.paused = false; this._startedAt = now; return Promise.resolve();
    }
    pause() { this.paused = true; log.audio.push({ op: "pause", i: this._i, frame: frameNo }); }
    // The deployed game has its audio files, so "ready" events fire for anyone who waits on them.
    addEventListener(type, fn, o) { super.addEventListener(type, fn, o); if (READY.includes(type)) Promise.resolve().then(() => { if (this._count(type)) this.dispatchEvent(new FakeEvent(type, { bubbles: false })); }); }
    load() { Promise.resolve().then(() => READY.forEach((t) => this.dispatchEvent(new FakeEvent(t, { bubbles: false })))); }
    canPlayType() { return "probably"; } fastSeek() {}
    cloneNode() { const a = new FakeAudio(this.src); a.volume = this.volume; a.loop = this.loop; a.muted = this.muted; return a; }
    _audible() { return !this.paused && !this.muted && Number(this.volume) > 0.001 && (this.loop || now - this._startedAt < 400); }
  }
  class FakeAudioContext {
    constructor() { this.state = firstInputFrame === null ? "suspended" : "running"; this.currentTime = 0; this.sampleRate = 44100; this.destination = { connect() {} }; this._gains = []; this._sources = []; audioCtxs.push(this); log.audio.push({ op: "AudioContext", frame: frameNo, beforeInput: firstInputFrame === null }); log.notes.push("uses Web Audio"); }
    resume() { this.state = "running"; return Promise.resolve(); }
    suspend() { this.state = "suspended"; return Promise.resolve(); }
    close() { this.state = "closed"; return Promise.resolve(); }
    createGain() { const g = { gain: { value: 1, setValueAtTime(v) { this.value = v; }, linearRampToValueAtTime(v) { this.value = v; }, exponentialRampToValueAtTime(v) { this.value = v; }, setTargetAtTime(v) { this.value = v; }, cancelScheduledValues() {} }, connect() { return g; }, disconnect() {} }; this._gains.push(g); return g; }
    createBufferSource() { const s = { buffer: null, loop: false, playbackRate: { value: 1 }, connect() { return s; }, disconnect() {}, start: () => { s._on = true; s._at = now; log.audio.push({ op: "bufferStart", loop: !!s.loop, frame: frameNo, beforeInput: firstInputFrame === null }); }, stop: () => { s._on = false; }, addEventListener() {} }; this._sources.push(s); return s; }
    createOscillator() { const s = { type: "sine", frequency: { value: 440, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() { return s; }, disconnect() {}, start: () => { s._on = true; s._at = now; }, stop: () => { s._on = false; }, addEventListener() {} }; this._sources.push(s); return s; }
    createMediaElementSource() { return { connect() {}, disconnect() {} }; }
    createBuffer() { return { getChannelData: () => new Float32Array(8), duration: 1 }; }
    createDynamicsCompressor() { return { connect() {}, disconnect() {}, threshold: { value: 0 }, knee: { value: 0 }, ratio: { value: 1 }, attack: { value: 0 }, release: { value: 0 } }; }
    createBiquadFilter() { return { connect() {}, disconnect() {}, frequency: { value: 0 }, Q: { value: 0 }, gain: { value: 0 }, type: "lowpass" }; }
    decodeAudioData(buf, ok) { const b = { duration: 1 }; if (ok) ok(b); return Promise.resolve(b); }
    _audible() { return this.state === "running" && this._sources.some((s) => s._on && (s.loop || now - s._at < 400)) && !this._gains.some((g) => Number(g.gain.value) <= 0.001); }
  }
  const audibleNow = () => audioEls.some((a) => a._audible()) || audioCtxs.some((c) => c._audible());

  // ---------- Poki SDK mock
  function makeSdk() {
    const rec = (m, extra = {}) => log.sdk.push({ m, frame: frameNo, beforeInput: firstInputFrame === null, breakPending: breaks.some((b) => b.pending), ...extra });
    const makeBreak = (kind, cb, value) => {
      rec(kind, { hasCallback: typeof cb === "function" });
      if (opt.sdk === "reject") return Promise.resolve(value);
      const b = { pending: true, kind };
      breaks.push(b);
      return new Promise((res) => {
        b.resolve = () => { if (!b.pending) return; b.pending = false; rec(kind + ":end"); res(value); };
        Promise.resolve().then(() => { try { if (typeof cb === "function") cb(); } catch (e) { err("breakCallback", e); } });
      });
    };
    const api = {
      init() { rec("init"); return opt.sdk === "reject" ? Promise.reject(new Error("PokiSDK: blocked by an ad blocker")) : Promise.resolve(); },
      setDebug() { rec("setDebug"); }, gameLoadingStart() { rec("gameLoadingStart"); }, gameLoadingProgress() { rec("gameLoadingProgress"); },
      gameLoadingFinished() { rec("gameLoadingFinished"); }, gameplayStart() { rec("gameplayStart"); }, gameplayStop() { rec("gameplayStop"); },
      commercialBreak(cb) { return makeBreak("commercialBreak", cb, undefined); },
      rewardedBreak(a, b) { return makeBreak("rewardedBreak", typeof a === "function" ? a : b, true); },
      happyTime() { rec("happyTime"); }, openExternalLink(u) { rec("openExternalLink", { u: String(u) }); },
      getURLParam() { return ""; }, shareableURL() { return Promise.resolve(""); }, isAdBlocked() { return opt.sdk === "reject"; }, adsBlocked() { return opt.sdk === "reject"; },
      getIsoLanguage() { return "en"; }, captureError() {}, logError() {}, enableEventTracking() {}, setDebugTouchOverlayController() {}, playtestSetCanvas() {}, muteAd() {}, displayAd() {}, destroyAd() {},
    };
    return new Proxy(api, { get(t, k) { if (k in t) return t[k]; if (typeof k === "symbol" || k === "then") return undefined; return () => { rec("other:" + String(k)); }; } });
  }

  // ---------- globals
  const def = (k, v) => Object.defineProperty(globalThis, k, { value: v, configurable: true, writable: true });
  const defGet = (k, get) => Object.defineProperty(globalThis, k, { get, configurable: true });
  def("window", globalThis); def("self", globalThis); def("top", globalThis); def("parent", globalThis); def("frames", globalThis);
  def("document", doc);
  def("addEventListener", win.addEventListener.bind(win)); def("removeEventListener", win.removeEventListener.bind(win)); def("dispatchEvent", win.dispatchEvent.bind(win));
  def("innerWidth", 1280); def("innerHeight", 720); def("outerWidth", 1280); def("outerHeight", 720); def("devicePixelRatio", 1); def("scrollX", 0); def("scrollY", 0); def("pageXOffset", 0); def("pageYOffset", 0);
  def("screen", { width: 1280, height: 720, availWidth: 1280, availHeight: 720, orientation: { type: "landscape-primary", angle: 0, addEventListener() {}, removeEventListener() {}, lock: () => Promise.resolve(), unlock() {} } });
  def("visualViewport", Object.assign(new Target("visualViewport"), { width: 1280, height: 720, scale: 1, offsetLeft: 0, offsetTop: 0 }));
  def("location", { href: "https://games.poki.com/skyhop/index.html", protocol: "https:", host: "games.poki.com", hostname: "games.poki.com", origin: "https://games.poki.com", pathname: "/skyhop/index.html", search: "", hash: "", reload() {}, assign() {}, replace() {} });
  def("history", { pushState() {}, replaceState() {}, back() {}, state: null, length: 1 });
  def("navigator", { userAgent: "Mozilla/5.0 (harness)", platform: "Win32", language: "en-US", languages: ["en-US"], onLine: true, maxTouchPoints: 0, hardwareConcurrency: 4, vibrate() { return true; }, getGamepads() { return []; }, sendBeacon() { return true; }, clipboard: { writeText: () => Promise.resolve() }, userActivation: { hasBeenActive: false, isActive: false }, wakeLock: { request: () => Promise.resolve({ release() {} }) }, mediaSession: { setActionHandler() {}, metadata: null }, serviceWorker: undefined, share: undefined });
  def("matchMedia", (q) => Object.assign(new Target("mql"), { matches: false, media: String(q), addListener() {}, removeListener() {} }));
  def("getComputedStyle", () => makeStyle());
  def("requestAnimationFrame", (cb) => { const id = ++rafId; rafQueue.push({ id, cb }); return id; });
  def("cancelAnimationFrame", (id) => { const i = rafQueue.findIndex((r) => r.id === id); if (i >= 0) rafQueue.splice(i, 1); });
  def("requestIdleCallback", (cb) => fakeSetTimeout(() => cb({ didTimeout: false, timeRemaining: () => 10 }), 1)); def("cancelIdleCallback", fakeClear);
  def("setTimeout", fakeSetTimeout); def("setInterval", fakeSetInterval); def("clearTimeout", fakeClear); def("clearInterval", fakeClear);
  def("performance", { now: () => now, mark() {}, measure() {}, timeOrigin: 0, getEntriesByType: () => [], getEntriesByName: () => [], memory: {} });
  const realDateNow = Date.now(); Date.now = () => realDateNow + now;
  def("scrollTo", () => {}); def("scroll", () => {}); def("scrollBy", () => {}); def("focus", () => {}); def("blur", () => {}); def("alert", () => {}); def("confirm", () => true); def("prompt", () => null);
  def("open", (u) => { log.notes.push("window.open " + String(u)); return null; });
  def("postMessage", () => {});
  for (const n of ["Event", "CustomEvent", "KeyboardEvent", "MouseEvent", "PointerEvent", "TouchEvent", "UIEvent", "FocusEvent", "WheelEvent", "InputEvent", "ErrorEvent", "PromiseRejectionEvent"]) def(n, FakeEvent);
  def("EventTarget", Target);
  for (const n of ["HTMLElement", "Element", "Node", "HTMLCanvasElement", "HTMLDivElement", "HTMLButtonElement", "HTMLImageElement", "HTMLScriptElement", "HTMLAnchorElement", "HTMLInputElement", "SVGElement"]) def(n, El);
  def("HTMLAudioElement", FakeAudio); def("HTMLMediaElement", FakeAudio); def("Audio", FakeAudio);
  def("AudioContext", FakeAudioContext); def("webkitAudioContext", FakeAudioContext);
  def("Image", class extends El { constructor() { super("img"); } set src(v) { this._src = v; Promise.resolve().then(() => this.dispatchEvent(new FakeEvent("load", { bubbles: false }))); } get src() { return this._src || ""; } get complete() { return true; } get naturalWidth() { return 32; } get naturalHeight() { return 32; } decode() { return Promise.resolve(); } });
  def("OffscreenCanvas", class extends El { constructor(w, h) { super("canvas", { width: w, height: h }); } });
  def("Path2D", class { moveTo() {} lineTo() {} arc() {} rect() {} closePath() {} addPath() {} roundRect() {} quadraticCurveTo() {} bezierCurveTo() {} ellipse() {} });
  for (const n of ["ResizeObserver", "IntersectionObserver", "MutationObserver", "PerformanceObserver"]) def(n, class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } });
  def("FontFace", class { load() { return Promise.resolve(this); } });
  def("DOMParser", class { parseFromString() { return doc; } });
  def("XMLHttpRequest", undefined);
  def("Worker", undefined);
  def("gtag", undefined);
  if (opt.sdk !== "missing" && sdkTagInHtml) def("PokiSDK", makeSdk());

  // storage
  const makeStorage = () => {
    const m = new Map();
    return { getItem: (k) => (opt.storage === "corrupt" ? "{not json" : m.has(String(k)) ? m.get(String(k)) : null), setItem: (k, v) => { m.set(String(k), String(v)); }, removeItem: (k) => { m.delete(String(k)); }, clear: () => m.clear(), key: (i) => [...m.keys()][i] ?? null, get length() { return m.size; } };
  };
  if (opt.storage === "throw") {
    const boom = () => { throw Object.assign(new Error("The operation is insecure."), { name: "SecurityError" }); };
    defGet("localStorage", boom); defGet("sessionStorage", boom);
  } else { def("localStorage", makeStorage()); def("sessionStorage", makeStorage()); }
  def("indexedDB", undefined);

  // network
  def("fetch", (input) => {
    const url = String(typeof input === "object" && input && input.url ? input.url : input);
    const external = /^(https?:)?\/\//i.test(url);
    log.fetches.push({ url, frame: frameNo, external });
    if (external && opt.fetch === "fail") return Promise.reject(new TypeError("Failed to fetch"));
    let bodyText = '[{"name":"ace","score":120},{"name":"bee","score":90}]';
    if (!external) { const p = resolve(gameDir, url.replace(/^\.?\//, "").split("?")[0]); if (existsSync(p)) { try { bodyText = readFileSync(p, "utf8"); } catch { bodyText = ""; } } else if (/\.(wav|ogg|mp3|m4a|aac|webm|png|jpe?g|webp|gif|svg|ttf|woff2?)$/i.test(p)) { bodyText = ""; } else return Promise.resolve({ ok: false, status: 404, statusText: "Not Found", headers: { get: () => null }, json: () => Promise.reject(new SyntaxError("Unexpected token")), text: () => Promise.resolve(""), arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)), blob: () => Promise.resolve({}) }); }
    return Promise.resolve({ ok: true, status: 200, statusText: "OK", headers: { get: () => "application/json" }, json: () => Promise.resolve().then(() => JSON.parse(bodyText)), text: () => Promise.resolve(bodyText), arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)), blob: () => Promise.resolve({}), clone() { return this; } });
  });

  // console
  const realConsole = globalThis.console;
  def("console", { ...realConsole, log: (...a) => log.console.push({ frame: frameNo, s: a.map(String).join(" ").slice(0, 60) }), info: (...a) => log.console.push({ frame: frameNo, s: a.map(String).join(" ").slice(0, 60) }), debug: (...a) => log.console.push({ frame: frameNo, s: a.map(String).join(" ").slice(0, 60) }), warn: () => { log.warn++; }, error: (...a) => { log.warn++; log.notes.push("console.error " + a.map(String).join(" ").slice(0, 100)); }, table() {}, group() {}, groupEnd() {}, groupCollapsed() {}, time() {}, timeEnd() {}, trace() {}, assert() {}, count() {}, dir() {} });

  process.on("unhandledRejection", (r) => err("unhandledRejection", r));
  process.on("uncaughtException", (e) => err("uncaughtException", e));

  // ---------- driver API
  const rafQueue = [];
  let rafId = 0;
  const flush = async () => { for (let i = 0; i < 4; i++) await new Promise((r) => real.setImmediate(r)); };
  async function step(ms) {
    now += ms;
    runTimers();
    const q = rafQueue.splice(0);
    for (const r of q) { try { r.cb(now); } catch (e) { err("frame", e); } }
    const calls = drawCalls.splice(0);
    if (calls.length) lastFrameCalls = calls;
    frameNo++;
    await flush();
    return calls.length;
  }
  async function frames(n, ms) { let drew = 0; for (let i = 0; i < n; i++) drew += (await step(ms)) ? 1 : 0; return drew; }
  const markInput = () => { if (firstInputFrame === null) { firstInputFrame = frameNo; globalThis.navigator.userActivation.hasBeenActive = true; globalThis.navigator.userActivation.isActive = true; audioCtxs.forEach((c) => { /* stays suspended until resume() */ }); } };
  const KEYS = { " ": ["Space", 32], ArrowLeft: ["ArrowLeft", 37], ArrowUp: ["ArrowUp", 38], ArrowRight: ["ArrowRight", 39], ArrowDown: ["ArrowDown", 40], Enter: ["Enter", 13], a: ["KeyA", 65], d: ["KeyD", 68], w: ["KeyW", 87] };
  async function key(type, k) {
    markInput();
    const [code, keyCode] = KEYS[k] || [k, 0];
    const evt = new FakeEvent(type, { key: k, code, keyCode, which: keyCode, target: body });
    body.dispatchEvent(evt);
    await flush();
    return evt.defaultPrevented;
  }
  async function tap(target) {
    markInput();
    const t = target || canvasEl || body;
    const pt = { clientX: 640, clientY: 360, pageX: 640, pageY: 360, offsetX: 640, offsetY: 360, screenX: 640, screenY: 360, button: 0, buttons: 1, pointerId: 1, pointerType: "mouse", isPrimary: true, identifier: 1, target: t };
    for (const type of ["pointerdown", "mousedown", "pointerup", "mouseup", "click"]) { t.dispatchEvent(new FakeEvent(type, { ...pt })); await flush(); }
  }
  async function tapAllButtons() {
    for (const el of [...allEls]) {
      if (el === canvasEl || el._removed || el.tagName === "A" || el.tagName === "BODY" || el.tagName === "HTML") continue;
      if (["click", "pointerdown", "mousedown", "touchstart", "pointerup"].some((t) => el._count(t) > 0) || el.tagName === "BUTTON" || typeof el.onclick === "function") await tap(el);
    }
  }
  async function setHidden(hidden) {
    doc.hidden = hidden; doc.visibilityState = hidden ? "hidden" : "visible";
    doc.dispatchEvent(new FakeEvent("visibilitychange", { target: doc }));
    win.dispatchEvent(new FakeEvent(hidden ? "blur" : "focus", { target: win, bubbles: false }));
    await flush();
  }
  async function idle(ms) { now += ms; runTimers(); await flush(); }
  async function load() {
    if (!entryMatch) { log.notes.push("no module entry in index.html"); return false; }
    const entry = resolve(gameDir, entryMatch[1].replace(/^\.?\//, "").split("?")[0]);
    if (!existsSync(entry)) { log.notes.push("entry not found: " + entryMatch[1]); return false; }
    try { await import(pathToFileURL(entry).href); } catch (e) { err("import", e); await flush(); return false; }
    await flush();
    doc.dispatchEvent(new FakeEvent("DOMContentLoaded", { target: doc })); win.dispatchEvent(new FakeEvent("load", { target: win, bubbles: false }));
    await flush();
    return true;
  }
  const keyListeners = () => [win, doc, body, html, canvasEl].filter(Boolean).reduce((n, t) => n + t._count("keydown") + t._count("keyup") + t._count("keypress"), 0);
  const frame = () => lastFrameCalls.map((c) => [c[0], [...c[1]]]);
  const resolveBreaks = async () => { breaks.forEach((b) => b.resolve && b.resolve()); await flush(); };
  const pendingBreaks = () => breaks.filter((b) => b.pending).length;
  return { log, load, step, frames, key, tap, tapAllButtons, setHidden, idle, flush, frame, audibleNow, keyListeners, resolveBreaks, pendingBreaks,
    frameNo: () => frameNo, firstInputFrame: () => firstInputFrame, sdkCalls: (m) => log.sdk.filter((c) => c.m === m), hasCanvas: () => !!canvasEl, out: (o) => real.log(JSON.stringify(o)), writeJson: (p, o) => writeFileSync(p, JSON.stringify(o, null, 1)) };
}

// Largest numeric difference between two frames' draw calls, compared in order while the call names match.
export function frameDiff(a, b) {
  let max = 0, compared = 0;
  const n = Math.min(a.length, b.length);
  for (let i = 0; i < n; i++) {
    if (a[i][0] !== b[i][0]) break;
    const x = a[i][1], y = b[i][1];
    for (let j = 0; j < Math.min(x.length, y.length); j++) if (typeof x[j] === "number" && typeof y[j] === "number") max = Math.max(max, Math.abs(x[j] - y[j]));
    compared++;
  }
  return { max, compared, sameShape: a.length === b.length && compared === n };
}
