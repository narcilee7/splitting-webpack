# 变更日志

本文档记录了 Splitting Webpack 项目的所有重要变更。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [未发布]

### v0.1.0 - 2025-7-16 (计划中)

#### 新增

- 完整的构建流程实现
- 模块递归解析算法
- 基础 bundle 代码生成
- CLI build 命令完善
- ES6 模块导入/导出支持

#### 修改

- 完善 `Compiler.run()` 方法实现
- 完善 `Compilation.buildModule()` 方法
- 增强错误处理和日志输出

---

## [已发布]

### [v0.0.2] - 2025-7-xx

#### 新增

- **项目初始化**
  - TypeScript 项目配置
  - ESLint 和 Prettier 配置
  - Vitest 测试框架集成
  - pnpm 包管理配置

- **CLI 框架**
  - commander.js 命令行解析
  - chalk 彩色输出支持
  - 基础 `build` 和 `dev` 命令框架

- **配置系统**
  - cosmiconfig 配置文件解析
  - 默认配置定义
  - 配置合并逻辑
  - TypeScript 类型定义完善

- **核心架构**
  - `Compiler` 类基础框架
  - `Compilation` 类基础框架  
  - `Resolver` 模块解析器框架
  - `LoaderRunner` Loader 运行器框架
  - `Parser` AST 解析器框架
  - `ChunkGraph` Chunk 图框架

- **插件系统**
  - Tapable 钩子系统简化实现
  - `SyncHook` 同步钩子
  - `AsyncSeriesHook` 异步钩子
  - 插件接口定义

- **开发服务器**
  - `DevServer` 基础框架
  - `HMR` 热更新框架
  - WebSocket 连接支持

- **工具函数**
  - 文件系统操作工具
  - 哈希计算工具
  - 缓存工具基础框架

#### 技术选型

- **运行时**: Node.js 20+
- **语言**: TypeScript (严格模式)
- **模块系统**: ES Modules
- **包管理**: pnpm
- **构建工具**: tsc (TypeScript Compiler)
- **测试框架**: Vitest
- **代码质量**: ESLint + Prettier

#### 依赖

```json
{
  "dependencies": {
    "chalk": "^5.3.0",
    "chokidar": "^3.6.0", 
    "commander": "^12.0.0",
    "cosmiconfig": "^9.0.0",
    "ws": "^8.17.0",
    "zod": "^4.0.5"
  },
  "devDependencies": {
    "@babel/core": "^7.28.0",
    "@babel/preset-env": "^7.28.0", 
    "@types/node": "^20.12.12",
    "@types/ws": "^8.5.10",
    "tsx": "^4.7.3",
    "typescript": "^5.4.5",
    "vitest": "^1.6.0"
  }
}
```

#### 文件结构

```
src/
├── cli.ts                    # CLI 入口 ✅
├── index.ts                  # 程序化 API 入口 ✅
├── types/                    # 类型定义 ✅
├── config/                   # 配置系统 ✅
├── tapable/                  # 钩子系统 ✅
├── compiler/                 # 编译器核心 ✅
├── resolver/                 # 模块解析 ✅
├── loader/                   # Loader 系统 ✅
├── parser/                   # AST 解析 ✅
├── chunk/                    # Chunk 处理 ✅
├── runtime/                  # 运行时 ✅
├── dev-server/              # 开发服务器 ✅
└── utils/                   # 工具函数 ✅
```

---

### [v0.0.1] - 2025-07-14 (初始版本)

#### 新增

- 项目初始结构
- 基础 README 文档
- MIT 许可证
- Git 仓库初始化

---

## 版本规划说明

### 版本号规则

- **主版本号**: 重大架构变更或不兼容的 API 修改
- **次版本号**: 新功能添加，向后兼容
- **修订号**: Bug 修复和小的改进

### 发布周期

- **主要版本**: 每次 (v0.1, v0.2, v0.3...)
- **修复版本**: 根据需要随时发布
- **开发版本**: 持续集成和测试

### 分支策略

- `master`: 稳定发布版本
- `develop`: 开发版本集成
- `feature/*`: 功能开发分支
- `hotfix/*`: 紧急修复分支

---

*更新时间: 2025年7月14日* 