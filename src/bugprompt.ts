import Config from "./config/Config.js";
import StackTracer from "./StackTracer.js";
import Logger from "./Logger.js";

export class Bugprompt {
  private static instance: Bugprompt;
  private _config: Config;
  private _stackTracer: StackTracer | null = null;
  private _logger: typeof Logger | null = null;

  private constructor() {
    this._config = new Config();
    this._config.load();
    this.applyConfig();
  }

  public static getInstance(): Bugprompt {
    if (!Bugprompt.instance) {
      Bugprompt.instance = new Bugprompt();
    }
    return Bugprompt.instance;
  }

  public config(): void {
    this.applyConfig();
  }

  private applyConfig(): void {
    this.configureStackTracer();
    this.configureLogger();
  }

  private configureStackTracer(): void {
    const stackTracerInstance = StackTracer.getInstance();
    if (this._config.stacktrace?.enabled) {
      this._stackTracer = stackTracerInstance;
      stackTracerInstance.enable();
    } else {
      this._stackTracer = null;
      stackTracerInstance.disable();
    }
  }

  private configureLogger(): void {
    if (this._config.log?.enabled) {
      this._logger = Logger;
      Logger.enable();
    } else {
      this._logger = null;
      Logger.disable();
    }
  }

  public get StackTracer(): StackTracer | null {
    return this._stackTracer;
  }

  public get LoggerWrapper(): typeof Logger | null {
    return this._logger;
  }
}
