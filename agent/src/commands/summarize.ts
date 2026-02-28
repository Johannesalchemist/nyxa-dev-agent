import * as path from "path";
import { execSync } from "child_process";
import { updateSummary } from "../core/summaryEngine";

export function summarizeCommand(): void {
  const rootPath = path.resolve(__dirname, "../../../");

  const runHash = execSync("git rev-parse HEAD", { cwd: rootPath }).toString().trim();

  updateSummary(rootPath, runHash);

  console.log("[nyxa-agent] summary updated");
}
