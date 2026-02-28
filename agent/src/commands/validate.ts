import * as path from "path";
import * as fs from "fs";
import { execSync } from "child_process";
import { resolveStableIdentity } from "../core/identityResolver";

export function validateCommand(): void {
  const rootPath = path.resolve(__dirname, "../../../");
  const statePath = path.join(rootPath, "kernel", "state", ".nyxa-state");

  if (!fs.existsSync(statePath)) {
    console.error("[nyxa-agent] missing .nyxa-state");
    process.exit(1);
  }

  const state = JSON.parse(fs.readFileSync(statePath, "utf8"));

  const identity = resolveStableIdentity(rootPath);

  const statusRaw = execSync("git status --porcelain", { cwd: rootPath })
    .toString()
    .trim();

  if (statusRaw.length > 0) {
    console.error("[nyxa-agent] working tree not clean");
    process.exit(1);
  }

  if (state.head !== identity.head) {
    console.error("[nyxa-agent] HEAD mismatch");
    process.exit(1);
  }

  if (state.treeHash !== identity.treeHash) {
    console.error("[nyxa-agent] treeHash mismatch");
    process.exit(1);
  }

  if (state.manifestHash !== identity.manifestHash) {
    console.error("[nyxa-agent] manifestHash mismatch");
    process.exit(1);
  }

  console.log("[nyxa-agent] state valid");
}
