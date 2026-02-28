import { execSync } from "child_process";
import * as crypto from "crypto";

export interface IdentityResult {
  head: string;
  treeHash: string;
  manifestHash: string;
  fileCount: number;
  generatedAt: number;
  mode: "stable";
}

export function resolveStableIdentity(rootPath: string): IdentityResult {
  const head = execSync("git rev-parse HEAD", { cwd: rootPath }).toString().trim();
  const treeHash = execSync("git rev-parse HEAD^{tree}", { cwd: rootPath }).toString().trim();

  const treeOutput = execSync("git ls-tree -r HEAD", { cwd: rootPath }).toString().trim();

  const lines = treeOutput.split("\n").filter(Boolean);

  const entries = lines.map(line => {
    // Format: <mode> <type> <blob>\t<path>
    const [left, path] = line.split("\t");
    const [mode, , blob] = left.split(" ");
    return `${mode}|${blob}|${path}`;
  });

  entries.sort();

  const manifestString = entries.join("\n");
  const manifestHash = crypto.createHash("sha256").update(manifestString).digest("hex");

  return {
    head,
    treeHash,
    manifestHash,
    fileCount: entries.length,
    generatedAt: Date.now(),
    mode: "stable"
  };
}
