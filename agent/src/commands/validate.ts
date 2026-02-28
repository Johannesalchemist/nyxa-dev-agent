import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { createHash } from "crypto";

function normalize(p: string): string {
  return p.replace(/\\/g, "/");
}

function collectFiles(dir: string, root: string, result: string[]): void {
  const entries = fs.readdirSync(dir);
  for (const entry of entries) {
    if (entry === ".git" || entry === "node_modules" || entry === "dist") continue;
    const fullPath = path.join(dir, entry);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      collectFiles(fullPath, root, result);
    } else {
      const relative = normalize(path.relative(root, fullPath));
      if (relative !== "kernel/state/.nyxa-state") {
        result.push(relative);
      }
    }
  }
}

function computeManifestHash(rootPath: string): string {
  const files: string[] = [];
  collectFiles(rootPath, rootPath, files);
  files.sort();
  const hash = createHash("sha256");
  for (const file of files) {
    const content = fs.readFileSync(path.join(rootPath, file));
    hash.update(file);
    hash.update(content);
  }
  return hash.digest("hex");
}

export function validateCommand(): void {
  const rootPath = path.resolve(__dirname, "../../../");
  const stateFile = path.join(rootPath, "kernel", "state", ".nyxa-state");

  if (!fs.existsSync(stateFile)) {
    console.error("[nyxa-agent] missing .nyxa-state");
    process.exit(1);
  }

  const state = JSON.parse(fs.readFileSync(stateFile, "utf8"));

  const head = execSync("git rev-parse HEAD", { cwd: rootPath }).toString().trim();
  const treeHash = execSync('git rev-parse "HEAD^{tree}"', { cwd: rootPath }).toString().trim();
  const statusRaw = execSync("git status --porcelain", { cwd: rootPath }).toString().trim();
  const manifestHash = computeManifestHash(rootPath);

  if (statusRaw.length > 0) {
    console.error("[nyxa-agent] working tree not clean");
    process.exit(1);
  }

  if (state.head !== head) {
    console.error("[nyxa-agent] HEAD mismatch");
    process.exit(1);
  }

  if (state.treeHash !== treeHash) {
    console.error("[nyxa-agent] treeHash mismatch");
    process.exit(1);
  }

  if (state.manifestHash !== manifestHash) {
    console.error("[nyxa-agent] manifestHash mismatch");
    process.exit(1);
  }

  console.log("[nyxa-agent] state valid");
}
