import ProjectUtil from "./ProjectUtil.js";
import path from "path";
import fs from "fs";
import StackTraceUtil from "./StackTraceUtil.js";

interface ErrorProps {
  name: string;
  message: string;
  stack: string | StackEntry[] | [];
  params: string;
}

interface StackEntry {
  file: string;
  line: number;
  at: string;
  code?: string;
}

interface ErrorObject {
  error: ErrorProps;
  log: string;
  formatted: string;
}

class ErrorUtil {
  // Asynch (non-blocking) entry-point for general use in production
  static async convertError(
    error: Error | string,
    monorepoRoot: string | null = null,
    workspacePaths: string[] | null = null,
    newCode: any = null,
  ): Promise<ErrorObject> {
    let errorObject = await this._processError(
      error,
      monorepoRoot,
      workspacePaths,
      newCode,
    );
    return this._formatErrorObject(errorObject);
  }

  // Synchronous version, e.g. for global unhandled errors and rejections on process exit
  static convertErrorSync(
    error: Error | string,
    monorepoRoot: string | null = null,
    workspacePaths: string[] | null = null,
    newCode: any = null,
  ): ErrorObject {
    let errorObject = this._processErrorSync(
      error,
      monorepoRoot,
      workspacePaths,
      newCode,
    );
    return this._formatErrorObject(errorObject);
  }

  // Shared method to format error object
  private static _formatErrorObject(errorObject: ErrorProps): ErrorObject {
    return {
      error: errorObject, // Raw JSON format
      log: JSON.stringify(errorObject, this._replacer), // Stringified format
      formatted: this._formatConsoleError(errorObject), // Human-readable format
    };
  }

  // Asynchronous version of _processError
  private static async _processError(
    error: Error | string,
    monorepoRoot: string | null,
    workspacePaths: string[] | null,
    newCode: any,
  ): Promise<ErrorProps> {
    const {
      errorProps,
      monorepoRoot: updatedMonorepoRoot,
      workspacePaths: updatedWorkspacePaths,
    } = this._sharedProcessErrorLogic(error, monorepoRoot, workspacePaths);

    // Fetch lines of code asynchronously
    if (Array.isArray(errorProps.stack)) {
      errorProps.stack = await this._fetchLinesOfCode(
        errorProps.stack,
        updatedMonorepoRoot,
        updatedWorkspacePaths,
        newCode,
      );
    }
    return errorProps;
  }

  // Synchronous version of _processError
  private static _processErrorSync(
    error: Error | string,
    monorepoRoot: string | null,
    workspacePaths: string[] | null,
    newCode: any,
  ): ErrorProps {
    const {
      errorProps,
      monorepoRoot: updatedMonorepoRoot,
      workspacePaths: updatedWorkspacePaths,
    } = this._sharedProcessErrorLogic(error, monorepoRoot, workspacePaths);

    // Ensure that errorProps.stack is always an array
    if (Array.isArray(errorProps.stack)) {
      errorProps.stack = this._fetchLinesOfCodeSync(
        errorProps.stack,
        updatedMonorepoRoot,
        updatedWorkspacePaths,
        newCode,
      );
    }
    return errorProps;
  }

