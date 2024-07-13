class FileMinifier {
  private minifyLevel: number;

  constructor(minifyLevel: number) {
    // NOTE: Output is for docs not working code, so we roll our own minify methods that don't complain

    // Minify level guidelines:
    // 0 - No minify: The content is returned as is.
    // 1 - Basic minify: Preserve comments and human readability, remove useless whitespace and carriage returns
    // >=2 - Full minify: As compressed as possible, maintaining machine readability
    this.minifyLevel = minifyLevel;
  }

  // Replace spaces with tabs for indentation
  private spacesToTabs(content: string): string {
    return content.replace(/^ +/gm, (match) => "\t".repeat(match.length / 4));
  }

  // Collapse single-line blocks and statements
  private collapseSingleLineBlocks(content: string): string {
    return content.replace(/({\s*)(.*)(\s*})/g, (_match, g1, g2, g3) => {
      return `${g1.trim()} ${g2.trim()} ${g3.trim()}`;
    });
  }

  // Normalize line breaks
  private normalizeLineBreaks(content: string): string {
    return content.replace(/\r\n|\r/g, "\n"); // Convert all types of line breaks to \n
  }

  minifyJS(content: string): string {
    if (this.minifyLevel === 0) {
      return content;
    }

    if (this.minifyLevel === 1) {
      content = this.spacesToTabs(content);
      content = this.collapseSingleLineBlocks(content);
      content = this.normalizeLineBreaks(content);
      content = content.replace(/\n\s*\n/g, "\n"); // Remove multiple blank lines
    }

    if (this.minifyLevel >= 2) {
      content = content
        .replace(/\/\/.*$/gm, "") // Remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, "") // Remove multi-line comments
        .replace(/\s+/g, " ") // Collapse multiple spaces to one
        .replace(/; /g, ";") // Remove space after semicolon
        .replace(/ {/g, "{") // Remove space before opening brace
        .replace(/ }/g, "}") // Remove space before closing brace
        .replace(/: /g, ":"); // Remove space after colon
    }

    return content.trim();
  }

  minifyJSON(content: string): string {
    if (this.minifyLevel === 0) {
      return content; // Return the content as is
    } else if (this.minifyLevel === 1) {
      // Basic minification: remove unnecessary whitespace while maintaining structure
      return JSON.stringify(JSON.parse(content), null, 2); // Reformat with a 2-space indent
    } else {
      // Full minification: remove all unnecessary whitespace
      return JSON.stringify(JSON.parse(content));
    }
  }

  minifyPython(content: string): string {
    // Level 0: No minification
    if (this.minifyLevel === 0) {
      return content;
    }

    // Basic minification (for Level 1 and above)
    // Remove trailing spaces
    content = content.replace(/[ \t]+$/gm, "");
    // Collapse multiple blank lines
    content = content.replace(/\n\s*\n/g, "\n");
    // Optionally, remove non-critical comments for level 1
    if (this.minifyLevel === 1) {
      // content = content.replace(/^\s*#.*$/gm, '');
    }

    // Additional minification for Level 2 and above
    if (this.minifyLevel >= 2) {
      // Remove all comments
      content = content.replace(/#.*$/gm, "");
      // Further minifications can be added here
    }

    return content.trim();
  }

  minifyHTML(content: string): string {
    if (this.minifyLevel === 0) {
      return content;
    }

    if (this.minifyLevel === 1) {
      content = this.collapseSingleLineBlocks(content);
      content = this.normalizeLineBreaks(content);
      content = content.replace(/\n\s*\n/g, "\n"); // Remove multiple blank lines
    }

    if (this.minifyLevel >= 2) {
      content = content.replace(/<!--[\s\S]*?-->/g, ""); // Remove HTML comments
      content = content.replace(/\s+/g, " "); // Collapse multiple spaces to one
    }

    return content.trim();
  }

  minifyCSS(content: string): string {
    if (this.minifyLevel === 0) {
      return content;
    }

    if (this.minifyLevel === 1) {
      content = this.spacesToTabs(content);
      content = this.collapseSingleLineBlocks(content);
      content = this.normalizeLineBreaks(content);
      content = content.replace(/\n\s*\n/g, "\n"); // Remove multiple blank lines
    }

    if (this.minifyLevel >= 2) {
      content = content
        .replace(/\/\/.*$/gm, "") // Remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, "") // Remove multi-line comments
        .replace(/\s+/g, " "); // Collapse multiple spaces to one
    }

    return content.trim();
  }

  minifySCSS(content: string): string {
    // Extend CSS minification for SCSS
    return this.minifyCSS(content);
    // Add any SCSS-specific minification logic here
  }

  minifyMarkdown(content: string): string {
    if (this.minifyLevel === 0) {
      return content;
    } else if (this.minifyLevel === 1) {
      // Level 1: Remove trailing spaces and excess empty lines
      return content
        .replace(/[ \t]+$/gm, "") // Remove trailing whitespace
        .replace(/\n{2,}/g, "\n\n"); // Collapse multiple blank lines
    } else {
      // Level 2: Remove all leading and trailing spaces except in list items or blockquotes
      return content
        .split("\n")
        .map((line) => {
          if (/^(\s*>|\s*[-+*]|\s*\d+\.)\s+/.test(line)) {
            // Preserve indentation for blockquotes and lists
            return line.replace(/[ \t]+$/g, "");
          }
          return line.trim(); // Trim each line
        })
        .join("\n")
        .replace(/\n{2,}/g, "\n\n"); // Collapse multiple blank lines
    }
  }
}

export default FileMinifier;
