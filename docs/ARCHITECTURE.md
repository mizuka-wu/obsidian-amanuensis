## 项目架构文档

### 概述

Amanuensis 是一个 Obsidian 社区插件，集成 AI 助手功能，支持多个 LLM 提供商。项目采用模块化架构，分离关注点，便于维护和扩展。

### 目录结构

```
src/
├── main.ts                 # 插件入口点，生命周期管理
├── settings.ts             # 设置选项卡
├── const.ts                # 全局常量
├── ui/                     # UI 模块
│   ├── index.ts           # UI 模块导出
│   ├── view.ts            # AI 助手视图（主聊天界面）
│   ├── ribbon.ts          # Ribbon 图标注册
│   ├── constants.ts       # UI 常量
│   ├── types.ts           # UI 类型定义
│   ├── ai-view.ts         # [已弃用] 旧视图文件
│   ├── ai-ribbon-icon.ts  # [已弃用] 旧 ribbon 文件
│   └── ai-const.ts        # [已弃用] 旧常量文件
├── server/                 # 后端服务器模块
│   ├── index.ts           # 服务器主文件
│   ├── chat-handler.ts    # 聊天消息处理
│   ├── types.ts           # 服务器类型定义
│   ├── mastra/            # Mastra 框架集成
│   │   └── index.ts       # Mastra 初始化和代理创建
│   ├── error/             # 错误处理
│   │   └── index.ts       # 自定义错误类
│   └── utils/             # 工具函数
│       └── port.ts        # 端口验证工具
├── settings/              # 设置管理模块
│   ├── sections/          # 设置选项卡分区
│   │   ├── basic-config-section.ts
│   │   ├── provider-section.ts
│   │   └── model-section.ts
│   ├── provider-manager.ts
│   ├── model-manager.ts
│   └── provider-defaults.ts
├── providers/             # LLM 提供商实现
│   ├── index.ts           # 提供商注册表
│   ├── base.ts            # 提供商基类和接口
│   ├── openai.ts          # OpenAI 实现
│   ├── anthropic.ts       # Anthropic 实现
│   ├── ollama.ts          # Ollama 实现
│   ├── lmstudio.ts        # LM Studio 实现
│   └── custom.ts          # 自定义提供商实现
├── types/                 # 全局类型定义
│   └── settings.ts        # 设置相关类型
├── utils/                 # 工具函数
│   ├── port-validator.ts  # 端口验证
│   └── uuid.ts            # UUID 生成
└── memory/                # 内存管理（预留）
```

### 核心模块说明

#### 1. UI 模块 (`src/ui/`)

**职责：** 管理所有用户界面相关的代码

**主要文件：**
- `view.ts` - `AIAssistantView` 类，实现聊天界面
- `ribbon.ts` - 注册 ribbon 图标，提供快速访问
- `constants.ts` - UI 文本和配置常量
- `types.ts` - UI 相关的 TypeScript 类型

**关键接口：**
```typescript
interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}
```

#### 2. 服务器模块 (`src/server/`)

**职责：** 管理 Express 服务器和 API 端点

**主要文件：**
- `index.ts` - 服务器主类 `AmanuensisServer`
- `chat-handler.ts` - 聊天消息处理逻辑
- `mastra/index.ts` - Mastra 框架集成

**API 端点：**
- `GET /api/models` - 获取可用模型列表
- `POST /api/chat` - 发送聊天消息
- `POST /mcp` - MCP 服务器端点

#### 3. 设置模块 (`src/settings/`)

**职责：** 管理插件设置和配置

**主要文件：**
- `sections/` - 设置选项卡的各个分区
- `provider-manager.ts` - 提供商管理逻辑
- `model-manager.ts` - 模型管理逻辑

#### 4. 提供商模块 (`src/providers/`)

**职责：** 抽象不同 LLM 提供商的实现

**支持的提供商：**
- OpenAI
- Anthropic
- Ollama
- LM Studio
- Custom (OpenAI 兼容 API)

**提供商接口：**
```typescript
interface ProviderImplementation {
  config: ProviderConfig;
  fetchModels?: (provider: ProviderProfile) => Promise<FetchedModel[]>;
}
```

### 数据流

#### 聊天流程

```
用户输入消息
    ↓
AIAssistantView.sendMessage()
    ↓
POST /api/chat (HTTP 请求)
    ↓
AmanuensisServer.handleChatMessage()
    ↓
ChatHandler.processMessage()
    ↓
Mastra 代理调用 LLM
    ↓
返回响应
    ↓
更新 UI 显示
```

#### 模型加载流程

```
AIAssistantView.onOpen()
    ↓
loadAvailableModels()
    ↓
GET /api/models
    ↓
AmanuensisServer.handleGetModels()
    ↓
从全局插件配置读取模型列表
    ↓
返回启用的模型
    ↓
填充模型选择器
```

### 关键设计决策

1. **模块化结构** - 每个模块有明确的职责，便于测试和维护
2. **类型安全** - 使用 TypeScript 严格模式，所有接口明确定义
3. **配置驱动** - 支持多个 LLM 提供商，通过配置灵活切换
4. **异步处理** - 所有网络请求和长时间操作都是异步的
5. **错误处理** - 完整的错误处理和用户反馈机制

### 扩展点

#### 添加新的 LLM 提供商

1. 在 `src/providers/` 中创建新文件（如 `newprovider.ts`）
2. 实现 `ProviderImplementation` 接口
3. 在 `src/providers/index.ts` 中注册
4. 在 `src/const.ts` 中添加 UI 文本

#### 添加新的 API 端点

1. 在 `src/server/index.ts` 的 `init()` 方法中添加路由
2. 创建对应的处理函数
3. 定义请求/响应类型

#### 扩展聊天功能

1. 修改 `src/server/chat-handler.ts` 的 `processMessage()` 方法
2. 在 `src/ui/view.ts` 中更新 UI 逻辑
3. 添加对应的常量和类型定义

### 依赖关系

**核心依赖：**
- `obsidian` - Obsidian API
- `@mastra/core` - Mastra 框架核心
- `@mastra/express` - Express 集成
- `express` - Web 框架
- `zod` - 数据验证

**开发依赖：**
- `typescript` - 类型检查
- `esbuild` - 打包工具
- `eslint` - 代码检查

### 性能考虑

1. **消息历史** - 聊天消息存储在内存中，刷新后清空
2. **模型缓存** - 模型列表在视图打开时加载一次
3. **异步操作** - 所有 I/O 操作都是异步的，不阻塞 UI
4. **错误恢复** - 网络错误时优雅降级，提供用户反馈

### 安全考虑

1. **API 密钥** - 存储在本地设置中，不上传到云端
2. **本地服务器** - 服务器仅在本地运行，不暴露到网络
3. **输入验证** - 所有用户输入都经过验证
4. **错误消息** - 避免在错误消息中泄露敏感信息
