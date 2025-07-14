import { Compiler } from "./compiler/Compiler.js"
import type { Configuration } from "./types/config.js"

export function createCompiler(config: Configuration): Compiler {
    return new Compiler(config)
}

export * from './types/config.js'
export * from './compiler/Compiler.js'
export * from './compiler/Compilation.js'
export * from './config/ConfigResolver.js'