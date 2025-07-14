import { Module } from "./module.js";

export interface Chunk {
    id: string;
    name: string;
    modules: Module[];
    entryModule: Module;
    files: string[];
    size: number;
    hash: string;
}

export interface ChunkGraph {
    chunks: Chunk[];
    moduleToChunk: Map<Module, Chunk>;
    chunkToModules: Map<Chunk, Set<Module>>;
}