import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { updateSummary } from "../core/summaryEngine";
import { ensureStructure } from "../core/structureGuard";

export function runCommand(): void {
  const rootPath = "C:\\Users\\Johannes\\nyxa-dev-agent";
  const statePath = path.join(rootPath, "kernel", "state");
  const metaPath = path.join(statePath, "meta.json");

  ensureStructure(rootPath);

  updateSummary(rootPath);

  const status = execSync("git status --porcelain", { cwd: rootPath })
    .toString()
    .trim();

  if (!status) {
    console.log("[nyxa-agent] no changes detected");
    return;
  }

  const timestamp = new Date().toISOString();

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
