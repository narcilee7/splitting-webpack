import { createHash } from "crypto"
import { Module } from "../types/module.js"

export function createFileHash(content: string): string {
    return createHash('md5').update(content).digest('hex').slice(0, 8)
}

export function createModuleHash(module: Module): string {
    const content = JSON.stringify({
        request: module.request,
        source: module.source,
        dependencies: module.dependencies.map(dep => dep.request)
    })
    return createFileHash(content)
}