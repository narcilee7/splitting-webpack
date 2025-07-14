import type { Dependency } from "../types/module.js"

export class DependencyCollector {
    collect(ast: any, source?: string): Dependency[] {
        const dependencies: Dependency[] = []

        // 如果有源码，使用正则表达式解析（更可靠）
        if (source) {
            return this.collectDependenciesFromSource(source);
        }

        // TODO: 如果需要更精确的AST解析，可以在这里实现
        console.warn('DependencyCollector: 缺少源码，跳过依赖收集');
        return dependencies
    }

    private collectDependenciesFromSource(source: string): Dependency[] {
        const dependencies: Dependency[] = [];

        // ES6 import 语句的各种形式
        // import xxx from 'module'
        // import { xxx } from 'module' 
        // import * as xxx from 'module'
        // import 'module'
        const importRegex = /import\s+(?:[^'"]*\s+from\s+)?['"]([^'"]+)['"]/g;
        let match;

        while ((match = importRegex.exec(source)) !== null) {
            const request = match[1];
            dependencies.push({
                type: 'import',
                request: request,
            });
        }

        // CommonJS require: require('module')
        const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
        while ((match = requireRegex.exec(source)) !== null) {
            const request = match[1];
            dependencies.push({
                type: 'require',
                request: request,
            });
        }

        // 动态 import: import('module')
        const dynamicImportRegex = /import\(['"]([^'"]+)['"]\)/g;
        while ((match = dynamicImportRegex.exec(source)) !== null) {
            const request = match[1];
            dependencies.push({
                type: 'dynamic-import',
                request: request,
            });
        }

        return dependencies;
    }
}