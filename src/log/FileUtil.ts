import fs from "fs";
import path from "path";

class FileUtils {
  // Method to find the project root by searching for package.json
  static findProjectRoot(currentDir: string = process.cwd()): string | null {
    let directory = currentDir;
    while (directory !== path.parse(directory).root) {
      const packageJsonPath = path.join(directory, "package.json");
      if (fs.existsSync(packageJsonPath)) {
        return directory; // Return the directory containing package.json
      }
      directory = path.dirname(directory); // Move up a directory level
    }
    return null; // No project root found
  }

  // Method to get the log file path
  static getLogFilePath(): string | null {
    const projectRoot = this.findProjectRoot();
    return projectRoot ? path.join(projectRoot, "package.log") : null;
  }

  // Trims the log file to prevent it from growing indefinitely
  private static trimLogFile(fileName: string): void {
    const lines = fs.readFileSync(fileName, "utf-8").split("\n");
    if (lines.length > 1) {
      lines.shift();
      fs.writeFileSync(fileName, lines.join("\n"));
    }
  }

  // Logs a message to a file, applying a maximum size limit
  static logToFile(message: string, maxSize: number): void {
    const logFilePath = this.getLogFilePath();
    if (!logFilePath) {
      console.warn("Log file path could not be determined.");
      return;
    }

    // Check if the log file exists and needs to be trimmed
    if (fs.existsSync(logFilePath)) {
      const stats = fs.statSync(logFilePath);
      if (stats.size >= maxSize) {
        this.trimLogFile(logFilePath);
      }
    }

    // Append the message to the log file
    fs.appendFileSync(logFilePath, message + "\n");
  }

  // Synchronous version of the logToFile method
  static logToFileSync(message: string, maxSize: number): void {
    const logFilePath = this.getLogFilePath();
    if (!logFilePath) {
      console.warn("Log file path could not be determined.");
      return;
    }

    // Check if the file exists and needs to be trimmed
    if (fs.existsSync(logFilePath)) {
      const stats = fs.statSync(logFilePath);
      if (stats.size >= maxSize) {
        this.trimLogFileSync(logFilePath);
      }
    }

    // Write the log message synchronously
    fs.appendFileSync(logFilePath, message + "\n");
  }

  // Synchronous version of trimLogFile
  private static trimLogFileSync(fileName: string): void {
    const lines = fs.readFileSync(fileName, "utf-8").split("\n");
    if (lines.length > 1) {
      lines.shift(); // Remove the first line
      fs.writeFileSync(fileName, lines.join("\n"));
    }
  }

  // Public method to get the project name, utilizes the private method
  static getProjectName(): string | null {
    let currentDir = process.cwd();
    while (currentDir !== path.parse(currentDir).root) {
      try {
        const packageJsonPath = path.join(currentDir, "package.json");
        const packageJsonRaw = fs.readFileSync(packageJsonPath, "utf8");
        const packageJson = JSON.parse(packageJsonRaw);
        return packageJson.name;
      } catch (error) {
        // Move to the parent directory and try again
        currentDir = path.dirname(currentDir);
      }
    }
    console.warn("Unable to find package.json in any parent directory.");
    return null;
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
}

export default FileUtils;
