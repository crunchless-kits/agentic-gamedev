#!/usr/bin/env node
// Checkpoints for fan-out commands, keyed by run id (never by date).
//   node checkpoint.mjs <command> start            -> prints a new run id and the file path
//   node checkpoint.mjs <command> <run-id> add <scout-name> <json-file>
//   node checkpoint.mjs <command> <run-id> list    -> scouts already recorded
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
const [command, runId, op, name, file] = process.argv.slice(2);
const dir = join(process.cwd(), ".cl", "checkpoints");
if (!command) { console.error("usage: checkpoint.mjs <command> start | <run-id> add <name> <json> | <run-id> list"); process.exit(2); }
mkdirSync(dir, { recursive: true });
if (runId === "start") { const id = `${command}-${randomBytes(3).toString("hex")}`; writeFileSync(join(dir, `${id}.json`), JSON.stringify({ command, scouts: {} }, null, 2)); console.log(JSON.stringify({ runId: id, file: join(dir, `${id}.json`) })); process.exit(0); }
const path = join(dir, `${runId}.json`);
if (!existsSync(path)) { console.error(`no checkpoint ${runId}`); process.exit(2); }
const cp = JSON.parse(readFileSync(path, "utf8"));
if (op === "add") { cp.scouts[name] = JSON.parse(readFileSync(file, "utf8")); writeFileSync(path, JSON.stringify(cp, null, 2)); console.log(`recorded ${name}`); }
else console.log(JSON.stringify(Object.keys(cp.scouts)));
