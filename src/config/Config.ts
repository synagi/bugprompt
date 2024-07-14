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
      include: string[];
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

class Config implements BugpromptConfig {
  stacktrace: StackTraceConfig;
  log: LogConfig;
  docs: DocsConfig;

  constructor() {
    this.stacktrace = { enabled: false };
    this.log = { enabled: false };
    this.docs = { ...DEFAULT_CONFIG.docs };
  }

  load(): void {
    const projectRoot = ProjectUtil.findProjectRoot();
    if (!projectRoot) {
      console.warn(
        "Project root not found. Using current directory for config.",
      );
      return;
    }
    const configPath = path.join(projectRoot, `${CONFIG_NAME}.json`);

    if (!fs.existsSync(configPath)) {
      this.createDefaultConfig(configPath);
    }

    const fileConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
    this.mergeConfig(fileConfig);
  }

  private mergeConfig(fileConfig: Partial<BugpromptConfig>): void {
    this.stacktrace = {
      enabled: fileConfig.stacktrace?.enabled ?? false,
    };
    this.log = {
      enabled: fileConfig.log?.enabled ?? false,
    };
    if (fileConfig.docs) {
      this.docs = {
        ...this.docs,
        ...fileConfig.docs,
      };
    }
  }

  private createDefaultConfig(configPath: string): void {
    fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2));
    console.log(`Created default configuration file at ${configPath}`);
    this.mergeConfig(DEFAULT_CONFIG);
  }
}

export default Config;
