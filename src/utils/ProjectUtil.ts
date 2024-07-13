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

        if (packageJson.name === this.getProjectName()) {
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
