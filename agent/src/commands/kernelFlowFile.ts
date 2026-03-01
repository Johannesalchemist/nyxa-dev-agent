import * as fs from "fs";
import { kernelFlowCommand } from "./kernelFlow";

const EXPECTED_CONTRACT = "1.0";

export function kernelFlowFileCommand(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    console.error("[nyxa-agent] flow file not found");
    process.exit(3);
  }

  let raw: string;
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch {
    console.error("[nyxa-agent] cannot read flow file");
    process.exit(3);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error("[nyxa-agent] invalid flow file JSON");
    process.exit(3);
  }

  if (typeof parsed !== "object" || parsed === null) {
    console.error("[nyxa-agent] flow file must be object");
    process.exit(2);
  }

  const obj = parsed as Record<string, unknown>;

  if (obj.contract !== EXPECTED_CONTRACT) {
    console.error("[nyxa-agent] flow contract mismatch");
    process.exit(2);
  }

  if (!Array.isArray(obj.flow)) {
    console.error("[nyxa-agent] flow must be array");
    process.exit(2);
  }

  const flow = obj.flow;

  if (!flow.every(step => typeof step === "string")) {
    console.error("[nyxa-agent] flow entries must be strings");
    process.exit(2);
  }

  kernelFlowCommand(flow as string[]);
}