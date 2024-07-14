import Config from "./config/Config.js";
import StackTracer from "./StackTracer.js";
import Logger from "./Logger.js";

export class Bugprompt {
  private static instance: Bugprompt;
  private _config: Config;
  private _stackTracer: StackTracer | null = null;
  private _logger: typeof Logger | null = null;
  private _enabled: boolean = false;

  private constructor() {
    this._config = new Config();
  }

  public static getInstance(): Bugprompt {
    if (!Bugprompt.instance) {
      Bugprompt.instance = new Bugprompt();
    }
    return Bugprompt.instance;
  }

  public enable(): void {
    if (!this._enabled) {
      this._config.load();
      this._enabled = true;
      this.applyConfig();
    }
  }

  public disable(): void {
    if (this._enabled) {
      this._enabled = false;
      this.disableFeatures();
    }
  }

  private applyConfig(): void {
    this.configureStackTracer();
    this.configureLogger();
  }

  private disableFeatures(): void {
    if (this._stackTracer) {
      this._stackTracer.disable();
      this._stackTracer = null;
    }
    if (this._logger) {
      this._logger.disable();
      this._logger = null;
    }
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

  public get config(): Config {
    return this._config;
  }
}
