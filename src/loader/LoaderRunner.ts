import { readFile } from "../utils/fs.js"
import type { RuleSetRule, LoaderContext } from "../types/config.js"
import { extname } from "path"

export interface LoaderResult {
    source?: string;
    sourceMap?: any;
    dependencies?: string[];
}

export interface LoaderInfo {
    loader: string;
    options?: any;
    pitch?: boolean;
}

export class LoaderRunner {
    private rules: RuleSetRule[]
    private loaderCache = new Map<string, any>()

    constructor(rules: RuleSetRule[]) {
        this.rules = rules
    }

    async run(resourcePath: string): Promise<LoaderResult> {
        console.log(`🔧 运行Loader: ${resourcePath}`)

        try {
            // 读取原始文件内容
            let source = await readFile(resourcePath)
            let sourceMap: any = undefined
            const dependencies: string[] = []

            // 匹配loader规则
            const matchedLoaders = this.getMatchedLoaders(resourcePath)

            if (matchedLoaders.length > 0) {
                console.log(`📋 匹配到 ${matchedLoaders.length} 个Loader: ${matchedLoaders.map(l => l.loader).join(' -> ')}`)
            }

            // Pitch阶段（正序执行）
            for (let i = 0; i < matchedLoaders.length; i++) {
                const loader = matchedLoaders[i]
                const pitchResult = await this.runPitch(loader, resourcePath)
                if (pitchResult !== undefined) {
                    // Pitch返回值，跳过后续loader
                    source = pitchResult
                    break
                }
            }

            // Normal阶段（逆序执行）
            for (let i = matchedLoaders.length - 1; i >= 0; i--) {
                const loader = matchedLoaders[i]
                console.log(`⚙️  执行Loader: ${loader.loader}`)

                const result = await this.runLoader(loader, resourcePath, source, sourceMap)
                source = result.source || source
                sourceMap = result.sourceMap || sourceMap

                if (result.dependencies) {
                    dependencies.push(...result.dependencies)
                }
            }

            console.log(`✅ Loader执行完成: ${resourcePath}`)
            return {
                source,
                sourceMap,
                dependencies
            }

        } catch (error: any) {
            console.error(`❌ Loader执行失败: ${resourcePath}`, error.message)
            throw new Error(`Loader failed for ${resourcePath}: ${error.message}`)
        }
    }

    private getMatchedLoaders(resourcePath: string): Array<{ loader: string, options?: any }> {
        const loaders: Array<{ loader: string, options?: any }> = []

        // 自动推断Loader（如果没有明确配置）
        if (this.rules.length === 0) {
            const inferredLoader = this.inferLoader(resourcePath)
            if (inferredLoader) {
                loaders.push(inferredLoader)
            }
        }

        for (const rule of this.rules) {
            if (this.testRule(rule, resourcePath)) {
                if (rule.loader) {
                    loaders.push({
                        loader: rule.loader,
                        options: rule.options
                    })
                } else if (rule.use) {
                    const uses = Array.isArray(rule.use) ? rule.use : [rule.use]
                    for (const use of uses) {
                        if (typeof use === 'string') {
                            loaders.push({ loader: use })
                        } else if (typeof use === 'object') {
                            loaders.push({
                                loader: (use as any).loader,
                                options: (use as any).options
                            })
                        }
                    }
                }
            }
        }

        return loaders
    }

    private testRule(rule: RuleSetRule, resourcePath: string): boolean {
        if (rule.test && !rule.test.test(resourcePath)) {
            return false
        }

        // 测试include条件
        if (rule.include && !this.testCondition(rule.include, resourcePath)) {
            return false
        }

        // 测试exclude条件
        if (rule.exclude && !this.testCondition(rule.exclude, resourcePath)) {
            return false
        }

        return true
    }

    private testCondition(condition: string | RegExp | (string | RegExp)[], resourcePath: string): boolean {
        if (Array.isArray(condition)) {
            return condition.some(cond => this.testCondition(cond, resourcePath))
        }

        if (typeof condition === 'string') {
            return resourcePath.includes(condition)
        }

        if (condition instanceof RegExp) {
            return condition.test(resourcePath)
        }

        return false
    }

