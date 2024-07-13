declare class Logger {
    private static instance;
    private isNode;
    private maxFileSize;
    private projectName;
    private constructor();
    static getInstance(projectName?: string): Logger;
    private formatLogEntry;
    private log;
    info(...messages: any[]): Promise<void>;
    warn(...messages: any[]): Promise<void>;
    error(...messages: any[]): Promise<void>;
    debug(...messages: any[]): Promise<void>;
    trace(...messages: any[]): Promise<void>;
    exception(...messages: any[]): Promise<void>;
    private logSync;
    private setupGlobalErrorHandlers;
}
declare const _default: Logger;
export default _default;
