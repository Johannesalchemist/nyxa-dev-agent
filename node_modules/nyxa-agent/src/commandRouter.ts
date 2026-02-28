import { NyxaCommand } from "./types";
import { initCommand } from "./commands/init";
import { runCommand } from "./commands/run";
import { summarizeCommand } from "./commands/summarize";
import { validateCommand } from "./commands/validate";

export function routeCommand(command: string): void {
  switch (command as NyxaCommand) {
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
    default:
      console.error(`Unknown command: ${command}`);
      process.exit(1);
  }
}
