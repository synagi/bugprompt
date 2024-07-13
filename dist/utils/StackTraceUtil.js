import ProjectUtil from "./ProjectUtil.js";
class StackTraceUtil {
    static processStackLine(stackLineObject) {
        // Check if stackLineObject is valid and has a line property
        if (!stackLineObject || typeof stackLineObject.line !== "string") {
            return null;
        }
        // Extract the line from the object
        const line = stackLineObject.line;
        // Extract file path from the line
        const filePath = this._extractFilePath(line);
        if (!filePath) {
            return null;
        }
        // Extract line number from the line
        const lineNumber = this._extractLineNumber(line);
        if (!lineNumber) {
            return null;
        }
        // Convert to relative path using the updated ProjectUtil
        const relativePath = ProjectUtil.getRelativePath(filePath);
        const atText = this._extractAtText(line);
        // Create a unique key for duplicate check
        const uniqueKey = `${relativePath}:${lineNumber}`;
        if (this._isDuplicate(uniqueKey)) {
            return null;
        }
        this._uniqueEntries.add(uniqueKey);
        return { file: relativePath, line: lineNumber, at: atText || "<no-data>" };
    }
    static _extractFilePath(line) {
        if (line.includes("file:///")) {
            const filePathStart = line.indexOf("file:///") + "file:///".length - 1;
            const endOfPath = line.indexOf(":", filePathStart);
            return line.substring(filePathStart, endOfPath);
        }
        const filePathIndex = line.indexOf("/");
        if (filePathIndex !== -1) {
            const endOfPath = line.indexOf(":", filePathIndex);
            return line.substring(filePathIndex, endOfPath);
        }
        return null;
    }
    static _extractLineNumber(line) {
        const parts = line.split(":").filter(Boolean);
        if (parts.length >= 3) {
            const lineNumberString = parts[parts.length - 2];
            const lineNumber = parseInt(lineNumberString);
            return !isNaN(lineNumber) ? lineNumber : null;
        }
        return null;
    }
    static _extractAtText(line) {
        const atIndex = line.indexOf("at ");
        const openParenIndex = line.indexOf(" (");
        if (atIndex !== -1 && openParenIndex !== -1) {
            return line.substring(atIndex + 3, openParenIndex).trim();
        }
        return null;
    }
    static _isDuplicate(uniqueKey) {
        return this._uniqueEntries.has(uniqueKey);
    }
}
StackTraceUtil._uniqueEntries = new Set();
export default StackTraceUtil;
//# sourceMappingURL=StackTraceUtil.js.map