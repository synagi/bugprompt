import fs from "fs/promises";
import path from "path";
import { globSync } from "glob";
import FileProcessor from "./FileProcessor.js";
import FileUtils from "../log/FileUtil.js";
class DocsBuilder {
    constructor(config) {
        this.validateConfig(config);
        this.config = config;
        this.projectRoot = FileUtils.findProjectRoot() || process.cwd();
    }
    async init() { }
    validateConfig(config) {
        if (!config ||
            typeof config !== "object" ||
            !Array.isArray(config.documents)) {
            throw new Error("Invalid documentation configuration");
        }
    }
    async ensureDirectoryExistence(dirPath) {
        try {
            const dirExists = await fs
                .access(dirPath)
                .then(() => true)
                .catch(() => false);
            if (!dirExists) {
                console.log(`Directory ${dirPath} does not exist, creating it.`);
                await fs.mkdir(dirPath, { recursive: true });
                console.log(`Directory ${dirPath} created.`);
            }
            else {
                console.log(`Directory ${dirPath} already exists.`);
            }
        }
        catch (error) {
            console.error(`Error ensuring directory existence for ${dirPath}:`, error);
            throw error;
        }
    }
    async build() {
        await this.init();
        const outputBaseDir = this.config.outputDir || "bin/docs";
        const outputDir = path.join(this.projectRoot, outputBaseDir);
        await this.ensureDirectoryExistence(outputDir);
        for (const document of this.config.documents) {
            let documentationContent = await this.processDocument(document);
            if (this.config.sanitize && Array.isArray(this.config.sanitize)) {
                documentationContent = this.sanitizeContent(documentationContent, this.config.sanitize);
            }
            await this.writeDocumentation(outputDir, document, documentationContent);
        }
    }
    findReferencedContentItem(referenceTitle) {
        for (const document of this.config.documents) {
            for (const item of document.content) {
                if (item.title === referenceTitle) {
                    return item;
                }
            }
        }
        return null;
    }
    async processDocument(document) {
        let documentationContent = "";
        let template = null;
        if (document.templateName) {
            template =
                this.config.templates?.find((t) => t.name === document.templateName) ||
                    null;
            if (!template) {
                console.error(`Template named '${document.templateName}' not found.`);
                throw new Error(`Template named '${document.templateName}' not found.`);
            }
            if (template.header) {
                documentationContent += template.header + "\n\n";
            }
        }
        const processedFiles = new Set();
        const minificationLevel = document.minificationLevel || 0;
        const processor = new FileProcessor(minificationLevel);
        for (const contentItem of document.content) {
            console.log(`Processing content for title: ${contentItem.title}`);
            const fileContents = await this.processContentItem(contentItem, processedFiles, processor);
            documentationContent += fileContents;
        }
        if (template && template.footer) {
            documentationContent += "\n" + template.footer;
        }
        return documentationContent;
    }
    async processContentItem(contentItem, processedFiles, processor) {
        if (contentItem.reference) {
            const referencedItem = this.findReferencedContentItem(contentItem.reference);
            if (!referencedItem) {
                throw new Error(`Referenced content item titled '${contentItem.reference}' not found.`);
            }
            contentItem = { ...referencedItem, ...contentItem };
        }
        const projectRoot = contentItem.root
            ? path.join(this.projectRoot, contentItem.root)
            : this.projectRoot;
        let content = "";
        if (contentItem.title) {
            content += `# ${contentItem.title}\n\n`;
        }
        if (contentItem.description) {
            content += `${contentItem.description}\n\n`;
        }
        if (!Array.isArray(contentItem.include)) {
            throw new Error(`Content item's 'include' field is not an array or missing.`);
        }
        for (const pattern of contentItem.include) {
            const files = globSync(pattern, { cwd: projectRoot, nodir: true });
            for (const file of files) {
                const fullPath = path.join(projectRoot, file);
                if (!processedFiles.has(fullPath) &&
                    !this.isFileExcluded(fullPath, contentItem.exclude, projectRoot)) {
                    processedFiles.add(fullPath);
                    const fileContent = await this.processFile(fullPath, processor, contentItem, projectRoot);
                    content += fileContent;
                }
            }
        }
        return content;
    }
    isFileExcluded(filePath, excludePatterns, projectRoot) {
        if (!excludePatterns)
            return false;
        const relativePath = path.relative(projectRoot, filePath);
        return excludePatterns.some((pattern) => {
            const regex = new RegExp("^" + pattern.replace(/\*/g, ".*").replace(/\?/g, ".") + "$");
            return regex.test(relativePath);
        });
    }
    async processFile(filePath, processor, contentItem, projectRoot) {
        const ext = path.extname(filePath).toLowerCase();
        const content = await fs.readFile(filePath, "utf8");
        const processedContent = processor.processFile(filePath, content);
        return this.formatFileContent(filePath, processedContent, ext, contentItem, projectRoot);
    }
    formatFileContent(filePath, content, ext, contentItem, projectRoot) {
        let header = "";
        const includeRootPath = contentItem.headerRootPath !== false;
        const includeRelativePath = contentItem.headerRelativePath !== false;
        if (includeRootPath) {
            header += path.relative(this.projectRoot, projectRoot);
        }
        if (includeRelativePath) {
            header += includeRootPath ? "/" : "";
            header += path.relative(projectRoot, filePath);
        }
        if (contentItem.headerPrefix) {
            header = contentItem.headerPrefix + (header ? " " + header : "");
        }
        header = header ? `${header}\n` : "";
        if (contentItem.useCodeblocks !== false) {
            return header + "```" + ext.slice(1) + "\n" + content + "\n```\n\n";
        }
        else {
            return header + content + "\n\n";
        }
    }
    async writeDocumentation(outputDir, document, documentationContent) {
        if (!document || typeof document.fileName !== "string") {
            throw new Error("Document object is undefined, or fileName is not a string");
        }
        let sanitizedFileName = document.fileName.split(" ").join("_");
        const outputFileName = path.join(outputDir, `${sanitizedFileName}.md`);
        try {
            await fs.writeFile(outputFileName, documentationContent);
            console.log(`Documentation for ${sanitizedFileName} has been generated in ${outputFileName}`);
        }
        catch (error) {
            console.error(`Error writing documentation for ${sanitizedFileName}:`, error);
        }
    }
    sanitizeContent(content, sanitizeArray) {
        let sanitizedContent = content;
        for (const pair of sanitizeArray) {
            const keyword = new RegExp(pair.keyword, "gi");
            sanitizedContent = sanitizedContent.replace(keyword, pair.replace);
        }
        return sanitizedContent;
    }
}
export default DocsBuilder;
//# sourceMappingURL=DocsBuilder.js.map