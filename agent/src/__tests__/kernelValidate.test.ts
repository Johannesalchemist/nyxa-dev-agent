import { describe, it, expect, vi, beforeEach } from "vitest";
import { kernelValidateCommand } from "../commands/kernelValidate";
import * as child from "child_process";

vi.mock("child_process");

const mockExec = vi.spyOn(child, "execSync");

function mockExit() {
  return vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
    throw new Error("EXIT_" + code);
  }) as any);
}

describe("kernelValidateCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NYXA_KERNEL_PATH = "fake";
  });

  it("exit 0 when everything valid", () => {
    mockExec.mockReturnValue(Buffer.from(JSON.stringify({
      contract: "1.0",
      version: "1.2.0",
      capabilities: ["validate"],
      status: "valid"
    })));

    const exitSpy = mockExit();

    expect(() => kernelValidateCommand()).not.toThrow();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it("exit 2 if capabilities missing", () => {
    mockExec.mockReturnValue(Buffer.from(JSON.stringify({
      contract: "1.0",
      version: "1.0.0",
      status: "valid"
    })));

    mockExit();

    expect(() => kernelValidateCommand()).toThrow("EXIT_2");
  });

  it("exit 2 if required capability absent", () => {
    mockExec.mockReturnValue(Buffer.from(JSON.stringify({
      contract: "1.0",
      version: "1.0.0",
      capabilities: [],
      status: "valid"
    })));

    mockExit();

    expect(() => kernelValidateCommand()).toThrow("EXIT_2");
  });
});