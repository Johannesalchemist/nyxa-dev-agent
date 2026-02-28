"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.commitWithGit = commitWithGit;
const child_process_1 = require("child_process");
const path = require("path");
const fs = require("fs");
function commitWithGit(rootPath, metaPath, timestamp) {
    const gitPath = path.join(rootPath, ".git");
    // 1. Initialize git if not exists
    if (!fs.existsSync(gitPath)) {
        (0, child_process_1.execSync)("git init", { cwd: rootPath });
    }
    // 2. Stage all files
    (0, child_process_1.execSync)("git add .", { cwd: rootPath });
    // 3. Deterministic commit message
    const message = `[nyxa-agent] init :: ${timestamp}`;
    (0, child_process_1.execSync)(`git commit -m "${message}"`, { cwd: rootPath });
    // 4. Retrieve commit hash
    const hash = (0, child_process_1.execSync)("git rev-parse HEAD", { cwd: rootPath })
        .toString()
        .trim();
    // 5. Update meta.json with correct hash
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf8"));
    meta.lastCommitHash = hash;
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), { encoding: "utf8" });
    // 6. Stage updated meta
    (0, child_process_1.execSync)("git add kernel/state/meta.json", { cwd: rootPath });
    // 7. Amend commit (no new commit)
    (0, child_process_1.execSync)("git commit --amend --no-edit", { cwd: rootPath });
    return hash;
}
