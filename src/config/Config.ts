import fs from "fs";
import path from "path";
import ProjectUtil from "../utils/ProjectUtil.js";
import { DEFAULT_CONFIG } from "./Config.default.js";

interface StackTraceConfig {
  enabled: boolean;
}

interface LogConfig {
  enabled: boolean;
}

interface DocsConfig {
  outputDir: string;
  templates: Array<{
    name: string;
    header: string;
    footer: string;
  }>;
  sanitize: Array<{
    keyword: string;
    replace: string;
  }>;
  documents: Array<{
    fileName: string;
    minificationLevel: number;
    templateName?: string;
    content: Array<{
      title?: string;
      description?: string;
      headerPrefix?: string;
      root?: string;
      include?: string[];
      exclude?: string[];
      reference?: string;
      useCodeblocks?: boolean;
    }>;
  }>;
}

export interface BugpromptConfig {
  stacktrace?: StackTraceConfig;
  log?: LogConfig;
  docs: DocsConfig;
}

export const CONFIG_NAME = "bugprompt";

export class Config implements BugpromptConfig {
  stacktrace: StackTraceConfig;
  log: LogConfig;
  docs: DocsConfig;
  private configSource: string = "default";

  constructor() {
    this.stacktrace = { enabled: false };
    this.log = { enabled: false };
    this.docs = { ...DEFAULT_CONFIG.docs };
    console.log("Config initialized with default values");
  }

  load(): void {
    console.log("Starting configuration load process");
    const projectRoot = ProjectUtil.findProjectRoot();
    if (!projectRoot) {
      console.warn(
        "Project root not found. Using current directory for config.",
      );
      this.configSource = "default (project root not found)";
      return;
    }
    console.log(`Project root found: ${projectRoot}`);

    const configPath = path.join(projectRoot, `${CONFIG_NAME}.json`);
    console.log(`Looking for config file at: ${configPath}`);

    if (!fs.existsSync(configPath)) {
      console.log(
        `Config file not found. Creating default config at ${configPath}`,
      );
      this.createDefaultConfig(configPath);
      this.configSource = "newly created default";
    } else {
      console.log(`Config file found at ${configPath}`);
      const fileConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
      console.log("Merging file config with default config");
      this.mergeConfig(fileConfig);
      this.configSource = "merged (file + default)";
    }

    console.log(`Final config source: ${this.configSource}`);
    console.log("Final configuration:", JSON.stringify(this, null, 2));
  }

  private mergeConfig(fileConfig: Partial<BugpromptConfig>): void {
    console.log("Starting deep merge of configurations");
    this.stacktrace = this.deepMerge(
      this.stacktrace,
      fileConfig.stacktrace || {},
    );
    this.log = this.deepMerge(this.log, fileConfig.log || {});
    if (fileConfig.docs) {
      this.docs = this.deepMerge(this.docs, fileConfig.docs);
    }
    console.log("Configuration merge completed");
  }

  private deepMerge(target: any, source: any): any {
    const output = Object.assign({}, target);
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach((key) => {
        if (this.isObject(source[key])) {
          if (!(key in target)) Object.assign(output, { [key]: source[key] });
          else output[key] = this.deepMerge(target[key], source[key]);
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    return output;
  }

  private isObject(item: any): boolean {
    return item && typeof item === "object" && !Array.isArray(item);
  }

  private createDefaultConfig(configPath: string): void {
    fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2));
    console.log(`Created default configuration file at ${configPath}`);
    this.mergeConfig(DEFAULT_CONFIG);
  }
}

export default Config;
