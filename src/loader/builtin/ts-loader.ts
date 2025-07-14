import type { LoaderContext } from "../../types/config.js"

export default async function tsLoader(
    source: string,
    sourceMap: string,
    context: LoaderContext
): Promise<string> {
    try {
        const ts = await import('typescript')

        const options = {
            module: ts.ModuleKind.ES2015,
            target: ts.ScriptTarget.ES2018,
            moduleResolution: ts.ModuleResolutionKind.NodeJs,
            allowSyntheticDefaultImports: true,
            esModuleInterop: true,
            skipLibCheck: true,
            ...JSON.parse(context.query || '{}')
        }

        const result = ts.transpileModule(source, {
            compilerOptions: options,
            fileName: context.resourcePath
        })

        return result.outputText
    } catch (error: any) {
        // 如果没有安装 typescript，返回原始代码
        if (error.code === 'MODULE_NOT_FOUND') {
            console.warn('ts-loader: typescript not found, returning original source');
            return source;
        }
        throw error;
    }
}