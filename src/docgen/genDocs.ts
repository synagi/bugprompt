import DocsBuilder from "./DocsBuilder.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import FileUtils from "../log/FileUtil.js";

async function main() {
  try {
    const projectRoot = await FileUtils.findProjectRoot();
    if (!projectRoot) {
      throw new Error(
        "Project root not found. Make sure you are running this from within a Node.js project.",
      );
    }

    const configPath = path.join(projectRoot, "config.docs.json");
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
          "config.docs.json not found in the project root. Using default configuration.",
        );
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const defaultConfigPath = path.join(
          __dirname,
          "..",
          "..",
          "config.docs.json",
        );

        const defaultConfigContent = await fs.readFile(
          defaultConfigPath,
          "utf8",
        );
        config = JSON.parse(defaultConfigContent);
        await fs.writeFile(configPath, JSON.stringify(config, null, 2));
        console.log(
          "Default config.docs.json has been copied to the project root.",
        );
      } else {
        throw error;
      }
    }

    // Determine the output directory
    const baseOutputDir = config.outputDir || "bin/docs";
    const bugpromptDir = "bugprompt";
    const fullOutputPath = path.join(projectRoot, baseOutputDir, bugpromptDir);

    // Ensure the output directory exists and is clean
    await FileUtils.prepareOutputDirectory(fullOutputPath);

    // Create DocsBuilder instance with the full output path
    const builder = new DocsBuilder(config, fullOutputPath);
    await builder.build();
  } catch (error) {
    console.error("Error in documentation generation:", error);
  }
}

main();
