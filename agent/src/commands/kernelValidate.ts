import { execSync } from "child_process";
import * as path from "path";

const EXPECTED_CONTRACT = "1.0";
const EXPECTED_MAJOR = "1";

export function kernelValidateCommand(): void {
  const kernelPath = process.env.NYXA_KERNEL_PATH;

  if (!kernelPath) {
    console.error("[nyxa-agent] NYXA_KERNEL_PATH not set");
    process.exit(3);
  }

  let raw: string;

  try {
    raw = execSync("node dist/index.js validate", {
      cwd: path.resolve(kernelPath),
      stdio: ["ignore", "pipe", "pipe"]
    }).toString().trim();
  } catch {
    console.error("[nyxa-agent] kernel execution failed");
    process.exit(3);
  }

  let parsed: any;

  try {
    parsed = JSON.parse(raw);
  } catch {
    console.error("[nyxa-agent] kernel returned invalid JSON");
    process.exit(3);
  }

  // Contract check
  if (parsed.contract !== EXPECTED_CONTRACT) {
    console.error("[nyxa-agent] contract mismatch");
    process.exit(2);
  }

  // Version check
  if (typeof parsed.version !== "string") {
    console.error("[nyxa-agent] invalid version format");
    process.exit(3);
  }

  const major = parsed.version.split(".")[0];

  if (major !== EXPECTED_MAJOR) {
    console.error("[nyxa-agent] major version incompatible");
    process.exit(2);
  }

  // Status check
  if (parsed.status !== "valid") {
    console.error("[nyxa-agent] kernel validation failed");
    process.exit(1);
  }

  console.log("[nyxa-agent] kernel valid");
}