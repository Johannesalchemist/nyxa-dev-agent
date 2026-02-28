import * as path from "path";
import * as fs from "fs";
import { execSync } from "child_process";
import { resolveStableIdentity } from "../core/identityResolver";

export function runCommand(): void {
  const rootPath = path.resolve(__dirname, "../../../");

  // Stage everything first
  execSync("git add -A", { cwd: rootPath });

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

  execSync("git add kernel/state/.nyxa-state", { cwd: rootPath });

  try {
    const message = `[nyxa-agent] run :: ${new Date(identity.generatedAt).toISOString()}`;
    execSync(`git commit -m "${message}"`, { cwd: rootPath });
    console.log("[nyxa-agent] run committed successfully");
  } catch {
    console.log("[nyxa-agent] nothing to commit");
  }
}
