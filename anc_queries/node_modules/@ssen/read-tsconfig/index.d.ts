import ts from 'typescript';
export declare function readTSConfig(searchPath: string, configName?: string): ts.ParsedCommandLine;
export declare function parseTSConfig(searchPath: string, tsconfig: object): ts.ParsedCommandLine;
