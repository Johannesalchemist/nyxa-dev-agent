import { describe, it, expect, vi } from "vitest"

const mockExec = vi.fn()
const mockReadFile = vi.fn()
const mockExists = vi.fn()

vi.mock("child_process", () => ({
  execSync: (cmd: string) => mockExec(cmd)
}))

vi.mock("fs", () => ({
  readFileSync: (path: string) => mockReadFile(path),
  existsSync: (path: string) => mockExists(path)
}))

vi.mock("../core/identityResolver", () => ({
  resolveStableIdentity: () => ({
    head: "abc",
    treeHash: "tree",
    manifestHash: "manifest"
  })
}))

import { validateCommand } from "../commands/validate"

describe("validateCommand", () => {

  it("passes when state matches identity", () => {

    mockExists.mockReturnValue(true)

    mockReadFile.mockReturnValue(JSON.stringify({
      head: "abc",
      treeHash: "tree",
      manifestHash: "manifest"
    }))

    mockExec.mockReturnValue(Buffer.from(""))

    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("exit")
    })

    expect(() => validateCommand()).not.toThrow()

    exitSpy.mockRestore()
  })

  it("fails on HEAD mismatch", () => {

    mockExists.mockReturnValue(true)

    mockReadFile.mockReturnValue(JSON.stringify({
      head: "wrong",
      treeHash: "tree",
      manifestHash: "manifest"
    }))

    mockExec.mockReturnValue(Buffer.from(""))

    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("exit")
    })

    expect(() => validateCommand()).toThrow()

    exitSpy.mockRestore()
  })
})