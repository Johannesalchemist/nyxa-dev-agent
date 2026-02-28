"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commitWithGit = commitWithGit;
const child_process_1 = require("child_process");
const path = require("path");
const fs = require("fs");
function commitWithGit(rootPath, timestamp) {
    const gitPath = path.join(rootPath, ".git");
    // 1. Initialize git if not exists
    if (!fs.existsSync(gitPath)) {
        (0, child_process_1.execSync)("git init", { cwd: rootPath });
    }
    // 2. Add all files
    (0, child_process_1.execSync)("git add .", { cwd: rootPath });
    // 3. Deterministic commit message
    const message = `[nyxa-agent] init :: ${timestamp}`;
    (0, child_process_1.execSync)(`git commit -m "${message}"`, { cwd: rootPath });
    // 4. Retrieve commit hash
    const hash = (0, child_process_1.execSync)("git rev-parse HEAD", { cwd: rootPath })
        .toString()
        .trim();
    return hash;
}
