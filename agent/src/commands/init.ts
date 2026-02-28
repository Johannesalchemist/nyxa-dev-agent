import * as path from "path";
import { execSync } from "child_process";
import { updateSummary } from "../core/summaryEngine";

export function initCommand(): void {
  const rootPath = path.resolve(__dirname, "../../../");

  const timestamp = new Date().toISOString();

  execSync("git add .", { cwd: rootPath });
  execSync(`git commit -m "[nyxa-agent] init :: ${timestamp}"`, { cwd: rootPath });

  const runHash = execSync("git rev-parse HEAD", { cwd: rootPath }).toString().trim();

  updateSummary(rootPath, runHash);

  console.log("[nyxa-agent] init completed");
}
