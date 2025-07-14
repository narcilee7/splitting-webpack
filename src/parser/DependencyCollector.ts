import type { Dependency } from "../types/module.js"

export class DependencyCollector {
    collect(ast: any): Dependency[] {
        const dependencies: Dependency[] = []

        if (!ast) return dependencies

        try {
            import('acorn-walk').then(({ simple }) => {
                simple(ast, {
                    CallExpression: (node: any) => {
                        // require()
                        if (node.callee.name === 'require' && node.arguments.length === 1) {
                            const arg = node.arguments[0]
                            if (arg.type === 'Literal' && typeof arg.value === 'string') {
                                dependencies.push({
                                    type: 'require',
                                    request: arg.value,
                                    loc: node.loc
                                })
                            }
                        }

                        // import
                        if (node.callee.name === 'Import' && node.arguments.length === 1) {
                            const arg = node.arguments[0]
                            if (arg.type === 'Literal' && typeof arg.value === 'string') {
                                dependencies.push({
                                    type: 'dynamic-import',
                                    request: arg.value,
                                    loc: node.loc
                                })
                            }
                        }
                    },
                    ImportDeclaration: (node: any) => {
                        // import 声明
                        if (node.source && node.source.type === 'Literal') {
                            dependencies.push({
                                type: 'import',
                                request: node.source.value,
                                loc: node.loc
                            })
                        }
                    }
                })
            }).catch(() => {
                // 如果没有 acorn-walk，使用简化版本
                console.warn('DependencyCollector: acorn-walk not found');
            })
        } catch (error) {
            // 如果没有 acorn-walk，使用简化版本
            console.warn('DependencyCollector: acorn-walk not found');
        }

        return dependencies
    }
}