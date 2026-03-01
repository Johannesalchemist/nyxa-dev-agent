import { describe, it, expect, vi, beforeEach } from "vitest";
import { kernelValidateCommand } from "../commands/kernelValidate";
import * as child from "child_process";

vi.mock("child_process");

const mockExec = vi.spyOn(child, "execSync");

function mockProcessExit() {
  const exit = vi.spyOn(process, "exit").mockImplementation(((code?: number) => {
    throw new Error("EXIT_" + code);
  }) as any);
  return exit;
}

describe("kernelValidateCommand", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NYXA_KERNEL_PATH = "fake-path";
  });

  it("returns 0 on valid contract + version", () => {
    mockExec.mockReturnValue(Buffer.from(JSON.stringify({
      contract: "1.0",
      version: "1.2.3",
      status: "valid"
    })));

    const exitSpy = mockProcessExit();

    expect(() => kernelValidateCommand()).not.toThrow();
    expect(exitSpy).not.toHaveBeenCalled();
  });

  it("exit 2 on contract mismatch", () => {
    mockExec.mockReturnValue(Buffer.from(JSON.stringify({
      contract: "2.0",
      version: "1.0.0",
      status: "valid"
    })));

    mockProcessExit();

    expect(() => kernelValidateCommand()).toThrow("EXIT_2");
  });

  it("exit 2 on major version mismatch", () => {
    mockExec.mockReturnValue(Buffer.from(JSON.stringify({
      contract: "1.0",
      version: "2.0.0",
      status: "valid"
    })));

    mockProcessExit();

    expect(() => kernelValidateCommand()).toThrow("EXIT_2");
  });

  it("exit 1 on status invalid", () => {
    mockExec.mockReturnValue(Buffer.from(JSON.stringify({
      contract: "1.0",
      version: "1.0.0",
      status: "invalid"
    })));

    mockProcessExit();

    expect(() => kernelValidateCommand()).toThrow("EXIT_1");
  });

  it("exit 3 on invalid JSON", () => {
    mockExec.mockReturnValue(Buffer.from("not-json"));

    mockProcessExit();

    expect(() => kernelValidateCommand()).toThrow("EXIT_3");
  });
});