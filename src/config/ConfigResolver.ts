import { cosmiconfigSync } from "cosmiconfig"
import { resolve, dirname } from "path"
import { defaultConfig } from "./default.js"
import type { Configuration } from "../types/config.js"

export class ConfigResolver {
    private explorer = cosmiconfigSync('splitting-webpack')

    async resolve(configPath?: string): Promise<Configuration> {
        try {
            let result

            if (configPath) {
                result = this.explorer.load(resolve(configPath))
            } else {
                // 自动搜索配置文件
                result = this.explorer.search()
            }

            const userConfig = result?.config || {}
            // 合并默认配置和用户配置
            const config = this.mergeConfig(defaultConfig, userConfig)

            // 解析相对路径
            if (result?.filepath) {
                const configDir = dirname(result.filepath)
                config.output.path = resolve(configDir, config.output.path)

                if (typeof config.entry === 'string') {
                    config.entry = resolve(configDir, config.entry)
                } else if (Array.isArray(config.entry)) {
                    config.entry = config.entry.map(e => resolve(configDir, e))
                } else if (typeof config.entry === 'object') {
                    const entries: Record<string, string> = {}
                    for (const [key, value] of Object.entries(config.entry)) {
                        entries[key] = resolve(configDir, value)
                    }
                    config.entry = entries
                }
            }
            return config
        } catch (error) {
            throw new Error(`Failed to resolve config: ${(error as any).message}`)
        }
    }


    private mergeConfig(base: Configuration, user: any): Configuration {
        const merged: Configuration = { ...base }

        for (const key in user) {
            if (user[key] !== undefined) {
                if (key === 'output' && typeof user[key] === 'object') {
                    merged[key] = { ...base[key], ...user[key] }
                } else if (key === 'resolve' && typeof user[key] === 'object') {
                    merged[key] = { ...base[key], ...user[key] }
                } else if (key === 'module' && typeof user[key] === 'object') {
                    merged[key] = { ...base[key], ...user[key] }
                } else {
                    (merged as any)[key] = (user as any)[key]
                }
            }
        }

        return merged;
    }
}