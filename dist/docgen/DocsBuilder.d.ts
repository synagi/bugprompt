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
declare class DocsBuilder {
    private config;
    private monorepoRoot;
    constructor(config: Config);
    init(): Promise<void>;
    private validateConfig;
    private ensureDirectoryExistence;
    build(): Promise<void>;
    private findReferencedContentItem;
    private processDocument;
    private processContentItem;
    private isFileExcluded;
    private processFile;
    private formatFileContent;
    private writeDocumentation;
    private sanitizeContent;
}
export default DocsBuilder;
