import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

function shouldIgnore(relativePath: string): boolean {
  const segments = relativePath.split(/[\\/]/);

  return segments.includes(".git") ||
         segments.includes("node_modules") ||
         segments.includes("dist");
}

function walk(dir: string, root: string, result: string[]) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(root, fullPath);

    if (shouldIgnore(relativePath)) {
      continue;
    }

    if (entry.isDirectory()) {
      walk(fullPath, root, result);
    } else {
      result.push(relativePath.replace(/\\/g, "/"));
    }
  }
}

export function updateSummary(rootPath: string): void {
  const statePath = path.join(rootPath, "kernel", "state");
  const summaryPath = path.join(statePath, "summary.json");

  const files: string[] = [];
  walk(rootPath, rootPath, files);

  files.sort();

  const fileCount = files.length;

  const headHash = execSync("git rev-parse HEAD", { cwd: rootPath })
    .toString()
    .trim();

  const summary = {
    projectStructure: files,
    fileCount,
    head: headHash,
    lastScan: new Date().toISOString()
  };

  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), {
    encoding: "utf8"
  });
}
