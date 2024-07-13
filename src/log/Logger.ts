import ErrorUtils from "../utils/ErrorUtil.js";
import FileUtils from "./FileUtil.js";
import EnvironmentUtils from "../utils/EnvUtil.js";
import ProjectUtils from "../utils/ProjectUtil.js";

const MAX_FILE_SIZE_MB = 10;

const LOG_LEVEL_EMOJIS: { [key: string]: string } = {
  info: "ℹ️",
  warn: "⚠️",
  error: "❗",
  debug: "🔧",
  trace: "🔍",
  exception: "❌",
};

type LogLevel = "info" | "warn" | "error" | "debug" | "trace" | "exception";

class Logger {
  private static instance: Logger;
  private isNode: boolean;
  private maxFileSize: number;
  private projectName: string;

  private constructor(projectName = "") {
    this.isNode = EnvironmentUtils.isNodeEnvironment();
    this.maxFileSize = MAX_FILE_SIZE_MB * 1024 * 1024;
    this.projectName = this.isNode
      ? projectName || ProjectUtils.getProjectName() || "Unknown_Project"
      : projectName || "NON-NODEJS";

    this.setupGlobalErrorHandlers();
  }

  public static getInstance(projectName = ""): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(projectName);
    }
    return Logger.instance;
  }

  private formatLogEntry(level: LogLevel, message: string): string {
    return `${LOG_LEVEL_EMOJIS[level]}[${this.projectName}] [${level.toUpperCase()}]: ${message}`;
  }

  private async log(level: LogLevel, ...messages: any[]): Promise<void> {
    let consoleLevel: "log" | "warn" | "error" | "debug" | "trace" =
      level === "exception" ? "error" : (level as any);
    let formattedMessages: string[] = [];
    let consoleMessages: any[] = [];

    for (const msg of messages) {
      if (msg instanceof Error) {
        const errorData = await ErrorUtils.convertError(msg);
        formattedMessages.push(errorData.log);
        consoleMessages.push(errorData.formatted);
      } else {
        formattedMessages.push(String(msg));
        consoleMessages.push(msg);
      }
    }

    // Console output
    console[consoleLevel](...consoleMessages);

    // File output
    if (this.isNode) {
      const logEntry = this.formatLogEntry(level, formattedMessages.join(" "));
      FileUtils.logToFile(logEntry, this.maxFileSize);
    }

    // Rethrow for exception level
    if (level === "exception") {
      throw new Error(
        messages
          .map((msg) => (msg instanceof Error ? msg.message : String(msg)))
          .join(" "),
      );
    }
  }

  // log levels
  public async info(...messages: any[]): Promise<void> {
    await this.log("info", ...messages);
  }
  public async warn(...messages: any[]): Promise<void> {
    await this.log("warn", ...messages);
  }
  public async error(...messages: any[]): Promise<void> {
    await this.log("error", ...messages);
  }
  public async debug(...messages: any[]): Promise<void> {
    await this.log("debug", ...messages);
  }
  public async trace(...messages: any[]): Promise<void> {
    await this.log("trace", ...messages);
  }
  public async exception(...messages: any[]): Promise<void> {
    await this.log("exception", ...messages);
  }

  // Sync methods for global unhandled errors and rejections
  private logSync(level: LogLevel, ...messages: any[]): void {
    let consoleLevel: "log" | "warn" | "error" | "debug" | "trace" =
      level === "exception" ? "error" : (level as any);
    let formattedMessages: string[] = [];

    for (const msg of messages) {
      if (msg instanceof Error) {
        const errorData = ErrorUtils.convertErrorSync(msg);
        formattedMessages.push(errorData.log);
        console.error(errorData.formatted);
      } else {
        formattedMessages.push(String(msg));
        console[consoleLevel](msg);
      }
    }

    // File output (synchronous)
    if (this.isNode) {
      const logEntry = this.formatLogEntry(level, formattedMessages.join(" "));
      FileUtils.logToFileSync(logEntry, this.maxFileSize);
    }
  }

  // Global error handlers setup
  private setupGlobalErrorHandlers(): void {
    if (!this.isNode) return;

    process.on("uncaughtException", (err: Error) => {
      this.logSync("exception", "Uncaught Exception:", err);
      process.exit(1);
    });

    process.on("unhandledRejection", (reason: any) => {
      this.logSync("exception", "Unhandled Rejection:", reason);
      process.exit(1);
    });
  }
}

export default Logger.getInstance();
