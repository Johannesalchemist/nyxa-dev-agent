import { initCommand } from "./commands/init";
import { validateCommand } from "./commands/validate";
import { summarizeCommand } from "./commands/summarize";
import { runCommand } from "./commands/run";
import { kernelValidateCommand } from "./commands/kernelValidate";
import { kernelExecCommand } from "./commands/kernelExec";
import { kernelFlowCommand } from "./commands/kernelFlow";
import { kernelFlowFileCommand } from "./commands/kernelFlowFile";

export function routeCommand(): void {
  const command = process.argv[2];

  switch (command) {
    case "init":
      initCommand();
      break;

    case "validate":
      validateCommand();
      break;

    case "summarize":
      summarizeCommand();
      break;

    case "run":
      runCommand();
      break;

    case "kernel-validate":
      kernelValidateCommand();
      break;

    case "kernel-exec":
      const cap = process.argv[3];
      if (!cap) {
        console.error("[nyxa-agent] missing capability");
        process.exit(3);
      }
      kernelExecCommand(cap);
      break;

    case "kernel-flow":
      const caps = process.argv.slice(3);
      kernelFlowCommand(caps);
      break;

    case "kernel-flow-file":
      const file = process.argv[3];
      if (!file) {
        console.error("[nyxa-agent] missing flow file");
        process.exit(3);
      }
      kernelFlowFileCommand(file);
      break;

    default:
      console.error("[nyxa-agent] unknown command");
      process.exit(1);
  }
}