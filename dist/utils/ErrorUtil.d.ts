interface ErrorProps {
    name: string;
    message: string;
    stack: string | StackEntry[] | [];
    params: string;
}
interface StackEntry {
    file: string;
    line: number;
    at: string;
    code?: string;
}
interface ErrorObject {
    error: ErrorProps;
    log: string;
    formatted: string;
}
declare class ErrorUtil {
    static convertError(error: Error | string, newCode?: any): Promise<ErrorObject>;
    static convertErrorSync(error: Error | string, newCode?: any): ErrorObject;
    private static _formatErrorObject;
    private static _processError;
    private static _processErrorSync;
    private static _sharedProcessErrorLogic;
    private static _replacer;
    private static _parseStackTrace;
    private static _extractProjectStack;
    private static _filterProjectStack;
    private static _fetchLinesOfCode;
    private static _fetchLinesOfCodeSync;
    private static _formatConsoleError;
}
export default ErrorUtil;
