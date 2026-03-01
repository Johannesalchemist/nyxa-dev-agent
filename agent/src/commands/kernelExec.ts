import { execSync } from "child_process";

const EXPECTED_CONTRACT = "1.0";

export function executeKernelCapability(capability: string): number {
  const kernelPath = process.env.NYXA_KERNEL_PATH;

  if (!kernelPath) return 3;

  let rawOutput: string;

  try {
    rawOutput = execSync(
      `node dist/index.js ${capability}`,
      { cwd: kernelPath }
    ).toString();
  } catch {
    return 3;
  }

  let parsed: any;

  try {
    parsed = JSON.parse(rawOutput);
  } catch {
    return 3;
  }

  if (parsed.contract !== EXPECTED_CONTRACT) return 2;
  if (!Array.isArray(parsed.capabilities)) return 2;
  if (!parsed.capabilities.includes(capability)) return 2;
  if (parsed.status !== "success" && parsed.status !== "valid") return 1;

  return 0;
}

export function kernelExecCommand(capability: string): void {
  const result = executeKernelCapability(capability);

  if (result === 0) {
    console.log("[nyxa-agent] kernel capability executed");
  }

  process.exit(result);
}