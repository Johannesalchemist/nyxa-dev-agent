import * as path from "path";
import * as fs from "fs";
import { resolveStableIdentity } from "../core/identityResolver";

export function runCommand(): void {
  const rootPath = path.resolve(__dirname, "../../../");

  const identity = resolveStableIdentity(rootPath);

  const stateDir = path.join(rootPath, "kernel", "state");
  const statePath = path.join(stateDir, ".nyxa-state");

  if (!fs.existsSync(stateDir)) {
    fs.mkdirSync(stateDir, { recursive: true });
  }

  fs.writeFileSync(
    statePath,
    JSON.stringify(identity, null, 2),
    { encoding: "utf8" }
  );

  console.log("[nyxa-agent] state file written");
}
