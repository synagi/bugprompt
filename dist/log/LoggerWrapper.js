import logger from "./Logger.js";
class LoggerWrapper {
    static info(...messages) {
        LoggerWrapper.handleAsyncLog("info", ...messages);
    }
    static warn(...messages) {
        LoggerWrapper.handleAsyncLog("warn", ...messages);
    }
    static error(...messages) {
        LoggerWrapper.handleAsyncLog("error", ...messages);
    }
    static debug(...messages) {
        LoggerWrapper.handleAsyncLog("debug", ...messages);
    }
    static trace(...messages) {
        LoggerWrapper.handleAsyncLog("trace", ...messages);
    }
    static exception(...messages) {
        LoggerWrapper.handleAsyncLog("exception", ...messages);
    }
    static handleAsyncLog(level, ...messages) {
        logger[level](...messages).catch((err) => {
            console.error(`Failed to log message at level ${level}:`, err);
        });
    }
}
export default LoggerWrapper;
//# sourceMappingURL=LoggerWrapper.js.map