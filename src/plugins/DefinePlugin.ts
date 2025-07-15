import type { Compiler } from "../compiler/Compiler.js"
import type { Compilation } from "../compiler/Compilation.js"

export interface DefinePluginOptions {
    [key: string]: any
}

export class DefinePlugin {
    private definitions: DefinePluginOptions

    constructor(definitions: DefinePluginOptions) {
        this.definitions = definitions
    }

    apply(compiler: Compiler): void {
        console.log('🔧 DefinePlugin已注册')

        compiler.hooks.make.tapAsync('DefinePlugin', async (compilation: Compilation) => {
            // 处理所有模块的源码，替换定义的常量
            for (const [path, module] of compilation.modules) {
                if (module.source) {
                    const originalSource = module.source
                    module.source = this.replaceDefinitions(module.source)

                    if (originalSource !== module.source) {
                        console.log(`🔄 DefinePlugin处理: ${path}`)
                    }
                }
            }
        })
    }

    private replaceDefinitions(source: string): string {
        let result = source

        for (const [key, value] of Object.entries(this.definitions)) {
            const stringValue = this.toDefinitionValue(value)

            // 创建正则表达式来匹配全局变量
            // 注意：这是一个简化的实现，真实的webpack使用AST替换
            // TODO 替换实现
            const regex = new RegExp(`\\b${this.escapeRegExp(key)}\\b`, 'g')

            const originalLength = result.length
            result = result.replace(regex, stringValue)

            if (result.length !== originalLength) {
                console.log(`🔄 替换定义: ${key} -> ${stringValue}`)
            }
        }

        return result
    }

    private toDefinitionValue(value: any): string {
        if (typeof value === 'string') {
            return JSON.stringify(value)
        }
        if (typeof value === 'boolean' || typeof value === 'number') {
            return String(value)
        }
        if (value === null || value === undefined) {
            return 'undefined'
        }
        if (typeof value === 'object') {
            return JSON.stringify(value)
        }
        return String(value)
    }

    private escapeRegExp(string: string): string {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }
} 