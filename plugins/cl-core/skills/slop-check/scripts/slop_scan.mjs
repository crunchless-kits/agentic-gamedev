#!/usr/bin/env node
// Slop scan: counts common AI tells in HTML, CSS, JSX/TSX/Vue, and Markdown. Read-only. Prints JSON.
//   node slop_scan.mjs <file-or-dir>... [--max 0] [--json]
// Exit 1 when any file has more flagged tells than --max (default 0). Heuristics, not verdicts: a reviewer
// confirms each flag against the project's style guide, where a deliberate choice (pixel dithering in a
// retro game, mono type in a terminal tool) is documented and allowed.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join } from "node:path";

const args = process.argv.slice(2);
const max = args.includes("--max") ? Number(args[args.indexOf("--max") + 1]) : 0;
const inputs = args.filter((a) => !a.startsWith("--") && a !== String(max));
const EXT = new Set([".html", ".htm", ".css", ".scss", ".jsx", ".tsx", ".vue", ".svelte", ".md", ".mdx", ".txt"]);
const SKIP = new Set(["node_modules", "dist", "build", ".git", "vendor", "Library"]);

const WRITING_TELLS = ["delve", "robust", "seamless", "seamlessly", "leverage", "unlock", "elevate", "empower", "game-changer", "game changer", "in today's", "it's not just", "not just a", "not only", "whether you're", "it's worth noting", "in conclusion", "furthermore", "moreover", "additionally", "crucial", "harness the", "navigate the", "landscape", "tapestry", "testament to", "dive into", "deep dive", "supercharge", "effortless", "effortlessly", "cutting-edge", "revolutionize", "unleash", "at its core", "that's where", "the best part", "imagine a world", "picture this", "say goodbye to", "look no further", "take it to the next level", "in a world where", "ever-evolving", "streamline", "holistic", "synergy", "transformative", "redefine", "reimagine", "next-gen", "bespoke", "meticulously crafted", "frictionless", "blazing fast", "lightning fast", "your journey", "embark on", "realm", "unlock the power", "stay ahead", "one-stop", "all-in-one", "pro tip", "fun fact", "let's dive", "buckle up", "hope this helps"];

function walk(p, out = []) {
  const st = statSync(p);
  if (st.isDirectory()) { for (const e of readdirSync(p)) if (!SKIP.has(e)) walk(join(p, e), out); }
  else if (EXT.has(extname(p).toLowerCase())) out.push(p);
  return out;
}
const count = (s, re) => (s.match(re) ?? []).length;
const samples = (s, re, n = 3) => [...s.matchAll(re)].slice(0, n).map((m) => m[0].replace(/\s+/g, " ").slice(0, 90));
const stripTags = (s) => s.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ");

