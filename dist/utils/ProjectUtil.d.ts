declare class ProjectUtil {
    private static monorepoRoot;
    private static workspacePaths;
    static initialize(overrideMonorepoRoot?: string | null, overrideWorkspacePaths?: string[] | null): {
        monorepoRoot: string | null;
        workspacePaths: string[];
    };
    static getMonorepoRoot(): string | null;
    static getWorkspacePaths(): string[];
    static getProjectFolder(startDir: string, overrideMonorepoRoot?: string | null, overrideWorkspacePaths?: string[] | null): string | null;
    static isLineInProject(line: string, overrideMonorepoRoot?: string | null, overrideWorkspacePaths?: string[] | null): boolean;
    static getRelativePath(fullPath: string, overrideMonorepoRoot?: string | null, overrideWorkspacePaths?: string[] | null): string;
    static getAbsoluteFilePath(relativeFilePath: string, overrideMonorepoRoot?: string | null, overrideWorkspacePaths?: string[] | null): string;
}
export default ProjectUtil;
