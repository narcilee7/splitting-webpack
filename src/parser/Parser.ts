import type { Module, Dependency } from "../types/module.js"
import { DependencyCollector } from "./DependencyCollector.js"

export interface ParseResult {
  ast: any
  dependencies: Dependency[]
}

export class Parser {
  private dependencyCollector: DependencyCollector

  constructor() {
    // TODO 这里应该用单例模式，保证唯一实例
    this.dependencyCollector = new DependencyCollector()
  }

  async parse(source: string, resourcePath: string): Promise<ParseResult> {
    try {
      console.log(`🔍 解析文件: ${resourcePath}`);

      // 动态导入
      const acorn = await import('acorn')

      const ast = acorn.parse(source, {
        ecmaVersion: 2022,
        sourceType: 'module',
        locations: true
      })

      // 传递源码给依赖收集器
      const dependencies = this.dependencyCollector.collect(ast, source)

      console.log(`✅ 解析完成: ${resourcePath}, 依赖数量: ${dependencies.length}`);

      return {
        ast,
        dependencies
      }
    } catch (error: any) {
      // 如果没有安装 acorn，返回简化的结果
      if (error.code === 'MODULE_NOT_FOUND') {
        console.warn('Parser: acorn not found, using simplified dependency collection');
        const dependencies = this.collectDependenciesSimple(source);
        return { ast: null, dependencies };
      }
      console.error(`解析失败 ${resourcePath}:`, error.message);
      throw new Error(`Failed to parse ${resourcePath}: ${error.message}`);
    }
  }

  private collectDependenciesSimple(source: string): Dependency[] {
    const dependencies: Dependency[] = [];

    // 简单的正则匹配（仅用于演示）
    const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    const dynamicImportRegex = /import\(['"]([^'"]+)['"]\)/g;

    let match;

    while ((match = requireRegex.exec(source)) !== null) {
      dependencies.push({
        type: 'require',
        request: match[1],
      });
    }

    while ((match = importRegex.exec(source)) !== null) {
      dependencies.push({
        type: 'import',
        request: match[1],
      });
    }

    while ((match = dynamicImportRegex.exec(source)) !== null) {
      dependencies.push({
        type: 'dynamic-import',
        request: match[1],
      });
    }

    return dependencies;
  }
}