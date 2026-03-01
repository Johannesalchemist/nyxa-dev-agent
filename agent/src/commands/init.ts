import { execSync } from "child_process"
import * as fs from "fs"
import * as path from "path"
import { resolveStableIdentity } from "../core/identityResolver"

export function initCommand() {
  const rootPath = path.resolve(__dirname, "../../../")
  const statePath = path.join(rootPath, "kernel", "state", ".nyxa-state")

  const currentHead = execSync("git rev-parse HEAD", { cwd: rootPath })
    .toString()
    .trim()

  let stateHead: string | null = null

  if (fs.existsSync(statePath)) {
    const state = JSON.parse(fs.readFileSync(statePath, "utf8"))
    stateHead = state.head
  }

  const status = execSync("git status --porcelain", { cwd: rootPath })
    .toString()
    .trim()

  if (status) {
    const timestamp = new Date().toISOString()
    const message = "[nyxa-agent] init :: " + timestamp

    execSync("git add -A", { cwd: rootPath, stdio: "inherit" })
    execSync('git commit -m "' + message + '"', { cwd: rootPath, stdio: "inherit" })
  }

  if (stateHead !== currentHead) {
    const identity = resolveStableIdentity(rootPath)
    fs.writeFileSync(statePath, JSON.stringify(identity, null, 2))
    console.log("[nyxa-agent] state synchronized to HEAD")
  } else {
    console.log("[nyxa-agent] already synchronized")
  }
}