import { resolve, dirname, extname, join, isAbsolute } from 'path'
import { readFile, exists } from '../utils/fs.js'
import { Configuration } from '../types/config.js'

export class Resolver {
    private config: Configuration['resolve']

    constructor(config: Configuration['resolve'] = {}) {
        this.config = {
            extensions: ['.js', '.ts', '.json'],
            alias: {},
            modules: ['node_modules'],
            mainFields: ['main', 'module'],
            mainFiles: ['index'],
            ...config
        }
    }

    async resolve(request: string, issuer?: string): Promise<string> {
        try {
            console.log(`🔍 解析模块: ${request}, issuer: ${issuer || '无'}`)

            // 处理别名
            const aliasedRequest = this.resolveAlias(request)

            // 处理绝对路径
            if (isAbsolute(aliasedRequest)) {
                console.log(`📁 绝对路径解析: ${aliasedRequest}`)
                return this.resolveFile(aliasedRequest)
            }

            // 处理相对路径
            if (aliasedRequest.startsWith('./') || aliasedRequest.startsWith('../')) {
                if (!issuer) {
                    throw new Error(`Cannot resolve relative path ${request} without issuer`)
                }
                const basedir = dirname(issuer)
                const resolved = resolve(basedir, aliasedRequest)
                console.log(`📂 相对路径解析: ${aliasedRequest} -> ${resolved}`)
                return this.resolveFile(resolved)
            }

            // 处理模块路径
            console.log(`📦 模块路径解析: ${aliasedRequest}`)
            return this.resolveModule(aliasedRequest, issuer)
        } catch (error: any) {
            console.error(`❌ 解析失败: ${request} - ${error.message}`)
            throw new Error(`Cannot resolve module ${request}: ${error.message}`)
        }
    }

    private resolveAlias(request: string): string {
        for (const [alias, target] of Object.entries(this.config?.alias || {})) {
            if (request.startsWith(alias)) {
                return request.replace(alias, target)
            }
        }
        return request
    }

    private async resolveFile(path: string): Promise<string> {
        console.log(`🔎 检查文件: ${path}`)

        // 如果文件已经存在
        if (await exists(path)) {
            console.log(`✅ 文件存在: ${path}`)
            return path
        }

        // 尝试添加扩展名
        for (const ext of this.config?.extensions || []) {
            const withExt = path + ext
            console.log(`🔎 尝试扩展名: ${withExt}`)
            if (await exists(withExt)) {
                console.log(`✅ 文件存在 (带扩展名): ${withExt}`)
                return withExt
            }
        }

        // 如果没有扩展名，可能是目录，尝试解析为包
        if (!extname(path)) {
            console.log(`📁 尝试作为目录解析: ${path}`)
            try {
                return await this.resolvePackage(path)
            } catch (error) {
                // 忽略包解析错误，继续抛出文件不存在错误
            }
        }

        throw new Error(`File not found: ${path}`)
    }

    private async resolvePackage(dir: string): Promise<string> {
        console.log(`📦 解析包: ${dir}`)

        // 查找package.json
        const packagePath = join(dir, 'package.json')
        if (await exists(packagePath)) {
            console.log(`📄 找到 package.json: ${packagePath}`)
            const packageJson = JSON.parse(await readFile(packagePath))

            // 尝试mainFields
            for (const field of this.config?.mainFields || []) {
                if (packageJson[field]) {
                    const mainFile = resolve(dir, packageJson[field])
                    console.log(`🔎 尝试主字段 ${field}: ${mainFile}`)
                    if (await exists(mainFile)) {
                        console.log(`✅ 找到主文件: ${mainFile}`)
                        return mainFile
                    }
                }
            }
        }

        // 尝试mainFiles
        for (const mainFile of this.config?.mainFiles || []) {
            for (const ext of this.config?.extensions || []) {
                const filePath = join(dir, mainFile + ext)
                console.log(`🔎 尝试主文件: ${filePath}`)
                if (await exists(filePath)) {
                    console.log(`✅ 找到主文件: ${filePath}`)
                    return filePath
                }
            }
        }

        throw new Error(`Cannot resolve package at ${dir}`)
    }

    private async resolveModule(request: string, issuer?: string): Promise<string> {
        const moduleDirs = this.getModuleDirs(issuer)
        console.log(`📦 解析模块 ${request}, 搜索目录:`, moduleDirs)

        for (const moduleDir of moduleDirs) {
            const packageDir = join(moduleDir, request)
            console.log(`🔎 尝试模块目录: ${packageDir}`)

            try {
                return await this.resolvePackage(packageDir)
            } catch (error) {
                // 尝试下一个
                continue
            }
        }

        throw new Error(`Cannot resolve module ${request}`)
    }

    private getModuleDirs(issuer?: string): string[] {
        const dirs: string[] = []

        if (issuer) {
            // 从issuer所在的目录开始向上查找node_modules
            let currentDir = dirname(issuer)
            while (currentDir !== dirname(currentDir)) {
                dirs.push(join(currentDir, 'node_modules'))
                currentDir = dirname(currentDir)
            }
        }

        // 添加全局模块目录
        for (const moduleDir of this.config?.modules || []) {
            dirs.push(resolve(moduleDir))
        }

        return dirs
    }
}