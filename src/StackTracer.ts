import ErrorUtil, { ErrorObject } from "./utils/ErrorUtil.js";

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

  private constructor() {}

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
    process.on("uncaughtException", this.handleUncaughtException);
    process.on("unhandledRejection", this.handleUnhandledRejection);
  }

  private removeGlobalHandlers(): void {
    process.off("uncaughtException", this.handleUncaughtException);
    process.off("unhandledRejection", this.handleUnhandledRejection);
  }

  private handleUncaughtException = (error: Error) => {
    if (this._enabled) {
      console.error(
        "Uncaught Exception:",
        this.processErrorSync(error).formatted,
      );
    } else {
      console.error("Uncaught Exception:", error);
    }
    process.exit(1);
  };

  private handleUnhandledRejection = (reason: any) => {
    if (this._enabled) {
      console.error(
        "Unhandled Rejection:",
        this.processErrorSync(
          reason instanceof Error ? reason : new Error(String(reason)),
        ).formatted,
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
