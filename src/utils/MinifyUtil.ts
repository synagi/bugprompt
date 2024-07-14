import path from "path";

class MinifyUtil {
  // Helper methods
  private static spacesToTabs(content: string): string {
    return content.replace(/^ +/gm, (match) => "\t".repeat(match.length / 4));
  }

  private static collapseSingleLineBlocks(content: string): string {
    return content.replace(/({\s*)(.*)(\s*})/g, (_match, g1, g2, g3) => {
      return `${g1.trim()} ${g2.trim()} ${g3.trim()}`;
    });
  }

  private static normalizeLineBreaks(content: string): string {
    return content.replace(/\r\n|\r/g, "\n");
  }

  // Minification methods
  static minifyJS(content: string, minifyLevel: number): string {
    if (minifyLevel === 0) {
      return content;
    }

    if (minifyLevel === 1) {
      content = this.spacesToTabs(content);
      content = this.collapseSingleLineBlocks(content);
      content = this.normalizeLineBreaks(content);
      content = content.replace(/\n\s*\n/g, "\n");
    }

    if (minifyLevel >= 2) {
      content = content
        .replace(/\/\/.*$/gm, "")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\s+/g, " ")
        .replace(/; /g, ";")
        .replace(/ {/g, "{")
        .replace(/ }/g, "}")
        .replace(/: /g, ":");
    }

    return content.trim();
  }

  static minifyJSON(content: string, minifyLevel: number): string {
    if (minifyLevel === 0) {
      return content;
    } else if (minifyLevel === 1) {
      return JSON.stringify(JSON.parse(content), null, 2);
    } else {
      return JSON.stringify(JSON.parse(content));
    }
  }

  static minifyPython(content: string, minifyLevel: number): string {
    if (minifyLevel === 0) {
      return content;
    }

    content = content.replace(/[ \t]+$/gm, "");
    content = content.replace(/\n\s*\n/g, "\n");

    if (minifyLevel >= 2) {
      content = content.replace(/#.*$/gm, "");
    }

    return content.trim();
  }

  static minifyHTML(content: string, minifyLevel: number): string {
    if (minifyLevel === 0) {
      return content;
    }

    if (minifyLevel === 1) {
      content = this.collapseSingleLineBlocks(content);
      content = this.normalizeLineBreaks(content);
      content = content.replace(/\n\s*\n/g, "\n");
    }

    if (minifyLevel >= 2) {
      content = content.replace(/<!--[\s\S]*?-->/g, "");
      content = content.replace(/\s+/g, " ");
    }

    return content.trim();
  }

  static minifyCSS(content: string, minifyLevel: number): string {
    if (minifyLevel === 0) {
      return content;
    }

    if (minifyLevel === 1) {
      content = this.spacesToTabs(content);
      content = this.collapseSingleLineBlocks(content);
      content = this.normalizeLineBreaks(content);
      content = content.replace(/\n\s*\n/g, "\n");
    }

    if (minifyLevel >= 2) {
      content = content
        .replace(/\/\/.*$/gm, "")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/\s+/g, " ");
    }

    return content.trim();
  }

  static minifySCSS(content: string, minifyLevel: number): string {
    return this.minifyCSS(content, minifyLevel);
  }

  static minifyMarkdown(content: string, minifyLevel: number): string {
    if (minifyLevel === 0) {
      return content;
    } else if (minifyLevel === 1) {
      return content.replace(/[ \t]+$/gm, "").replace(/\n{2,}/g, "\n\n");
    } else {
      return content
        .split("\n")
        .map((line) => {
          if (/^(\s*>|\s*[-+*]|\s*\d+\.)\s+/.test(line)) {
            return line.replace(/[ \t]+$/g, "");
          }
          return line.trim();
        })
        .join("\n")
        .replace(/\n{2,}/g, "\n\n");
    }
  }

  // File processing method
  static processFile(
    filePath: string,
    content: string,
    minifyLevel: number,
  ): string {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case ".yml":
      case ".yaml":
      case ".jsx":
      case ".tsx":
      case ".svelte":
        return content;
      case ".py":
        return this.minifyPython(content, minifyLevel);
      case ".js":
      case ".cjs":
      case ".ts":
      case ".mjs":
        return this.minifyJS(content, minifyLevel);
      case ".md":
      case ".mdx":
        return this.minifyMarkdown(content, minifyLevel);
      case ".ejs":
      case ".html":
      case ".htm":
        return this.minifyHTML(content, minifyLevel);
      case ".scss":
        return this.minifySCSS(content, minifyLevel);
      case ".css":
        return this.minifyCSS(content, minifyLevel);
      case ".vue":
        return this.processCompositeFile(
          content,
          ["script", "style", "template"],
          minifyLevel,
        );
      case ".json":
        return this.minifyJSON(content, minifyLevel);
      default:
        return `Unknown filetype requested: ${filePath}\n`;
    }
  }

  private static processCompositeFile(
    content: string,
    types: string[],
    minifyLevel: number,
  ): string {
    let processedContent = "";
    let hasSections = false;

    types.forEach((type) => {
      const regex = new RegExp(`<${type}[^>]*>([\\s\\S]*?)<\\/${type}>`, "g");
      let match: RegExpExecArray | null;

      while ((match = regex.exec(content)) !== null) {
        hasSections = true;
        let sectionContent = match[1];

        switch (type) {
          case "script":
            sectionContent = this.minifyJS(sectionContent, minifyLevel);
            break;
          case "style":
            sectionContent = this.minifyCSS(sectionContent, minifyLevel);
            break;
          case "template":
            sectionContent = this.minifyHTML(sectionContent, minifyLevel);
            break;
          default:
            break;
        }

        processedContent += `<${type}>${sectionContent}</${type}>`;
      }
    });

    if (!hasSections) {
      processedContent = this.minifyHTML(content, minifyLevel);
    }

    return processedContent;
  }
}

export default MinifyUtil;
