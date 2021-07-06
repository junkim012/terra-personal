import { Options } from 'package-json';
import { PackageJson } from 'type-fest';
import { PackageInfo, PublishOption } from './types';
export declare type GetRemotePackageJson = (params: {
    name: string;
} & Options) => Promise<PackageJson | undefined>;
interface Params {
    packages: Map<string, PackageInfo>;
    outDir: string;
    tag: string | undefined;
    registry: string | undefined;
    getRemotePackageJson?: GetRemotePackageJson;
}
export declare function getPublishOptions({ packages, outDir, tag: forceTag, registry: forceRegistry, getRemotePackageJson, }: Params): Promise<Map<string, PublishOption>>;
export {};
