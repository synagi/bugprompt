import fs from "fs";
import path from "path";
import { glob } from "glob";
import FileUtil from "./FileUtil.js";
import MinifyUtil from "./MinifyUtil.js";

interface ContentItem {
  reference?: string;
  root?: string;
  title?: string;
  description?: string;
  include?: string[] | null;
  exclude?: string[] | null;
  headerRootPath?: boolean;
  headerRelativePath?: boolean;
  headerPrefix?: string;
  useCodeblocks?: boolean;
}

class DocUtil {
  static async prepareOutputDirectory(dirPath: string): Promise<void> {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true });
      console.log(`Output directory created or verified: ${dirPath}`);
      await FileUtil.cleanDirectory(dirPath);
    } catch (error) {
      console.error(`Error preparing output directory ${dirPath}:`, error);
      throw error;
    }
  }

  static async processContentItem(
    contentItem: ContentItem,
    processedFiles: Set<string>,
    projectRoot: string,
    minificationLevel: number,
  ): Promise<string> {
    console.log(
      `Processing content item:`,
      JSON.stringify(contentItem, null, 2),
    );

    const includePatterns = contentItem.include || ["**/*"];
    const excludePatterns = contentItem.exclude || [];

    console.log(`Include patterns:`, includePatterns);
    console.log(`Exclude patterns:`, excludePatterns);

    const itemRoot = contentItem.root || "";
    const fullItemRoot = path.join(projectRoot, itemRoot);
    console.log(`Full item root:`, fullItemRoot);

    let content = "";

    if (contentItem.title) {
      content += `# ${contentItem.title}\n\n`;
    }

    if (contentItem.description) {
      content += `${contentItem.description}\n\n`;
    }

    const globOptions = {
      cwd: fullItemRoot,
      nodir: true,
      ignore: excludePatterns,
      absolute: true,
    };
    console.log(`Glob options:`, JSON.stringify(globOptions, null, 2));

    for (const pattern of includePatterns) {
      const files = await glob(pattern, globOptions);
      console.log(`Glob pattern ${pattern} matched files:`, files.length);

      if (files.length > 0) {
        console.log(`Sample matched files:`, files.slice(0, 5));
      }

      for (const fullPath of files) {
        if (!processedFiles.has(fullPath)) {
          processedFiles.add(fullPath);
          console.log(`Processing file: ${fullPath}`);
          const fileContent = await this.processFile(
            fullPath,
            MinifyUtil,
            contentItem,
            fullItemRoot,
            minificationLevel,
          );
          content += fileContent;
        }
      }
    }
    return content;
  }

  static async processFile(
    filePath: string,
    minifyUtil: typeof MinifyUtil,
    contentItem: ContentItem,
    projectRoot: string,
    minificationLevel: number,
  ): Promise<string> {
    const ext = path.extname(filePath).toLowerCase();
    const content = await fs.promises.readFile(filePath, "utf8");
    const processedContent = minifyUtil.processFile(
      filePath,
      content,
      minificationLevel,
    );
    return this.formatFileContent(
      filePath,
      processedContent,
      ext,
      contentItem,
      projectRoot,
    );
  }

  static formatFileContent(
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
      header += path.relative(process.cwd(), projectRoot);
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

  static async writeDocumentation(
    outputDir: string,
    fileName: string,
    documentationContent: string,
  ): Promise<void> {
    if (!fileName) {
      throw new Error("fileName is undefined or empty");
    }

    let sanitizedFileName = fileName.split(" ").join("_");
    const outputFileName = path.join(outputDir, `${sanitizedFileName}.md`);

    try {
      await fs.promises.writeFile(outputFileName, documentationContent);
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

  static sanitizeContent(
    content: string,
    sanitizeArray: Array<{ keyword: string; replace: string }>,
  ): string {
    let sanitizedContent = content;
    for (const pair of sanitizeArray) {
      const keyword = new RegExp(pair.keyword, "gi");
      sanitizedContent = sanitizedContent.replace(keyword, pair.replace);
    }
    return sanitizedContent;
  }
}

export default DocUtil;
