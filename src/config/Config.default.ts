import { BugpromptConfig } from "./Config";

export const DEFAULT_CONFIG: BugpromptConfig = {
  docs: {
    outputDir: "bin/",
    templates: [
      {
        name: "default",
        header:
          "# Source code\nThis doc contains the latest source code of the project, with each script given with its relative path to the project root.  Analyze all the code directly to understand its structure, flow and purpose:",
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
              "Here are the project files (and any additional notes, instructions or gotchas go here)...",
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
              "**/node_modules/**/*",
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
            headerPrefix: "//",
            useCodeblocks: false,
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
  stacktrace: {
    enabled: false,
  },
  log: {
    enabled: false,
  },
};
