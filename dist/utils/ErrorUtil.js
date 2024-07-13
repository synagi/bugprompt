import ProjectUtil from "./ProjectUtil.js";
import path from "path";
import fs from "fs";
import StackTraceUtil from "./StackTraceUtil.js";
class ErrorUtil {
    // Asynch (non-blocking) entry-point for general use in production
    static async convertError(error, newCode = null) {
        let errorObject = await this._processError(error, newCode);
        return this._formatErrorObject(errorObject);
    }
    // Synchronous version, e.g. for global unhandled errors and rejections on process exit
    static convertErrorSync(error, newCode = null) {
        let errorObject = this._processErrorSync(error, newCode);
        return this._formatErrorObject(errorObject);
    }
    // Shared method to format error object
    static _formatErrorObject(errorObject) {
        return {
            error: errorObject, // Raw JSON format
            log: JSON.stringify(errorObject, this._replacer), // Stringified format
            formatted: this._formatConsoleError(errorObject), // Human-readable format
        };
    }
    // Asynchronous version of _processError
    static async _processError(error, newCode) {
        const errorProps = this._sharedProcessErrorLogic(error);
        // Fetch lines of code asynchronously
        if (Array.isArray(errorProps.stack)) {
            errorProps.stack = await this._fetchLinesOfCode(errorProps.stack, newCode);
        }
        return errorProps;
    }
    // Synchronous version of _processError
    static _processErrorSync(error, newCode) {
        const errorProps = this._sharedProcessErrorLogic(error);
        // Ensure that errorProps.stack is always an array
        if (Array.isArray(errorProps.stack)) {
            errorProps.stack = this._fetchLinesOfCodeSync(errorProps.stack, newCode);
        }
        return errorProps;
    }
    // Shared logic between sync / async _processError functions
    static _sharedProcessErrorLogic(error) {
        // Handling string errors (or non-Error objects)
        if (typeof error === "string") {
            return {
                name: "DevErrorMessage",
                message: error,
                stack: "No stack trace available for string-based errors",
                params: "",
            };
        }
        // Default properties for an error object
        let errorProps = {
            name: error.name || "Unknown Error",
            message: error.message || "No message provided",
            stack: error.stack || "No stack trace provided",
            params: "",
        };
        // Handle AggregateError
        if (error instanceof AggregateError) {
            errorProps.stack = error.errors.map((err) => err.stack || "").join("\n");
        }
        // Extract additional properties if they exist
        const additionalProps = [
            "code",
            "errno",
            "syscall",
            "path",
            "address",
            "port",
            "hostname",
        ];
        errorProps.params = additionalProps
            .filter((prop) => error[prop] !== undefined)
            .map((prop) => `${prop}: ${error[prop]}`)
            .join(", ");
        // Process stack trace if available
        if (errorProps.stack !== "No stack trace provided" &&
            errorProps.stack.length > 0) {
            if (typeof errorProps.stack === "string") {
                let parsedStack = this._parseStackTrace(errorProps.stack) || [];
                let projectStack = this._extractProjectStack(parsedStack) || [];
                let filteredProjectStack = this._filterProjectStack(projectStack) || [];
                errorProps.stack = filteredProjectStack;
            }
        }
        else {
            errorProps.stack = []; // Ensure it's an empty array if no stack trace
        }
        return errorProps;
    }
    static _replacer(_key, value) {
        if (value === null || value === "") {
            return undefined;
        }
        return value;
    }
    static _parseStackTrace(stack) {
        if (!stack) {
            return [];
        }
        return stack
            .split("\n")
            .map((line, index) => {
            const trimmedLine = line.trim();
            if (index === 0 && !trimmedLine.startsWith("at ")) {
                return null;
            }
            // Check for node modules and internal lines
            if (trimmedLine.includes("/node_modules/")) {
                return { type: "node_module", line: trimmedLine };
            }
            else if (trimmedLine.startsWith("at native") ||
                trimmedLine.includes("node:")) {
                return { type: "internal", line: trimmedLine };
            }
            // Check if the line is an anonymous or native call
            if (trimmedLine.includes("(<anonymous>)") ||
                trimmedLine.includes("(native)")) {
                return { type: "unknown", line: trimmedLine };
            }
            // Check for project lines
            if (ProjectUtil.isLineInProject(trimmedLine)) {
                return { type: "project", line: trimmedLine };
            }
            // Default to unknown for any other cases
            return { type: "unknown", line: trimmedLine };
        })
            .filter((entry) => entry !== null);
    }
    static _extractProjectStack(parsedStack) {
        let nodeModuleItemIncluded = false;
        return parsedStack.filter(({ type }) => {
            if (type === "node_module" && !nodeModuleItemIncluded) {
                nodeModuleItemIncluded = true;
                return true;
            }
            return type === "project";
        });
    }
    static _filterProjectStack(parsedProjectStack) {
        let processedStack = [];
        for (const stackLineObject of parsedProjectStack) {
            const processedLine = StackTraceUtil.processStackLine(stackLineObject);
            if (processedLine) {
                processedStack.push(processedLine);
            }
        }
        return processedStack;
    }
    static async _fetchLinesOfCode(filteredProjectStack, newCode = null) {
        // Ensure that filteredProjectStack is always an array
        if (!Array.isArray(filteredProjectStack)) {
            return [];
        }
        return Promise.all(filteredProjectStack.map(async (entry) => {
            if (!entry.file) {
                return { ...entry, code: "<no-data>" };
            }
            // Use newCode if provided
            if (newCode) {
                const matchingCodeEntry = newCode.find((codeEntry) => codeEntry.file === entry.file && codeEntry.line === entry.line);
                if (matchingCodeEntry && matchingCodeEntry.code) {
                    return { ...entry, code: matchingCodeEntry.code };
                }
            }
            // Fallback to async file reading logic
            const absoluteFilePath = ProjectUtil.getAbsoluteFilePath(entry.file);
            if (!fs.existsSync(absoluteFilePath)) {
                return { ...entry, code: "<no-data>" };
            }
            try {
                const fileContents = await fs.promises.readFile(absoluteFilePath, "utf8");
                const lines = fileContents.split("\n");
                const codeLine = lines[parseInt(entry.line.toString()) - 1]
                    ?.trim()
                    .substring(0, 100) || "";
                return { ...entry, code: codeLine };
            }
            catch (error) {
                return { ...entry, code: "<error-fetching-code>" };
            }
        }));
    }
    static _fetchLinesOfCodeSync(filteredProjectStack, newCode = null) {
        // Ensure that filteredProjectStack is always an array
        if (!Array.isArray(filteredProjectStack)) {
            return [];
        }
        return filteredProjectStack.map((entry) => {
            if (!entry.file) {
                return { ...entry, code: "<no-data>" };
            }
            // Use newCode if provided
            if (newCode) {
                const matchingCodeEntry = newCode.find((codeEntry) => codeEntry.file === entry.file && codeEntry.line === entry.line);
                if (matchingCodeEntry && matchingCodeEntry.code) {
                    return { ...entry, code: matchingCodeEntry.code };
                }
            }
            // Fallback to sync file reading logic
            const absoluteFilePath = ProjectUtil.getAbsoluteFilePath(entry.file);
            if (!fs.existsSync(absoluteFilePath)) {
                return { ...entry, code: "<no-data>" };
            }
            try {
                const fileContents = fs.readFileSync(absoluteFilePath, "utf8");
                const lines = fileContents.split("\n");
                const codeLine = lines[parseInt(entry.line.toString()) - 1]
                    ?.trim()
                    .substring(0, 100) || "";
                return { ...entry, code: codeLine };
            }
            catch (error) {
                return { ...entry, code: "<error-fetching-code>" };
            }
        });
    }
    static _formatConsoleError(errorObject) {
        // Define color variables
        const colorBold = "\x1b[1m"; // Bold
        const colorDim = "\x1b[2m"; // Dim
        const colorReset = "\x1b[0m"; // Reset formatting
        const colorBright = "\x1b[91m"; // Bright red
        // Format the error type and message with bold
        let output = `\n${colorBright}${errorObject.message}${colorReset} ${colorBold}(${errorObject.name})${colorReset}\n`;
        if (Array.isArray(errorObject.stack) && errorObject.stack.length > 0) {
            errorObject.stack.forEach((trace, index, array) => {
                const location = `${path.basename(trace.file)}:${trace.line}`;
                const atText = trace.at ? `${trace.at}` : "<anonymous>";
                let codeSnippet = "";
                // Add and highlight code snippet if available and not <no-data>
                if (trace.code && trace.code !== "<no-data>") {
                    const highlightedAtText = `// ${atText}:`; // Default color for comment
                    const highlightedCode = `${colorBold}${trace.code}${colorReset}`; // Bold code
                    // Dim code block markers and add a line break after the code block
                    codeSnippet = `${colorDim}\n    \`\`\`js\n${colorReset}    ${highlightedAtText}\n    ${highlightedCode}${colorDim}\n    \`\`\`${colorReset}`;
                }
                else {
                    // Default color for at text without code block
                    codeSnippet = `\n    ${atText}`;
                }
                // Including file path and filename, file path in dim
                output += `\n> ${colorBright}${location}${colorReset}    ${colorDim}(${trace.file})${colorReset}${codeSnippet}`;
                // Add two line breaks after the last entry
                if (index === array.length - 1) {
                    output += "\n";
                }
            });
        }
        else {
            output += `Stack Trace: ${errorObject.stack || "Unavailable"}\n`;
        }
        // Format and highlight parameter values as bold
        if (errorObject.params) {
            const formattedParams = errorObject.params
                .split(", ")
                .map((param) => {
                const [key, value] = param.split(": ");
                return `${key}: ${colorBold}${value}${colorReset}`;
            })
                .join(", ");
            output += `\nAdditional Parameters: ${formattedParams}`;
        }
        return output;
    }
}
export default ErrorUtil;
//# sourceMappingURL=ErrorUtil.js.map