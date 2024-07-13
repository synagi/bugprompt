import Config from "./config/Config.js";
import LoggerWrapper from "./log/LoggerWrapper.js";
import StackTracer, { IStackTracer } from "./StackTracer.js";

class Bugprompt {
  private static instance: Bugprompt;
  private _config: Config;

  public LoggerWrapper = LoggerWrapper;
  public StackTracer: IStackTracer = StackTracer;

  private constructor() {
    this._config = new Config();
    this.StackTracer.enable(); // This now sets up global error handlers
  }

  public static getInstance(): Bugprompt {
    if (!Bugprompt.instance) {
      Bugprompt.instance = new Bugprompt();
    }
    return Bugprompt.instance;
  }

  public config(): void {
    this._config.load();
    this.applyConfig();
  }

  private applyConfig(): void {
    if (this._config.log.enabled) {
      LoggerWrapper.enable();
    }
    // StackTracer is already enabled in the constructor
  }
}

export default Bugprompt.getInstance();
