declare class StackTraceUtil {
    private static _uniqueEntries;
    static processStackLine(stackLineObject: {
        line: string;
    }): {
        file: string;
        line: number;
        at: string;
    } | null;
    private static _extractFilePath;
    private static _extractLineNumber;
    private static _extractAtText;
    private static _isDuplicate;
}
export default StackTraceUtil;
