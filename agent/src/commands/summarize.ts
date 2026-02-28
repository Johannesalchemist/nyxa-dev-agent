import { updateSummary } from "../core/summaryEngine";
import * as path from "path";

export function summarizeCommand(): void {
  const rootPath = path.resolve(__dirname, "../../../");
  updateSummary(rootPath);
  console.log("[nyxa-agent] summary updated");
}
