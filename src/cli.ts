import { Command } from 'commander'
import chalk from 'chalk'
import { ConfigResolver } from './config/ConfigResolver.js'
import { createCompiler } from './index.js'

const program = new Command()

program
    .name('splitting-webpack')
    .description('A webpack-like bundler for learning purposes')
    .version('0.0.2')

program
    .command('build')
    .description('Build for production')
    .option('-c, --config <path>', 'config file path')
    .option('--mode <mode>', 'build mode (development|production)', 'production')
    .option('--watch', 'watch for file changes')
    .option('--analyze', 'analyze bundle size')
    .option('--progress', 'show build progress', true)
    .option('--stats [preset]', 'stats preset (errors-only|minimal|normal|detailed)', 'normal')
    .option('--bail', 'fail on first error')
    .action(async (options) => {
        try {
            const startTime = Date.now()

            if (options.progress) {
                console.log(chalk.blue('🚀 Building for production...'))
            }

            // 解析配置
            const configResolver = new ConfigResolver()
            const config = await configResolver.resolve(options.config)

            // 应用命令行选项
            if (options.mode) {
                config.mode = options.mode as 'development' | 'production'
            }

            // 创建编译器
            const compiler = createCompiler(config)

            if (options.watch) {
                // 监听模式
                console.log(chalk.yellow('👀 Watching for file changes...'))
                compiler.watch((error, stats) => {
                    if (error) {
                        console.error(chalk.red('❌ Watch build failed:'), error)
                        return
                    }
                    if (stats) {
                        printBuildResults(stats, options, startTime)
                    }
                })
            } else {
                // 单次构建
                const stats = await compiler.run()
                printBuildResults(stats, options, startTime)

                if (stats.hasErrors() && options.bail) {
                    process.exit(1)
                }
            }

        } catch (error: any) {
            console.error(chalk.red('❌ Build Failed: ', error.message || error))
            if (process.env.DEBUG) {
                console.error(chalk.gray(error.stack))
            }
            process.exit(1)
        }
    })

function printBuildResults(stats: any, options: any, startTime: number) {
    const buildTime = Date.now() - startTime

    // 根据stats级别显示不同详细程度的信息
    if (stats.hasErrors()) {
        console.error(chalk.red('❌ 构建失败: ' + stats.getErrors()[0]?.message))

        if (options.stats !== 'errors-only') {
            stats.getErrors().forEach((error: Error, index: number) => {
                console.error(chalk.red(`  Error ${index + 1}: ${error.message}`))
            })
        }

        if (!options.watch) {
            process.exit(1)
        }
        return
    }

    // 构建成功
    console.log(chalk.green('✅ Build completed successfully!'))

    if (options.stats === 'minimal') {
        console.log(chalk.gray(`  Time: ${buildTime}ms`))
    } else if (options.stats === 'normal' || options.stats === 'detailed') {
        console.log(chalk.gray(`  Time: ${buildTime}ms`))
        console.log(chalk.gray(`  Modules: ${stats.getModulesCount()}`))
        console.log(chalk.gray(`  Assets: ${stats.getAssetsCount()}`))

        if (options.stats === 'detailed') {
            // 显示资源详情
            const assets = stats.compilation?.assets || new Map()
            if (assets.size > 0) {
                console.log(chalk.blue('\n📦 Assets:'))
                for (const [filename, content] of assets) {
                    const size = (content.length / 1024).toFixed(2)
                    console.log(chalk.gray(`  ${filename}: ${size} KB`))
                }
            }

            // 显示模块统计
            const modules = stats.compilation?.modules || new Map()
            if (modules.size > 0) {
                console.log(chalk.blue('\n🔧 Modules:'))
                let count = 0
                for (const [path, module] of modules) {
                    if (count < 10) { // 只显示前10个模块
                        const size = (module.source.length / 1024).toFixed(2)
                        const shortPath = path.split(/[/\\]/).slice(-2).join('/')
                        console.log(chalk.gray(`  ${shortPath}: ${size} KB`))
                        count++
                    }
                }
                if (modules.size > 10) {
                    console.log(chalk.gray(`  ... and ${modules.size - 10} more modules`))
                }
            }
        }
    }

    if (options.analyze) {
        console.log(chalk.blue('\n📊 Bundle Analysis:'))
        // TODO: 实现bundle分析功能
        console.log(chalk.gray('  Bundle analysis feature coming soon...'))
    }
}

program
    .command('dev')
    .description('Start development server')
    .option('-c, --config <path>', 'config file path')
    .option('-p, --port <port>', 'dev server port', '3000')
    .option('--host <host>', 'dev server host', 'localhost')
    .option('--hot', 'enable hot module replacement', true)
    .option('--open', 'open browser automatically')
    .action(async (options) => {
        try {
            console.log(chalk.blue('🚀 Starting development server...'))

            const configResolver = new ConfigResolver()
            const config = await configResolver.resolve(options.config)

            // 开发模式配置
            config.mode = 'development'
            if (!config.devServer) config.devServer = {}
            config.devServer.port = parseInt(options.port)
            config.devServer.hot = options.hot
            config.devServer.open = options.open

            const compiler = createCompiler(config)
            const { DevServer } = await import('./dev-server/DevServer.js')

            const server = new DevServer(compiler, {
                port: parseInt(options.port),
                hot: options.hot,
                open: options.open
            })

            await server.start()

            console.log(chalk.green(`✅ Dev server started at http://${options.host}:${options.port}`))

        } catch (error: any) {
            console.error(chalk.red("❌ Failed to start dev server: "), error.message)
            if (process.env.DEBUG) {
                console.error(chalk.gray(error.stack))
            }
            process.exit(1)
        }
    })

program
    .command('init')
    .description('Initialize a new project')
    .option('-t, --template <template>', 'project template', 'basic')
    .action(async (options) => {
        console.log(chalk.blue('🎉 Initializing new project...'))

        // TODO: 实现项目初始化功能
        console.log(chalk.yellow('⚠️  Init command coming soon...'))
        console.log(chalk.gray('  You can manually create a splitting-webpack.config.js file for now.'))
    })

program
    .command('analyze')
    .description('Analyze bundle size and composition')
    .option('-c, --config <path>', 'config file path')
    .action(async (options) => {
        console.log(chalk.blue('📊 Analyzing bundle...'))

        // TODO: 实现bundle分析功能
        console.log(chalk.yellow('⚠️  Analyze command coming soon...'))
    })

// 全局选项
program
    .option('--verbose', 'verbose output')
    .option('--silent', 'suppress output')

// 错误处理
program.on('command:*', () => {
    console.error(chalk.red(`Unknown command: ${program.args.join(' ')}`))
    console.log('See --help for available commands.')
    process.exit(1)
})

program.parse()