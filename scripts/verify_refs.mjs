#!/usr/bin/env node
// Reference snapshot verifier.
//   node scripts/verify_refs.mjs                      age check only (exit 1 if any snapshot older than --max-age-days)
//   node scripts/verify_refs.mjs --fetch              also fetch each source URL and report status
//   node scripts/verify_refs.mjs --fetch --fingerprint --write
//        fetch, fingerprint page text (sentence hashes only, no page text is stored), compare with
//        references/source-fingerprints.json, write the new fingerprints and verify-report.md
// The monthly CI job uses the last form and opens a pull request when fingerprints change.
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, resolve, dirname } from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const KIT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const FP_PATH = join(KIT, "references", "source-fingerprints.json");
const REPORT_PATH = join(KIT, "verify-report.md");
const args = process.argv.slice(2);
const doFetch = args.includes("--fetch");
const doFingerprint = args.includes("--fingerprint");
const doWrite = args.includes("--write");
const maxAge = args.includes("--max-age-days") ? Number(args[args.indexOf("--max-age-days") + 1]) : 90;

function walk(dir, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "node_modules") walk(p, out); }
    else if (p.includes(`${join("references", "")}`) && p.endsWith(".md")) out.push(p);
  }
  return out;
}

export function textOf(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function fingerprint(text) {
  const sentences = text.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter((s) => s.length > 20);
  const hashes = sentences.map((s) => createHash("sha1").update(s.toLowerCase()).digest("hex").slice(0, 12));
  return { textHash: createHash("sha256").update(text).digest("hex").slice(0, 16), sentences: hashes.length, sentenceHashes: hashes };
}

export function compare(oldFp, newFp) {
  if (!oldFp) return { status: "new", added: newFp.sentences, removed: 0, changedRatio: 1 };
  const oldSet = new Set(oldFp.sentenceHashes), newSet = new Set(newFp.sentenceHashes);
  const added = [...newSet].filter((h) => !oldSet.has(h)).length;
  const removed = [...oldSet].filter((h) => !newSet.has(h)).length;
  const base = Math.max(oldSet.size, 1);
  return { status: added + removed ? "changed" : "same", added, removed, changedRatio: Number(((added + removed) / base).toFixed(3)) };
}

async function main() {
  const refs = walk(join(KIT, "plugins"));
  const today = new Date();
  const previous = existsSync(FP_PATH) ? JSON.parse(readFileSync(FP_PATH, "utf8")) : { sources: {} };
  const next = { generatedAt: today.toISOString(), sources: { ...previous.sources } };
  const report = [];

  for (const file of refs) {
    const text = readFileSync(file, "utf8");
    const m = text.match(/Last verified:\s*(\d{4}-\d{2}-\d{2})/);
    if (!m) continue;
    const ageDays = Math.floor((today - new Date(m[1])) / 86400000);
    const urls = [...new Set((text.match(/https?:\/\/[^\s)>\]]+/g) ?? []).map((u) => u.replace(/[.,]$/, "")))];
    const entry = { file: file.replace(KIT + "/", ""), verified: m[1], ageDays, stale: ageDays > maxAge, sources: [] };
    for (const url of urls) {
      const src = { url, status: null, ok: false };
      if (doFetch) {
        try {
          const res = await fetch(url, { redirect: "follow", signal: AbortSignal.timeout(20000), headers: { "user-agent": "crunchless-verify-refs" } });
          src.status = res.status; src.ok = res.ok;
          if (res.ok && doFingerprint) {
            const fp = fingerprint(textOf(await res.text()));
            src.diff = compare(previous.sources[url], fp);
            next.sources[url] = { ...fp, fetchedAt: today.toISOString(), file: entry.file };
          }
        } catch (e) {
          src.error = String(e.message ?? e).slice(0, 100);
        }
      }
      entry.sources.push(src);
    }
    report.push(entry);
  }

  const stale = report.filter((r) => r.stale);
  const broken = report.flatMap((r) => r.sources.filter((s) => doFetch && !s.ok).map((s) => ({ file: r.file, url: s.url, status: s.status, error: s.error })));
  const changed = report.flatMap((r) => r.sources.filter((s) => s.diff && s.diff.status !== "same").map((s) => ({ file: r.file, url: s.url, ...s.diff })));

  if (doWrite) {
    writeFileSync(FP_PATH, JSON.stringify(next, null, 2) + "\n");
    const lines = [
      `# Snapshot verification report (${today.toISOString().slice(0, 10)})`, "",
      `Snapshots: ${report.length}, stale (> ${maxAge} days): ${stale.length}, unreachable sources: ${broken.length}, changed sources: ${changed.length}`, "",
      "## Changed sources (re-read the live page and update the snapshot notes)", "",
      ...(changed.length ? changed.map((c) => `- ${c.file}: ${c.url} (${c.status}, +${c.added} / -${c.removed} sentences, ${Math.round(c.changedRatio * 100)}% of page)`) : ["- none"]), "",
      "## Stale snapshots", "", ...(stale.length ? stale.map((s) => `- ${s.file}: verified ${s.verified}, ${s.ageDays} days old`) : ["- none"]), "",
      "## Unreachable sources", "", ...(broken.length ? broken.map((b) => `- ${b.file}: ${b.url} (${b.status ?? b.error})`) : ["- none"]), "",
      "## Reviewer checklist", "",
      "- [ ] For each changed source, open the live page, update the matching notes file in your own words, and bump its Last verified date",
      "- [ ] For each unreachable source, find the page's new location or mark the note as unverified",
      "- [ ] Run `node scripts/registry.mjs` and `node scripts/smoke.mjs` before merging",
    ];
    writeFileSync(REPORT_PATH, lines.join("\n") + "\n");
  }

  console.log(JSON.stringify({ checked: report.length, maxAgeDays: maxAge, stale: stale.map((r) => ({ file: r.file, ageDays: r.ageDays })), broken, changed, snapshots: report }, null, 2));
  process.exit(stale.length || broken.length || changed.length ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