    private async runLoader(
        loader: { loader: string, options?: any },
        resourcePath: string,
        source: string,
        sourceMap: any
    ): Promise<LoaderResult> {
        // 创建Loader上下文
        const context: LoaderContext = {
            resourcePath,
            query: loader.options ? JSON.stringify(loader.options) : '',
            callback: (error, content, map) => {
                if (error) throw error
                return {
                    source: content || source,
                    sourceMap: map
                }
            },
            async: () => context.callback,
            cacheable: () => { }, // 简化
            addDependency: () => { }, // 简化
            emitFile: () => { }, // 简化
        }

        // 根据loader名称加载对应的处理器
        const loaderModule = await this.loadLoader(loader.loader)

        try {
            const result = await loaderModule.default(source, sourceMap, context)
            return {
                source: result,
                sourceMap
            }
        } catch (error: any) {
            throw new Error(`Loader ${loader.loader} failed: ${error.message}`)
        }
    }

    private async loadLoader(loaderName: string): Promise<any> {
        // 检查缓存
        if (this.loaderCache.has(loaderName)) {
            return this.loaderCache.get(loaderName)
        }

        let loaderModule: any

        try {
            // 处理内置Loader
            if (loaderName.startsWith('builtin:')) {
                const builtinName = loaderName.replace('builtin:', '')
                switch (builtinName) {
                    case 'babel-loader':
                        loaderModule = await import('./builtin/babel-loader.js')
                        break
                    case 'ts-loader':
                        loaderModule = await import('./builtin/ts-loader.js')
                        break
                    case 'css-loader':
                        loaderModule = await import('./builtin/css-loader.js')
                        break
                    case 'json-loader':
                        loaderModule = await import('./builtin/json-loader.js')
                        break
                    case 'url-loader':
                        loaderModule = await import('./builtin/url-loader.js')
                        break
                    case 'raw-loader':
                        loaderModule = await import('./builtin/raw-loader.js')
                        break
                    default:
                        throw new Error(`Unknown builtin loader: ${builtinName}`)
                }
            } else if (loaderName === 'babel-loader' || loaderName === 'ts-loader') {
                // 兼容旧的loader名称
                loaderModule = await import(`./builtin/${loaderName}.js`)
            } else {
                // 尝试从 node_modules 加载
                loaderModule = await import(loaderName)
            }

            // 缓存Loader
            this.loaderCache.set(loaderName, loaderModule)
            console.log(`✅ 加载Loader成功: ${loaderName}`)

            return loaderModule

        } catch (error: any) {
            console.error(`❌ 加载Loader失败: ${loaderName}`, error.message)
            throw new Error(`Cannot load loader ${loaderName}: ${error.message}`)
        }
    }

    private inferLoader(resourcePath: string): { loader: string, options?: any } | null {
        const ext = extname(resourcePath)

        switch (ext) {
            case '.ts':
            case '.tsx':
                return { loader: 'builtin:ts-loader' }
            case '.js':
            case '.jsx':
                return { loader: 'builtin:babel-loader' }
            case '.css':
                return { loader: 'builtin:css-loader' }
            case '.json':
                return { loader: 'builtin:json-loader' }
            case '.png':
            case '.jpg':
            case '.jpeg':
            case '.gif':
            case '.svg':
                return { loader: 'builtin:url-loader' }
            default:
                return { loader: 'builtin:raw-loader' }
        }
    }

    private async runPitch(loader: { loader: string, options?: any }, resourcePath: string): Promise<string | undefined> {
        try {
            const loaderModule = await this.loadLoader(loader.loader)
            if (loaderModule.pitch && typeof loaderModule.pitch === 'function') {
                console.log(`🔄 执行Pitch: ${loader.loader}`)
                return await loaderModule.pitch(resourcePath, loader.options)
            }
        } catch (error) {
            console.warn(`⚠️  Pitch执行失败: ${loader.loader}`, error)
        }
        return undefined
    }
}