import type { Compiler } from "../compiler/Compiler.js"
import { promises as fs } from "fs"
import { join } from "path"

export interface CleanWebpackPluginOptions {
    dry?: boolean // 仅显示要删除的文件，不实际删除
    verbose?: boolean // 显示详细的删除信息
    cleanStaleWebpackAssets?: boolean // 清理过时的webpack资源
    protectWebpackAssets?: boolean // 保护webpack生成的资源
    cleanOnceBeforeBuildPatterns?: string[] // 额外清理的模式
    dangerouslyAllowCleanPatternsOutsideProject?: boolean // 允许清理项目外的文件
}

export class CleanWebpackPlugin {
    private options: CleanWebpackPluginOptions

    constructor(options: CleanWebpackPluginOptions = {}) {
        this.options = {
            dry: false,
            verbose: false,
            cleanStaleWebpackAssets: true,
            protectWebpackAssets: true,
            cleanOnceBeforeBuildPatterns: [],
            dangerouslyAllowCleanPatternsOutsideProject: false,
            ...options
        }
    }

    apply(compiler: Compiler): void {
        console.log('🧹 CleanWebpackPlugin已注册')

        compiler.hooks.emit.tapAsync('CleanWebpackPlugin', async (compilation) => {
            const outputPath = compiler.config.output.path

            if (this.options.dry) {
                console.log('🧹 DRY RUN: 将要清理的目录:', outputPath)
                return
            }

            try {
                await this.cleanOutputPath(outputPath)
                console.log(`🧹 清理完成: ${outputPath}`)
            } catch (error: any) {
                console.error(`❌ 清理失败: ${error.message}`)
                compilation.errors.push(new Error(`CleanWebpackPlugin: ${error.message}`))
            }
        })
    }

    private async cleanOutputPath(outputPath: string): Promise<void> {
        try {
            // 检查目录是否存在
            await fs.access(outputPath)

            // 读取目录内容
            const files = await fs.readdir(outputPath, { withFileTypes: true })

            for (const file of files) {
                const filePath = join(outputPath, file.name)

                if (this.shouldClean(file.name)) {
                    if (file.isDirectory()) {
                        await fs.rmdir(filePath, { recursive: true })
                        if (this.options.verbose) {
                            console.log(`🗂️  删除目录: ${filePath}`)
                        }
                    } else {
                        await fs.unlink(filePath)
                        if (this.options.verbose) {
                            console.log(`📄 删除文件: ${filePath}`)
                        }
                    }
                }
            }
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                // 目录不存在，无需清理
                return
            }
            throw error
        }
    }

    private shouldClean(filename: string): boolean {
        // 简化的清理逻辑
        // 在实际实现中，这里会有更复杂的规则来决定是否清理文件

        // 保护某些特殊文件
        const protectedFiles = ['.gitkeep', '.keep', 'README.md']
        if (protectedFiles.includes(filename)) {
            return false
        }

        // 默认清理所有文件
        return true
    }
} 