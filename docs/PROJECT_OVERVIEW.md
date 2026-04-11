# 项目概览

## 项目简介

**Amanuensis** 是一个功能强大的 Obsidian 社区插件，为用户提供集成的 AI 助手功能。插件支持多个 LLM 提供商（OpenAI、Anthropic、Ollama、LM Studio 等），允许用户灵活配置和切换不同的 AI 模型。

## 核心特性

- **多提供商支持** - 支持 OpenAI、Anthropic、Ollama、LM Studio 和自定义 OpenAI 兼容 API
- **灵活的模型配置** - 用户可以添加和管理多个 LLM 模型
- **现代化聊天界面** - 类似 Cursor/Windsurf 的用户友好的聊天 UI
- **本地服务器** - 后端服务器运行在本地，保护用户隐私
- **Mastra 框架集成** - 利用 Mastra 框架的强大功能
- **MCP 支持** - 集成 Model Context Protocol 支持

## 技术栈

### 前端
- **Obsidian API** - 插件开发框架
- **TypeScript** - 类型安全的开发语言
- **CSS** - 响应式样式设计

### 后端
- **Express.js** - Web 框架
- **Mastra** - AI 框架
- **Node.js** - 运行时环境

### 开发工具
- **esbuild** - 快速打包工具
- **TypeScript** - 类型检查
- **ESLint** - 代码质量检查

## 项目结构

```
obsidian-amanuensis/
├── src/                    # 源代码
│   ├── main.ts            # 插件入口
│   ├── ui/                # UI 模块
│   ├── server/            # 后端服务器
│   ├── settings/          # 设置管理
│   ├── providers/         # LLM 提供商
│   ├── types/             # 类型定义
│   ├── utils/             # 工具函数
│   └── const.ts           # 全局常量
├── docs/                  # 文档
│   ├── ARCHITECTURE.md    # 架构文档
│   ├── DEVELOPMENT_GUIDE.md # 开发指南
│   ├── MODULE_GUIDE.md    # 模块指南
│   └── PROJECT_OVERVIEW.md # 项目概览
├── styles.css             # 全局样式
├── manifest.json          # 插件元数据
├── package.json           # 项目配置
└── README.md              # 项目说明
```

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

这会启动监听模式，自动编译 TypeScript 文件。

### 生产构建

```bash
npm run build
```

生成的文件：
- `main.js` - 打包后的插件代码
- `manifest.json` - 插件元数据
- `styles.css` - 样式文件

### 代码检查

```bash
npm run lint
```

## 主要模块

### UI 模块 (`src/ui/`)
管理聊天界面和用户交互。包含：
- `view.ts` - 主聊天视图
- `ribbon.ts` - Ribbon 图标
- `constants.ts` - UI 常量
- `types.ts` - 类型定义

### 服务器模块 (`src/server/`)
处理 API 请求和 LLM 调用。包含：
- `index.ts` - 服务器主类
- `chat-handler.ts` - 聊天处理
- `mastra/` - Mastra 框架集成

### 设置模块 (`src/settings/`)
管理用户配置。包含：
- `sections/` - 设置 UI 分区
- `provider-manager.ts` - 提供商管理
- `model-manager.ts` - 模型管理

### 提供商模块 (`src/providers/`)
抽象不同 LLM 提供商。支持：
- OpenAI
- Anthropic
- Ollama
- LM Studio
- Custom (OpenAI 兼容)

## API 端点

### GET /api/models
获取可用的模型列表。

**响应：**
```json
{
  "models": [
    {
      "id": "model-1",
      "name": "GPT-4",
      "modelId": "gpt-4",
      "providerId": "openai",
      "enabled": true
    }
  ]
}
```

### POST /api/chat
发送聊天消息。

**请求：**
```json
{
  "message": "你好",
  "modelId": "model-1"
}
```

**响应：**
```json
{
  "response": "你好！我是 AI 助手..."
}
```

## 配置说明

### 基础配置
- **端口号** - 服务器运行的端口（默认 8761）

### 提供商配置
每个提供商需要配置：
- **名称** - 显示名称
- **类型** - 提供商类型
- **Base URL** - API 基础地址
- **API Key** - API 密钥（可选）

### 模型配置
每个模型需要配置：
- **显示名称** - 在菜单中显示的名称
- **模型 ID** - API 请求时使用的模型标识
- **提供商** - 所属的提供商
- **启用状态** - 是否启用该模型

## 文档导航

- **[架构文档](./ARCHITECTURE.md)** - 项目整体架构和设计
- **[开发指南](./DEVELOPMENT_GUIDE.md)** - 开发工作流和最佳实践
- **[模块指南](./MODULE_GUIDE.md)** - 各模块详细说明和集成方式

## 开发工作流

### 1. 添加新功能

1. 在相应模块创建类型定义
2. 实现功能逻辑
3. 添加常量和 UI 文本
4. 测试和验证

### 2. 添加新的 LLM 提供商

1. 创建提供商实现文件
2. 在提供商注册表中注册
3. 更新类型定义
4. 添加 UI 文本

### 3. 修改 UI

1. 编辑 `src/ui/view.ts` 中的视图类
2. 在 `src/ui/constants.ts` 中添加文本
3. 在 `styles.css` 中添加样式

## 代码规范

### TypeScript
- 使用严格模式
- 避免 `any` 类型
- 为公共 API 添加类型定义

### 命名规范
- **类名** - PascalCase
- **函数名** - camelCase
- **常量** - UPPER_SNAKE_CASE
- **文件名** - kebab-case

### 代码风格
- 2 空格缩进
- 使用 `async/await`
- 完整的错误处理
- 适当的注释

## 性能考虑

- 聊天消息存储在内存中
- 模型列表在视图打开时加载
- 所有 I/O 操作都是异步的
- 网络错误时优雅降级

## 安全考虑

- API 密钥存储在本地设置中
- 服务器仅在本地运行
- 所有用户输入都经过验证
- 避免在错误消息中泄露敏感信息

## 常见问题

### Q: 如何添加新的聊天功能？
A: 参考[开发指南](./DEVELOPMENT_GUIDE.md)中的"添加新功能"部分。

### Q: 如何支持新的 LLM 提供商？
A: 参考[开发指南](./DEVELOPMENT_GUIDE.md)中的"添加新的 LLM 提供商"部分。

### Q: 如何修改聊天界面？
A: 编辑 `src/ui/view.ts` 和 `styles.css`，参考[开发指南](./DEVELOPMENT_GUIDE.md)。

### Q: 如何调试插件？
A: 使用浏览器开发者工具查看日志和网络请求。

## 贡献指南

欢迎贡献代码！请：

1. Fork 项目
2. 创建功能分支
3. 提交清晰的 commit 消息
4. 推送到分支
5. 创建 Pull Request

## 许可证

本项目采用 0-BSD 许可证。

## 相关资源

- [Obsidian 插件开发文档](https://docs.obsidian.md)
- [Mastra 框架文档](https://mastra.ai)
- [TypeScript 手册](https://www.typescriptlang.org/docs)
- [Express.js 文档](https://expressjs.com)

## 联系方式

如有问题或建议，欢迎提交 Issue 或 Pull Request。
