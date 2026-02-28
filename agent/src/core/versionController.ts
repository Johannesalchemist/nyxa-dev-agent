import { execSync } from "child_process";
import * as path from "path";
import * as fs from "fs";

export function commitWithGit(rootPath: string, timestamp: string): string {
  const gitPath = path.join(rootPath, ".git");

  // 1. Initialize git if not exists
  if (!fs.existsSync(gitPath)) {
    execSync("git init", { cwd: rootPath });
  }

  // 2. Add all files
  execSync("git add .", { cwd: rootPath });

  // 3. Deterministic commit message
  const message = `[nyxa-agent] init :: ${timestamp}`;
  execSync(`git commit -m "${message}"`, { cwd: rootPath });

  // 4. Retrieve commit hash
  const hash = execSync("git rev-parse HEAD", { cwd: rootPath })
    .toString()
    .trim();

  return hash;
}
