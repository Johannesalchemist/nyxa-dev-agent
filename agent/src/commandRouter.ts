import { initCommand } from "./commands/init";
import { runCommand } from "./commands/run";
import { summarizeCommand } from "./commands/summarize";
import { validateCommand } from "./commands/validate";
import { kernelValidateCommand } from "./commands/kernelValidate";

export function routeCommand(command: string | undefined): void {
  switch (command) {
    case "init":
      initCommand();
      break;

    case "run":
      runCommand();
      break;

    case "summarize":
      summarizeCommand();
      break;

    case "validate":
      validateCommand();
      break;

    case "kernel-validate":
      kernelValidateCommand();
      break;

    default:
      console.error("[nyxa-agent] unknown command");
      process.exit(2);
  }
}