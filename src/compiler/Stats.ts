/**
 * 构建产物统计
 */

// implements 
import type { Stats } from "../types/compiler.js"
import chalk from "chalk"
import { Compilation } from "./Compilation.js"

export class StatsImpl implements Stats {
    public compilation: Compilation
    private startTime: number

    constructor(compilation: Compilation) {
        this.compilation = compilation
        this.startTime = Date.now()
    }

    hasErrors(): boolean {
        return this.compilation.errors.length > 0
    }

    hasWarnings(): boolean {
        return this.compilation.warnings.length > 0
    }

    getErrors(): Error[] {
        return this.compilation.errors
    }

    getWarnings(): string[] {
        return this.compilation.warnings
    }

    getTime(): number {
        return Date.now() - this.startTime
    }

    getModulesCount(): number {
        return this.compilation.modules.size
    }

    getAssetsCount(): number {
        return this.compilation.assets.size
    }

    toString(options: { colors?: boolean }): string {
        const { colors = false } = options
        const lines: string[] = []

        // 构建统计信息
        // TODO 真实的计算时间
        lines.push(`Built in ${Date.now()}ms`)
        lines.push(`Modules: ${this.compilation.modules.size}`)
        lines.push(`Chunks: ${this.compilation.chunks.length}`)
        lines.push(`Assets: ${this.compilation.assets.size}`)

        // 输出文件信息
        if (this.compilation.assets.size > 0) {
            lines.push('');
            lines.push('Assets:');
            for (const [filename, content] of this.compilation.assets) {
                const size = (content.length / 1024).toFixed(2);
                const line = `  ${filename} ${size} KB`;
                lines.push(colors ? chalk.green(line) : line);
            }
        }

        // 错误信息
        if (this.hasErrors()) {
            lines.push('');
            lines.push('Errors:');
            for (const error of this.compilation.errors) {
                const line = `  ${error.message}`;
                lines.push(colors ? chalk.red(line) : line);
            }
        }

        // 警告信息
        if (this.hasWarnings()) {
            lines.push('');
            lines.push('Warnings:');
            for (const warning of this.compilation.warnings) {
                const line = `  ${warning}`;
                lines.push(colors ? chalk.yellow(line) : line);
            }
        }

        return lines.join('\n')
    }
}