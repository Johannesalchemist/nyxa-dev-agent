import { execSync } from "child_process";
import * as path from "path";
import * as fs from "fs";

export function commitWithGit(rootPath: string, metaPath: string, timestamp: string): string {
  const gitPath = path.join(rootPath, ".git");

  if (!fs.existsSync(gitPath)) {
    execSync("git init", { cwd: rootPath });
  }

  execSync("git add .", { cwd: rootPath });

  const message = `[nyxa-agent] init :: ${timestamp}`;
  execSync(`git commit -m "${message}"`, { cwd: rootPath });

  // First hash (before amend)
  const firstHash = execSync("git rev-parse HEAD", { cwd: rootPath })
    .toString()
    .trim();

  // Update meta with first hash
  const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  meta.lastCommitHash = firstHash;
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), { encoding: "utf8" });

  execSync("git add kernel/state/meta.json", { cwd: rootPath });
  execSync("git commit --amend --no-edit", { cwd: rootPath });

  // FINAL hash after amend
  const finalHash = execSync("git rev-parse HEAD", { cwd: rootPath })
    .toString()
    .trim();

  // Write correct final hash
  const updatedMeta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  updatedMeta.lastCommitHash = finalHash;

  fs.writeFileSync(metaPath, JSON.stringify(updatedMeta, null, 2), { encoding: "utf8" });

  execSync("git add kernel/state/meta.json", { cwd: rootPath });
  execSync("git commit --amend --no-edit", { cwd: rootPath });

  return finalHash;
}
