import fs from "fs";
import path from "path";
class ProjectUtil {
    static findProjectRoot(currentDir = process.cwd()) {
        let directory = currentDir;
        while (directory !== path.parse(directory).root) {
            if (fs.existsSync(path.join(directory, "package.json"))) {
                // Check if this is the nodejs-util package or a project using it
                const packageJson = JSON.parse(fs.readFileSync(path.join(directory, "package.json"), "utf8"));
                if (packageJson.name === "@synagi/nodejs-util") {
                    // If it's the nodejs-util package, return its root
                    return directory;
                }
                else {
                    // If it's a project using nodejs-util, return its root
                    return directory;
                }
            }
            directory = path.dirname(directory);
        }
        throw new Error("Project root not found");
    }
    static getRelativePath(fullPath) {
        const projectRoot = this.findProjectRoot();
        return path.relative(projectRoot, fullPath);
    }
    static getAbsoluteFilePath(relativeFilePath) {
        const projectRoot = this.findProjectRoot();
        return path.join(projectRoot, relativeFilePath);
    }
    static isLineInProject(line) {
        const projectRoot = this.findProjectRoot();
        return line.includes(projectRoot);
    }
}
export default ProjectUtil;
//# sourceMappingURL=ProjectUtil.js.map