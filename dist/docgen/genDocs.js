import DocsBuilder from "./DocsBuilder.js";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import FileUtils from "../log/FileUtil.js";
async function main() {
    try {
        const projectRoot = await FileUtils.findProjectRoot();
        if (!projectRoot) {
            throw new Error("Project root not found. Make sure you are running this from within a Node.js project.");
        }
        const configPath = path.join(projectRoot, "config.docs.json");
        let config;
        try {
            const configContent = await fs.readFile(configPath, "utf8");
            config = JSON.parse(configContent);
        }
        catch (error) {
            if (error instanceof Error &&
                "code" in error &&
                error.code === "ENOENT") {
                console.log("config.docs.json not found in the project root. Using default configuration.");
                // Get the path to the default config file in the nodejs-util package
                const __filename = fileURLToPath(import.meta.url);
                const __dirname = path.dirname(__filename);
                const defaultConfigPath = path.join(__dirname, "..", "..", "config.docs.json");
                try {
                    const defaultConfigContent = await fs.readFile(defaultConfigPath, "utf8");
                    config = JSON.parse(defaultConfigContent);
                    // Copy the default config to the project root
                    await fs.writeFile(configPath, defaultConfigContent);
                    console.log("Default config.docs.json has been copied to the project root.");
                }
                catch (defaultConfigError) {
                    console.error("Error reading or copying default config:", defaultConfigError);
                    throw defaultConfigError;
                }
            }
            else {
                throw error;
            }
        }
        const builder = new DocsBuilder(config);
        await builder.build();
    }
    catch (error) {
        console.error("Error in documentation generation:", error);
    }
}
main();
//# sourceMappingURL=genDocs.js.map