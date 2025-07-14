import type { Configuration } from "../types/config.js"

export const defaultConfig: Configuration = {
    entry: './src/index.js',
    output: {
        path: './dist',
        filename: 'bundle.js',
        publicPath: '/',
        clean: true
    },
    mode: 'development',
    resolve: {
        extensions: ['.js', '.ts', '.json'],
        alias: {},
        modules: ['node_modules'],
        mainFields: ['main', 'module'],
        mainFiles: ['index']
    },
    module: {
        rules: []
    },
    plugins: [],
    cache: {
        type: 'memory'
    },
    devtool: 'source-map',
    target: 'web',
    externals: {}
}