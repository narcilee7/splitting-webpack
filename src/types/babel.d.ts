declare module '@babel/core' {
    export function transform(code: string, options?: any): { code: string; map?: any }
    export function transformAsync(code: string, options?: any): Promise<{ code: string; map?: any }>
} 