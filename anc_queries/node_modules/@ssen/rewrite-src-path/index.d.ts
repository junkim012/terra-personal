interface Params {
    /** import '..a' */
    importPath: string;
    /** absolute file path */
    filePath: string;
    /** absolute src directory path */
    rootDir: string;
}
export declare function rewriteSrcPath({ importPath, filePath, rootDir }: Params): string;
export {};
