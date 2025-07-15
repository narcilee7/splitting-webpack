import { LoaderRunner } from "../loader/LoaderRunner.js";
import { Resolver } from "../resolver/Resolver.js";
import { Chunk } from "../types/chunk.js";
import { Module } from "../types/module.js";
import { Compiler } from "./Compiler.js";
import { CodeGenerator } from "../chunk/CodeGenerator.js";
import { ChunkGraph } from "../chunk/ChunkGraph.js";
import { Parser } from "../parser/Parser.js";
import { join } from "path";
import { promises } from 'fs'
import { writeFile } from "../utils/fs.js";

export class Compilation {
  public compiler: Compiler; // 主编译器
  public modules: Map<string, Module> = new Map(); // 模块
  public moduleBuildPromises = new Map<string, Promise<Module>>() // 并发构建Promises
  public chunks: Chunk[] = []; // chunks
  public errors: Error[] = []; // 错误
  public warnings: string[] = []; // 警告
  public assets: Map<string, string> = new Map(); // 依赖

  private resolver: Resolver; // 解析器
  private loaderRunner: LoaderRunner; // 
  private parser: Parser; // 解析器
  private chunkGraph: ChunkGraph; // chunk图
  private codeGenerator: CodeGenerator; // 代码生成器

  constructor(compiler: Compiler) {
    this.compiler = compiler;
    // TODO 支持从Compiler注入 单例
    this.resolver =   new Resolver(compiler.config.resolve);
    this.loaderRunner = new LoaderRunner(compiler.config.module?.rules || []);
    this.parser = new Parser();
    this.chunkGraph = new ChunkGraph();
    this.codeGenerator = new CodeGenerator();
  }

  private log(message: string, ...args: any[]) {
    // if (!this.compiler.config.sl)
  }

  async build(): Promise<void> {
    console.log(`📦 开始构建模块...`)

    try {
      const entries = this.getEntries()

      if (entries.length === 0) {
        throw new Error('❌ 没有配置有效的入口')
      }

      // 构建所有入口模块
      for (const entry of entries) {
        console.log(`📥 构建入口: ${entry}`)
        // 为入口文件提供基准目录 - 使用配置文件所在目录或当前工作目录
        const entryContext = this.compiler.config.context || process.cwd()
        try {
          await this.buildModuleWithContext(entry, entryContext)
        } catch (error: any) {
          console.log(`❌ 【Error】构建入口失败：${entry}`, error)
          this.errors.push(new Error(`构建入口失败: ${entry} - ${error.message}`));
        }
      }

      if (this.errors.length > 0) {
        throw new Error(`构建阶段出错，共 ${this.errors.length} 个错误`);
      }

      console.log(`📊 构建完成! 共 ${this.modules.size} 个模块`)

    } catch (error) {
      console.error('构建失败:', error)
      throw error
    }
  }

  async buildModuleWithContext(request: string, context: string): Promise<Module> {
    try {
      // 1. 解析模块路径，使用 context 作为基准
      const resolved = await this.resolver.resolve(request, context);

      // 检查模块是否已经构建
      if (this.modules.has(resolved)) {
        return this.modules.get(resolved)!;
      }

      // 2. 创建模块对象
      const module: Module = {
        id: resolved,
        request: resolved,
        userRequest: request,
        rawRequest: request,
        resource: resolved,
        dependencies: [],
        source: '',
        built: false,
        error: undefined,
        warnings: [],
      };

      this.modules.set(resolved, module);

      // 3. 通过Loader处理文件内容
      const loaderResult = await this.loaderRunner.run(resolved);
      const source = loaderResult.source || '';

      module.source = source;

      // 4. 解析源码，收集依赖
      const parseResult = await this.parser.parse(source, resolved);
      module.dependencies = parseResult.dependencies;

      // 5. 递归构建依赖模块
      for (const dep of parseResult.dependencies) {
        const depModule = await this.buildModule(dep.request, module);
        // 将构建完成的模块对象回填到依赖中
        dep.module = depModule;
      }

      module.built = true;
      console.log(`✅ 模块构建完成: ${resolved}`)
      return module;

    } catch (error) {
      console.error(`模块构建失败: ${request}`, error)
      throw error
    }
  }

