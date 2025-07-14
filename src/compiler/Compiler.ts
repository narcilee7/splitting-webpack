import { SyncHook, AsyncSeriesHook } from "../tapable/index.js"
import type { Configuration } from "../types/config.js"
import type { CompilerHooks, Stats } from '../types/compiler.js'
import { Compilation } from "./Compilation.js"
import { StatsImpl } from "./Stats.js"

export class Compiler {
    public hooks: CompilerHooks
    public config: Configuration
    public compilation?: Compilation

    constructor(config: Configuration) {
        this.config = config
        this.hooks = {
            environment: new SyncHook(),
            afterEnvironment: new SyncHook(),
            compile: new SyncHook(),
            done: new SyncHook(),
            make: new AsyncSeriesHook(),
            finishMake: new AsyncSeriesHook(),
            emit: new AsyncSeriesHook(),
            afterEmit: new AsyncSeriesHook()
        }

        this.initialPlugins()
    }

    private initialPlugins(): void {
        // 应用内置插件
        this.applyBuiltinPlugins()

        // 应用用户插件
        if (this.config.plugins) {
            for (const plugin of this.config.plugins) {
                // 改一下插件的指向
                plugin.apply(this)
            }
        }
    }

    private applyBuiltinPlugins(): void {
        // TODO 添加内置插件
    }

    async run(): Promise<Stats> {
        try {
            console.log('🚀 开始构建...')

            // 1. 环境准备阶段
            this.hooks.environment.call()
            this.hooks.afterEnvironment.call()

            // 2. 编译准备阶段
            this.hooks.compile.call()

            // 3. 创建编译实例
            this.compilation = new Compilation(this)

            // 4. Make 阶段 - 构建模块
            console.log('📦 开始构建模块...')
            await this.hooks.make.callAsync(this.compilation)

            // 从入口开始构建模块图
            await this.compilation.build()

            await this.hooks.finishMake.callAsync(this.compilation)

            // 5. Seal 阶段 - 封装模块
            console.log('🔒 封装模块...')
            await this.compilation.seal()

            // 6. Emit 阶段 - 输出文件
            console.log('📄 生成文件...')
            await this.hooks.emit.callAsync(this.compilation)
            await this.compilation.emit()
            await this.hooks.afterEmit.callAsync(this.compilation)

            // 7. Done 阶段 - 完成构建
            const stats = new StatsImpl(this.compilation)
            this.hooks.done.call(stats)

            console.log('✅ 构建完成!')
            return stats

        } catch (error) {
            console.error('❌ 构建失败:', error)
            throw error
        }
    }

    watch(callback: (error: Error | null, stats?: Stats) => void): void {
        // TODO 监听模式的实现
        // 这里暂时简化为直接调用 run
        this.run()
            .then(stats => callback(null, stats))
            .catch(error => callback(error));
    }
}