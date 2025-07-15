import { resolve, dirname, extname, join, isAbsolute } from 'path'
import { readFile, exists, isDirectory } from '../utils/fs.js'
import { Configuration } from '../types/config.js'

/**
 * 模块解析器
 * 
 * 支持: "相对路径、绝对路径、扩展名推断"
 */
export class Resolver {
    private config: Configuration['resolve']

    private triedPaths: string[] = []

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
        // 先清空调用paths
        this.triedPaths = []
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
                    const errMsg = `Cannot resolve relative path ${request} without issuer\n`
                    + `Tried paths:\n`
                    + this.triedPaths.map(p => `  - ${p}`).join('\n')
                    throw new Error(errMsg)
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
    /**
     * 处理别名
     * @param request 
     * @returns 
     */
    private resolveAlias(request: string): string {
        for (const [alias, target] of Object.entries(this.config?.alias || {})) {
            // 完全别名
            if (request === alias) {
                return target
            }
            // 别名+路径
            if (request.startsWith(alias + '/')) {
                return target + request.slice(alias.length)
            }
        }
        return request
    }

    private async resolveFile(path: string): Promise<string> {
        /**
         * 1. 如果是已存在的文件，直接返回
         * 2. 如果是已存在的目录，尝试当作package
         * 3. 如果是没有扩展名的路径，才走拼接扩展名
         */
        console.log(`🔎 检查文件: ${path}`)

        // 如果文件已经存在
        this.triedPaths.push(path)
        if (await exists(path)) {
            if (await isDirectory(path)) {
                console.log(`目录路径，尝试作为包解析: ${path}`)
                return await this.resolvePackage(path)
            }
            console.log(`✅ 文件存在: ${path}`)
            return path
        }

        for (const ext of this.config?.extensions || []) {
            // 如果是不存在的路径 -> 只可能是缺少扩展名
            const withExt = path + ext
            console.log(`🔎 尝试扩展名: ${withExt}`)
            this.triedPaths.push(withExt)
            if (await exists(withExt)) {
                console.log(`✅ 文件存在 (带扩展名): ${withExt}`)
                return withExt
            }
        }

        throw new Error(`File not found: ${path}`)
    }

    private async resolvePackage(dir: string): Promise<string> {
        console.log(`📦 解析包: ${dir}`)

        // 查找package.json
        const packagePath = join(dir, 'package.json')
        this.triedPaths.push(packagePath)
        if (await exists(packagePath)) {
            console.log(`📄 找到 package.json: ${packagePath}`)
            const packageJson = JSON.parse(await readFile(packagePath))

            // 尝试mainFields
            for (const field of this.config?.mainFields || []) {
                if (packageJson[field]) {
                    const mainFile = resolve(dir, packageJson[field])
                    console.log(`🔎 尝试主字段 ${field}: ${mainFile}`)
                    this.triedPaths.push(mainFile)
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
                this.triedPaths.push(filePath)
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
            const [packageName, ...subPathParts] = request.split('/')
            const subPath = subPathParts.join('/')

            const packageDir = join(moduleDir, packageName)
            console.log(`尝试模块包目录，${packageDir}`)

            try {
                let entryFile = await this.resolvePackage(packageDir)

                if (subPath) {
                    // 拼接子路径
                    const fullSubPath = resolve(dirname(entryFile), subPath)
                    return await this.resolveFile(fullSubPath)
                }

                return entryFile
            } catch (error) {
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