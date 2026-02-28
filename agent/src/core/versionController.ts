import { execSync } from "child_process";
import * as path from "path";
import * as fs from "fs";

export function commitWithGit(rootPath: string, metaPath: string, timestamp: string): string {
  const gitPath = path.join(rootPath, ".git");

  if (!fs.existsSync(gitPath)) {
    execSync("git init", { cwd: rootPath });
  }

  // Stage everything
  execSync("git add .", { cwd: rootPath });

  const message = `[nyxa-agent] init :: ${timestamp}`;
  execSync(`git commit -m "${message}"`, { cwd: rootPath });

  // Hash of init commit
  const initHash = execSync("git rev-parse HEAD", { cwd: rootPath })
    .toString()
    .trim();

  // Update meta with previous commit hash
  const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
  meta.lastCommitHash = initHash;

  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), { encoding: "utf8" });

  execSync("git add kernel/state/meta.json", { cwd: rootPath });

  const syncMessage = `[nyxa-agent] sync meta :: ${timestamp}`;
  execSync(`git commit -m "${syncMessage}"`, { cwd: rootPath });

  return initHash;
}
