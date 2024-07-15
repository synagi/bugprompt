import axios from "axios";
import fs from "fs/promises";
import ProjectUtil from "../utils/ProjectUtil.js";

export class ErrorGenerator {
  async axiosError(): Promise<never> {
    try {
      await axios.get("http://nonexistent.server");
      throw new Error("This should not be reached");
    } catch (error) {
      throw error;
    }
  }

  referenceError(): never {
    // @ts-ignore
    return nonExistentVariable;
  }

  typeError(): void {
    const obj = {};
    (obj as any)();
  }

  static staticTypeError(): void {
    const obj = {};
    (obj as any)();
  }

  syntaxError(): never {
    eval("var a =;");
    throw new Error("This should not be reached");
  }

  customError(): never {
    throw new Error("Custom error thrown");
  }

  rangeError(): void {
    new Array(-1);
  }

  evalError(): never {
    eval("throw new EvalError('EvalError triggered')");
    throw new Error("This should not be reached");
  }

  uriError(): void {
    decodeURIComponent("%");
  }

  static internalError(): never {
    function recurse(): never {
      return recurse();
    }
    return recurse();
  }

  unhandledPromiseRejection(): Promise<never> {
    return Promise.reject(new Error("Unhandled promise rejection"));
  }

  async systemError(): Promise<never> {
    await fs.readFile("nonexistentfile.txt");
    throw new Error("This should not be reached");
  }

  aggregateError(): never {
    const errors: Error[] = [];
    try {
      this.referenceError();
    } catch (error) {
      errors.push(error as Error);
    }
    try {
      this.typeError();
    } catch (error) {
      errors.push(error as Error);
    }
    try {
      this.syntaxError();
    } catch (error) {
      errors.push(error as Error);
    }
    if (errors.length > 0) {
      throw new AggregateError(errors, "Aggregated multiple errors");
    }
    throw new Error("This should not be reached");
  }

  devErrorObject(): never {
    throw new Error("Developer error with Error object");
  }

  devErrorMessage(): never {
    throw "Developer error with string message";
  }
}

export async function generateTestCases(
  bugprompt: any,
): Promise<Record<string, any>> {
  console.log("generateTestCases function called");
  console.log("bugprompt object:", ProjectUtil.trim(bugprompt));
  console.log("StackTracer defined:", !!bugprompt.StackTracer);
  console.log("StackTracer enabled:", bugprompt.StackTracer?.isEnabled());

  if (!bugprompt.StackTracer || !bugprompt.StackTracer.isEnabled()) {
    throw new Error("StackTracer is not enabled in generateTestCases");
  }

  const errorGen = new ErrorGenerator();
  const testCases: Record<string, any> = {};

  const methods = [
    "referenceError",
    "typeError",
    "syntaxError",
    "customError",
    "rangeError",
    "evalError",
    "uriError",
    "aggregateError",
    "devErrorObject",
    "devErrorMessage",
    "unhandledPromiseRejection",
    "axiosError",
    "systemError",
  ];

  console.log("Enabling bugprompt");
  bugprompt.enable();
  console.log("StackTracer defined after enable:", !!bugprompt.StackTracer);

  for (const method of methods) {
    try {
      await (errorGen as any)[method]();
    } catch (error) {
      if (bugprompt.StackTracer) {
        const result = bugprompt.StackTracer.processErrorSync(error as Error);
        // Check if stack is an array before mapping
        if (Array.isArray(result.error.stack)) {
          result.error.stack = result.error.stack.map((entry: any) => ({
            ...entry,
            file: entry.file.replace(/^dist\//, "src/").replace(/\.js$/, ".ts"),
          }));
        } else {
          // If stack is not an array, convert it to a string and replace dist with src
          result.error.stack = (result.error.stack as string)
            .replace(/dist\//g, "src/")
            .replace(/\.js/g, ".ts");
        }
        testCases[method] = result;
      }
    }
  }

  return testCases;
}
