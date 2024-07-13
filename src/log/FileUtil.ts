import fs from "fs";
import path from "path";

class FileUtils {
  static findProjectRoot(currentDir: string = process.cwd()): string | null {
    let directory = currentDir;
    while (directory !== path.parse(directory).root) {
      const packageJsonPath = path.join(directory, "package.json");
      if (fs.existsSync(packageJsonPath)) {
        return directory;
      }
      directory = path.dirname(directory);
    }
    return null;
  }

  static getLogFilePath(): string | null {
    const projectRoot = this.findProjectRoot();
    return projectRoot ? path.join(projectRoot, "bugprompt.log") : null;
  }

  static async prepareOutputDirectory(dirPath: string): Promise<void> {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true });
      console.log(`Output directory created or verified: ${dirPath}`);
      await this.cleanDirectory(dirPath);
    } catch (error) {
      console.error(`Error preparing output directory ${dirPath}:`, error);
      throw error;
    }
  }

  static async cleanDirectory(dirPath: string): Promise<void> {
    try {
      const files = await fs.promises.readdir(dirPath);
      for (const file of files) {
        const fullPath = path.join(dirPath, file);
        await fs.promises.rm(fullPath, { recursive: true, force: true });
      }
      console.log(`Directory cleaned: ${dirPath}`);
    } catch (error) {
      console.error(`Error cleaning directory ${dirPath}:`, error);
      throw error;
    }
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

export default FileUtils;
