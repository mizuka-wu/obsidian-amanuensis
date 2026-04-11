# 模块集成指南

## 模块概览

本项目采用模块化架构，每个模块负责特定的功能领域。本指南说明各模块的职责、接口和集成方式。

## UI 模块 (`src/ui/`)

### 职责

- 管理聊天界面的渲染和交互
- 处理用户输入和事件
- 与后端服务器通信

### 核心文件

| 文件 | 职责 |
|------|------|
| `view.ts` | AI 助手视图主类 |
| `ribbon.ts` | Ribbon 图标注册 |
| `constants.ts` | UI 文本和配置常量 |
| `types.ts` | UI 相关类型定义 |
| `index.ts` | 模块导出 |

### 关键类和函数

#### AIAssistantView

主要的聊天界面实现类。

```typescript
class AIAssistantView extends ItemView {
  // 生命周期方法
  async onOpen(): Promise<void>
  async onClose(): Promise<void>
  
  // 私有方法
  private createHeader(container: HTMLElement): void
  private createModelSelector(container: HTMLElement): void
  private createMessagesContainer(container: HTMLElement): void
  private createComposer(container: HTMLElement): void
  private renderMessages(): void
  private async sendMessage(): Promise<void>
}
```

#### registerAIRibbon

注册 Ribbon 图标，提供快速访问聊天界面。

```typescript
function registerAIRibbon(plugin: Plugin): void
```

### 使用示例

在 `main.ts` 中注册视图和 Ribbon：

```typescript
import { AIAssistantView, registerAIRibbon, UI_CONFIG } from "./ui";

async onload() {
  // 注册视图
  this.registerView(UI_CONFIG.VIEW_TYPE, (leaf) => new AIAssistantView(leaf));
  
  // 注册 Ribbon 图标
  registerAIRibbon(this);
}
```

### 扩展 UI

添加新的 UI 元素：

```typescript
// 在 AIAssistantView 中添加新方法
private createNewElement(container: HTMLElement): void {
  const element = container.createDiv("new-element");
  // 实现逻辑
}

// 在 onOpen 中调用
async onOpen(): Promise<void> {
  // ...
  this.createNewElement(root);
}
```

## 服务器模块 (`src/server/`)

### 职责

- 运行 Express 服务器
- 处理 API 请求
- 集成 Mastra 框架
- 管理聊天消息处理

### 核心文件

| 文件 | 职责 |
|------|------|
| `index.ts` | 服务器主类 |
| `chat-handler.ts` | 聊天消息处理 |
| `types.ts` | 服务器类型定义 |
| `mastra/index.ts` | Mastra 框架集成 |
| `error/index.ts` | 错误类定义 |
| `utils/port.ts` | 端口验证工具 |

### 关键类和函数

#### AmanuensisServer

主服务器类，管理 Express 应用和 API 端点。

```typescript
class AmanuensisServer {
  // 静态工厂方法
  static async create(options?: AmanuensisServerOptions): Promise<AmanuensisServer>
  
  // 生命周期方法
  async init(): Promise<void>
  async start(port?: number): Promise<void>
  async stop(): Promise<void>
  
  // 私有方法
  private async handleGetModels(): Promise<ModelsResponse>
  private async handleChatMessage(message: string, modelId: string): Promise<string>
}
```

#### ChatHandler

处理聊天消息和对话历史。

```typescript
class ChatHandler {
  addMessage(role: "user" | "assistant", content: string): void
  getHistory(): ChatMessage[]
  clearHistory(): void
  async processMessage(userMessage: string, modelId: string): Promise<string>
}
```

### API 端点

#### GET /api/models

获取可用的模型列表。

**响应：**
```typescript
{
  models: Array<{
    id: string;
    name: string;
    modelId: string;
    providerId: string;
    enabled: boolean;
  }>
}
```

#### POST /api/chat

发送聊天消息。

**请求：**
```typescript
{
  message: string;
  modelId: string;
}
```

**响应：**
```typescript
{
  response?: string;
  error?: string;
}
```

### 使用示例

在 `main.ts` 中创建和启动服务器：

