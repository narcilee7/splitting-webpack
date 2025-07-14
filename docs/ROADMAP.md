# Splitting Webpack 项目路线图

## 🎯 项目目标

深入学习和理解 Webpack 的底层机制，通过从零实现一个类似 Webpack 的构建工具来掌握模块打包的核心原理。

## 📦 版本规划

### v0.0.2 (当前版本) - 基础架构搭建 ✅

**状态**: 已完成  

#### 已实现功能

- [x] 项目基础架构设计
- [x] TypeScript 配置和构建环境
- [x] CLI 框架搭建 (commander.js)
- [x] 配置解析系统 (cosmiconfig)
- [x] 核心类型定义 (Configuration, Module, Chunk等)
- [x] Tapable 钩子系统简化实现
- [x] 基础类结构搭建:
  - [x] Compiler 类框架
  - [x] Compilation 类框架
  - [x] Resolver 类框架
  - [x] LoaderRunner 类框架
  - [x] Parser 类框架
  - [x] ChunkGraph 类框架
- [x] 开发服务器框架
- [x] 热更新 (HMR) 框架

#### 技术特点

- 使用 ES Modules
- TypeScript 严格模式
- 模块化架构设计
- 插件系统设计

---

### v0.1.0 - 最小可运行构建器 🚧

**状态**: 计划中  
**目标完成时间**: 2024年2月

#### 核心目标

实现一个能够构建简单 JavaScript 项目的最小版本构建器

#### 计划实现功能

- [ ] **完整的构建流程** - 端到端构建pipeline
  - [ ] 完善 `Compiler.run()` 方法
  - [ ] 实现 make → seal → emit 完整流程
- [ ] **模块解析和处理**
  - [ ] 完善 `Compilation.buildModule()` 方法
  - [ ] 实现递归依赖解析
  - [ ] 基础 ES6 import/export 支持
- [ ] **代码生成**
  - [ ] 实现基本的 bundle 生成
  - [ ] CommonJS 运行时支持
- [ ] **文件输出**
  - [ ] 实现文件写入功能
  - [ ] 基础的文件名处理
- [ ] **CLI 命令完善**
  - [ ] 完善 `build` 命令
  - [ ] 基础错误处理和日志

#### 验证目标

能够构建这样的简单项目:

```javascript
// src/index.js
import { add } from './math.js'
console.log(add(1, 2))

// src/math.js  
export function add(a, b) { return a + b }
```

#### 成功标准

- [ ] CLI 命令 `splitting-webpack build` 能够成功执行
- [ ] 生成的 bundle 可以在 Node.js 中正常运行
- [ ] 支持相对路径模块导入
- [ ] 基础错误信息展示

---

### v0.2.0 - Loader 系统 📅

**状态**: 规划中  

#### 计划功能

- [ ] **Loader 系统完善**
  - [ ] Loader 链式调用
  - [ ] 内置 Loader 实现 (babel-loader, ts-loader)
  - [ ] Loader 选项配置
- [ ] **文件类型支持**
  - [ ] TypeScript 支持
  - [ ] JSON 模块支持
  - [ ] CSS 基础支持 (可选)
- [ ] **模块系统增强**
  - [ ] npm 包解析支持
  - [ ] node_modules 查找算法
  - [ ] package.json 解析

---

### v0.3.0 - 插件系统 📅

**状态**: 规划中

#### 计划功能

- [ ] **插件架构完善**
  - [ ] 插件生命周期钩子
  - [ ] 内置插件实现
  - [ ] 第三方插件支持
- [ ] **构建优化**
  - [ ] 代码分割基础实现
  - [ ] Tree Shaking 简单版本
  - [ ] 模块缓存系统

---

### v0.4.0 - 开发体验 📅

**状态**: 规划中

#### 计划功能

- [ ] **开发服务器完善**
  - [ ] 文件监听和自动重建
  - [ ] 热模块替换 (HMR) 实现
  - [ ] Source Map 支持
- [ ] **调试支持**
  - [ ] 详细的构建信息
  - [ ] 性能分析工具
  - [ ] 依赖图可视化

---

### v0.5.0+ - 高级特性 📅

**状态**: 远期规划

#### 可能包含的功能

- [ ] 代码分割和懒加载
- [ ] 高级优化算法
- [ ] 多种输出格式支持
- [ ] Web Workers 支持
- [ ] 微前端架构支持

---

## 🏗️ 架构演进

### 当前架构特点

- 模块化设计，职责分离清晰
- 类型安全 (TypeScript)
- 钩子系统支持扩展
- 配置驱动的设计

### 架构改进计划

- 性能优化: 并行处理、缓存机制
- 内存管理: 大项目支持
- 错误处理: 更友好的错误信息
- 测试覆盖: 单元测试和集成测试

---

## 📈 学习目标追踪

### 已理解的概念

- [x] Webpack 整体架构设计
- [x] 模块解析算法基础
- [x] 插件系统设计模式
- [x] 配置系统设计

### 待深入理解的概念

- [ ] 模块图构建算法
- [ ] 代码生成和优化
- [ ] HMR 实现原理
- [ ] Tree Shaking 算法
- [ ] 代码分割策略

---

## 🚀 如何参与

### 开发环境设置

```bash
git clone <repo>
cd splitting-webpack
pnpm install
pnpm run dev  # 开发模式
pnpm run test # 运行测试
```

### 贡献指南

1. 选择一个未完成的功能
2. 创建功能分支
3. 实现功能并编写测试
4. 更新文档
5. 提交 Pull Request

---
