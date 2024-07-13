import { BugpromptConfig } from "./Config";

export const DEFAULT_CONFIG: BugpromptConfig = {
  stacktrace: {
    enabled: false,
  },
  log: {
    enabled: false,
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
