"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCommand = initCommand;
const fs = require("fs");
const path = require("path");
const versionController_1 = require("../core/versionController");
function initCommand() {
    const rootPath = "C:\\Users\\Johannes\\nyxa-dev-agent";
    const kernelPath = path.join(rootPath, "kernel");
    const statePath = path.join(kernelPath, "state");
    if (!fs.existsSync(kernelPath)) {
        fs.mkdirSync(kernelPath);
    }
    if (!fs.existsSync(statePath)) {
        fs.mkdirSync(statePath);
    }
    const timestamp = new Date().toISOString();
    const metaPath = path.join(statePath, "meta.json");
    const summaryPath = path.join(statePath, "summary.json");
    const meta = {
        version: "1.0.0",
        lastCommitHash: "",
        lastCommand: "init",
        timestamp
    };
    const summary = {
        projectStructure: ["kernel/state"],
        fileCount: 2,
        lastScan: timestamp
    };
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), { encoding: "utf8" });
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), { encoding: "utf8" });
    // --- Git Integration ---
    const commitHash = (0, versionController_1.commitWithGit)(rootPath, timestamp);
    // Update meta with real commit hash
    const updatedMeta = {
        ...meta,
        lastCommitHash: commitHash
    };
    fs.writeFileSync(metaPath, JSON.stringify(updatedMeta, null, 2), { encoding: "utf8" });
    console.log("[nyxa-agent] kernel initialized and committed");
}
