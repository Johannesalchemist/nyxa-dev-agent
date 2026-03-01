import { kernelExecCommand } from "./kernelExec";
import { kernelValidateCommand } from "./kernelValidate";
import { execSync } from "child_process";

const REQUIRED_FIRST = "validate";

export function kernelFlowCommand(capabilities: string[]): void {
  if (!Array.isArray(capabilities) || capabilities.length === 0) {
    console.error("[nyxa-agent] flow cannot be empty");
    process.exit(2);
  }

  if (capabilities[0] !== REQUIRED_FIRST) {
    console.error("[nyxa-agent] flow must start with validate");
    process.exit(2);
  }

  const unique = new Set(capabilities);
  if (unique.size !== capabilities.length) {
    console.error("[nyxa-agent] duplicate capabilities not allowed");
    process.exit(2);
  }

  // Resolve kernel capabilities dynamically via validate
  let kernelInfoRaw: string;
  try {
    const kernelPath = process.env.NYXA_KERNEL_PATH;
    if (!kernelPath) {
      console.error("[nyxa-agent] NYXA_KERNEL_PATH not set");
      process.exit(3);
    }

    kernelInfoRaw = execSync(
      `node dist/index.js validate`,
      { cwd: kernelPath }
    ).toString();
  } catch {
    console.error("[nyxa-agent] cannot query kernel capabilities");
    process.exit(3);
  }

  let kernelInfo: any;
  try {
    kernelInfo = JSON.parse(kernelInfoRaw);
  } catch {
    console.error("[nyxa-agent] invalid kernel response");
    process.exit(3);
  }

  const kernelCaps: string[] = kernelInfo.capabilities || [];

  for (const step of capabilities) {
    if (!kernelCaps.includes(step)) {
      console.error(`[nyxa-agent] capability not supported: ${step}`);
      process.exit(2);
    }
  }

  // Execute flow
  for (const step of capabilities) {
    if (step === "validate") {
      kernelValidateCommand();
    } else {
      kernelExecCommand(step);
    }
  }

  console.log("[nyxa-agent] kernel flow completed");
  process.exit(0);
}