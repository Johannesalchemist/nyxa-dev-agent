#!/usr/bin/env node

import { routeCommand } from "./commandRouter";

function main(): void {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    console.error("No command provided.");
    process.exit(1);
  }

  routeCommand(command);
}

main();
