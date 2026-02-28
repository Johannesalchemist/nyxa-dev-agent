export interface NyxaMeta {
    version: string;
    lastCommitHash: string;
    lastCommand: string;
    timestamp: string;
}
export interface SummaryData {
    projectStructure: string[];
    fileCount: number;
    lastScan: string;
}
export type NyxaCommand = "init" | "run" | "summarize" | "validate";
export interface ExecutionContext {
    rootPath: string;
    command: NyxaCommand;
    timestamp: string;
}
