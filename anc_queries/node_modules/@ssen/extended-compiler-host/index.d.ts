import ts from 'typescript';
export declare const targetExtensions: string[];
export declare function createExtendedCompilerHost(options: ts.CompilerOptions, setParentNodes?: boolean, compilerHost?: ts.CompilerHost): ts.CompilerHost;
