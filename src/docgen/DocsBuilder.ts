import fs from "fs/promises";
import path from "path";
import { glob } from "glob";
import FileProcessor from "./FileProcessor.js";
import ProjectUtil from "../utils/ProjectUtil.js";

interface Config {
  documents: Document[];
  outputDir?: string;
  docHeader?: string;
  templates?: Template[];
  sanitize?: SanitizePair[];
}

interface Document {
  fileName: string;
  templateName?: string;
  content: ContentItem[];
  minificationLevel?: number;
}

interface ContentItem {
  reference?: string;
  root?: string;
  title?: string;
  description?: string;
  include: string[];
  exclude?: string[];
  headerRootPath?: boolean;
  headerRelativePath?: boolean;
  headerPrefix?: string;
  useCodeblocks?: boolean;
}

interface Template {
  name: string;
  header?: string;
  footer?: string;
}

interface SanitizePair {
  keyword: string;
  replace: string;
}

class DocsBuilder {
  private config: Config;
  private projectRoot: string;

  constructor(config: Config) {
    this.validateConfig(config);
    this.config = config;
    this.projectRoot = ProjectUtil.findProjectRoot();
    console.log(
      `DocsBuilder initialized with projectRoot: ${this.projectRoot}`,
    );
    console.log(`Config:`, JSON.stringify(this.config, null, 2));
  }

  async init(): Promise<void> {}

  private validateConfig(config: Config): void {
    if (
      !config ||
      typeof config !== "object" ||
      !Array.isArray(config.documents)
    ) {
      throw new Error("Invalid documentation configuration");
    }
  }

  private async ensureDirectoryExistence(dirPath: string): Promise<void> {
    try {
      const dirExists = await fs
        .access(dirPath)
        .then(() => true)
        .catch(() => false);
      if (!dirExists) {
        console.log(`Directory ${dirPath} does not exist, creating it.`);
        await fs.mkdir(dirPath, { recursive: true });
        console.log(`Directory ${dirPath} created.`);
      } else {
        console.log(`Directory ${dirPath} already exists.`);
      }
    } catch (error) {
      console.error(
        `Error ensuring directory existence for ${dirPath}:`,
        error,
      );
      throw error;
    }
  }

  async build(): Promise<void> {
    await this.init();

    const outputBaseDir = this.config.outputDir || "bin/docs";
    const outputDir = path.join(this.projectRoot, outputBaseDir);
    console.log(`Output directory: ${outputDir}`);

    await this.ensureDirectoryExistence(outputDir);

    for (const document of this.config.documents) {
      console.log(`Processing document: ${document.fileName}`);
      console.log(`Document config:`, JSON.stringify(document, null, 2));
      let documentationContent = await this.processDocument(document);
      if (this.config.sanitize && Array.isArray(this.config.sanitize)) {
        documentationContent = this.sanitizeContent(
          documentationContent,
          this.config.sanitize,
        );
      }
      await this.writeDocumentation(outputDir, document, documentationContent);
    }
  }

  private findReferencedContentItem(
    referenceTitle: string,
  ): ContentItem | null {
    for (const document of this.config.documents) {
      for (const item of document.content) {
        if (item.title === referenceTitle) {
          return item;
        }
      }
    }
    return null;
  }

  private async processDocument(document: Document): Promise<string> {
    console.log(`Processing document: ${document.fileName}`);
    let documentationContent = "";

    let template: Template | null = null;
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

    const processedFiles = new Set<string>();
    const minificationLevel = document.minificationLevel || 0;
    const processor = new FileProcessor(minificationLevel);

    for (const contentItem of document.content) {
      console.log(`Processing content for title: ${contentItem.title}`);
      const fileContents = await this.processContentItem(
        contentItem,
        processedFiles,
        processor,
      );
      documentationContent += fileContents;
    }

    if (template && template.footer) {
      documentationContent += "\n" + template.footer;
    }

    return documentationContent;
  }

  private async processContentItem(
    contentItem: ContentItem,
    processedFiles: Set<string>,
    processor: FileProcessor,
  ): Promise<string> {
    console.log(
      `Processing content item with include patterns: ${contentItem.include}`,
    );
    console.log(`Exclude patterns: ${contentItem.exclude}`);

    if (contentItem.reference) {
      const referencedItem = this.findReferencedContentItem(
        contentItem.reference,
      );
      if (!referencedItem) {
        throw new Error(
          `Referenced content item titled '${contentItem.reference}' not found.`,
        );
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
      throw new Error(
        `Content item's 'include' field is not an array or missing.`,
      );
    }

    const globOptions = {
      cwd: projectRoot,
      nodir: true,
      ignore: contentItem.exclude,
      absolute: true,
    };
    console.log(`Glob options:`, JSON.stringify(globOptions, null, 2));

    for (const pattern of contentItem.include) {
      const files = await glob(pattern, globOptions);
      console.log(`Glob pattern ${pattern} matched files: ${files.length}`);

      for (const fullPath of files) {
        if (!processedFiles.has(fullPath)) {
          processedFiles.add(fullPath);
          console.log(`Processing file: ${fullPath}`);
          const fileContent = await this.processFile(
            fullPath,
            processor,
            contentItem,
            projectRoot,
          );
          content += fileContent;
        }
      }
    }
    return content;
  }

  private async processFile(
    filePath: string,
    processor: FileProcessor,
    contentItem: ContentItem,
    projectRoot: string,
  ): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();
    const content = await fs.readFile(filePath, "utf8");
    const processedContent = processor.processFile(filePath, content);
    return this.formatFileContent(
      filePath,
      processedContent,
      ext,
      contentItem,
      projectRoot,
    );
  }

  private formatFileContent(
    filePath: string,
    content: string,
    ext: string,
    contentItem: ContentItem,
    projectRoot: string,
  ): string {
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
    } else {
      return header + content + "\n\n";
    }
  }

  private async writeDocumentation(
    outputDir: string,
    document: Document,
    documentationContent: string,
  ): Promise<void> {
    if (!document || typeof document.fileName !== "string") {
      throw new Error(
        "Document object is undefined, or fileName is not a string",
      );
    }

    let sanitizedFileName = document.fileName.split(" ").join("_");
    const outputFileName = path.join(outputDir, `${sanitizedFileName}.md`);

    try {
      await fs.writeFile(outputFileName, documentationContent);
      console.log(
        `Documentation for ${sanitizedFileName} has been generated in ${outputFileName}`,
      );
    } catch (error) {
      console.error(
        `Error writing documentation for ${sanitizedFileName}:`,
        error,
      );
    }
  }

  private sanitizeContent(
    content: string,
    sanitizeArray: SanitizePair[],
  ): string {
    let sanitizedContent = content;
    for (const pair of sanitizeArray) {
      const keyword = new RegExp(pair.keyword, "gi");
      sanitizedContent = sanitizedContent.replace(keyword, pair.replace);
    }
    return sanitizedContent;
  }
}

export default DocsBuilder;
