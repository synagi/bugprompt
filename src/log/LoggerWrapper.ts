import logger from "./Logger.js";

type LogLevel = "info" | "warn" | "error" | "debug" | "trace" | "exception";

class LoggerWrapper {
  private static _enabled: boolean = false;

  static enable(): void {
    LoggerWrapper._enabled = true;
    logger.setEnabled(true);
  }

  static disable(): void {
    LoggerWrapper._enabled = false;
    logger.setEnabled(false);
  }

  static info(...messages: any[]): void {
    LoggerWrapper.handleAsyncLog("info", ...messages);
  }

  static warn(...messages: any[]): void {
    LoggerWrapper.handleAsyncLog("warn", ...messages);
  }

  static error(...messages: any[]): void {
    LoggerWrapper.handleAsyncLog("error", ...messages);
  }

  static debug(...messages: any[]): void {
    LoggerWrapper.handleAsyncLog("debug", ...messages);
  }

  static trace(...messages: any[]): void {
    LoggerWrapper.handleAsyncLog("trace", ...messages);
  }

  static exception(...messages: any[]): void {
    LoggerWrapper.handleAsyncLog("exception", ...messages);
  }

  private static handleAsyncLog(level: LogLevel, ...messages: any[]): void {
    if (LoggerWrapper._enabled) {
      logger[level](...messages).catch((err: Error) => {
        console.error(`Failed to log message at level ${level}:`, err);
      });
    } else {
      // Log to console without stack trace when not enabled
      console[level === "exception" ? "error" : level](...messages);
    }
  }
}

export default LoggerWrapper;