  async buildModule(request: string, issuer?: Module): Promise<Module> {
    try {
      const context = issuer?.resource
      // 1. 解析模块路径
      const resolved = await this.resolver.resolve(request, context);

      // 并发安全：Promise缓存
      if (this.moduleBuildPromises.has(resolved)) {
        return this.moduleBuildPromises.get(resolved)
      }
      // 检查模块是否已经构建
      if (this.modules.has(resolved)) {
        return this.modules.get(resolved)!;
      }

      // 2. 创建模块对象
      const module: Module = {
        id: resolved,
        request: resolved,
        userRequest: request,
        rawRequest: request,
        resource: resolved,
        dependencies: [],
        source: '',
        built: false,
        error: undefined,
        warnings: [],
      };

      this.modules.set(resolved, module);

      // 3. 运行 Loader 处理文件
      const result = await this.loaderRunner.run(resolved);
      module.source = result.source!;

      // 4. 解析 AST 并收集依赖
      const parseResult = await this.parser.parse(result.source!, resolved);
      module.ast = parseResult.ast;
      module.dependencies = parseResult.dependencies;

      // 5. 递归构建依赖模块
      for (const dep of parseResult.dependencies) {
        const depModule = await this.buildModule(dep.request, module);
        // 将构建完成的模块对象回填到依赖中
        dep.module = depModule;
      }

      module.built = true;
      return module;

    } catch (error: any) {
      this.errors.push(error);
      throw error;
    }
  }

  async seal(): Promise<void> {
    console.log('🔒 开始封装阶段...')

    // 1. 收集所有已构建的入口模块
    const entries = this.getEntries()
    console.log(`📥 处理 ${entries.length} 个入口`)

    const entryModules: Module[] = []
    for (const entry of entries) {
      // 解析入口路径为绝对路径，以匹配 modules Map 中的键
      const entryContext = this.compiler.config.context || process.cwd()
      let resolvedEntry: string

      try {
        resolvedEntry = await this.resolver.resolve(entry, entryContext)
        console.log(`🔍 解析入口 ${entry} -> ${resolvedEntry}`)
      } catch (error) {
        console.error(`❌ 无法解析入口: ${entry}`, error)
        this.errors.push(new Error(`无法解析入口模块: ${entry}`))
        continue
      }

      const module = this.modules.get(resolvedEntry)
      if (module) {
        entryModules.push(module)
        console.log(`✅ 找到入口模块: ${resolvedEntry}`)
      } else {
        console.error(`❌ 入口模块未在已构建模块中找到: ${resolvedEntry}`)
        console.log(`📋 已构建的模块:`, Array.from(this.modules.keys()))
        const error = new Error(`入口模块未找到: ${entry} (${resolvedEntry})`)
        this.errors.push(error)
      }
    }

    if (entryModules.length === 0) {
      throw new Error('没有找到有效的入口模块')
    }

    // 2. 生成chunk图
    console.log('🎯 生成chunk图...')
    this.chunks = this.chunkGraph.createChunks(entryModules)
    console.log(`📦 生成了 ${this.chunks.length} 个chunk`)

    // 3. 为每个chunk生成代码
    console.log('🔧 生成chunk代码...')
    for (const chunk of this.chunks) {
      try {
        const code = this.codeGenerator.generate(chunk)
        const filename = this.getChunkFilename(chunk)
        this.assets.set(filename, code)
        console.log(`✅ 生成asset: ${filename} (${(code.length / 1024).toFixed(2)} KB)`)
      } catch (error) {
        console.error(`❌ 生成chunk失败: ${chunk.name}`, error)
        this.errors.push(error as Error)
      }
    }

    console.log(`🎉 封装完成! 生成了 ${this.assets.size} 个文件`)
  }

  async emit(): Promise<void> {
    console.log('📄 开始输出文件...')

    const outputPath = this.compiler.config.output.path
    console.log(`📁 输出目录: ${outputPath}`)

    // 确保输出目录存在
    try {
      await promises.mkdir(outputPath, { recursive: true })
    } catch (error: any) {
      if (error.code !== 'EEXIST') {
        console.error('❌ 创建输出目录失败:', error)
        this.errors.push(error)
        return
      }
    }

    // 写入所有asset文件
    const writePromises = []
    for (const [filename, content] of this.assets) {
      const fullPath = join(outputPath, filename)
      console.log(`💾 写入文件: ${filename}`)

      writePromises.push(
        writeFile(fullPath, content).catch(error => {
          console.error(`❌ 写入文件失败: ${filename}`, error)
          this.errors.push(error)
        })
      )
    }

    // 等待所有文件写入完成
    await Promise.all(writePromises)

    if (this.errors.length === 0) {
      console.log(`✅ 文件输出完成! 共 ${this.assets.size} 个文件`)
    } else {
      console.error(`⚠️ 输出完成，但有 ${this.errors.length} 个错误`)
    }
  }

  private getEntries(): string[] {
    // 从配置中获取入口 以数组形式输出
    const { entry } = this.compiler.config;

    if (typeof entry === 'string') {
      return [entry];
    } else if (Array.isArray(entry)) {
      return entry;
    } else {
      return Object.values(entry);
    }
  }

  private getChunkFilename(chunk: Chunk): string {
    const { filename } = this.compiler.config.output;
    return filename.replace('[name]', chunk.name).replace('[hash]', chunk.hash);
  }
}