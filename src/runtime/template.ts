/**
 * Webpack 风格的运行时模板
 * 提供模块加载、缓存和执行环境
 */

export interface RuntimeModule {
  id: string
  exports: any
  loaded: boolean
}

/**
 * 生成webpack风格的bundle包装器
 */
export function generateBundleTemplate(modules: Record<string, string>, entryModuleId: string): string {
  // 规范化入口模块ID，确保使用正斜杠
  const normalizedEntryId = entryModuleId.replace(/\\/g, '/')

  return `
(function(modules) {
  // 模块缓存
  var installedModules = {};

  // require 函数
  function __webpack_require__(moduleId) {
    // 检查模块是否已在缓存中
    if(installedModules[moduleId]) {
      return installedModules[moduleId].exports;
    }
    
    // 创建新模块并放入缓存
    var module = installedModules[moduleId] = {
      id: moduleId,
      loaded: false,
      exports: {}
    };

    // 执行模块函数
    modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

    // 标记模块为已加载
    module.loaded = true;

    // 返回模块导出
    return module.exports;
  }

  // 暴露模块对象 (__webpack_modules__)
  __webpack_require__.m = modules;

  // 暴露模块缓存
  __webpack_require__.c = installedModules;

  // 定义 getter 函数用于和谐导出
  __webpack_require__.d = function(exports, name, getter) {
    if(!__webpack_require__.o(exports, name)) {
      Object.defineProperty(exports, name, { enumerable: true, get: getter });
    }
  };

  // 定义 __esModule 标记
  __webpack_require__.r = function(exports) {
    if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
      Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
    }
    Object.defineProperty(exports, '__esModule', { value: true });
  };

  // hasOwnProperty 简写
  __webpack_require__.o = function(object, property) { 
    return Object.prototype.hasOwnProperty.call(object, property); 
  };

  // 公共路径
  __webpack_require__.p = "";

  // 加载入口模块并返回导出
  return __webpack_require__("${normalizedEntryId}");
})({
${Object.entries(modules).map(([moduleId, source]) =>
    `"${moduleId}": function(module, exports, __webpack_require__) {\n${source}\n}`
  ).join(',\n')}
});`
}

/**
 * 将ES6模块转换为CommonJS格式
 */
export function transformESModuleToCommonJS(source: string): string {
  let transformed = source

  // 标记为ES模块
  transformed = '__webpack_require__.r(exports);\n' + transformed

  // 1. 转换 export function
  transformed = transformed.replace(
    /export\s+function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*{[^}]*}/g,
    (match, functionName) => {
      const functionDeclaration = match.replace(/^export\s+/, '')
      return `${functionDeclaration}\n__webpack_require__.d(exports, "${functionName}", function() { return ${functionName}; });`
    }
  )

  // 2. 转换 export const/let/var
  transformed = transformed.replace(
    /export\s+(const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=([^;]+);/g,
    (match, type, varName, value) => {
      return `${type} ${varName} =${value};\n__webpack_require__.d(exports, "${varName}", function() { return ${varName}; });`
    }
  )

  // 3. 转换 export default
  transformed = transformed.replace(
    /export\s+default\s+(.+)/g,
    'module.exports.default = $1;\nmodule.exports = module.exports.default;'
  )

  // 4. 转换 export { name }
  transformed = transformed.replace(
    /export\s*{\s*([^}]+)\s*}/g,
    (match, exports) => {
      const names = exports.split(',').map((name: string) => name.trim())
      return names.map((name: string) =>
        `__webpack_require__.d(exports, "${name}", function() { return ${name}; });`
      ).join('\n')
    }
  )

  // 5. 转换 import { name } from 'module'
  transformed = transformed.replace(
    /import\s+{\s*([^}]+)\s*}\s+from\s+['"]([^'"]+)['"]/g,
    (match, imports, modulePath) => {
      const names = imports.split(',').map((name: string) => name.trim())
      const varName = `__module_${Math.random().toString(36).substr(2, 9)}`
      return `var ${varName} = __webpack_require__("${modulePath}");\n` +
        names.map((name: string) => `var ${name} = ${varName}.${name};`).join('\n') + ';'
    }
  )

  // 6. 转换 import default
  transformed = transformed.replace(
    /import\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s+from\s+['"]([^'"]+)['"]/g,
    'var $1 = __webpack_require__("$2").default || __webpack_require__("$2");'
  )

  return transformed
}

/**
 * 生成模块ID（简单的文件路径hash）
 */
export function generateModuleId(filePath: string): string {
  // 简化版：使用相对路径作为模块ID
  return filePath.replace(/\\/g, '/').replace(/^\.\//, '')
}