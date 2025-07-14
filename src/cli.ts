import { Command } from 'commander'
import chalk from 'chalk'
import { ConfigResolver } from './config/ConfigResolver.js'
import { createCompiler } from './index.js'

// 当前进程做一些事情
const program = new Command()

program
    .name('splitting-webpack')
    .description('Build for production')
    .version('0.0.1')

program
    .command('build')
    .description('Build for production')
    .option('-c, --config <path>', 'config file path')
    .option('--mode <mode>', 'build mode', 'production')
    .action(async options => {
        try {
            console.log(chalk.blue('🚀 Building for production...'))

            // 解析配置
            const configResolver = new ConfigResolver()
            const config = await configResolver.resolve(options.config)

            // 创建编译器并运行构建
            const compiler = createCompiler(config)
            const stats = await compiler.run()

            // 输出构建结果
            if (stats.hasErrors()) {
                console.error(chalk.red('❌ Build completed with errors:'))
                stats.getErrors().forEach(error => {
                    console.error(chalk.red(`  ${error.message}`))
                })
                process.exit(1)
            } else {
                console.log(chalk.green('✅ Build completed successfully!'))
                console.log(chalk.gray(`  Time: ${stats.getTime()}ms`))
                console.log(chalk.gray(`  Modules: ${stats.getModulesCount()}`))
                console.log(chalk.gray(`  Assets: ${stats.getAssetsCount()}`))
            }

        } catch (error: any) {
            console.error(chalk.red('❌ Build Failed: ', error.message || error))
            if (process.env.DEBUG) {
                console.error(error.stack)
            }
            process.exit(1)
        }
    })


program
    .command('dev')
    .description('Start development server')
    .option('-c --config <path>', 'config file path')
    .option('-p --port <port>', 'dev server port', '3000')
    .action(async options => {
        try {
            console.log(chalk.blue('🚀 Starting development server....'))

            const configResolver = new ConfigResolver()
            const config = await configResolver.resolve(options.config)

            const compiler = createCompiler(config)

            const { DevServer } = await import('./dev-server/DevServer')

            const server = new DevServer(compiler, {
                port: parseInt(options.port),
                hot: true // 默认热更新
            })

            await server.start()
        } catch (error) {
            console.error(chalk.red("❌ Failed to start dev server: "), error)
            process.exit(1)
        }
    })

program.parse()