import ProjectUtil from "./ProjectUtil.js";

class StackTraceUtil {
  private static _uniqueEntries = new Set<string>();

  static processStackLine(
    stackLineObject: { line: string },
    monorepoRoot: string | null,
    workspacePaths: string[] | null,
  ) {
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

    // Convert to relative path
    const relativePath = ProjectUtil.getRelativePath(
      filePath,
      monorepoRoot,
      workspacePaths,
    );
    const atText = this._extractAtText(line);

    // Create a unique key for duplicate check
    const uniqueKey = `${relativePath}:${lineNumber}`;
    if (this._isDuplicate(uniqueKey)) {
      return null;
    }
    this._uniqueEntries.add(uniqueKey);

    return { file: relativePath, line: lineNumber, at: atText || "<no-data>" };
  }

  private static _extractFilePath(line: string): string | null {
    // Handling lines starting with 'file:///'
    if (line.includes("file:///")) {
      const filePathStart = line.indexOf("file:///") + "file:///".length - 1;
      const endOfPath = line.indexOf(":", filePathStart);
      return line.substring(filePathStart, endOfPath);
    }

    // Handling standard file path
    const filePathIndex = line.indexOf("/");
    if (filePathIndex !== -1) {
      const endOfPath = line.indexOf(":", filePathIndex);
      return line.substring(filePathIndex, endOfPath);
    }

    // If no valid path is found
    return null;
  }

  private static _extractLineNumber(line: string): number | null {
    // Split the line by colon and remove empty strings if any
    const parts = line.split(":").filter(Boolean);

    // The line number should be the second last part of the split
    if (parts.length >= 3) {
      const lineNumberString = parts[parts.length - 2];
      const lineNumber = parseInt(lineNumberString);
      if (!isNaN(lineNumber)) {
        return lineNumber;
      }
    }
    return null;
  }

  private static _extractAtText(line: string): string | null {
    const atIndex = line.indexOf("at ");
    const openParenIndex = line.indexOf(" (");
    if (atIndex !== -1 && openParenIndex !== -1) {
      return line.substring(atIndex + 3, openParenIndex).trim();
    }
    return null;
  }

  private static _isDuplicate(uniqueKey: string): boolean {
    return this._uniqueEntries.has(uniqueKey);
  }
}

export default StackTraceUtil;
