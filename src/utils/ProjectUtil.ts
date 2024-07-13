import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

class ProjectUtil {
  private static monorepoRoot: string | null = null;
  private static workspacePaths: string[] | null = null;

  // General initialization method
  static initialize(
    overrideMonorepoRoot: string | null = null,
    overrideWorkspacePaths: string[] | null = null,
  ): { monorepoRoot: string | null; workspacePaths: string[] } {
    const monorepoRoot =
      overrideMonorepoRoot || this.monorepoRoot || this.getMonorepoRoot();
    const workspacePaths =
      overrideWorkspacePaths || this.workspacePaths || this.getWorkspacePaths();

    return { monorepoRoot, workspacePaths };
  }

  static getMonorepoRoot(): string | null {
    if (this.monorepoRoot !== null) {
      return this.monorepoRoot;
    }

    let currentDir = path.dirname(fileURLToPath(import.meta.url));
    while (currentDir !== path.parse(currentDir).root) {
      const packageJsonPath = path.join(currentDir, "package.json");
      if (fs.existsSync(packageJsonPath)) {
        try {
          const packageJson = JSON.parse(
            fs.readFileSync(packageJsonPath, "utf8"),
          );
          if (packageJson.workspaces) {
            this.monorepoRoot = currentDir;
            return currentDir;
          }
        } catch (error) {
          // Ignore the error as it means package.json doesn't exist in this directory
        }
      }
      currentDir = path.dirname(currentDir);
    }

    return null; // Indicate that a monorepo root was not found
  }

  static getWorkspacePaths(): string[] {
    if (this.workspacePaths !== null) {
      return this.workspacePaths;
    }

    let workspacePaths: string[] = [];
    try {
      const monorepoRoot = this.getMonorepoRoot();
      if (!monorepoRoot) {
        return []; // Return an empty array if no monorepo root is found
      }

      const packageJsonPath = path.join(monorepoRoot, "package.json");
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

      if (packageJson.workspaces && Array.isArray(packageJson.workspaces)) {
        for (const workspacePattern of packageJson.workspaces) {
          if (workspacePattern.endsWith("/*")) {
            const baseDir = path.join(
              monorepoRoot,
              workspacePattern.slice(0, -2),
            );
            try {
              const subdirs = fs.readdirSync(baseDir, { withFileTypes: true });
              for (const dirent of subdirs) {
                if (dirent.isDirectory()) {
                  workspacePaths.push(path.join(baseDir, dirent.name));
                }
              }
            } catch (error) {
              console.warn(`Skipping non-existent directory: ${baseDir}`);
            }
          } else {
            workspacePaths.push(path.join(monorepoRoot, workspacePattern));
          }
        }
      }
    } catch (error) {
      console.error("Error fetching workspace paths:", error);
      workspacePaths = []; // Reset to empty array on error
    }

    this.workspacePaths = workspacePaths;
    return workspacePaths;
  }

  // Common function to find project folder given a starting directory
  static getProjectFolder(
    startDir: string,
    overrideMonorepoRoot: string | null = null,
    overrideWorkspacePaths: string[] | null = null,
  ): string | null {
    const { monorepoRoot, workspacePaths } = this.initialize(
      overrideMonorepoRoot,
      overrideWorkspacePaths,
    );

    if (!monorepoRoot) {
      return null; // Not in a monorepo
    }

    // Check if startDir is a subdirectory of any workspace path
    for (const workspacePath of workspacePaths) {
      if (startDir.startsWith(workspacePath)) {
        return startDir;
      }
    }

    // Check if startDir is within the monorepo root but not in a specific workspace
    if (startDir.startsWith(monorepoRoot)) {
      return startDir;
    }

    return null; // Project folder not found within the monorepo
  }

  static isLineInProject(
    line: string,
    overrideMonorepoRoot: string | null = null,
    overrideWorkspacePaths: string[] | null = null,
  ): boolean {
    const { monorepoRoot, workspacePaths } = this.initialize(
      overrideMonorepoRoot,
      overrideWorkspacePaths,
    );

    if (monorepoRoot && line.includes(monorepoRoot)) {
      return true;
    }
    for (const workspacePath of workspacePaths) {
      if (line.includes(workspacePath)) {
        return true;
      }
    }
    return false;
  }

  static getRelativePath(
    fullPath: string,
    overrideMonorepoRoot: string | null = null,
    overrideWorkspacePaths: string[] | null = null,
  ): string {
    const { monorepoRoot, workspacePaths } = this.initialize(
      overrideMonorepoRoot,
      overrideWorkspacePaths,
    );

    for (const workspacePath of workspacePaths) {
      if (fullPath.startsWith(workspacePath)) {
        const relativePath = path.relative(workspacePath, fullPath);
        const projectName = path.basename(workspacePath);
        return path.join(projectName, relativePath);
      }
    }
    return path.relative(path.join(monorepoRoot || "", "src"), fullPath);
  }

  static getAbsoluteFilePath(
    relativeFilePath: string,
    overrideMonorepoRoot: string | null = null,
    overrideWorkspacePaths: string[] | null = null,
  ): string {
    const { monorepoRoot, workspacePaths } = this.initialize(
      overrideMonorepoRoot,
      overrideWorkspacePaths,
    );

    for (const workspacePath of workspacePaths) {
      const projectName = path.basename(workspacePath);
      if (relativeFilePath.startsWith(projectName)) {
        const pathWithinProject = relativeFilePath.substring(
          projectName.length + 1,
        );
        return path.join(workspacePath, pathWithinProject);
      }
    }
    return path.join(monorepoRoot || "", "src", relativeFilePath);
  }
}

export default ProjectUtil;
