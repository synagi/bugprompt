import Config from "./config/Config.js";
import StackTracer from "./StackTracer.js";
import LoggerWrapper from "./log/LoggerWrapper.js";

export class Bugprompt {
  private static instance: Bugprompt;
  private _config: Config;
  private _stackTracer: StackTracer | null = null;
  private _logger: typeof LoggerWrapper | null = null;

  private constructor() {
    this._config = new Config();
  }

  public static getInstance(): Bugprompt {
    if (!Bugprompt.instance) {
      Bugprompt.instance = new Bugprompt();
    }
    return Bugprompt.instance;
  }

  public config(): void {
    this._config.load();
    const stackTracerInstance = StackTracer.getInstance();
    if (this._config.stacktrace?.enabled) {
      this._stackTracer = stackTracerInstance;
      stackTracerInstance.enable();
    } else {
      this._stackTracer = null;
      stackTracerInstance.disable();
    }
    if (this._config.log?.enabled) {
      this._logger = LoggerWrapper;
      LoggerWrapper.enable();
    } else {
      this._logger = null;
      LoggerWrapper.disable();
    }
  }

  public getStackTracer(): StackTracer | null {
    return this._stackTracer;
  }

  public getLogger(): typeof LoggerWrapper | null {
    return this._logger;
  }
}
