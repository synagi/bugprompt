import logger from "./Logger.js";

type LogLevel = "info" | "warn" | "error" | "debug" | "trace" | "exception";

class LoggerWrapper {
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
    logger[level](...messages).catch((err: Error) => {
      console.error(`Failed to log message at level ${level}:`, err);
    });
  }
}

export default LoggerWrapper;
