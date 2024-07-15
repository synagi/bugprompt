import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

class ProjectUtil {
  static trim(data: any, maxLength: number = 90, maxDepth: number = 10): any {
    let processedCount = 0;

    function trimInternal(item: any, depth: number): any {
      if (processedCount >= maxDepth) {
        return undefined;
      }

      if (item === null || item === undefined) {
        return item;
      }

      if (typeof item === "string") {
        processedCount++;
        return item.length > maxLength
          ? item.substring(0, maxLength) + "..."
          : item;
      }

      if (typeof item !== "object") {
        processedCount++;
        return item;
      }

      if (Array.isArray(item)) {
        return item
          .map((subItem) => trimInternal(subItem, depth + 1))
          .filter((subItem) => subItem !== undefined);
      }

      const trimmedObj: any = {};
      for (const [key, value] of Object.entries(item)) {
        if (processedCount >= maxDepth) {
          break;
        }
        const trimmedValue = trimInternal(value, depth + 1);
        if (trimmedValue !== undefined) {
          trimmedObj[key] = trimmedValue;
        }
      }
      return trimmedObj;
    }

    return trimInternal(data, 0);
  }

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

  static getRelativePath(fullPath: string): string {
    const projectRoot = this.findProjectRoot();
    if (!projectRoot) {
      throw new Error("Project root not found");
    }
    return path.relative(projectRoot, fullPath).replace(/\\/g, "/");
  }

  static getAbsoluteFilePath(relativeFilePath: string): string {
    const projectRoot = this.findProjectRoot();
    return projectRoot
      ? path.join(projectRoot, relativeFilePath)
      : relativeFilePath;
  }

  static isLineInProject(line: string): boolean {
    const projectRoot = this.findProjectRoot();
    return projectRoot ? line.includes(projectRoot) : false;
  }

  static getFileContents(filePath: string): string | null {
    try {
      const absoluteFilePath = this.getAbsoluteFilePath(filePath);
      return fs.readFileSync(absoluteFilePath, "utf8");
    } catch (error) {
      console.error(`Error reading file: ${filePath}`, error);
      return null;
    }
  }

  static async getFileContentsAsync(filePath: string): Promise<string | null> {
    try {
      const absoluteFilePath = this.getAbsoluteFilePath(filePath);
      return await fs.promises.readFile(absoluteFilePath, "utf8");
    } catch (error) {
      console.error(`Error reading file: ${filePath}`, error);
      return null;
    }
  }

  static getCodeLine(filePath: string, lineNumber: number): string | null {
    const projectRoot = this.findProjectRoot();
    if (!projectRoot) {
      throw new Error("Project root not found");
    }

    // Convert src path to dist path for reading
    const absoluteFilePath = path.join(
      projectRoot,
      "dist",
      filePath.replace(/^src\//, "").replace(/\.ts$/, ".js"),
    );

    try {
      const fileContents = fs.readFileSync(absoluteFilePath, "utf8");
      const lines = fileContents.split("\n");
      return lineNumber > 0 && lineNumber <= lines.length
        ? lines[lineNumber - 1]
        : null;
    } catch (error) {
      console.error(`Error reading file: ${absoluteFilePath}`, error);
      return null;
    }
  }

  static async getCodeLineAsync(
    filePath: string,
    lineNumber: number,
  ): Promise<string | null> {
    const projectRoot = this.findProjectRoot();

    if (!projectRoot) {
      throw new Error("Project root not found");
    }

    // Convert src path to dist path for reading, but only within the project
    let absoluteFilePath = this.normalizeFilePath(filePath, projectRoot);
    if (absoluteFilePath.includes(projectRoot)) {
      absoluteFilePath = absoluteFilePath
        .replace(`${projectRoot}/src`, `${projectRoot}/dist`)
        .replace(/\.ts$/, ".js");
    }

    try {
      const fileContents = await fs.promises.readFile(absoluteFilePath, "utf8");
      const lines = fileContents.split("\n");

      if (lineNumber > 0 && lineNumber <= lines.length) {
        return lines[lineNumber - 1];
      } else {
        throw new Error(`Invalid line number: ${lineNumber}`);
      }
    } catch (error) {
      throw new Error(`Error reading file: ${absoluteFilePath}, ${error}`);
    }
  }

  private static normalizeFilePath(
    filePath: string,
    projectRoot: string,
  ): string {
    let absoluteFilePath = filePath;
    if (filePath.startsWith("file:")) {
      absoluteFilePath = fileURLToPath(filePath);
    } else if (!path.isAbsolute(filePath)) {
      absoluteFilePath = path.join(projectRoot, filePath);
    }

    // Always return src path for project files
    if (absoluteFilePath.includes(projectRoot)) {
      return absoluteFilePath
        .replace(`${projectRoot}/dist`, `${projectRoot}/src`)
        .replace(/\.js$/, ".ts");
    }

    return absoluteFilePath;
  }
}

export default ProjectUtil;
