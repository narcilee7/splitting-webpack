import type { Compiler } from "../compiler/Compiler.js"
import type { Compilation } from "../compiler/Compilation.js"

export interface BannerPluginOptions {
    banner: string | (() => string)
    raw?: boolean
    entryOnly?: boolean
    test?: string | RegExp
    include?: string | RegExp
    exclude?: string | RegExp
}

export class BannerPlugin {
    private options: BannerPluginOptions

    constructor(options: string | BannerPluginOptions) {
        if (typeof options === 'string') {
            this.options = { banner: options }
        } else {
            this.options = options
        }
    }

    apply(compiler: Compiler): void {
        console.log('🎯 BannerPlugin已注册')

        compiler.hooks.emit.tapAsync('BannerPlugin', async (compilation: Compilation) => {
            const banner = this.getBanner()
            const wrappedBanner = this.options.raw ? banner : `/*! ${banner} */`

            for (const [filename, source] of compilation.assets) {
                if (this.shouldProcessFile(filename)) {
                    compilation.assets.set(filename, wrappedBanner + '\n' + source)
                    console.log(`📜 添加横幅到: ${filename}`)
                }
            }
        })
    }

    private getBanner(): string {
        if (typeof this.options.banner === 'function') {
            return this.options.banner()
        }
        return this.options.banner
    }

    private shouldProcessFile(filename: string): boolean {
        // 只处理JavaScript文件（如果没有特殊配置）
        const isJS = filename.endsWith('.js')

        if (this.options.entryOnly && !isJS) {
            return false
        }

        if (this.options.test) {
            const test = this.options.test
            if (typeof test === 'string') {
                return filename.includes(test)
            }
            return test.test(filename)
        }

        if (this.options.include) {
            const include = this.options.include
            if (typeof include === 'string') {
                return filename.includes(include)
            }
            if (!include.test(filename)) {
                return false
            }
        }

        if (this.options.exclude) {
            const exclude = this.options.exclude
            if (typeof exclude === 'string') {
                return !filename.includes(exclude)
            }
            if (exclude.test(filename)) {
                return false
            }
        }

        return isJS
    }
} 