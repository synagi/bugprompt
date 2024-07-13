declare class FileMinifier {
    private minifyLevel;
    constructor(minifyLevel: number);
    private spacesToTabs;
    private collapseSingleLineBlocks;
    private normalizeLineBreaks;
    minifyJS(content: string): string;
    minifyJSON(content: string): string;
    minifyPython(content: string): string;
    minifyHTML(content: string): string;
    minifyCSS(content: string): string;
    minifySCSS(content: string): string;
    minifyMarkdown(content: string): string;
}
export default FileMinifier;
