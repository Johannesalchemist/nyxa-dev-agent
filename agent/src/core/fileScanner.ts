import * as fs from "fs";
import * as path from "path";

function walk(dir: string, base: string, results: string[]): void {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.name === ".git") continue;
    if (entry.name === "node_modules") continue;

    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(base, fullPath).replace(/\\/g, "/");

    if (entry.isDirectory()) {
      walk(fullPath, base, results);
    } else {
      results.push(relativePath);
    }
  }
}

export function scanProjectFiles(rootPath: string): string[] {
  const results: string[] = [];
  walk(rootPath, rootPath, results);
  results.sort();
  return results;
}
