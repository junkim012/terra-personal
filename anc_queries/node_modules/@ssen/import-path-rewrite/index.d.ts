import ts from 'typescript';
interface Configuration {
    /**
     * source root
     *
     * /project/root/src
     */
    src: string;
    /**
     * file path
     *
     * /project/root/src/path/file.ts
     */
    fileName?: string;
}
export declare const importPathRewrite: (config: Configuration) => ts.TransformerFactory<ts.SourceFile>;
export {};
