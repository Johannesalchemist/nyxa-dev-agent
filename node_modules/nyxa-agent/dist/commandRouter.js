"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.routeCommand = routeCommand;
const init_1 = require("./commands/init");
const run_1 = require("./commands/run");
const summarize_1 = require("./commands/summarize");
const validate_1 = require("./commands/validate");
function routeCommand(command) {
    switch (command) {
        case "init":
            (0, init_1.initCommand)();
            break;
        case "run":
            (0, run_1.runCommand)();
            break;
        case "summarize":
            (0, summarize_1.summarizeCommand)();
            break;
        case "validate":
            (0, validate_1.validateCommand)();
            break;
        default:
            console.error(`Unknown command: ${command}`);
            process.exit(1);
    }
}
