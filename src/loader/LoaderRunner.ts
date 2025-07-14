import { readFile } from "../utils/fs.js"
import type { RuleSetRule, LoaderContext } from "../types/config.js"

export interface LoaderResult {
    source?: string;
    sourceMap?: any;
}

export class LoaderRunner {
    private rules: RuleSetRule[]

    constructor(rules: RuleSetRule[]) {
        this.rules = rules
    }

    async run(resourcePath: string): Promise<LoaderResult> {
        // 读取原始文件内容
        let source = await readFile(resourcePath)
        let sourceMap: any = undefined

        // 匹配loader规则
        const matchedLoaders = this.getMatchedLoaders(resourcePath)

        // 逆序执行Loader
        for (let i = matchedLoaders.length - 1; i >= 0; i--) {
            const loader = matchedLoaders[i]
            const result = await this.runLoader(loader, resourcePath, source, sourceMap)
            source = result.source!
            sourceMap = result.sourceMap
        }

        return {
            source,
            sourceMap
        }
    }

    private getMatchedLoaders(resourcePath: string): Array<{ loader: string, options?: any }> {
        const loaders: Array<{ loader: string, options?: any }> = []

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
                            loaders.push({
                                loader: use
                            })
                        } else {
                            loaders.push({
                                loader: use.loader!,
                                options: use.options
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
        if (loaderName === 'babel-loader') {
            // 内置的laoder
            return await import('./builtin/babel-loader')
        }

        if (loaderName === 'ts-loader') {
            return await import('./builtin/ts-loader.js');
        }

        // 尝试从 node_modules 加载
        try {
            return await import(loaderName);
        } catch (error: any) {
            throw new Error(`Cannot load loader ${loaderName}: ${error.message}`);
        }
    }
}