```typescript
import { AmanuensisServer } from "./server";

async onload() {
  const port = validatePort(this.settings.port);
  
  this.server = await AmanuensisServer.create({ port });
  await this.server.start();
}

async onunload() {
  if (this.server) {
    await this.server.stop();
  }
}
```

### 添加新的 API 端点

在 `AmanuensisServer.init()` 中添加：

```typescript
this.expressApplication.post("/api/new-endpoint", async (req, res) => {
  try {
    const { param } = req.body as { param?: string };
    
    if (!param) {
      res.status(400).json({ error: "Parameter is required" });
      return;
    }
    
    const result = await this.handleNewEndpoint(param);
    res.json({ result });
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
```

## 设置模块 (`src/settings/`)

### 职责

- 管理插件设置
- 提供设置 UI
- 持久化用户配置

### 核心文件

| 文件 | 职责 |
|------|------|
| `../settings.ts` | 设置选项卡主类 |
| `sections/basic-config-section.ts` | 基础配置分区 |
| `sections/provider-section.ts` | 提供商管理分区 |
| `sections/model-section.ts` | 模型管理分区 |
| `provider-manager.ts` | 提供商管理逻辑 |
| `model-manager.ts` | 模型管理逻辑 |

### 关键类

#### AmanuensisSettingTab

设置选项卡主类。

```typescript
class AmanuensisSettingTab extends PluginSettingTab {
  display(): void
}
```

#### BasicConfigSection

基础配置分区。

```typescript
class BasicConfigSection {
  display(containerEl: HTMLElement): void
}
```

### 使用示例

在 `main.ts` 中注册设置选项卡：

```typescript
import { AmanuensisSettingTab } from "./settings";

async onload() {
  this.addSettingTab(new AmanuensisSettingTab(this.app, this));
}
```

### 添加新的设置项

在对应的 section 文件中添加：

```typescript
new Setting(containerEl)
  .setName("新设置")
  .setDesc("设置描述")
  .addText((text) =>
    text
      .setValue(this.plugin.settings.newSetting)
      .onChange(async (value) => {
        this.plugin.settings.newSetting = value;
        await this.plugin.saveSettings();
      }),
  );
```

## 提供商模块 (`src/providers/`)

### 职责

- 抽象不同 LLM 提供商的实现
- 提供统一的提供商接口
- 支持模型列表获取

### 核心文件

| 文件 | 职责 |
|------|------|
| `index.ts` | 提供商注册表和工厂函数 |
| `base.ts` | 提供商基类和接口 |
| `openai.ts` | OpenAI 实现 |
| `anthropic.ts` | Anthropic 实现 |
| `ollama.ts` | Ollama 实现 |
| `lmstudio.ts` | LM Studio 实现 |
| `custom.ts` | 自定义提供商实现 |

### 关键接口

#### ProviderImplementation

```typescript
interface ProviderImplementation {
  config: ProviderConfig;
  fetchModels?: (provider: ProviderProfile) => Promise<FetchedModel[]>;
}
```

#### ProviderConfig

```typescript
interface ProviderConfig {
  defaultName: string;
  defaultBaseUrl: string;
  requiresApiKey: boolean;
  description: string;
  supportsBatchImport: boolean;
}
```

### 工厂函数

```typescript
// 获取提供商配置
function getProviderConfig(type: ProviderType): ProviderConfig

// 获取提供商实现
function getProviderImplementation(type: ProviderType): ProviderImplementation

// 检查是否支持批量导入
function supportsBatchImport(type: ProviderType): boolean

// 获取提供商模型列表
async function fetchProviderModels(
  type: ProviderType,
  provider: ProviderProfile,
): Promise<FetchedModel[]>
```

### 添加新的提供商

1. 创建 `src/providers/newprovider.ts`：

```typescript
import type { ProviderImplementation } from "./base";

export const implementation: ProviderImplementation = {
  config: {
    defaultName: "New Provider",
    defaultBaseUrl: "https://api.example.com",
    requiresApiKey: true,
    description: "Description",
    supportsBatchImport: false,
  },
  fetchModels: async (provider) => {
    // 实现获取模型列表
    return [];
  },
};
```

