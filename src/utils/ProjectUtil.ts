import fs from "fs";
import path from "path";

class ProjectUtil {
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
    return projectRoot ? path.relative(projectRoot, fullPath) : fullPath;
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
}

export default ProjectUtil;
