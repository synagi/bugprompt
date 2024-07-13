import fs from "fs";
import path from "path";
import ProjectUtil from "../utils/ProjectUtil.js";

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
  stacktrace: StackTraceConfig;
  log: LogConfig;
  docs: DocsConfig;
}

const DEFAULT_CONFIG: BugpromptConfig = {
  stacktrace: {
    enabled: true,
  },
  log: {
    enabled: true,
  },
  docs: {
    outputDir: "bin/",
    templates: [
      {
        name: "default",
        header:
          "# Source code\nBelow is the latest source code of the project, showing the contents of each file along with it's relative path.  Analyze it directly to understand the latest code and its structure:",
        footer: "",
      },
    ],
    sanitize: [
      {
        keyword: "<some private string>",
        replace: "<redacted>",
      },
    ],
    documents: [
      {
        fileName: "Project Code",
        minificationLevel: 0,
        templateName: "default",
        content: [
          {
            title: "projectname",
            description:
              "Any important project details or gotchas for the LLM go here...",
            headerPrefix: "##",
            root: "",
            include: [
              "**/*.ts",
              "**/*.d.ts",
              "**/*.js",
              "**/*.cjs",
              "**/*.mjs",
              "**/*.tsx",
              "**/*.jsx",
            ],
            exclude: [
              "node_modules/**/*",
              "dist/**/*",
              "bin/**/*",
              "*.json",
              "*.log",
            ],
          },
        ],
      },
      {
        fileName: "Project Code Min",
        minificationLevel: 2,
        content: [
          {
            reference: "projectname",
            headerPrefix: "// .",
            useCodeblocks: false,
            include: ["**/*"],
            exclude: [],
          },
        ],
      },
      {
        fileName: "Project Config",
        minificationLevel: 1,
        content: [
          {
            reference: "projectname",
            include: ["*.json"],
            exclude: ["package-lock.json"],
          },
        ],
      },
    ],
  },
};

export const CONFIG_NAME = "bugprompt";

class Config implements BugpromptConfig {
  stacktrace: StackTraceConfig;
  log: LogConfig;
  docs: DocsConfig;

  constructor() {
    this.stacktrace = { ...DEFAULT_CONFIG.stacktrace };
    this.log = { ...DEFAULT_CONFIG.log };
    this.docs = { ...DEFAULT_CONFIG.docs };
  }

  load(): void {
    const projectRoot = ProjectUtil.findProjectRoot();
    const configPath = path.join(projectRoot, `${CONFIG_NAME}.json`);

    if (fs.existsSync(configPath)) {
      const fileConfig = JSON.parse(fs.readFileSync(configPath, "utf8"));
      this.update(fileConfig);
    } else {
      // Create default config file if it doesn't exist
      fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2));
    }
  }

  private update(options: Partial<BugpromptConfig>): void {
    this.stacktrace = { ...this.stacktrace, ...options.stacktrace };
    this.log = { ...this.log, ...options.log };
    this.docs = { ...this.docs, ...options.docs };
  }
}

export default Config;
