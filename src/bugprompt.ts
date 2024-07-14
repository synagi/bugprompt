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
    console.log("Bugprompt config() called");
    this._config.load();
    console.log("Config loaded:", JSON.stringify(this._config, null, 2));
    this.configureStackTracer();
    this.configureLogger();
    console.log("Bugprompt configuration complete");
  }

  private configureStackTracer(): void {
    console.log("Configuring StackTracer");
    const stackTracerInstance = StackTracer.getInstance();
    if (this._config.stacktrace?.enabled) {
      console.log("StackTracer enabled in config");
      this._stackTracer = stackTracerInstance;
      stackTracerInstance.enable();
    } else {
      console.log("StackTracer disabled in config");
      this._stackTracer = null;
      stackTracerInstance.disable();
    }
    console.log("StackTracer isEnabled:", stackTracerInstance.isEnabled());
  }

  private configureLogger(): void {
    if (this._config.log?.enabled) {
      this._logger = LoggerWrapper;
      LoggerWrapper.enable();
    } else {
      this._logger = null;
      LoggerWrapper.disable();
    }
  }

  public get StackTracer(): StackTracer | null {
    return this._stackTracer;
  }

  public get LoggerWrapper(): typeof LoggerWrapper | null {
    return this._logger;
  }
}
