#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commandRouter_1 = require("./commandRouter");
function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    if (!command) {
        console.error("No command provided.");
        process.exit(1);
    }
    (0, commandRouter_1.routeCommand)(command);
}
main();
