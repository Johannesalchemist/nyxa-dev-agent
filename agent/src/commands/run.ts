import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { updateSummary } from "../core/summaryEngine";
import { ensureStructure } from "../core/structureGuard";

function isSourceChange(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/");

  if (
    normalized.startsWith("kernel/state/") ||
    normalized.startsWith("agent/dist/") ||
    normalized.startsWith("node_modules/") ||
    normalized.startsWith(".git/")
  ) {
    return false;
  }

  return true;
}

export function runCommand(): void {
  const rootPath = "C:\\Users\\Johannes\\nyxa-dev-agent";
  const statePath = path.join(rootPath, "kernel", "state");
  const metaPath = path.join(statePath, "meta.json");

  ensureStructure(rootPath);

  // 🔎 1️⃣ Check changes BEFORE summary update
  const statusRaw = execSync("git status --porcelain", { cwd: rootPath })
    .toString()
    .trim();

  if (!statusRaw) {
    updateSummary(rootPath);
    console.log("[nyxa-agent] no changes detected");
    return;
  }

  const lines = statusRaw.split("\n");
  const sourceChanges = lines
    .map(line => line.substring(3))
    .filter(isSourceChange);

  // 🧠 2️⃣ If no real source change → do NOT commit
  if (sourceChanges.length === 0) {
    updateSummary(rootPath);
    console.log("[nyxa-agent] no source changes detected");
    return;
  }

  // 🚀 3️⃣ Real source change
  const timestamp = new Date().toISOString();

  updateSummary(rootPath);

  execSync("git add .", { cwd: rootPath });

  const commitMessage = `[nyxa-agent] run :: ${timestamp}`;
  execSync(`git commit -m "${commitMessage}"`, { cwd: rootPath });

  const runHash = execSync("git rev-parse HEAD", { cwd: rootPath })
    .toString()
    .trim();

  const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  meta.lastCommitHash = runHash;
  meta.lastCommand = "run";
  meta.timestamp = timestamp;

  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), { encoding: "utf8" });

  execSync("git add kernel/state/meta.json", { cwd: rootPath });

  const syncMessage = `[nyxa-agent] sync meta :: ${timestamp}`;
  execSync(`git commit -m "${syncMessage}"`, { cwd: rootPath });

  console.log(`[nyxa-agent] run completed and committed (${runHash})`);
}
