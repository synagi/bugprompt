import path from "path";
import FileMinifier from "./FileMinifier.js";

class FileProcessor {
  private minifier: FileMinifier;

  constructor(minifyLevel: number) {
    this.minifier = new FileMinifier(minifyLevel);
  }

  processFile(filePath: string, content: string): string {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case ".yml":
      case ".yaml":
      case ".jsx":
      case ".tsx":
      case ".svelte":
        return content;
      case ".py":
        return this.minifier.minifyPython(content);
      case ".js":
      case ".cjs":
      case ".ts":
      case ".mjs":
        return this.minifier.minifyJS(content);
      case ".md":
      case ".mdx":
        return this.minifier.minifyMarkdown(content);
      case ".ejs":
      case ".html":
      case ".htm":
        return this.minifier.minifyHTML(content);
      case ".scss":
        return this.minifier.minifySCSS(content);
      case ".css":
        return this.minifier.minifyCSS(content);
      case ".vue":
        return this.processCompositeFile(content, [
          "script",
          "style",
          "template",
        ]);
      case ".json":
        return this.minifier.minifyJSON(content);
      default:
        return `Unknown filetype requested: ${filePath}\n`;
    }
  }

  private processCompositeFile(content: string, types: string[]): string {
    let processedContent = "";
    let hasSections = false;

    types.forEach((type) => {
      const regex = new RegExp(`<${type}[^>]*>([\\s\\S]*?)<\\/${type}>`, "g");
      let match: RegExpExecArray | null;

      while ((match = regex.exec(content)) !== null) {
        hasSections = true;
        let sectionContent = match[1];

        // Apply minification based on section type
        switch (type) {
          case "script":
            sectionContent = this.minifier.minifyJS(sectionContent);
            break;
          case "style":
            sectionContent = this.minifier.minifyCSS(sectionContent);
            break;
          case "template":
            sectionContent = this.minifier.minifyHTML(sectionContent);
            break;
          default:
            break;
        }

        // Reassemble the processed section back into the file
        processedContent += `<${type}>${sectionContent}</${type}>`;
      }
    });

    // If no sections were found, treat entire content as HTML (for Svelte-like files)
    if (!hasSections) {
      processedContent = this.minifier.minifyHTML(content);
    }

    return processedContent;
  }
}

export default FileProcessor;
