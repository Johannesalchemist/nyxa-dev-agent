import * as fs from "fs";
import * as path from "path";
import { scanProjectFiles } from "./fileScanner";

export function updateSummary(rootPath: string, runHash: string): void {
  const files = scanProjectFiles(rootPath);

  const summary = {
    projectStructure: files,
    fileCount: files.length,
    head: runHash,
    lastScan: new Date().toISOString(),
  };

  const summaryPath = path.join(rootPath, "kernel", "state", "summary.json");

  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), {
    encoding: "utf8",
  });
}
