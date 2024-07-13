import fs from "fs";
import path from "path";
import FileUtil from "../log/FileUtil.js";

class ProjectUtil {
  static findProjectRoot(currentDir: string = process.cwd()): string {
    console.log(
      `ProjectUtil.findProjectRoot called with currentDir: ${currentDir}`,
    );
    let directory = currentDir;
    let lastDirectory = "";
    let foundNodeModules = false;

    while (directory !== lastDirectory) {
      console.log(`Checking directory: ${directory}`);
      if (fs.existsSync(path.join(directory, "package.json"))) {
        const packageJsonPath = path.join(directory, "package.json");
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, "utf8"),
        );
        console.log(`Found package.json with name: ${packageJson.name}`);

        if (packageJson.name === FileUtil.getProjectName()) {
          console.log(
            `Matched project name. Returning directory: ${directory}`,
          );
          return directory;
        } else if (foundNodeModules) {
          console.log(
            `Passed through node_modules. Returning directory: ${directory}`,
          );
          return directory;
        }
      }

      if (path.basename(directory) === "node_modules") {
        console.log(`Found node_modules directory: ${directory}`);
        foundNodeModules = true;
      }

      lastDirectory = directory;
      directory = path.dirname(directory);
    }

    console.log(
      `No suitable root found. Returning current working directory: ${process.cwd()}`,
    );
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
