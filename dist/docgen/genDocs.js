import DocsBuilder from "./DocsBuilder.js";
import fs from "fs/promises";
import path from "path";
import FileUtils from "../log/FileUtil.js";
async function main() {
    try {
        const projectRoot = await FileUtils.findProjectRoot();
        if (!projectRoot) {
            throw new Error("Project root not found. Make sure you are running this from within a Node.js project.");
        }
        const configPath = path.join(projectRoot, "config.docs.json");
        try {
            const configContent = await fs.readFile(configPath, "utf8");
            const config = JSON.parse(configContent);
            const builder = new DocsBuilder(config);
            await builder.build();
        }
        catch (error) {
            if (error instanceof Error &&
                "code" in error &&
                error.code === "ENOENT") {
                console.error("config.docs.json not found in the project root. Please create this file with your documentation configuration.");
            }
            else {
                throw error;
            }
        }
    }
    catch (error) {
        console.error("Error in documentation generation:", error);
    }
}
main();
//# sourceMappingURL=genDocs.js.map