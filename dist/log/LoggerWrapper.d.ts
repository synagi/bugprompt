declare class LoggerWrapper {
    static info(...messages: any[]): void;
    static warn(...messages: any[]): void;
    static error(...messages: any[]): void;
    static debug(...messages: any[]): void;
    static trace(...messages: any[]): void;
    static exception(...messages: any[]): void;
    private static handleAsyncLog;
}
export default LoggerWrapper;
