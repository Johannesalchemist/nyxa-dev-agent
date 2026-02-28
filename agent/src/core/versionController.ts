import { execSync } from "child_process";
import * as path from "path";
import * as fs from "fs";

export function commitWithGit(rootPath: string, metaPath: string, timestamp: string): string {
  const gitPath = path.join(rootPath, ".git");

  // 1. Initialize git if not exists
  if (!fs.existsSync(gitPath)) {
    execSync("git init", { cwd: rootPath });
  }

  // 2. Stage all files
  execSync("git add .", { cwd: rootPath });

  // 3. Deterministic commit message
  const message = `[nyxa-agent] init :: ${timestamp}`;
  execSync(`git commit -m "${message}"`, { cwd: rootPath });

  // 4. Retrieve commit hash
  const hash = execSync("git rev-parse HEAD", { cwd: rootPath })
    .toString()
    .trim();

  // 5. Update meta.json with correct hash
  const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  meta.lastCommitHash = hash;

  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), { encoding: "utf8" });

  // 6. Stage updated meta
  execSync("git add kernel/state/meta.json", { cwd: rootPath });

  // 7. Amend commit (no new commit)
  execSync("git commit --amend --no-edit", { cwd: rootPath });

  return hash;
}
