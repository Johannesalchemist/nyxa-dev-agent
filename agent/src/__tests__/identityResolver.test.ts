import { describe, it, expect, vi } from "vitest"

vi.mock("child_process", () => {
  return {
    execSync: (cmd: string) => {
      if (cmd.includes("rev-parse HEAD")) return Buffer.from("abc123")
      if (cmd.includes("HEAD^{tree}")) return Buffer.from("tree456")
      if (cmd.includes("ls-tree")) return Buffer.from("file1\nfile2")
      return Buffer.from("")
    }
  }
})

import { resolveStableIdentity } from "../core/identityResolver"

describe("identityResolver", () => {
  it("resolves deterministic identity", () => {
    const identity = resolveStableIdentity("dummy-path")

    expect(identity.head).toBe("abc123")
    expect(identity.treeHash).toBe("tree456")
    expect(identity.manifestHash).toBeTypeOf("string")
  })
})