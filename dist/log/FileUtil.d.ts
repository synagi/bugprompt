declare class FileUtils {
    static findProjectRoot(currentDir?: string): string | null;
    static getLogFilePath(): string | null;
    private static trimLogFile;
    static logToFile(message: string, maxSize: number): void;
    static logToFileSync(message: string, maxSize: number): void;
    private static trimLogFileSync;
    static getProjectName(): string | null;
}
export default FileUtils;
