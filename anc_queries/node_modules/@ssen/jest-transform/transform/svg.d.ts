/// <reference types="node" />
import { BinaryLike } from 'crypto';
declare function getCacheKey(fileData: BinaryLike, filePath: string, configString: string): string;
declare function processFunction(sourceText: string): string;
declare const _default: {
    getCacheKey: typeof getCacheKey;
    process: typeof processFunction;
};
export = _default;
