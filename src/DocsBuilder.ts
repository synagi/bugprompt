import path from "path";
import Config, { CONFIG_NAME } from "./config/Config.js";
import ProjectUtil from "./utils/ProjectUtil.js";
import DocUtil from "./utils/DocsUtil.js";

interface Template {
  name: string;
  header?: string;
  footer?: string;
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

interface DocsConfig {
  documents: Document[];
  outputDir?: string;
  templates?: Template[];
  sanitize?: Array<{ keyword: string; replace: string }>;
}

export class DocsBuilder {
  private config: DocsConfig;
  private projectRoot: string;
  private outputPath: string;

  constructor(config: DocsConfig, outputPath: string) {
    this.validateConfig(config);
    this.config = config;
    const projectRoot = ProjectUtil.findProjectRoot();
    if (!projectRoot) {
      throw new Error(
        "Project root not found. Unable to initialize DocsBuilder.",
      );
    }
    this.projectRoot = projectRoot;
    this.outputPath = outputPath;
    console.log(
      `DocsBuilder initialized with projectRoot: ${this.projectRoot}`,
    );
    console.log(`Output path: ${this.outputPath}`);
    console.log(`Config:`, JSON.stringify(this.config, null, 2));
  }

  private validateConfig(config: DocsConfig): void {
    if (
      !config ||
      typeof config !== "object" ||
      !Array.isArray(config.documents)
    ) {
      throw new Error("Invalid documentation configuration");
    }
  }

  public async build(): Promise<void> {
    for (const document of this.config.documents) {
      console.log(`Processing document: ${document.fileName}`);
      console.log(`Document config:`, JSON.stringify(document, null, 2));

      let documentationContent = await this.processDocument(document);
      if (this.config.sanitize && Array.isArray(this.config.sanitize)) {
        documentationContent = DocUtil.sanitizeContent(
          documentationContent,
          this.config.sanitize,
        );
      }

      await DocUtil.writeDocumentation(
        this.outputPath,
        document.fileName,
        documentationContent,
      );
    }
  }

  private async processDocument(document: Document): Promise<string> {
    console.log(`Processing document: ${document.fileName}`);
    let documentationContent = "";

    let template: Template | null = null;
    if (document.templateName && this.config.templates) {
      template =
        this.config.templates.find((t) => t.name === document.templateName) ||
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

    for (const contentItem of document.content) {
      console.log(`Processing content for title: ${contentItem.title}`);
      const fileContents = await DocUtil.processContentItem(
        contentItem,
        processedFiles,
        this.projectRoot,
        minificationLevel,
      );
      documentationContent += fileContents;
    }

    if (template && template.footer) {
      documentationContent += "\n" + template.footer;
    }

    return documentationContent;
  }

  public static async build(): Promise<void> {
    try {
      const projectRoot = ProjectUtil.findProjectRoot();
      if (!projectRoot) {
        throw new Error(
          "Project root not found. Make sure you are running this from within a Node.js project.",
        );
      }

      const config = new Config();
      config.load();

      const baseOutputDir = config.docs.outputDir || "bin";
      const bugpromptDir = CONFIG_NAME;
      const fullOutputPath = path.join(
        projectRoot,
        baseOutputDir,
        bugpromptDir,
      );

      await DocUtil.prepareOutputDirectory(fullOutputPath);

      const builder = new DocsBuilder(config.docs, fullOutputPath);
      await builder.build();
    } catch (error) {
      console.error("Error in documentation generation:", error);
    }
  }
}

// This allows the script to be run directly from the command line
if (require.main === module) {
  DocsBuilder.build();
}
