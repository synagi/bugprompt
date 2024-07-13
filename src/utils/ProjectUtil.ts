import fs from "fs";
import path from "path";
import FileUtil from "../log/FileUtil.js";

class ProjectUtil {
  static findProjectRoot(currentDir: string = process.cwd()): string {
    let directory = currentDir;
    let lastDirectory = "";
    while (directory !== lastDirectory) {
      if (fs.existsSync(path.join(directory, "package.json"))) {
        const projectName = FileUtil.getProjectName();

        // Check if this is the nodejs-util package
        if (projectName === FileUtil.getProjectName()) {
          // If it's the nodejs-util package, return its directory
          return directory;
        } else {
          // If it's not nodejs-util, this is the project root we want
          return directory;
        }
      }
      lastDirectory = directory;
      directory = path.dirname(directory);
    }
    // If we've reached here, we couldn't find a package.json
    // So we'll return the current working directory as a fallback
    return process.cwd();
  }

  static getRelativePath(fullPath: string): string {
    const projectRoot = this.findProjectRoot();
    return path.relative(projectRoot, fullPath);
  }

  static getAbsoluteFilePath(relativeFilePath: string): string {
    const projectRoot = this.findProjectRoot();
    return path.join(projectRoot, relativeFilePath);
  }

  static isLineInProject(line: string): boolean {
    const projectRoot = this.findProjectRoot();
    return line.includes(projectRoot);
  }
}

export default ProjectUtil;
