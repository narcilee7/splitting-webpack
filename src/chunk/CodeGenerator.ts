import { generateBundleTemplate, transformESModuleToCommonJS, generateModuleId } from "../runtime/template.js"
import type { Chunk } from "../types/chunk.js"
import type { Module } from "../types/module.js"

/**
 * 代码生成器
 * 负责将模块和chunk转换为可执行的JavaScript代码
 */
export class CodeGenerator {

    /**
     * 生成单个chunk的完整代码
     */
    generate(chunk: Chunk): string {
        console.log(`🔧 生成代码: ${chunk.name}`)

        // 1. 收集所有模块并转换
        const modules = this.collectModules(chunk)

        // 2. 确定入口模块ID
        const entryModuleId = chunk.entryModule?.id || chunk.modules[0]?.id
        if (!entryModuleId) {
            throw new Error(`Chunk ${chunk.name} 没有入口模块`)
        }

        // 3. 生成bundle代码
        const bundleCode = generateBundleTemplate(modules, entryModuleId)

        console.log(`✅ 代码生成完成: ${Object.keys(modules).length} 个模块`)
        return bundleCode
    }

    /**
     * 收集chunk中的所有模块并转换为CommonJS格式
     */
    private collectModules(chunk: Chunk): Record<string, string> {
        const modules: Record<string, string> = {}

        for (const module of chunk.modules) {
            try {
                // 生成模块ID
                const moduleId = this.generateModuleId(module)

                // 转换模块代码
                const transformedCode = this.transformModuleCode(module)

                modules[moduleId] = transformedCode

            } catch (error) {
                console.error(`❌ 模块转换失败: ${module.resource}`, error)
                throw error
            }
        }

        return modules
    }

    /**
     * 生成模块ID
     */
    private generateModuleId(module: Module): string {
        // 使用模块的resource路径生成ID
        return generateModuleId(module.resource)
    }

    /**
     * 转换单个模块的代码
     */
    private transformModuleCode(module: Module): string {
        let code = module.source

        // 1. 首先处理依赖关系的路径替换
        code = this.resolveDependencies(module, code)

        // 2. 将ES6模块转换为CommonJS
        code = transformESModuleToCommonJS(code)

        // 3. 添加源码映射注释（如果需要）
        if (process.env.NODE_ENV === 'development') {
            code += `\n\n//# sourceURL=webpack:///${module.resource}`
        }

        return code
    }

    /**
     * 解析模块依赖，将相对路径转换为模块ID
     */
    private resolveDependencies(module: Module, code: string): string {
        let resolvedCode = code

        // 处理每个依赖
        for (const dependency of module.dependencies) {
            if (dependency.module) {
                const depModuleId = this.generateModuleId(dependency.module)

                // 替换import语句中的路径
                const importRegex = new RegExp(
                    `(import\\s+.*?\\s+from\\s+['"\`])${escapeRegExp(dependency.request)}(['"\`])`,
                    'g'
                )
                resolvedCode = resolvedCode.replace(importRegex, `$1${depModuleId}$2`)

                // 替换require调用中的路径
                const requireRegex = new RegExp(
                    `(require\\s*\\(\\s*['"\`])${escapeRegExp(dependency.request)}(['"\`]\\s*\\))`,
                    'g'
                )
                resolvedCode = resolvedCode.replace(requireRegex, `$1${depModuleId}$2`)
            }
        }

        return resolvedCode
    }

    /**
     * 生成多个chunk的代码（未来用于代码分割）
     */
    generateMultipleChunks(chunks: Chunk[]): Record<string, string> {
        const results: Record<string, string> = {}

        for (const chunk of chunks) {
            const filename = this.getChunkFilename(chunk)
            results[filename] = this.generate(chunk)
        }

        return results
    }

    /**
     * 获取chunk的文件名
     */
    private getChunkFilename(chunk: Chunk): string {
        // 简单实现：使用chunk名称
        return `${chunk.name}.js`
    }

    /**
     * 生成source map（未来功能）
     */
    generateSourceMap(chunk: Chunk): string {
        // TODO: 实现source map生成
        return JSON.stringify({
            version: 3,
            sources: chunk.modules.map(m => m.resource),
            names: [],
            mappings: "",
            file: this.getChunkFilename(chunk)
        })
    }
}

/**
 * 转义正则表达式特殊字符
 */
function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}