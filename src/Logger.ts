import fs from "fs";
import path from "path";
import ErrorUtils from "./utils/ErrorUtil.js";
import EnvironmentUtils from "./utils/EnvUtil.js";
import ProjectUtils from "./utils/ProjectUtil.js";

const MAX_FILE_SIZE_MB = 10;

type LogLevel = "INFO" | "WARN" | "ERROR" | "DEBUG" | "TRACE" | "EXCEPTION";

class Logger {
  private static instance: Logger;
  private isNode: boolean;
  private maxFileSize: number;
  private projectName: string;
  private enabled: boolean = false;
  private logFilePath: string | null = null;

  private constructor(projectName = "") {
    this.isNode = EnvironmentUtils.isNodeEnvironment();
    this.maxFileSize = MAX_FILE_SIZE_MB * 1024 * 1024;
    this.projectName = this.isNode
      ? projectName || ProjectUtils.getProjectName() || "Unknown_Project"
      : projectName || "NON-NODEJS";
    this.initLogFile();
  }

  public static getInstance(projectName = ""): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(projectName);
    }
    return Logger.instance;
  }

  public enable(): void {
    this.enabled = true;
  }

  public disable(): void {
    this.enabled = false;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  private initLogFile(): void {
    if (this.isNode) {
      const projectRoot = ProjectUtils.findProjectRoot();
      if (projectRoot) {
        this.logFilePath = path.join(projectRoot, "bugprompt.log");
      } else {
        console.warn("Project root not found. Log file will not be created.");
        this.logFilePath = null;
      }
    }
  }

  private formatLogEntry(level: LogLevel, message: string): string {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${this.projectName}] [${level}] ${message}`;
  }

  private async log(level: LogLevel, ...messages: any[]): Promise<void> {
    const consoleMethod = this.getConsoleMethod(level);
    let formattedMessages: string[] = [];

    for (const msg of messages) {
      if (msg instanceof Error) {
        const errorData = await ErrorUtils.convertError(msg);
        formattedMessages.push(this.formatErrorForLog(errorData));
      } else {
        formattedMessages.push(String(msg));
      }
    }

    const logEntry = this.formatLogEntry(level, formattedMessages.join(" "));

    // Console output always works
    console[consoleMethod](logEntry);

    // File output only if enabled and in Node environment
    if (this.isNode && this.enabled && this.logFilePath) {
      this.writeToFile(logEntry);
    }

    // Rethrow for exception level
    if (level === "EXCEPTION") {
      throw new Error(formattedMessages.join(" "));
    }
  }

  private getConsoleMethod(
    level: LogLevel,
  ): "log" | "warn" | "error" | "debug" | "trace" {
    switch (level) {
      case "INFO":
        return "log";
      case "WARN":
        return "warn";
      case "ERROR":
      case "EXCEPTION":
        return "error";
      case "DEBUG":
        return "debug";
      case "TRACE":
        return "trace";
      default:
        return "log";
    }
  }

  private formatErrorForLog(errorData: any): string {
    let output = `${errorData.error.message} (${errorData.error.name})\n`;

    if (Array.isArray(errorData.error.stack)) {
      errorData.error.stack.forEach((trace: any) => {
        output += `  at ${trace.at} (${trace.file}:${trace.line})\n`;
        if (trace.code && trace.code !== "<no-data>") {
          output += `    ${trace.code}\n`;
        }
      });
    } else {
      output += errorData.error.stack || "No stack trace available";
    }

    if (errorData.error.params) {
      output += `\nAdditional Parameters: ${errorData.error.params}`;
    }

    return output;
  }

  private writeToFile(message: string): void {
    if (!this.logFilePath) return;

    try {
      if (fs.existsSync(this.logFilePath)) {
        const stats = fs.statSync(this.logFilePath);
        if (stats.size >= this.maxFileSize) {
          this.trimLogFile();
        }
      }
      fs.appendFileSync(this.logFilePath, message + "\n");
    } catch (error) {
      console.error("Error writing to log file:", error);
    }
  }

  private trimLogFile(): void {
    if (!this.logFilePath) return;

    try {
      const lines = fs.readFileSync(this.logFilePath, "utf-8").split("\n");
      if (lines.length > 1000) {
        // Keep last 1000 lines
        const newContent = lines.slice(-1000).join("\n");
        fs.writeFileSync(this.logFilePath, newContent);
      }
    } catch (error) {
      console.error("Error trimming log file:", error);
    }
  }

  // Public logging methods
  public async info(...messages: any[]): Promise<void> {
    await this.log("INFO", ...messages);
  }

  public async warn(...messages: any[]): Promise<void> {
    await this.log("WARN", ...messages);
  }

  public async error(...messages: any[]): Promise<void> {
    await this.log("ERROR", ...messages);
  }

  public async debug(...messages: any[]): Promise<void> {
    await this.log("DEBUG", ...messages);
  }

  public async trace(...messages: any[]): Promise<void> {
    await this.log("TRACE", ...messages);
  }

  public async exception(...messages: any[]): Promise<void> {
    await this.log("EXCEPTION", ...messages);
  }

  // Sync methods for global unhandled errors and rejections
  public logSync(level: LogLevel, ...messages: any[]): void {
    const consoleMethod = this.getConsoleMethod(level);
    let formattedMessages: string[] = [];

    for (const msg of messages) {
      if (msg instanceof Error) {
        const errorData = ErrorUtils.convertErrorSync(msg);
        formattedMessages.push(this.formatErrorForLog(errorData));
      } else {
        formattedMessages.push(String(msg));
      }
    }

    const logEntry = this.formatLogEntry(level, formattedMessages.join(" "));

    // Console output always works
    console[consoleMethod](logEntry);

    // File output only if enabled and in Node environment
    if (this.isNode && this.enabled && this.logFilePath) {
      this.writeToFile(logEntry);
    }
  }
}

export default Logger.getInstance();
