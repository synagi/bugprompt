import ErrorUtils from "../utils/ErrorUtil.js";
import FileUtils from "./FileUtil.js";
import EnvironmentUtils from "../utils/EnvUtil.js";
// Constants for the logger
const MAX_FILE_SIZE_MB = 1; // 1 MB in bytes
// Mapping from log levels to emojis
const LOG_LEVEL_EMOJIS = {
    info: "ℹ️",
    warn: "⚠️",
    error: "❗",
    debug: "🔧",
    trace: "🔍",
    exception: "❌",
};
class Logger {
    constructor(projectName = "") {
        this.isNode = EnvironmentUtils.isNodeEnvironment();
        this.maxFileSize = MAX_FILE_SIZE_MB * 1024 * 1024;
        this.projectName = this.isNode
            ? projectName || FileUtils.getProjectName() || "Unknown_Project"
            : projectName || "NON-NODEJS";
        this.setupGlobalErrorHandlers();
    }
    static getInstance(projectName = "") {
        if (!Logger.instance) {
            Logger.instance = new Logger(projectName);
        }
        return Logger.instance;
    }
    // Private method to format a log entry for file
    formatLogEntry(level, message) {
        return `${LOG_LEVEL_EMOJIS[level]}[${this.projectName}] [${level.toUpperCase()}]: ${message}`;
    }
    // Private method to log messages from normal code (i.e. async)
    async log(level, ...messages) {
        let consoleLevel = level === "exception" ? "error" : level;
        let formattedMessages = [];
        let consoleMessages = [];
        for (const msg of messages) {
            if (msg instanceof Error) {
                const errorData = await ErrorUtils.convertError(msg);
                formattedMessages.push(errorData.log);
                consoleMessages.push(errorData.formatted);
            }
            else {
                formattedMessages.push(String(msg));
                consoleMessages.push(msg);
            }
        }
        // Console output
        console[consoleLevel](...consoleMessages);
        // File output
        if (this.isNode) {
            const logEntry = this.formatLogEntry(level, formattedMessages.join(" "));
            FileUtils.logToFile(logEntry, this.maxFileSize);
        }
        // Rethrow for exception level
        if (level === "exception") {
            throw new Error(messages
                .map((msg) => (msg instanceof Error ? msg.message : String(msg)))
                .join(" "));
        }
    }
    // Public methods for different log levels
    async info(...messages) {
        await this.log("info", ...messages);
    }
    async warn(...messages) {
        await this.log("warn", ...messages);
    }
    async error(...messages) {
        await this.log("error", ...messages);
    }
    async debug(...messages) {
        await this.log("debug", ...messages);
    }
    async trace(...messages) {
        await this.log("trace", ...messages);
    }
    async exception(...messages) {
        await this.log("exception", ...messages);
    }
    // Sync methods exclusively for global unhandled errors and rejections
    logSync(level, ...messages) {
        let consoleLevel = level === "exception" ? "error" : level;
        let formattedMessages = [];
        for (const msg of messages) {
            if (msg instanceof Error) {
                const errorData = ErrorUtils.convertErrorSync(msg);
                formattedMessages.push(errorData.log);
                console.error(errorData.formatted); // Use console.error for exceptions
            }
            else {
                formattedMessages.push(String(msg));
                console[consoleLevel](msg);
            }
        }
        // File output (synchronous)
        if (this.isNode) {
            const logEntry = this.formatLogEntry(level, formattedMessages.join(" "));
            FileUtils.logToFileSync(logEntry, this.maxFileSize);
        }
    }
    // Global error handlers setup
    setupGlobalErrorHandlers() {
        if (!this.isNode)
            return;
        process.on("uncaughtException", (err) => {
            this.logSync("exception", "Uncaught Exception:", err);
            process.exit(1);
        });
        process.on("unhandledRejection", (reason) => {
            this.logSync("exception", "Unhandled Rejection:", reason);
            process.exit(1);
        });
    }
}
export default Logger.getInstance();
//# sourceMappingURL=Logger.js.map