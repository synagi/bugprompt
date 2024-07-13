import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
class ProjectUtil {
    // General initialization method
    static initialize(overrideMonorepoRoot = null, overrideWorkspacePaths = null) {
        const monorepoRoot = overrideMonorepoRoot || this.monorepoRoot || this.getMonorepoRoot();
        const workspacePaths = overrideWorkspacePaths || this.workspacePaths || this.getWorkspacePaths();
        return { monorepoRoot, workspacePaths };
    }
    static getMonorepoRoot() {
        let currentDir = path.dirname(fileURLToPath(import.meta.url));
        while (currentDir !== path.parse(currentDir).root) {
            const packageJsonPath = path.join(currentDir, "package.json");
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
                // Check if it's a monorepo by looking for workspaces attribute
                if (packageJson.workspaces) {
                    this.monorepoRoot = currentDir;
                    return currentDir;
                }
                // If not a monorepo, return the current directory as the root
                return currentDir;
            }
            currentDir = path.dirname(currentDir);
        }
        return null; // Fallback if no package.json is found
    }
    static getWorkspacePaths() {
        if (this.workspacePaths !== null) {
            return this.workspacePaths;
        }
        let workspacePaths = [];
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
                        const baseDir = path.join(monorepoRoot, workspacePattern.slice(0, -2));
                        try {
                            const subdirs = fs.readdirSync(baseDir, { withFileTypes: true });
                            for (const dirent of subdirs) {
                                if (dirent.isDirectory()) {
                                    workspacePaths.push(path.join(baseDir, dirent.name));
                                }
                            }
                        }
                        catch (error) {
                            console.warn(`Skipping non-existent directory: ${baseDir}`);
                        }
                    }
                    else {
                        workspacePaths.push(path.join(monorepoRoot, workspacePattern));
                    }
                }
            }
        }
        catch (error) {
            console.error("Error fetching workspace paths:", error);
            workspacePaths = []; // Reset to empty array on error
        }
        this.workspacePaths = workspacePaths;
        return workspacePaths;
    }
    // Common function to find project folder given a starting directory
    static getProjectFolder(startDir, overrideMonorepoRoot = null, overrideWorkspacePaths = null) {
        const { monorepoRoot, workspacePaths } = this.initialize(overrideMonorepoRoot, overrideWorkspacePaths);
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
    static isLineInProject(line, overrideMonorepoRoot = null, overrideWorkspacePaths = null) {
        const { monorepoRoot, workspacePaths } = this.initialize(overrideMonorepoRoot, overrideWorkspacePaths);
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
    static getRelativePath(fullPath, overrideMonorepoRoot = null, overrideWorkspacePaths = null) {
        const { monorepoRoot, workspacePaths } = this.initialize(overrideMonorepoRoot, overrideWorkspacePaths);
        for (const workspacePath of workspacePaths) {
            if (fullPath.startsWith(workspacePath)) {
                const relativePath = path.relative(workspacePath, fullPath);
                const projectName = path.basename(workspacePath);
                return path.join(projectName, relativePath);
            }
        }
        return path.relative(path.join(monorepoRoot || "", "src"), fullPath);
    }
    static getAbsoluteFilePath(relativeFilePath, overrideMonorepoRoot = null, overrideWorkspacePaths = null) {
        const { monorepoRoot, workspacePaths } = this.initialize(overrideMonorepoRoot, overrideWorkspacePaths);
        for (const workspacePath of workspacePaths) {
            const projectName = path.basename(workspacePath);
            if (relativeFilePath.startsWith(projectName)) {
                const pathWithinProject = relativeFilePath.substring(projectName.length + 1);
                return path.join(workspacePath, pathWithinProject);
            }
        }
        return path.join(monorepoRoot || "", "src", relativeFilePath);
    }
}
ProjectUtil.monorepoRoot = null;
ProjectUtil.workspacePaths = null;
export default ProjectUtil;
//# sourceMappingURL=ProjectUtil.js.map