  // Shared logic between sync / async _processError functions
  private static _sharedProcessErrorLogic(
    error: Error | string,
    monorepoRoot: string | null,
    workspacePaths: string[] | null,
  ): {
    errorProps: ErrorProps;
    monorepoRoot: string | null;
    workspacePaths: string[] | null;
  } {
    // Handling string errors (or non-Error objects)
    if (typeof error === "string") {
      return {
        errorProps: {
          name: "DevErrorMessage",
          message: error,
          stack: "No stack trace available for string-based errors",
          params: "",
        },
        monorepoRoot,
        workspacePaths,
      };
    }

    // Default properties for an error object
    let errorProps: ErrorProps = {
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
      .filter((prop) => (error as any)[prop] !== undefined)
      .map((prop) => `${prop}: ${(error as any)[prop]}`)
      .join(", ");

    // Process stack trace if available
    if (
      errorProps.stack !== "No stack trace provided" &&
      errorProps.stack.length > 0
    ) {
      // Add this check
      if (!monorepoRoot || !workspacePaths) {
        monorepoRoot = ProjectUtil.getMonorepoRoot();
        workspacePaths = ProjectUtil.getWorkspacePaths();
      }

      if (typeof errorProps.stack === "string") {
        let parsedStack =
          this._parseStackTrace(
            errorProps.stack,
            monorepoRoot,
            workspacePaths,
          ) || [];
        let projectStack = this._extractProjectStack(parsedStack) || [];
        let filteredProjectStack =
          this._filterProjectStack(
            projectStack,
            monorepoRoot,
            workspacePaths,
          ) || [];
        errorProps.stack = filteredProjectStack;
      }
    } else {
      errorProps.stack = []; // Ensure it's an empty array if no stack trace
    }

    return { errorProps, monorepoRoot, workspacePaths };
  }

  private static _replacer(_key: string, value: any): any {
    if (value === null || value === "") {
      return undefined;
    }
    return value;
  }

  private static _parseStackTrace(
    stack: string,
    monorepoRoot: string | null,
    workspacePaths: string[] | null,
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

        // Check for node modules and internal lines
        if (trimmedLine.includes("/node_modules/")) {
          return { type: "node_module", line: trimmedLine };
        } else if (
          trimmedLine.startsWith("at native") ||
          trimmedLine.includes("node:")
        ) {
          return { type: "internal", line: trimmedLine };
        }

        // Check if the line is an anonymous or native call
        if (
          trimmedLine.includes("(<anonymous>)") ||
          trimmedLine.includes("(native)")
        ) {
          return { type: "unknown", line: trimmedLine };
        }

        // Check for project lines
        if (
          ProjectUtil.isLineInProject(trimmedLine, monorepoRoot, workspacePaths)
        ) {
          return { type: "project", line: trimmedLine };
        }

        // Default to unknown for any other cases
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
    monorepoRoot: string | null,
    workspacePaths: string[] | null,
  ): StackEntry[] {
    let processedStack: StackEntry[] = [];

    for (const stackLineObject of parsedProjectStack) {
      const processedLine = StackTraceUtil.processStackLine(
        stackLineObject,
        monorepoRoot,
        workspacePaths,
      );
      if (processedLine) {
        processedStack.push(processedLine);
      }
    }

    return processedStack;
  }

  private static async _fetchLinesOfCode(
    filteredProjectStack: StackEntry[],
    monorepoRoot: string | null,
    workspacePaths: string[] | null,
    newCode: any[] | null = null,
  ): Promise<StackEntry[]> {
    // Ensure that filteredProjectStack is always an array
    if (!Array.isArray(filteredProjectStack)) {
      return [];
    }

    return Promise.all(
      filteredProjectStack.map(async (entry) => {
        if (!entry.file) {
          return { ...entry, code: "<no-data>" };
        }

        // Use newCode if provided
        if (newCode) {
          const matchingCodeEntry = newCode.find(
            (codeEntry) =>
              codeEntry.file === entry.file && codeEntry.line === entry.line,
          );
          if (matchingCodeEntry && matchingCodeEntry.code) {
            return { ...entry, code: matchingCodeEntry.code };
          }
        }

        // Fallback to async file reading logic
        const absoluteFilePath = ProjectUtil.getAbsoluteFilePath(
          entry.file,
          monorepoRoot,
          workspacePaths,
        );
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
    monorepoRoot: string | null,
    workspacePaths: string[] | null,
    newCode: any[] | null = null,
  ): StackEntry[] {
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
        const matchingCodeEntry = newCode.find(
          (codeEntry) =>
            codeEntry.file === entry.file && codeEntry.line === entry.line,
        );
        if (matchingCodeEntry && matchingCodeEntry.code) {
          return { ...entry, code: matchingCodeEntry.code };
        }
      }

      // Fallback to sync file reading logic
      const absoluteFilePath = ProjectUtil.getAbsoluteFilePath(
        entry.file,
        monorepoRoot,
        workspacePaths,
      );
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
