import fs from "fs/promises";
import fsSync from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bugprompt from "../index.js";
import { generateTestCases } from "../utils/TestUtil.js";
import Config from "../config/Config.js";
import ProjectUtil from "../utils/ProjectUtil.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("Starting test case generation...");
  console.log(`Current working directory: ${process.cwd()}`);
  console.log(`__dirname: ${__dirname}`);
  console.log(`__filename: ${__filename}`);

  try {
    console.log("Setting up bugprompt configuration...");
    const configPath = path.join(process.cwd(), "bugprompt.json");
    if (fsSync.existsSync(configPath)) {
      await fs.unlink(configPath);
      console.log("Removed existing bugprompt.json");
    }

    const customConfig = new Config();
    customConfig.stacktrace = { enabled: true };
    customConfig.log = { enabled: true };

    await fs.writeFile(configPath, JSON.stringify(customConfig, null, 2));
    console.log("Created custom bugprompt.json configuration");

    console.log("Enabling bugprompt...");
    bugprompt.enable();

    console.log(
      "Bugprompt config (snippet):",
      JSON.stringify(ProjectUtil.trim(bugprompt.config), null, 2),
    );
    console.log("StackTracer enabled:", bugprompt.StackTracer?.isEnabled());

    if (!bugprompt.StackTracer || !bugprompt.StackTracer.isEnabled()) {
      throw new Error("StackTracer is not enabled after configuration");
    }

    console.log("Calling generateTestCases...");
    const testCases = await generateTestCases(bugprompt);

    console.log("Raw test cases:", JSON.stringify(testCases, null, 2));
    console.log(
      "generateTestCases completed. Number of test cases:",
      Object.keys(testCases).length,
    );

    // Write the file to the src directory
    const filePath = path.join(
      __dirname,
      "../../src/__tests__/bugprompt.test.data.json",
    );
    await fs.writeFile(filePath, JSON.stringify(testCases, null, 2));

    console.log("Test cases written to file:", filePath);
  } catch (error) {
    console.error("Error during test case generation:", error);
  } finally {
    bugprompt.disable();
    console.log("Bugprompt disabled");
  }
}

main().catch(console.error);
