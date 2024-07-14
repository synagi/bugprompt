import ErrorUtil, { ErrorObject } from "./utils/ErrorUtil.js";
import Logger from "./Logger.js";

export interface IStackTracer {
  enable(): void;
  disable(): void;
  isEnabled(): boolean;
  processError(error: Error | string): Promise<ErrorObject>;
  processErrorSync(error: Error | string): ErrorObject;
}

class StackTracer implements IStackTracer {
  private static instance: StackTracer;
  private _enabled: boolean = false;
  private logger: typeof Logger;

  private constructor() {
    this.logger = Logger;
  }

  public static getInstance(): StackTracer {
    if (!StackTracer.instance) {
      StackTracer.instance = new StackTracer();
    }
    return StackTracer.instance;
  }

  enable(): void {
    if (!this._enabled) {
      this._enabled = true;
      this.setupErrorPreparation();
      this.setupGlobalHandlers();
    }
  }

  disable(): void {
    if (this._enabled) {
      this._enabled = false;
      this.removeGlobalHandlers();
    }
  }

  isEnabled(): boolean {
    return this._enabled;
  }

  private setupErrorPreparation(): void {
    Error.stackTraceLimit = Infinity;
  }

  private setupGlobalHandlers(): void {
    process.removeListener("uncaughtException", this.handleUncaughtException);
    process.removeListener("unhandledRejection", this.handleUnhandledRejection);
    process.on("uncaughtException", this.handleUncaughtException);
    process.on("unhandledRejection", this.handleUnhandledRejection);
  }

  private removeGlobalHandlers(): void {
    console.log("Removing global handlers");
    process.removeListener("uncaughtException", this.handleUncaughtException);
    process.removeListener("unhandledRejection", this.handleUnhandledRejection);
  }

  private handleUncaughtException = (error: Error) => {
    console.log("Uncaught exception handler called, enabled:", this._enabled);
    if (this._enabled) {
      const processedError = this.processErrorSync(error);
      this.logger.logSync(
        "EXCEPTION",
        "Uncaught Exception:",
        processedError.formatted,
      );
    } else {
      console.error("Uncaught Exception:", error);
    }
    // Don't exit the process during testing
    if (process.env.NODE_ENV !== "test") {
      process.exit(1);
    }
  };

  private handleUnhandledRejection = (reason: any) => {
    console.log("Unhandled rejection handler called, enabled:", this._enabled);
    if (this._enabled) {
      const processedError = this.processErrorSync(
        reason instanceof Error ? reason : new Error(String(reason)),
      );
      this.logger.logSync(
        "EXCEPTION",
        "Unhandled Rejection:",
        processedError.formatted,
      );
    } else {
      console.error("Unhandled Rejection:", reason);
    }
    // Don't exit the process during testing
    if (process.env.NODE_ENV !== "test") {
      process.exit(1);
    }
  };

  async processError(error: Error | string): Promise<ErrorObject> {
    return this._enabled
      ? ErrorUtil.convertError(error)
      : {
          error: {
            name: "Error",
            message: error.toString(),
            stack: "",
            params: "",
          },
          log: "",
          formatted: error.toString(),
        };
  }

  processErrorSync(error: Error | string): ErrorObject {
    return this._enabled
      ? ErrorUtil.convertErrorSync(error)
      : {
          error: {
            name: "Error",
            message: error.toString(),
            stack: "",
            params: "",
          },
          log: "",
          formatted: error.toString(),
        };
  }
}

export default StackTracer;
