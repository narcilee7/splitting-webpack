import type { LoaderContext } from "../../types/config.js"

export default async function babelLoader(
    source: string,
    sourceMap: string,
    context: LoaderContext
): Promise<string> {
    try {
        // 动态导入@babel/core
        const babel = await import("@babel/core")

        const options = {
            filename: context.resourcePath,
            presets: [
                ['@babel/preset-env', { modules: false }],
                '@babel/preset-typescript'
            ],
            plugin: [],
            sourceMap: true,
            ...JSON.parse(context.query || '{}')
        }

        const result = await babel.transformAsync(source, options)

        if (!result || !result.code) {
            throw new Error('Babel transformation failed.')
        }

        return result.code
    } catch (error: any) {
        // 如果没有安装@babel/core
        if (error.code === 'MODULE_NOT_FOUND') {
            console.warn('babel-loader: @babel/core not found, returning original source');
            return source
        }
        throw error
    }
}