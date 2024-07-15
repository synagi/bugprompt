import fs from "fs";
import path from "path";
import ProjectUtil from "./ProjectUtil.js";

class LogUtil {
  static getLogFilePath(): string | null {
    const projectRoot = ProjectUtil.findProjectRoot();
    return projectRoot ? path.join(projectRoot, "bugprompt.log") : null;
  }

  static logToFile(message: string, maxSize: number): void {
    const logFilePath = this.getLogFilePath();
    if (!logFilePath) {
      console.warn("Log file path could not be determined.");
      return;
    }

    if (fs.existsSync(logFilePath)) {
      const stats = fs.statSync(logFilePath);
      if (stats.size >= maxSize) {
        this.trimLogFile(logFilePath);
      }
    }

    fs.appendFileSync(logFilePath, message + "\n");
  }

  static logToFileSync(message: string, maxSize: number): void {
    const logFilePath = this.getLogFilePath();
    if (!logFilePath) {
      console.warn("Log file path could not be determined.");
      return;
    }

    if (fs.existsSync(logFilePath)) {
      const stats = fs.statSync(logFilePath);
      if (stats.size >= maxSize) {
        this.trimLogFileSync(logFilePath);
      }
    }

    fs.appendFileSync(logFilePath, message + "\n");
  }

  private static trimLogFile(fileName: string): void {
    const lines = fs.readFileSync(fileName, "utf-8").split("\n");
    if (lines.length > 1) {
      lines.shift();
      fs.writeFileSync(fileName, lines.join("\n"));
    }
  }

  private static trimLogFileSync(fileName: string): void {
    const lines = fs.readFileSync(fileName, "utf-8").split("\n");
    if (lines.length > 1) {
      lines.shift(); // Remove the first line
      fs.writeFileSync(fileName, lines.join("\n"));
    }
  }
}

export default LogUtil;