function scanMarkup(s, ext) {
  const text = /\.(md|mdx|txt)$/.test(ext) ? s : stripTags(s);
  const isMd = /\.(md|mdx|txt)$/.test(ext);
  const headings = isMd ? [...s.matchAll(/^#{1,6}\s+(.+)$/gm)].map((m) => m[1].trim()) : [...s.matchAll(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi)].map((m) => stripTags(m[1]).trim());
  const codeless = s.replace(/<(code|pre)[\s\S]*?<\/\1>/gi, " ").replace(/```[\s\S]*?```/g, " ").replace(/`[^`]*`/g, " ");
  const f = {};
  f.pills = { n: count(s, /border-radius:\s*(?:9{3,}|50|40)px|rounded-full|class="[^"]*\b(pill|tag|badge|chip)s?\b/gi), strong: true, hint: "tags, pills, badges as decoration" };
  f.italics = { n: count(codeless, /<em\b|<i\b|font-style:\s*italic|\bitalic\b/gi) + (isMd ? count(codeless, /(^|\s)[*_][^*_\s][^*_]*[*_](\s|[.,;:]|$)/g) : 0), threshold: 3, hint: "italic used for rhythm instead of meaning" };
  f.instrumentSerif = { n: count(s, /Instrument\s+Serif/gi), strong: true, hint: "the default AI display serif" };
  f.negativeKerning = { n: count(s, /letter-spacing:\s*-|tracking-tight(?:er)?\b/gi), strong: true, hint: "tightened display type" };
  f.dividers = { n: count(s, /<hr\b|border-(?:top|bottom):\s*\d*\.?\d+px\s+solid|\bdivide-[xy]\b|\bborder-t\b|\bborder-b\b/gi), threshold: 2, hint: "rules between every section or row" };
  f.opacityShades = { n: count(s, /rgba?\([^)]*,\s*0?\.\d+\)|\bopacity:\s*0?\.\d|\/(?:5|10|15|20|25|30|40|50|60|70|80)\b/g), threshold: 6, hint: "translucent shades instead of a palette" };
  f.borderedContainers = { n: count(s, /border:\s*1px\s+solid|\bborder\b(?=[^;]*rounded)|class="[^"]*\bborder\b[^"]*\brounded/gi), threshold: 3, hint: "every card outlined" };
  f.detailedDiagrams = { n: [...s.matchAll(/<svg[\s\S]*?<\/svg>/gi)].filter((m) => count(m[0], /<(rect|path|circle|line|polyline|polygon|text)\b/gi) > 25).length, strong: true, hint: "diagrams with more nodes than ideas" };
  const words = text.split(/\s+/).filter(Boolean);
  const sentences = text.split(/(?<=[.!?])\s+/).map((x) => x.trim().toLowerCase()).filter((x) => x.length > 30);
  const dup = sentences.length - new Set(sentences).size;
  // Length alone is weak evidence: a landing page carries a catalog, a reference doc carries tables. Flag repeats always, length only past a generous limit.
  const verboseLimit = isMd ? 1500 : 2000;
  f.verboseRedundant = { n: dup + (words.length > verboseLimit ? 1 : 0), threshold: 0, warnOnly: isMd, hint: `repeated sentences ${dup}, ${words.length} words (limit ${verboseLimit})` };
  f.codeBreadcrumbs = { n: count(s, /breadcrumb|<nav[^>]*>[^<]*(?:\s\/\s|›|»)/gi) + count(codeless, /\b[a-z]+ \/ [a-z]+ \/ [a-z]+\b/gi), strong: true, hint: "path-style breadcrumbs as decoration" };
  f.sectionNumbering = { n: headings.filter((h) => /^(?:0?\d{1,2}[.)]?\s+\S|\(\d+\))/.test(h)).length, strong: true, hint: "01, 02 numbered headings" };
  f.eyebrows = { n: count(s, /text-transform:\s*uppercase[^}"]*font-size:\s*(?:1[0-4]px|0\.\d+(?:r?em))|font-size:\s*(?:1[0-4]px|0\.\d+(?:r?em))[^}"]*text-transform:\s*uppercase|class="[^"]*\buppercase\b[^"]*\btext-(?:xs|sm)\b|class="[^"]*\btext-(?:xs|sm)\b[^"]*\buppercase\b/gi), strong: true, hint: "small uppercase label above a heading" };
  f.dithering = { n: count(codeless, /\bdither(?:ing|ed)?\b(?!\s*(?:tells?|is|are|as a|by default|\)|,))/gi), strong: true, hint: "dither textures by default" };
  f.asciiImages = { n: count(s, /[\u2500-\u257F\u2580-\u259F]{6,}|(?:^|\n)[ \t]*[#@%*+=\-]{12,}[ \t]*(?:\n|$)/g), strong: true, hint: "ASCII or box-drawing art" };
  f.squircles = { n: count(s, /border-radius:\s*(?:2[4-9]|[3-9]\d)px|rounded-(?:3xl|\[(?:2[4-9]|[3-9]\d)px\])|squircle|corner-shape:\s*squircle/gi), threshold: 2, hint: "large radii on cards and buttons" };
  f.monoFonts = { n: count(codeless, /font-family:[^;}"]*mono|\bfont-mono\b|JetBrains Mono|Fira Code|IBM Plex Mono|Space Mono|Geist Mono/gi), threshold: 2, hint: "mono type outside code" };
  f.allCapsSubtitles = { n: headings.filter((h) => h.length >= 8 && /^[A-Z0-9 ,.&'!?:-]+$/.test(h) && /[A-Z]{3,}/.test(h)).length + count(s, /<h[2-6][^>]*text-transform:\s*uppercase/gi), strong: true, hint: "uppercase subtitles" };
  f.gradientBackgrounds = { n: count(s, /(?:linear|radial|conic)-gradient\(|bg-gradient-to-/gi), strong: true, hint: "gradient backgrounds or glows" };
  f.periodsInTitles = { n: headings.filter((h) => /[^.]\.$/.test(h) && !/\.\.\.$/.test(h)).length + count(s, /<title>[^<]*\.<\/title>/i), strong: true, hint: "full stops at the end of headings" };
  const lower = text.toLowerCase();
  const phraseHits = WRITING_TELLS.filter((p) => new RegExp(`(^|[^a-z])${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`, "i").test(lower));
  f.writingTells = { n: phraseHits.length, threshold: 2, hint: phraseHits.slice(0, 8).join(", ") || "none" };
  f.emDashes = { n: count(text, /\u2014/g), strong: true, hint: "em dashes" };
  f.negationPivot = { n: count(text, /\b(?:it'?s|this is|that'?s|we'?re|they'?re|you'?re)\s+not\s+(?:just\s+|only\s+|about\s+)?[^.;:!?]{2,60},\s+(?:it'?s|this is|that'?s|but|we'?re|they'?re|you'?re)\b/gi) + count(text, /\bnot\s+(?:a|an|the)?\s*[^.;:!?,]{2,40},\s+but\s+(?:a|an|the)?\s*[^.;:!?]{2,40}/gi), threshold: 1, hint: "negation pivots ('it's not X, it's Y', 'not X, but Y')" };
  f.exclamations = { n: count(text.replace(/`[^`]*`/g, ""), /!(?![=\]])/g), threshold: 2, hint: "exclamation marks" };
  f.rhetoricalHeadings = { n: headings.filter((h) => /\?$/.test(h)).length, threshold: 1, hint: "headings as questions" };
  f.colonHeadlines = { n: headings.filter((h) => /\w:\s+\w/.test(h)).length, threshold: 2, warnOnly: isMd, hint: "'X: Y' headline pairs" };
  f.emoji = { n: count(text, /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu), strong: true, hint: "emoji in copy or headings" };
  f.tripletHeadlines = { n: headings.filter((h) => /^[^,]+, [^,]+,? and [^,]+$/i.test(h)).length, threshold: 1, hint: "rule-of-three headlines" };
  return f;
}

const results = [];
let totalFlags = 0;
for (const input of inputs) for (const file of walk(input)) {
  const s = readFileSync(file, "utf8");
  const f = scanMarkup(s, extname(file).toLowerCase());
  const over = Object.entries(f).filter(([, v]) => (v.strong ? v.n > 0 : v.n > (v.threshold ?? 0)));
  const flagged = over.filter(([, v]) => !v.warnOnly).map(([k, v]) => ({ tell: k, count: v.n, hint: v.hint }));
  const warnings = over.filter(([, v]) => v.warnOnly).map(([k, v]) => ({ tell: k, count: v.n, hint: v.hint }));
  totalFlags += flagged.length;
  results.push({ file, flaggedCount: flagged.length, flagged, warnings, counts: Object.fromEntries(Object.entries(f).map(([k, v]) => [k, v.n])) });
}
console.log(JSON.stringify({ files: results.length, maxAllowedPerFile: max, over: results.filter((r) => r.flaggedCount > max).map((r) => r.file), results }, null, 2));
process.exit(results.some((r) => r.flaggedCount > max) ? 1 : 0);
