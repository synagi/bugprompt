import Config from "./config/Config.js";
import LoggerWrapper from "./log/LoggerWrapper.js";
import StackTracer from "./StackTracer.js";

class Bugprompt {
  private static instance: Bugprompt;
  private _config: Config;
  private stackTracer: StackTracer;

  private constructor() {
    this._config = new Config();
    this.stackTracer = new StackTracer();
  }

  public static getInstance(): Bugprompt {
    if (!Bugprompt.instance) {
      Bugprompt.instance = new Bugprompt();
    }
    return Bugprompt.instance;
  }

  public config(): void {
    // Load configuration from file or environment
    this._config.load();
    this.applyConfig();
  }

  private applyConfig(): void {
    if (this._config.stacktrace.enabled) {
      this.stackTracer.enable();
    }
    if (this._config.log.enabled) {
      LoggerWrapper.enable();
    }
  }
}

export default Bugprompt.getInstance();
