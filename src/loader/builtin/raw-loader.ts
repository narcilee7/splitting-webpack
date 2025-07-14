import type { LoaderContext } from "../../types/config.js"

export default async function rawLoader(
    source: string,
    sourceMap: any,
    context: LoaderContext
): Promise<string> {
    try {
        // 将文件内容作为字符串导出
        const escapedContent = source
            .replace(/\\/g, '\\\\')
            .replace(/`/g, '\\`')
            .replace(/\$/g, '\\$')

        const moduleCode = `
// Raw content exported by raw-loader
const content = \`${escapedContent}\`;

export default content;
`

        console.log(`📝 Raw内容处理完成: ${context.resourcePath}`)
        return moduleCode.trim()

    } catch (error: any) {
        console.error(`❌ Raw Loader处理失败: ${context.resourcePath}`, error)
        throw new Error(`Raw Loader failed: ${error.message}`)
    }
} 