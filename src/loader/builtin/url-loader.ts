import type { LoaderContext } from "../../types/config.js"
import { extname, basename } from "path"
import { promises as fs } from "fs"

interface UrlLoaderOptions {
    limit?: number // 文件大小限制，超过则使用文件路径
    mimetype?: string // MIME类型
    name?: string // 输出文件名模板
}

export default async function urlLoader(
    source: string,
    sourceMap: any,
    context: LoaderContext
): Promise<string> {
    try {
        const options: UrlLoaderOptions = context.query ? JSON.parse(context.query) : {}
        const limit = options.limit || 8192 // 默认8KB

        // 读取文件的原始内容（二进制）
        const buffer = await fs.readFile(context.resourcePath)
        const fileSize = buffer.length

        let moduleCode: string

        if (fileSize <= limit) {
            // 小文件：转换为base64 data URL
            const base64 = buffer.toString('base64')
            const mimeType = options.mimetype || getMimeType(context.resourcePath)
            const dataUrl = `data:${mimeType};base64,${base64}`

            moduleCode = `
// Asset inlined by url-loader
export default "${dataUrl}";
`
            console.log(`🖼️  资源内联完成: ${context.resourcePath} (${fileSize} bytes)`)

        } else {
            // 大文件：使用文件路径
            const fileName = options.name || `[name].[hash:8].[ext]`
            const ext = extname(context.resourcePath)
            const name = basename(context.resourcePath, ext)
            const hash = generateHash(buffer).substring(0, 8)

            const outputName = fileName
                .replace('[name]', name)
                .replace('[hash:8]', hash)
                .replace('[ext]', ext.slice(1))

            // TODO: 实际应该将文件复制到输出目录
            const publicPath = `/${outputName}`

            moduleCode = `
// Asset referenced by url-loader
export default "${publicPath}";
`
            console.log(`🖼️  资源引用完成: ${context.resourcePath} -> ${publicPath}`)
        }

        return moduleCode.trim()

    } catch (error: any) {
        console.error(`❌ URL Loader处理失败: ${context.resourcePath}`, error)
        throw new Error(`URL Loader failed: ${error.message}`)
    }
}

function getMimeType(filePath: string): string {
    const ext = extname(filePath).toLowerCase()
    const mimeTypes: Record<string, string> = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.webp': 'image/webp',
        '.ico': 'image/x-icon'
    }
    return mimeTypes[ext] || 'application/octet-stream'
}

function generateHash(content: Buffer): string {
    // 简单的hash生成（生产环境应使用更复杂的算法）
    const str = content.toString('hex')
    let hash = 0
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i)
        hash = ((hash << 5) - hash) + char
        hash = hash & hash // 转换为32位整数
    }
    return Math.abs(hash).toString(16)
} 