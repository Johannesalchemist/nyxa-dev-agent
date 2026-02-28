import { NyxaCommand } from "./types";
import { initCommand } from "./commands/init";
import { runCommand } from "./commands/run";
import { summarizeCommand } from "./commands/summarize";
import { validateCommand } from "./commands/validate";
import { runLab } from "./core/labRunner";

export function routeCommand(command: string): void {
  switch (command as NyxaCommand | "lab") {
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

    case "lab":
      runLab("C:\\Users\\Johannes\\nyxa-dev-agent");
      break;

    default:
      console.error(`[nyxa-agent] unknown command: ${command}`);
      process.exit(1);
  }
}
