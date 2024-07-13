import fs from "fs";
import path from "path";
class FileUtils {
    // Method to find the project root by searching for package.json
    static findProjectRoot(currentDir = process.cwd()) {
        while (currentDir !== path.parse(currentDir).root) {
            const packageJsonPath = path.join(currentDir, "package.json");
            if (fs.existsSync(packageJsonPath)) {
                return currentDir; // Return the directory containing package.json
            }
            currentDir = path.dirname(currentDir);
        }
        return null;
    }
    // Method to get the log file path
    static getLogFilePath() {
        const projectRoot = this.findProjectRoot();
        return projectRoot ? path.join(projectRoot, "package.log") : null;
    }
    // Trims the log file to prevent it from growing indefinitely
    static trimLogFile(fileName) {
        const lines = fs.readFileSync(fileName, "utf-8").split("\n");
        if (lines.length > 1) {
            lines.shift();
            fs.writeFileSync(fileName, lines.join("\n"));
        }
    }
    // Logs a message to a file, applying a maximum size limit
    static logToFile(message, maxSize) {
        const logFilePath = this.getLogFilePath();
        if (!logFilePath) {
            console.warn("Log file path could not be determined.");
            return;
        }
        // Check if the log file exists and needs to be trimmed
        if (fs.existsSync(logFilePath)) {
            const stats = fs.statSync(logFilePath);
            if (stats.size >= maxSize) {
                this.trimLogFile(logFilePath);
            }
        }
        // Append the message to the log file
        fs.appendFileSync(logFilePath, message + "\n");
    }
    // Synchronous version of the logToFile method
    static logToFileSync(message, maxSize) {
        const logFilePath = this.getLogFilePath();
        if (!logFilePath) {
            console.warn("Log file path could not be determined.");
            return;
        }
        // Check if the file exists and needs to be trimmed
        if (fs.existsSync(logFilePath)) {
            const stats = fs.statSync(logFilePath);
            if (stats.size >= maxSize) {
                this.trimLogFileSync(logFilePath);
            }
        }
        // Write the log message synchronously
        fs.appendFileSync(logFilePath, message + "\n");
    }
    // Synchronous version of trimLogFile
    static trimLogFileSync(fileName) {
        const lines = fs.readFileSync(fileName, "utf-8").split("\n");
        if (lines.length > 1) {
            lines.shift(); // Remove the first line
            fs.writeFileSync(fileName, lines.join("\n"));
        }
    }
    // Public method to get the project name, utilizes the private method
    static getProjectName() {
        let currentDir = process.cwd();
        while (currentDir !== path.parse(currentDir).root) {
            try {
                const packageJsonPath = path.join(currentDir, "package.json");
                const packageJsonRaw = fs.readFileSync(packageJsonPath, "utf8");
                const packageJson = JSON.parse(packageJsonRaw);
                return packageJson.name;
            }
            catch (error) {
                // Move to the parent directory and try again
                currentDir = path.dirname(currentDir);
            }
        }
        console.warn("Unable to find package.json in any parent directory.");
        return null;
    }
}
export default FileUtils;
//# sourceMappingURL=FileUtil.js.map