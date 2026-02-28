import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

function normalize(p: string): string {
  return p.replace(/\\/g, "/");
}

function collectFiles(dir: string, root: string, result: string[]): void {
  const entries = fs.readdirSync(dir);

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);

    if (entry === ".git" || entry === "node_modules") continue;

    if (stat.isDirectory()) {
      collectFiles(fullPath, root, result);
    } else {
      const relative = normalize(path.relative(root, fullPath));
      result.push(relative);
    }
  }
}

export function validateCommand(): void {
  const rootPath = "C:\\Users\\Johannes\\nyxa-dev-agent";
  const statePath = path.join(rootPath, "kernel", "state");
  const metaPath = path.join(statePath, "meta.json");
  const summaryPath = path.join(statePath, "summary.json");

  const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  const summary = JSON.parse(fs.readFileSync(summaryPath, "utf8"));

  const head = execSync("git rev-parse HEAD", { cwd: rootPath })
    .toString()
    .trim();

  const parent = execSync("git rev-parse HEAD~1", { cwd: rootPath })
    .toString()
    .trim();

  if (summary.head !== head) {
    console.error("[nyxa-agent] summary HEAD mismatch");
    process.exit(1);
  }

  if (meta.lastCommitHash !== parent) {
    console.error("[nyxa-agent] meta does not reference run commit");
    process.exit(1);
  }

  const files: string[] = [];
  collectFiles(rootPath, rootPath, files);

  files.sort();
  summary.projectStructure.sort();

  if (files.length !== summary.fileCount) {
    console.error("[nyxa-agent] fileCount mismatch");
    process.exit(1);
  }

  for (let i = 0; i < files.length; i++) {
    if (files[i] !== summary.projectStructure[i]) {
      console.error("[nyxa-agent] project structure mismatch");
      process.exit(1);
    }
  }

  const statusRaw = execSync("git status --porcelain", { cwd: rootPath })
    .toString()
    .trim();

  if (statusRaw.length > 0) {
    console.error("[nyxa-agent] working tree not clean");
    process.exit(1);
  }

  console.log("[nyxa-agent] state valid");
}
