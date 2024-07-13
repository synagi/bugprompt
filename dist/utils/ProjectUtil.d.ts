declare class ProjectUtil {
    static findProjectRoot(currentDir?: string): string;
    static getRelativePath(fullPath: string): string;
    static getAbsoluteFilePath(relativeFilePath: string): string;
    static isLineInProject(line: string): boolean;
}
export default ProjectUtil;
