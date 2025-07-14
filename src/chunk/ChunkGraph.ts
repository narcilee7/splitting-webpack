import type { Module } from "../types/module.js"
import type { Chunk, ChunkGraph as ChunkGraphType } from "../types/chunk.js"
import { createFileHash } from "../utils/hash.js"


export class ChunkGraph {
    private chunks: Chunk[] = []
    private moduleToChunk = new Map<Module, Chunk>()
    private chunkToModules = new Map<Chunk, Set<Module>>()

    createChunks(entryModules: Module[]): Chunk[] {
        this.chunks = []
        this.moduleToChunk.clear()
        this.chunkToModules.clear()

        // 为每个入口创建一个主chunk
        entryModules.forEach((entryModule, index) => {
            const chunk = this.createChunk(`main${index || 0}`, entryModule)
            this.addModuleToChunk(entryModule, chunk)
            this.collectModulesForChunk(entryModule, chunk, new Set())
        })

        // 处理动态导入，创建单独的chunk
        this.handleDynamicImports()

        return this.chunks
    }

    private createChunk(name: string, entryModule: Module) {
        const chunk: Chunk = {
            id: `chunk_${this.chunks.length}`,
            name,
            modules: [],
            entryModule: entryModule,
            files: [],
            size: 0,
            hash: '',
        }

        this.chunks.push(chunk)
        this.chunkToModules.set(chunk, new Set())

        return chunk
    }

    private collectModulesForChunk(module: Module, chunk: Chunk, visited: Set<Module>): void {
        console.log(`🔍 收集模块到chunk: ${module.resource} -> ${chunk.name}`)

        if (visited.has(module)) {
            console.log(`⏭️  模块已访问，跳过: ${module.resource}`)
            return
        }

        // 标记当前模块为已访问
        visited.add(module)
        console.log(`✅ 标记模块为已访问: ${module.resource}`)

        // 只收集静态依赖
        console.log(`📦 检查模块依赖 (${module.dependencies.length}个): ${module.resource}`)
        for (const dep of module.dependencies) {
            console.log(`🔗 处理依赖: ${dep.request} (type: ${dep.type})`)

            if (dep.type === 'dynamic-import') {
                // 动态导入通过handlerDynamicImports创建新的chunk，这里不处理
                console.log(`⏭️  跳过动态导入: ${dep.request}`)
                continue
            }

            if (dep.module) {
                console.log(`✅ 依赖模块存在: ${dep.module.resource}`)
                if (!this.moduleToChunk.has(dep.module)) {
                    console.log(`📥 添加依赖模块到chunk: ${dep.module.resource}`)
                    this.addModuleToChunk(dep.module, chunk)
                    this.collectModulesForChunk(dep.module, chunk, visited)
                } else {
                    console.log(`⏭️  依赖模块已在其他chunk中: ${dep.module.resource}`)
                }
            } else {
                console.log(`❌ 依赖模块不存在: ${dep.request}`)
            }
        }
    }

    private addModuleToChunk(module: Module, chunk: Chunk): void {
        if (this.moduleToChunk.has(module)) {
            // 模块已经属于了某个chunk
            return
        }

        this.moduleToChunk.set(module, chunk)
        this.chunkToModules.get(chunk)!.add(module)
        chunk.modules.push(module)
        chunk.size += module.source.length
    }

    private handleDynamicImports(): void {
        const processedModules = new Set<Module>()

        for (const chunk of [...this.chunks]) {
            for (const module of chunk.modules) {
                if (processedModules.has(module)) {
                    // 已经处理过
                    continue
                }

                processedModules.add(module)

                for (const dep of module.dependencies) {
                    // 处理依赖
                    if (dep.type === 'dynamic-import' && dep.module) {
                        // 为动态导入创建独立的chunk
                        const dynamicChunk = this.createChunk(`dynamic_${dep.request}`, dep.module)
                        this.addModuleToChunk(dep.module, dynamicChunk)
                        this.collectModulesForChunk(dep.module, dynamicChunk, new Set())
                    }
                }
            }
        }

        // 生成chunk哈希
        for (const chunk of this.chunks) {
            chunk.hash = this.generateChunkHash(chunk)
        }
    }

    private generateChunkHash(chunk: Chunk): string {
        const content = chunk.modules
            .map(module => module.source)
            .join('')
        return createFileHash(content)
    }
}