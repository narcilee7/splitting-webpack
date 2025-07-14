import type { Compiler } from "../compiler/Compiler.js"
import type { Compilation } from "../compiler/Compilation.js"
import chalk from "chalk"

export interface ProgressPluginOptions {
    profile?: boolean
    modulesCount?: number
    showEntries?: boolean
    showModules?: boolean
    showActiveModules?: boolean
}

export class ProgressPlugin {
    private options: ProgressPluginOptions
    private startTime: number = 0
    private lastProgressTime: number = 0

    constructor(options: ProgressPluginOptions = {}) {
        this.options = {
            profile: false,
            modulesCount: 1000,
            showEntries: true,
            showModules: true,
            showActiveModules: false,
            ...options
        }
    }

    apply(compiler: Compiler): void {
        console.log('📊 ProgressPlugin已注册')

        compiler.hooks.compile.tap('ProgressPlugin', () => {
            this.startTime = Date.now()
            this.lastProgressTime = this.startTime
            this.reportProgress(0, '开始编译')
        })

        compiler.hooks.make.tapAsync('ProgressPlugin', async (compilation: Compilation) => {
            this.reportProgress(10, '分析模块依赖')
        })

        compiler.hooks.finishMake.tapAsync('ProgressPlugin', async (compilation: Compilation) => {
            const moduleCount = compilation.modules.size
            this.reportProgress(60, `构建完成 (${moduleCount} 个模块)`)
        })

        compiler.hooks.emit.tapAsync('ProgressPlugin', async (compilation: Compilation) => {
            const chunkCount = compilation.chunks.length
            const assetCount = compilation.assets.size
            this.reportProgress(90, `生成资源 (${chunkCount} 个chunk, ${assetCount} 个文件)`)
        })

        compiler.hooks.done.tap('ProgressPlugin', (stats) => {
            const duration = Date.now() - this.startTime
            this.reportProgress(100, `构建完成 (${duration}ms)`)
        })
    }

    private reportProgress(percentage: number, message: string): void {
        const now = Date.now()
        const elapsed = now - this.startTime
        const delta = now - this.lastProgressTime

        if (this.options.profile || delta > 100) { // 限制更新频率
            const progressBar = this.createProgressBar(percentage)
            const timeInfo = this.options.profile ? ` (+${delta}ms)` : ''

            console.log(`${progressBar} ${percentage.toString().padStart(3, ' ')}% ${message}${timeInfo}`)
            this.lastProgressTime = now
        }
    }

    private createProgressBar(percentage: number): string {
        const barLength = 20
        const filledLength = Math.round(barLength * percentage / 100)
        const emptyLength = barLength - filledLength

        const filled = chalk.green('█'.repeat(filledLength))
        const empty = chalk.gray('░'.repeat(emptyLength))

        return `[${filled}${empty}]`
    }
} 