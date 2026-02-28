import { execSync } from "child_process";

export interface FitnessResult {
  score: number;
  buildPassed: boolean;
  validatePassed: boolean;
  workingTreeClean: boolean;
}

export function evaluateFitness(rootPath: string): FitnessResult {
  let score = 0;
  let buildPassed = false;
  let validatePassed = false;
  let workingTreeClean = false;

  // BUILD
  try {
    execSync("npm run build", { cwd: rootPath, stdio: "ignore" });
    buildPassed = true;
    score += 1;
  } catch {
    return { score: 0, buildPassed, validatePassed, workingTreeClean };
  }

  // VALIDATE
  try {
    execSync("npm run validate", { cwd: rootPath, stdio: "ignore" });
    validatePassed = true;
    score += 1;
  } catch {
    return { score: 0, buildPassed, validatePassed, workingTreeClean };
  }

  // WORKING TREE CLEAN?
  const status = execSync("git status --porcelain", { cwd: rootPath })
    .toString()
    .trim();

  if (status.length === 0) {
    workingTreeClean = true;
    score += 1;
  }

  return {
    score,
    buildPassed,
    validatePassed,
    workingTreeClean
  };
}
