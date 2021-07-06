import { PublishOption } from './types';
interface VersionInfo {
    currentVersion: string;
    remoteVersion: string | undefined;
}
export declare type AvailablePublishOption = PublishOption & VersionInfo;
export declare function getVersions({ current, remote }: PublishOption): VersionInfo;
interface Params {
    publishOptions: Map<string, PublishOption>;
    skipSelection: boolean;
}
export declare function selectPublishOptions({ publishOptions, skipSelection, }: Params): Promise<AvailablePublishOption[]>;
export {};
