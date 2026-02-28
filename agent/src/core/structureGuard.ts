import * as fs from "fs";
import * as path from "path";

export function ensureStructure(rootPath: string): void {
  const requiredDirs = [
    path.join(rootPath, "kernel"),
    path.join(rootPath, "kernel", "state"),
    path.join(rootPath, "agent"),
    path.join(rootPath, "agent", "src"),
  ];

  for (const dir of requiredDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}
