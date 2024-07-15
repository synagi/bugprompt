import ProjectUtil from "./ProjectUtil.js";
import { StackEntry } from "../utils/ErrorUtil.js";
import { fileURLToPath } from "url";

class StackTraceUtil {
  private static _uniqueEntries = new Set<string>();

  static processStackLine(stackLineObject: {
    line: string;
  }): StackEntry | null {
    if (!stackLineObject || typeof stackLineObject.line !== "string") {
      return null;
    }

    const line = stackLineObject.line;

    let match = line.match(/at\s+(.+)\s+\((.+):(\d+):(\d+)\)/);
    if (!match) {
      match = line.match(/at\s+(.+)\s+\(eval at .+\s+\((.+):(\d+):(\d+)\)/);
      if (!match) {
        return null;
      }
    }

    const [, at, filePath, lineNumber] = match;
    const normalizedPath = this.normalizeFilePath(filePath);

    const uniqueKey = `${normalizedPath}:${lineNumber}`;
    if (this._isDuplicate(uniqueKey)) {
      //console.warn("Duplicate entry found:", uniqueKey);
      return null;
    }
    this._uniqueEntries.add(uniqueKey);

    return {
      file: normalizedPath,
      line: parseInt(lineNumber, 10),
      at: at || "<no-data>",
    };
  }

  private static normalizeFilePath(filePath: string): string {
    if (filePath.startsWith("file:")) {
      filePath = fileURLToPath(filePath);
    }
    let relativePath = ProjectUtil.getRelativePath(filePath);
    return relativePath.replace(/^dist\//, "src/").replace(/\.js$/, ".ts");
  }

  private static _isDuplicate(uniqueKey: string): boolean {
    return this._uniqueEntries.has(uniqueKey);
  }
}

export default StackTraceUtil;
