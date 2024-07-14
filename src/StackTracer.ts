import ErrorUtil, { ErrorObject } from "./utils/ErrorUtil.js";
import Logger from "./log/Logger.js";

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
    console.log("StackTracer enable() called");
    if (!this._enabled) {
      this._enabled = true;
      this.setupErrorPreparation();
      this.setupGlobalHandlers();
    }
    console.log("StackTracer enabled:", this._enabled);
  }

  disable(): void {
    console.log("StackTracer disable() called");
    if (this._enabled) {
      this._enabled = false;
      this.removeGlobalHandlers();
    }
    console.log("StackTracer enabled:", this._enabled);
  }

  isEnabled(): boolean {
    return this._enabled;
  }

  private setupErrorPreparation(): void {
    Error.stackTraceLimit = Infinity;
  }

  private setupGlobalHandlers(): void {
    console.log("Setting up global handlers");
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
        "exception",
        "Uncaught Exception:",
        processedError.formatted,
      );
    } else {
      console.error("Uncaught Exception:", error);
    }
    process.exit(1);
  };

  private handleUnhandledRejection = (reason: any) => {
    console.log("Unhandled rejection handler called, enabled:", this._enabled);
    if (this._enabled) {
      const processedError = this.processErrorSync(
        reason instanceof Error ? reason : new Error(String(reason)),
      );
      this.logger.logSync(
        "exception",
        "Unhandled Rejection:",
        processedError.formatted,
      );
    } else {
      console.error("Unhandled Rejection:", reason);
    }
    process.exit(1);
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
