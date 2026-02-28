import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { evaluateFitness } from "./fitnessEngine";

function getTimestamp(): string {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function createBranch(rootPath: string, branchName: string): void {
  execSync(`git checkout -b ${branchName}`, { cwd: rootPath });
}

function returnToMaster(rootPath: string): void {
  execSync(`git checkout master`, { cwd: rootPath });
}

function deleteBranch(rootPath: string, branchName: string): void {
  execSync(`git branch -D ${branchName}`, { cwd: rootPath });
}

function applyMinimalMutation(rootPath: string): void {
  const targetFile = path.join(
    rootPath,
    "agent",
    "src",
    "core",
    "orchestrator.ts"
  );

  const content = fs.readFileSync(targetFile, "utf8");
  const mutationComment = `\n// lab-mutation ${new Date().toISOString()}\n`;
  fs.writeFileSync(targetFile, content + mutationComment, { encoding: "utf8" });

  execSync(`git add "${targetFile}"`, { cwd: rootPath });
  execSync(`git commit -m "[nyxa-lab] minimal mutation"`, { cwd: rootPath });
}

export function runLab(rootPath: string): void {
  const branchName = `lab-${getTimestamp()}`;

  console.log(`[nyxa-lab] creating branch ${branchName}`);
  createBranch(rootPath, branchName);

  try {
    applyMinimalMutation(rootPath);

    const result = evaluateFitness(rootPath);

    console.log(`[nyxa-lab] fitness score: ${result.score}`);

    if (result.score >= 3) {
      console.log(`[nyxa-lab] mutation accepted on ${branchName}`);
    } else {
      console.log(`[nyxa-lab] mutation rejected`);
      returnToMaster(rootPath);
      deleteBranch(rootPath, branchName);
    }

  } catch (err) {
    console.log("[nyxa-lab] error during mutation, reverting");

    returnToMaster(rootPath);
    deleteBranch(rootPath, branchName);
  }
}
