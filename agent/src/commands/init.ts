import { execSync } from "child_process"

export function initCommand() {
  const status = execSync("git status --porcelain").toString().trim()

  if (!status) {
    console.log("[nyxa-agent] already clean, init skipped")
    return
  }

  const timestamp = new Date().toISOString()
  const message = "[nyxa-agent] init :: " + timestamp

  execSync("git add -A", { stdio: "inherit" })
  execSync('git commit -m "' + message + '"', { stdio: "inherit" })

  console.log("[nyxa-agent] init commit created")
}