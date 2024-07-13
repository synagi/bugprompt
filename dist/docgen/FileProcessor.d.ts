declare class FileProcessor {
    private minifier;
    constructor(minifyLevel: number);
    processFile(filePath: string, content: string): string;
    private processCompositeFile;
}
export default FileProcessor;
