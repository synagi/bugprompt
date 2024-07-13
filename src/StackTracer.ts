import ErrorUtil, { ErrorObject, ErrorProps } from "./utils/ErrorUtil.js";

export interface IStackTracer {
  enable(): void;
  isEnabled(): boolean;
  processError(error: Error | string): Promise<ErrorObject>;
  processErrorSync(error: Error | string): ErrorObject;
}

class StackTracer implements IStackTracer {
  private static instance: StackTracer;
  private _enabled: boolean = false;

  private constructor() {
    this.setupErrorPreparation();
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
      this.setupGlobalHandlers();
    }
  }

  isEnabled(): boolean {
    return this._enabled;
  }

  private setupErrorPreparation(): void {
    Error.stackTraceLimit = Infinity;
  }

  private setupGlobalHandlers(): void {
    process.on("uncaughtException", (error) => {
      if (this._enabled) {
        console.error(
          "Uncaught Exception:",
          this.processErrorSync(error).formatted,
        );
      }
      process.exit(1);
    });

    process.on("unhandledRejection", (reason) => {
      if (this._enabled) {
        console.error(
          "Unhandled Rejection:",
          this.processErrorSync(
            reason instanceof Error ? reason : new Error(String(reason)),
          ).formatted,
        );
      }
      process.exit(1);
    });
  }

  async processError(error: Error | string): Promise<ErrorObject> {
    if (!this._enabled) {
      const errorProps: ErrorProps = {
        name: "Error",
        message: error.toString(),
        stack: "",
        params: "",
      };
      return { error: errorProps, log: "", formatted: error.toString() };
    }
    return ErrorUtil.convertError(error);
  }

  processErrorSync(error: Error | string): ErrorObject {
    if (!this._enabled) {
      const errorProps: ErrorProps = {
        name: "Error",
        message: error.toString(),
        stack: "",
        params: "",
      };
      return { error: errorProps, log: "", formatted: error.toString() };
    }
    return ErrorUtil.convertErrorSync(error);
  }
}

export default StackTracer.getInstance();
