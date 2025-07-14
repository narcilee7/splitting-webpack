// 内置插件导出
export { BannerPlugin } from './BannerPlugin.js'
export { DefinePlugin } from './DefinePlugin.js'
export { ProgressPlugin } from './ProgressPlugin.js'
export { CleanWebpackPlugin } from './CleanWebpackPlugin.js'

// 插件工具类型
export type { BannerPluginOptions } from './BannerPlugin.js'
export type { DefinePluginOptions } from './DefinePlugin.js'
export type { ProgressPluginOptions } from './ProgressPlugin.js'
export type { CleanWebpackPluginOptions } from './CleanWebpackPlugin.js'

// 导入插件类
import { BannerPlugin } from './BannerPlugin.js'
import { DefinePlugin } from './DefinePlugin.js'
import { ProgressPlugin } from './ProgressPlugin.js'
import { CleanWebpackPlugin } from './CleanWebpackPlugin.js'

// 内置插件配置
export const BuiltinPlugins = {
    BannerPlugin,
    DefinePlugin,
    ProgressPlugin,
    CleanWebpackPlugin
}