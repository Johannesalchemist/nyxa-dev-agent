import { execSync } from "child_process"
import * as fs from "fs"
import * as path from "path"
import { resolveStableIdentity } from "../core/identityResolver"

export function initCommand() {
  const rootPath = path.resolve(__dirname, "../../../")
  const statePath = path.join(rootPath, "kernel", "state", ".nyxa-state")

  const status = execSync("git status --porcelain", { cwd: rootPath })
    .toString()
    .trim()

  if (!status) {
    console.log("[nyxa-agent] already clean, init skipped")
    return
  }

  const timestamp = new Date().toISOString()
  const message = "[nyxa-agent] init :: " + timestamp

  execSync("git add -A", { cwd: rootPath, stdio: "inherit" })
  execSync('git commit -m "' + message + '"', { cwd: rootPath, stdio: "inherit" })

  const identity = resolveStableIdentity(rootPath)

  fs.writeFileSync(statePath, JSON.stringify(identity, null, 2))

  console.log("[nyxa-agent] init completed and state refreshed (not committed)")
}