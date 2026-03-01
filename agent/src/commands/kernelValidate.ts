import { execSync } from "child_process";
import * as path from "path";

const EXPECTED_CONTRACT = "1.0";

export function kernelValidateCommand(): void {
  const kernelPath = process.env.NYXA_KERNEL_PATH;

  if (!kernelPath) {
    console.error("[nyxa-agent] NYXA_KERNEL_PATH not set");
    process.exit(2);
  }

  const kernelEntry = path.join(kernelPath, "dist", "index.js");

  try {
    const output = execSync(
      `node "${kernelEntry}" validate`,
      { stdio: "pipe" }
    ).toString().trim();

    const parsed = JSON.parse(output);

    if (parsed.contract !== EXPECTED_CONTRACT) {
      console.error("[nyxa-agent] kernel contract mismatch");
      process.exit(2);
    }

    if (parsed.status !== "valid") {
      console.error("[nyxa-agent] kernel validation failed");
      process.exit(1);
    }

    console.log("[nyxa-agent] kernel valid");
    process.exit(0);

  } catch {
    console.error("[nyxa-agent] kernel execution failed");
    process.exit(3);
  }
}