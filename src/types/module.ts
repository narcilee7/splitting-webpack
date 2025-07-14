export interface Module {
    id: string;
    request: string;
    userRequest: string;
    rawRequest: string;
    resource: string;
    dependencies: Dependency[];
    source: string;
    ast?: any;
    hash?: string;
    buildInfo?: any;
    built?: boolean;
    error?: Error;
    warnings: string[]
}

export interface Dependency {
    type: 'require' | 'import' | 'dynamic-import';
    request: string;
    loc?: {
        start: {
            line: number, column: number;
        },
        end: {
            line: number, column: number;
        }
    },
    module?: Module;
}