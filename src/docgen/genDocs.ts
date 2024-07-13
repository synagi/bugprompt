import DocsBuilder from "./DocsBuilder.js";
import path from "path";
import FileUtils from "../log/FileUtil.js";
import Config, { CONFIG_NAME } from "../config/Config.js";

async function main() {
  try {
    const projectRoot = await FileUtils.findProjectRoot();
    if (!projectRoot) {
      throw new Error(
        "Project root not found. Make sure you are running this from within a Node.js project.",
      );
    }

    const config = new Config();
    config.load();

    const baseOutputDir = config.docs.outputDir || "bin";
    const bugpromptDir = CONFIG_NAME;
    const fullOutputPath = path.join(projectRoot, baseOutputDir, bugpromptDir);

    // Ensure output dir exists and is clean
    await FileUtils.prepareOutputDirectory(fullOutputPath);

    const builder = new DocsBuilder(config.docs, fullOutputPath);
    await builder.build();
  } catch (error) {
    console.error("Error in documentation generation:", error);
  }
}

main();
