#!/usr/bin/env node
// Regression cases for guard-bash.mjs: every bypass from the v0.15 cold review must block, and
// everyday commands must pass. Runs the real hook over stdin. Exit 1 on failure.
//   node plugins/cl-core/scripts/guard-bash.test.mjs
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HOOK = join(dirname(fileURLToPath(import.meta.url)), "guard-bash.mjs");
const CWD = "/home/dev/game";
const run = (command, tool = "Bash", raw) => spawnSync("node", [HOOK], { input: raw ?? JSON.stringify({ tool_name: tool, cwd: CWD, tool_input: { command } }), encoding: "utf8" });

const blocked = [
  // the review's bypass list
  ["Bash", "rm -rf ./node_modules/../src"],
  ["Bash", "rm -rf dist ~/"],
  ["Bash", "rm -rf /tmp/../home/me"],
  ["Bash", "rm --recursive --force src"],
  ["Bash", "git push origin +main"],
  ["Bash", "git checkout ."],
  ["Bash", "git restore ."],
  ["Bash", "git stash drop"],
  ["Bash", "git stash clear"],
  ["Bash", "find . -delete"],
  ["Bash", "rd /s /q Assets"],
  ["Bash", "rmdir /s Assets"],
  ["Bash", "del /s /q *.tmp"],
  ["PowerShell", "ri -r Assets"],
  ["PowerShell", "rm -r Assets"],
  ["PowerShell", "Remove-Item -Recurse -Force C:/Users/me/Documents/layout"],
  ["PowerShell", "Remove-Item -Path src -Recurse"],
  ["PowerShell", "Get-ChildItem Assets | Remove-Item -Recurse -Force"],
  // the classic forms
  ["Bash", "git clean -f"],
  ["Bash", "git clean -fdx"],
  ["Bash", "git reset --hard HEAD~1"],
  ["Bash", "git -C ../other reset --hard"],
  ["Bash", "git branch -D feature"],
  ["Bash", "git branch --delete --force feature"],
  ["Bash", "git push --force"],
  ["Bash", "git push -f origin main"],
  ["Bash", "git push --force-with-lease origin main"],
  ["Bash", "git checkout -- ."],
  ["Bash", "rm -rf src"],
  ["Bash", "rm -rf ."],
  ["Bash", "rm -rf *"],
  ["Bash", "rm -rf /"],
  ["Bash", "rm -Rf \"src\""],
  ["Bash", "rm -rf $HOME/dist"],
  ["Bash", "rm -rf {src,lib}"],
  // compound commands, wrappers, and nested shells
  ["Bash", "npm test && rm -rf src"],
  ["Bash", "ls; rm -rf src"],
  ["Bash", "false || git reset --hard"],
  ["Bash", "echo $(rm -rf src)"],
  ["Bash", "echo `git stash drop`"],
  ["Bash", "sudo rm -rf /var/www"],
  ["Bash", "sudo -u root rm -rf /var/www"],
  ["Bash", "FOO=1 rm -rf src"],
  ["Bash", "if true; then rm -rf src; fi"],
  ["Bash", "bash -c \"rm -rf src\""],
  ["Bash", "ls | xargs rm -rf"],
  ["Bash", "find . -name '*.bak' -exec rm -rf {} +"],
  ["Bash", "cmd /c rd /s /q Assets"],
  ["Bash", "pwsh -Command \"Remove-Item -Recurse Assets\""],
  ["PowerShell", "Write-Host hi; Remove-Item Assets -Recurse"],
  ["PowerShell", "git push origin +main"],
];

const allowed = [
  ["Bash", "rm -rf node_modules"],
  ["Bash", "rm -rf dist"],
  ["Bash", "rm -rf ./dist/"],
  ["Bash", "rm -rf dist/*"],
  ["Bash", "rm -rf packages/app/node_modules"],
  ["Bash", "rm -rf /home/dev/game/build"],
  ["Bash", "rm -rf /tmp/scratch-123"],
  ["Bash", "rm notes.txt"],
  ["Bash", "rmdir empty-folder"],
  ["Bash", "git status"],
  ["Bash", "git commit -m \"note: rm -rf src was bad\""],
  ["Bash", "echo 'git reset --hard'"],
  ["Bash", "git push origin main"],
  ["Bash", "git push -u origin feature"],
  ["Bash", "git checkout -b feature"],
  ["Bash", "git checkout main"],
  ["Bash", "git checkout -- src/player.ts"],
  ["Bash", "git restore --staged ."],
  ["Bash", "git restore src/player.ts"],
  ["Bash", "git branch -d feature"],
  ["Bash", "git clean -n"],
  ["Bash", "git reset --soft HEAD~1"],
  ["Bash", "git stash pop"],
  ["Bash", "find . -name '*.log'"],
  ["Bash", "find dist -delete"],
  ["Bash", "npm run build 2>&1 | tee build.log"],
  ["Bash", "npm test && rm -rf dist"],
  ["PowerShell", "Remove-Item -Recurse -Force dist"],
  ["PowerShell", "Remove-Item -Recurse node_modules,dist"],
  ["PowerShell", "Remove-Item -Force notes.txt"],
  ["PowerShell", "Get-ChildItem -Recurse"],
];

const fails = [];
const check = (cond, name) => { if (!cond) { fails.push(name); console.log(`FAIL ${name}`); } };
for (const [tool, cmd] of blocked) { const r = run(cmd, tool); check(r.status === 2 && /crunchless guard: blocked/.test(r.stderr), `blocks [${tool}] ${cmd} (exit ${r.status})`); }
for (const [tool, cmd] of allowed) { const r = run(cmd, tool); check(r.status === 0, `allows [${tool}] ${cmd} (exit ${r.status}: ${r.stderr.trim()})`); }
let r = run(null, "Bash", "not json");
check(r.status === 2 && /could not read the hook payload/.test(r.stderr), "unreadable payload blocks visibly");
r = run(null, "Bash", JSON.stringify({ tool_name: "Bash", tool_input: {} }));
check(r.status === 0, "payload without a command passes");

const total = blocked.length + allowed.length + 2;
console.log(fails.length ? `\n${fails.length} of ${total} guard cases failed` : `all ${total} guard cases passed (${blocked.length} blocked, ${allowed.length} allowed, 2 payload)`);
process.exit(fails.length ? 1 : 0);
