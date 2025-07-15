import { promises as fs } from "fs"
import { dirname } from "path"
import { stat } from "fs/promises"

const ensureDire = async (path: string): Promise<void> => {
    try {
        await fs.mkdir(dirname(path), { recursive: true })
    } catch (error: any) {
        if (error.code !== 'EEXIST') {
            throw error;
        }
    }
}

const readFile = (path: string): Promise<string> => {
    return fs.readFile(path, 'utf-8')
}

const writeFile = async (path: string, content: string): Promise<void> => {
    await ensureDire(path)
    await fs.writeFile(path, content, 'utf-8')
}

const exists = async (path: string): Promise<boolean> => {
    try {
        await fs.access(path)
        return true
    } catch (error) {
        return false
    }
}

const isDirectory = async (path: string): Promise<boolean> => {
    try {
        const s = await stat(path)
        return s.isDirectory()
    } catch (error) {
        return false
    }
}


export {
    ensureDire,
    readFile,
    writeFile,
    exists,
    isDirectory
}