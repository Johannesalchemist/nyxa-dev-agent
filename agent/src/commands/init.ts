import * as fs from "fs";
import * as path from "path";
import { commitWithGit } from "../core/versionController";
import { updateSummary } from "../core/summaryEngine";

export function initCommand(): void {
  const rootPath = "C:\\Users\\Johannes\\nyxa-dev-agent";
  const kernelPath = path.join(rootPath, "kernel");
  const statePath = path.join(kernelPath, "state");

  if (!fs.existsSync(kernelPath)) {
    fs.mkdirSync(kernelPath);
  }

  if (!fs.existsSync(statePath)) {
    fs.mkdirSync(statePath);
  }

  const timestamp = new Date().toISOString();

  const metaPath = path.join(statePath, "meta.json");
  const summaryPath = path.join(statePath, "summary.json");

  const meta = {
    version: "1.0.0",
    lastCommitHash: "",
    lastCommand: "init",
    timestamp
  };

  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), { encoding: "utf8" });

  if (!fs.existsSync(summaryPath)) {
    fs.writeFileSync(summaryPath, JSON.stringify({}, null, 2), { encoding: "utf8" });
  }

  const initHash = commitWithGit(rootPath, metaPath, timestamp);

  updateSummary(rootPath);

  console.log(`[nyxa-agent] kernel initialized and committed (${initHash})`);
}
