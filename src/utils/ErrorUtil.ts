import ProjectUtil from "./ProjectUtil.js";
import path from "path";
import fs from "fs";
import StackTraceUtil from "./StackTraceUtil.js";

export interface ErrorProps {
  name: string;
  message: string;
  stack: string | StackEntry[] | [];
  params: string;
}

export interface StackEntry {
  file: string;
  line: number;
  at: string;
  code?: string;
}

export interface ErrorObject {
  error: ErrorProps;
  log: string;
  formatted: string;
}

class ErrorUtil {
  static async convertError(
    error: Error | string,
    newCode: any = null,
  ): Promise<ErrorObject> {
    let errorObject = await this._processError(error, newCode);
    return this._formatErrorObject(errorObject);
  }

  static convertErrorSync(
    error: Error | string,
    newCode: any = null,
  ): ErrorObject {
    let errorObject = this._processErrorSync(error, newCode);
    return this._formatErrorObject(errorObject);
  }

  private static _formatErrorObject(errorObject: ErrorProps): ErrorObject {
    return {
      error: errorObject,
      log: JSON.stringify(errorObject, this._replacer),
      formatted: this._formatConsoleError(errorObject),
    };
  }

  private static async _processError(
    error: Error | string,
    newCode: any,
  ): Promise<ErrorProps> {
    const errorProps = this._sharedProcessErrorLogic(error);

    if (Array.isArray(errorProps.stack)) {
      errorProps.stack = await this._fetchLinesOfCode(
        errorProps.stack,
        newCode,
      );
    }
    return errorProps;
  }

  private static _processErrorSync(
    error: Error | string,
    newCode: any,
  ): ErrorProps {
    const errorProps = this._sharedProcessErrorLogic(error);

    if (Array.isArray(errorProps.stack)) {
      errorProps.stack = this._fetchLinesOfCodeSync(errorProps.stack, newCode);
    }
    return errorProps;
  }

  private static _sharedProcessErrorLogic(error: Error | string): ErrorProps {
    if (typeof error === "string") {
      return {
        name: "DevErrorMessage",
        message: error,
        stack: "No stack trace available for string-based errors",
        params: "",
      };
    }

    let errorProps: ErrorProps = {
      name: error.name || "Unknown Error",
      message: error.message || "No message provided",
      stack: error.stack || "No stack trace provided",
      params: "",
    };

    if (error instanceof AggregateError) {
      errorProps.stack = error.errors.map((err) => err.stack || "").join("\n");
    }

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
      .filter((prop) => (error as any)[prop] !== undefined)
      .map((prop) => `${prop}: ${(error as any)[prop]}`)
      .join(", ");

    if (
      errorProps.stack !== "No stack trace provided" &&
      errorProps.stack.length > 0
    ) {
      if (typeof errorProps.stack === "string") {
        let parsedStack = this._parseStackTrace(errorProps.stack) || [];
        let projectStack = this._extractProjectStack(parsedStack) || [];
        let filteredProjectStack = this._filterProjectStack(projectStack) || [];
        errorProps.stack = filteredProjectStack;
      }
    } else {
      errorProps.stack = [];
    }

    return errorProps;
  }

  private static _replacer(_key: string, value: any): any {
    if (value === null || value === "") {
      return undefined;
    }
    return value;
  }

  private static _parseStackTrace(
    stack: string,
  ): { type: string; line: string }[] {
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

        if (trimmedLine.includes("/node_modules/")) {
          return { type: "node_module", line: trimmedLine };
        } else if (
          trimmedLine.startsWith("at native") ||
          trimmedLine.includes("node:")
        ) {
          return { type: "internal", line: trimmedLine };
        }

        if (
          trimmedLine.includes("(<anonymous>)") ||
          trimmedLine.includes("(native)")
        ) {
          return { type: "unknown", line: trimmedLine };
        }

        if (ProjectUtil.isLineInProject(trimmedLine)) {
          return { type: "project", line: trimmedLine };
        }

        return { type: "unknown", line: trimmedLine };
      })
      .filter(
        (entry): entry is { type: string; line: string } => entry !== null,
      );
  }

  private static _extractProjectStack(
    parsedStack: { type: string; line: string }[],
  ): { type: string; line: string }[] {
    let nodeModuleItemIncluded = false;
    return parsedStack.filter(({ type }) => {
      if (type === "node_module" && !nodeModuleItemIncluded) {
        nodeModuleItemIncluded = true;
        return true;
      }
      return type === "project";
    });
  }

  private static _filterProjectStack(
    parsedProjectStack: { type: string; line: string }[],
  ): StackEntry[] {
    let processedStack: StackEntry[] = [];

    for (const stackLineObject of parsedProjectStack) {
      const processedLine = StackTraceUtil.processStackLine(stackLineObject);
      if (processedLine) {
        processedStack.push(processedLine);
      }
    }

    return processedStack;
  }

  private static async _fetchLinesOfCode(
    filteredProjectStack: StackEntry[],
    newCode: any[] | null = null,
  ): Promise<StackEntry[]> {
    if (!Array.isArray(filteredProjectStack)) {
      return [];
    }

    return Promise.all(
      filteredProjectStack.map(async (entry) => {
        if (!entry.file) {
          return { ...entry, code: "<no-data>" };
        }

        if (newCode) {
          const matchingCodeEntry = newCode.find(
            (codeEntry) =>
              codeEntry.file === entry.file && codeEntry.line === entry.line,
          );
          if (matchingCodeEntry && matchingCodeEntry.code) {
            return { ...entry, code: matchingCodeEntry.code };
          }
        }

        const absoluteFilePath = ProjectUtil.getAbsoluteFilePath(entry.file);
        if (!fs.existsSync(absoluteFilePath)) {
          return { ...entry, code: "<no-data>" };
        }

        try {
          const fileContents = await fs.promises.readFile(
            absoluteFilePath,
            "utf8",
          );
          const lines = fileContents.split("\n");
          const codeLine =
            lines[parseInt(entry.line.toString()) - 1]
              ?.trim()
              .substring(0, 100) || "";
          return { ...entry, code: codeLine };
        } catch (error) {
          return { ...entry, code: "<error-fetching-code>" };
        }
      }),
    );
  }

  private static _fetchLinesOfCodeSync(
    filteredProjectStack: StackEntry[],
    newCode: any[] | null = null,
  ): StackEntry[] {
    if (!Array.isArray(filteredProjectStack)) {
      return [];
    }

    return filteredProjectStack.map((entry) => {
      if (!entry.file) {
        return { ...entry, code: "<no-data>" };
      }

      if (newCode) {
        const matchingCodeEntry = newCode.find(
          (codeEntry) =>
            codeEntry.file === entry.file && codeEntry.line === entry.line,
        );
        if (matchingCodeEntry && matchingCodeEntry.code) {
          return { ...entry, code: matchingCodeEntry.code };
        }
      }

      const absoluteFilePath = ProjectUtil.getAbsoluteFilePath(entry.file);
      if (!fs.existsSync(absoluteFilePath)) {
        return { ...entry, code: "<no-data>" };
      }

      try {
        const fileContents = fs.readFileSync(absoluteFilePath, "utf8");
        const lines = fileContents.split("\n");
        const codeLine =
          lines[parseInt(entry.line.toString()) - 1]
            ?.trim()
            .substring(0, 100) || "";
        return { ...entry, code: codeLine };
      } catch (error) {
        return { ...entry, code: "<error-fetching-code>" };
      }
    });
  }

  private static _formatConsoleError(errorObject: ErrorProps): string {
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
        } else {
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
    } else {
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
