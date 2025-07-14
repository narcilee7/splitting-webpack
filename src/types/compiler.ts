import { Compilation } from "../compiler/Compilation.js";
import { AsyncSeriesHook, SyncHook } from "../tapable/index.js";

export interface CompilerHooks {
    environment: SyncHook<[]>;
    afterEnvironment: SyncHook<[]>;
    compile: SyncHook<[]>;
    make: AsyncSeriesHook<[Compilation]>;
    finishMake: AsyncSeriesHook<[Compilation]>;
    emit: AsyncSeriesHook<[Compilation]>;
    afterEmit: AsyncSeriesHook<[Compilation]>;
    done: SyncHook<[Stats]>;
}
/** 编译信息 */
export interface Stats {
    compilation: Compilation;
    hasErrors(): boolean;
    hasWarnings(): boolean;
    getErrors(): Error[];
    getWarnings(): string[];
    getTime(): number;
    getModulesCount(): number;
    getAssetsCount(): number;
    toString(options?: { colors?: boolean }): string;
}

