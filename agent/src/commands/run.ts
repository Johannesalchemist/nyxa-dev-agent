import * as path from "path";
import * as fs from "fs";
import { execSync } from "child_process";
import { resolveStableIdentity } from "../core/identityResolver";

export function runCommand(): void {
  const rootPath = path.resolve(__dirname, "../../../");

  // Stage everything
  execSync("git add -A", { cwd: rootPath });

  // Commit code changes if any
  const diff = execSync("git diff --cached --name-only", { cwd: rootPath })
    .toString()
    .trim();

  if (diff.length > 0) {
    execSync(`git commit -m "[nyxa-agent] code sync"`, { cwd: rootPath });
  }

  // Resolve identity AFTER code commit
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

  execSync(
    `git commit -m "[nyxa-agent] state :: ${identity.head}"`,
    { cwd: rootPath }
  );

  console.log("[nyxa-agent] run completed");
}
