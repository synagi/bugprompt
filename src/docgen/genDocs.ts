import DocsBuilder from "./DocsBuilder.js";
import fs from "fs/promises";
import path from "path";
import FileUtils from "../log/FileUtil.js";

// Default config, auto created in root if missing
const CONFIG_NAME = "bugprompt";
const DEFAULT_CONFIG = {
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
};

// gen docs from the config
async function main() {
  try {
    const projectRoot = await FileUtils.findProjectRoot();
    if (!projectRoot) {
      throw new Error(
        "Project root not found. Make sure you are running this from within a Node.js project.",
      );
    }

    const confFileName = CONFIG_NAME + ".json";

    const configPath = path.join(projectRoot, confFileName);
    let config;

    try {
      const configContent = await fs.readFile(configPath, "utf8");
      config = JSON.parse(configContent);
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        console.log(
          `${confFileName} not found in the project root. Using default configuration.`,
        );
        config = DEFAULT_CONFIG;
        await fs.writeFile(configPath, JSON.stringify(config, null, 2));
        console.log(
          `Default ${confFileName} has been created in the project root.`,
        );
      } else {
        throw error;
      }
    }

    const baseOutputDir = config.outputDir || "bin";
    const bugpromptDir = CONFIG_NAME;
    const fullOutputPath = path.join(projectRoot, baseOutputDir, bugpromptDir);

    // Ensure output dir exists and is clean
    await FileUtils.prepareOutputDirectory(fullOutputPath);

    const builder = new DocsBuilder(config, fullOutputPath);
    await builder.build();
  } catch (error) {
    console.error("Error in documentation generation:", error);
  }
}

main();
