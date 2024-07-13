import fs from "fs";
import path from "path";
import FileUtil from "../log/FileUtil.js";

class ProjectUtil {
  static findProjectRoot(currentDir: string = process.cwd()): string {
    let directory = currentDir;
    let lastDirectory = "";
    let foundNodeModules = false;

    while (directory !== lastDirectory) {
      if (fs.existsSync(path.join(directory, "package.json"))) {
        const packageJsonPath = path.join(directory, "package.json");
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, "utf8"),
        );

        if (packageJson.name === FileUtil.getProjectName()) {
          // If it's the nodejs-util package itself
          return directory;
        } else if (foundNodeModules) {
          // If we've passed through node_modules, this is the root of the project using nodejs-util
          return directory;
        }
        // If neither condition is met, continue searching upwards
      }

      if (path.basename(directory) === "node_modules") {
        foundNodeModules = true;
      }

      lastDirectory = directory;
      directory = path.dirname(directory);
    }

    // If we've reached here, we couldn't find a suitable root
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
