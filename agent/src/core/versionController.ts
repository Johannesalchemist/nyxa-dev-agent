import { execSync } from "child_process";
import * as path from "path";
import * as fs from "fs";

export function commitWithGit(rootPath: string, metaPath: string, timestamp: string): string {
  const gitPath = path.join(rootPath, ".git");

  if (!fs.existsSync(gitPath)) {
    execSync("git init", { cwd: rootPath });
  }

  // Stage everything (meta currently has empty hash)
  execSync("git add .", { cwd: rootPath });

  const message = `[nyxa-agent] init :: ${timestamp}`;
  execSync(`git commit -m "${message}"`, { cwd: rootPath });

  // FINAL hash after first commit
  const finalHash = execSync("git rev-parse HEAD", { cwd: rootPath })
    .toString()
    .trim();

  // Update meta with correct hash
  const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  meta.lastCommitHash = finalHash;
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), { encoding: "utf8" });

  // Amend once
  execSync("git add kernel/state/meta.json", { cwd: rootPath });
  execSync("git commit --amend --no-edit", { cwd: rootPath });

  return finalHash;
}