2. 在 `src/providers/index.ts` 中注册：

```typescript
import * as newprovider from "./newprovider";

const providerImplementations: Record<ProviderType, ProviderImplementation> = {
  // ...
  newprovider: newprovider.implementation,
};
```

3. 更新 `src/types/settings.ts`：

```typescript
export type ProviderType = 
  | "openai"
  | "anthropic"
  | "ollama"
  | "lmstudio"
  | "custom"
  | "newprovider";
```

## 类型定义模块 (`src/types/`)

### 职责

- 定义全局类型
- 提供类型安全的接口

### 核心文件

| 文件 | 职责 |
|------|------|
| `settings.ts` | 设置相关类型 |

### 关键类型

```typescript
// 提供商类型
type ProviderType = "openai" | "anthropic" | "ollama" | "lmstudio" | "custom";

// 提供商配置
interface ProviderProfile {
  id: string;
  type: ProviderType;
  name: string;
  baseUrl: string;
  apiKey: string;
}

// 模型条目
interface ModelEntry {
  id: string;
  name: string;
  modelId: string;
  providerId: string;
  enabled: boolean;
}

// 插件设置
interface AmanuensisPluginSettings {
  port: string;
  providers: Record<string, ProviderProfile>;
  models: ModelEntry[];
  defaultModelId?: string;
}
```

## 工具模块 (`src/utils/`)

### 职责

- 提供通用工具函数
- 验证和转换数据

### 核心文件

| 文件 | 职责 |
|------|------|
| `port-validator.ts` | 端口验证 |
| `uuid.ts` | UUID 生成 |

## 模块间通信

### 数据流

```
UI (AIAssistantView)
  ↓ HTTP 请求
Server (AmanuensisServer)
  ↓ 处理请求
ChatHandler
  ↓ 调用 Mastra
Mastra Agent
  ↓ 调用 LLM
LLM Provider
  ↓ 返回响应
ChatHandler
  ↓ 返回响应
Server
  ↓ HTTP 响应
UI (更新消息)
```

### 依赖关系

```
main.ts
├── UI (view, ribbon)
├── Server
│   ├── ChatHandler
│   └── Mastra
├── Settings
│   └── Providers
└── Types
```

## 最佳实践

### 1. 模块独立性

- 每个模块应该尽可能独立
- 通过明确的接口进行通信
- 避免循环依赖

### 2. 类型安全

- 为所有公共 API 定义类型
- 避免使用 `any` 类型
- 使用 TypeScript 严格模式

### 3. 错误处理

- 在模块边界处理错误
- 提供有意义的错误消息
- 不要泄露内部实现细节

### 4. 可测试性

- 将逻辑与 UI 分离
- 使用依赖注入
- 避免全局状态

### 5. 文档

- 为公共 API 添加 JSDoc 注释
- 记录重要的设计决策
- 提供使用示例

## 常见集成场景

### 场景 1：添加新的聊天功能

1. 在 `src/ui/types.ts` 中定义新的消息类型
2. 在 `src/ui/view.ts` 中实现 UI 逻辑
3. 在 `src/server/chat-handler.ts` 中实现处理逻辑
4. 在 `src/ui/constants.ts` 中添加 UI 文本

### 场景 2：支持新的 LLM 提供商

1. 在 `src/providers/` 中创建新的提供商文件
2. 在 `src/providers/index.ts` 中注册
3. 更新 `src/types/settings.ts` 中的 `ProviderType`
4. 在 `src/const.ts` 中添加 UI 文本

### 场景 3：添加新的服务器端点

1. 在 `src/server/types.ts` 中定义请求/响应类型
2. 在 `src/server/index.ts` 中添加路由和处理函数
3. 在 `src/ui/view.ts` 中调用新端点

## 故障排除

### 模块加载失败

检查：
- 导入路径是否正确
- 模块是否正确导出
- 是否有循环依赖

### 类型错误

检查：
- 类型定义是否完整
- 是否使用了正确的类型
- 是否有类型不匹配

### 运行时错误

检查：
- 是否有 null/undefined 检查
- 是否正确处理了异步操作
- 是否有适当的错误处理
