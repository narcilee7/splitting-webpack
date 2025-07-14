# Splitting Webpack

## description

A project for deeply learning webpack.

## architecture

```bash
┌────────────────────────────┐
│  CLI / Programmatic API    │
│  (bin 命令行 / node API)    │
└────────────┬───────────────┘
             │
┌────────────▼───────────────┐
│ 1. 配置解析 ConfigResolver   │
│   - 读取 webpack.config.ts   │
│   - 合并默认配置             │
└────────────┬───────────────┘
             │
┌────────────▼───────────────┐
│ 2. 初始化 Compiler          │
│   - 挂载内置插件             │
│   - 创建 Compilation 实例    │
└────────────┬───────────────┘
             │
┌────────────▼───────────────┐
│ 3. 构建阶段 Build           │
│   3.1 入口 EntryResolver   │
│   3.2 模块解析 ModuleFactory│
│   3.3 Loader Pipeline       │
│   3.4 AST 解析 (acorn)      │
│   3.5 依赖收集 Dependency   │
│   3.6 图算法 DFS/BFS       │
└────────────┬───────────────┘
             │
┌────────────▼───────────────┐
│ 4. 封装阶段 Seal            │
│   4.1 ChunkGraph 生成       │
│   4.2 模块合并              │
│   4.3 运行时 Runtime        │
└────────────┬───────────────┘
             │
┌────────────▼───────────────┐
│ 5. 生成阶段 Emit            │
│   5.1 代码生成 MagicString  │
│   5.2 SourceMap             │
│   5.3 写入文件系统          │
└────────────────────────────┘
```

### File Architecture

```bash
// 项目结构
src/
├── cli.ts                    # CLI 入口
├── index.ts                  # 程序化 API 入口
├── types/
│   ├── config.ts            # 配置类型定义
│   ├── compiler.ts          # 编译器类型
│   ├── module.ts            # 模块类型
│   └── chunk.ts             # chunk 类型
├── config/
│   ├── resolver.ts          # 配置解析器
│   └── default.ts           # 默认配置
├── tapable/
│   ├── index.ts             # 简化版 Tapable
│   ├── SyncHook.ts          # 同步钩子
│   └── AsyncSeriesHook.ts   # 异步钩子
├── compiler/
│   ├── Compiler.ts          # 编译器主类
│   ├── Compilation.ts       # 编译过程
│   └── Stats.ts             # 构建统计
├── resolver/
│   ├── Resolver.ts          # 模块解析器
│   └── utils.ts             # 解析工具
├── loader/
│   ├── LoaderRunner.ts      # Loader 运行器
│   └── builtin/             # 内置 Loader
│       ├── babel-loader.ts
│       └── ts-loader.ts
├── parser/
│   ├── Parser.ts            # AST 解析器
│   └── DependencyCollector.ts # 依赖收集器
├── chunk/
│   ├── ChunkGraph.ts        # Chunk 图
│   └── CodeGenerator.ts     # 代码生成器
├── runtime/
│   └── template.ts          # 运行时模板
├── dev-server/
│   ├── DevServer.ts         # 开发服务器
│   └── HMR.ts               # 热更新
└── utils/
    ├── fs.ts                # 文件系统工具
    ├── hash.ts              # 哈希工具
    └── cache.ts             # 缓存工具
```
