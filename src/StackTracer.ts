import ErrorUtil from "./utils/ErrorUtil.js";

class StackTracer {
  private enabled: boolean = false;

  enable(): void {
    if (!this.enabled) {
      this.enabled = true;
      this.setupGlobalHandlers();
    }
  }

  private setupGlobalHandlers(): void {
    Error.stackTraceLimit = Infinity;

    Error.prepareStackTrace = (error) => {
      return ErrorUtil.convertError(error);
    };

    process.on("uncaughtException", (error) => {
      console.error("Uncaught Exception:", ErrorUtil.convertErrorSync(error));
      process.exit(1);
    });

    process.on("unhandledRejection", (reason) => {
      console.error(
        "Unhandled Rejection:",
        ErrorUtil.convertErrorSync(reason as Error),
      );
      process.exit(1);
    });
  }
}

export default StackTracer;
