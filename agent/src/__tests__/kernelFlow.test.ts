import { describe, it, expect, vi, beforeEach } from "vitest";
import * as child from "child_process";

vi.mock("child_process", () => ({
  execSync: vi.fn()
}));

vi.mock("../commands/kernelValidate", () => ({
  kernelValidateCommand: vi.fn()
}));

vi.mock("../commands/kernelExec", () => ({
  kernelExecCommand: vi.fn()
}));

import { kernelFlowCommand } from "../commands/kernelFlow";

describe("kernelFlow Policy v1.0", () => {

  beforeEach(() => {
    process.env.NYXA_KERNEL_PATH = "mock-path";

    (child.execSync as any).mockReturnValue(
      JSON.stringify({
        capabilities: ["validate", "run", "summarize"]
      })
    );
  });

  function expectExit(code: number, fn: () => void) {
    const spy = vi.spyOn(process, "exit").mockImplementation(((c?: number) => {
      throw new Error(String(c));
    }) as any);

    try {
      fn();
    } catch (e: any) {
      expect(Number(e.message)).toBe(code);
    }

    spy.mockRestore();
  }

  it("passes valid flow", () => {
    expectExit(0, () => kernelFlowCommand(["validate", "run"]));
  });

  it("fails on empty flow", () => {
    expectExit(2, () => kernelFlowCommand([]));
  });

  it("fails if validate not first", () => {
    expectExit(2, () => kernelFlowCommand(["run", "validate"]));
  });

  it("fails on duplicate steps", () => {
    expectExit(2, () => kernelFlowCommand(["validate", "validate"]));
  });

  it("fails on unsupported capability", () => {
    expectExit(2, () => kernelFlowCommand(["validate", "unknown"]));
  });

  it("fails if NYXA_KERNEL_PATH missing", () => {
    delete process.env.NYXA_KERNEL_PATH;
    expectExit(3, () => kernelFlowCommand(["validate"]));
  });

});