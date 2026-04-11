# 开发指南

## 快速开始

### 环境要求

- Node.js 18+ (推荐使用 LTS 版本)
- npm (项目使用 npm 作为包管理器)
- Obsidian (用于测试插件)

### 安装和运行

```bash
# 安装依赖
npm install

# 开发模式（监听文件变化）
npm run dev

# 生产构建
npm run build

# 代码检查
npm run lint
```

### 项目结构快速导航

```
src/
├── main.ts              # 插件入口，生命周期管理
├── ui/                  # UI 模块（聊天界面）
├── server/              # 后端服务器（Express + Mastra）
├── settings/            # 设置管理
├── providers/           # LLM 提供商实现
├── types/               # 类型定义
└── utils/               # 工具函数
```

## 开发工作流

### 1. 添加新功能

#### 步骤 1：创建类型定义

在相应模块的 `types.ts` 文件中定义新的接口：

```typescript
// src/ui/types.ts
export interface NewFeature {
  id: string;
  name: string;
}
```

#### 步骤 2：实现功能

在对应模块中实现功能逻辑。遵循以下原则：
- 单一职责原则：每个文件/类只做一件事
- 类型安全：使用 TypeScript 严格模式
- 错误处理：使用 try-catch 和适当的错误消息

#### 步骤 3：添加常量

如果需要 UI 文本或配置，添加到对应的 `constants.ts` 文件：

```typescript
// src/ui/constants.ts
export const UI_TEXTS = {
  NEW_FEATURE_LABEL: "新功能",
};
```

#### 步骤 4：测试和验证

```bash
npm run build
npm run lint
```

### 2. 修改 UI

#### 修改聊天界面

编辑 `src/ui/view.ts` 中的 `AIAssistantView` 类：

```typescript
// 添加新的 UI 元素
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

#### 修改样式

编辑 `styles.css` 添加新的样式：

```css
.new-element {
  padding: 12px;
  border-radius: 6px;
  background-color: var(--background-primary);
}
```

### 3. 添加新的 API 端点

在 `src/server/index.ts` 的 `init()` 方法中添加：

```typescript
// 添加新的路由
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

// 实现处理函数
private async handleNewEndpoint(param: string): Promise<string> {
  // 实现逻辑
  return "result";
}
```

### 4. 添加新的 LLM 提供商

#### 步骤 1：创建提供商文件

创建 `src/providers/newprovider.ts`：

```typescript
import type { ProviderImplementation } from "./base";

export const implementation: ProviderImplementation = {
  config: {
    defaultName: "New Provider",
    defaultBaseUrl: "https://api.example.com",
    requiresApiKey: true,
    description: "Description of the provider",
    supportsBatchImport: false,
  },
  fetchModels: async (provider) => {
    // 实现获取模型列表的逻辑
    return [];
  },
};
```

#### 步骤 2：注册提供商

在 `src/providers/index.ts` 中添加：

```typescript
import * as newprovider from "./newprovider";

const providerImplementations: Record<ProviderType, ProviderImplementation> = {
  // ...
  newprovider: newprovider.implementation,
};
```

#### 步骤 3：更新类型定义

在 `src/types/settings.ts` 中更新 `ProviderType`：

```typescript
export type ProviderType =
  | "openai"
  | "anthropic"
  | "ollama"
  | "lmstudio"
  | "custom"
  | "newprovider";
```

#### 步骤 4：添加 UI 文本

在 `src/const.ts` 中添加：

```typescript
export const PROVIDER_TYPE_OPTIONS = {
  // ...
  newprovider: "New Provider",
};
```

### 5. 修改设置

设置分为三个部分，在 `src/settings/sections/` 中：

#### 基础配置

编辑 `basic-config-section.ts` 添加新的设置项：

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

#### Provider 管理

编辑 `provider-section.ts` 修改提供商相关的 UI。

#### Model 管理

编辑 `model-section.ts` 修改模型相关的 UI。

## 代码规范

### TypeScript 规范

- 使用严格模式：`"strict": true`
- 避免 `any` 类型，使用具体的类型定义
- 使用 `const` 而不是 `let`（除非需要重新赋值）
- 使用箭头函数而不是 `function` 关键字

### 命名规范

- **类名**：PascalCase（如 `AIAssistantView`）
- **函数名**：camelCase（如 `createHeader`）
- **常量**：UPPER_SNAKE_CASE（如 `DEFAULT_PORT`）
- **接口**：PascalCase，通常以 `I` 开头或不加前缀（如 `ChatMessage`）
- **文件名**：kebab-case（如 `chat-handler.ts`）或 camelCase（如 `chatHandler.ts`）

### 代码风格

- 使用 2 空格缩进
- 行长度不超过 100 个字符（ESLint 配置）
- 使用 `async/await` 而不是 Promise 链
- 添加适当的错误处理和日志

### 注释规范

- 为复杂逻辑添加注释
- 为公共 API 添加 JSDoc 注释
- 避免过度注释明显的代码

```typescript
/**
 * 处理聊天消息
 * @param message - 用户消息
 * @param modelId - 模型 ID
 * @returns 模型响应
 */
async function processMessage(message: string, modelId: string): Promise<string> {
  // 实现逻辑
}
```

## 调试

### 启用调试日志

在浏览器控制台中查看日志：

```typescript
console.log("Debug message:", data);
console.error("Error message:", error);
```

### 检查网络请求

1. 打开 Obsidian 开发者工具（Ctrl+Shift+I 或 Cmd+Option+I）
2. 切换到 Network 标签
3. 发送聊天消息观察请求

### 检查服务器日志

服务器日志输出到 Obsidian 控制台。

## 测试

### 手动测试

1. 运行 `npm run dev` 启动开发模式
2. 在 Obsidian 中启用插件
3. 测试各项功能

### 代码检查

```bash
npm run lint
```

修复 ESLint 错误：

```bash
npm run lint -- --fix
```

## 构建和发布

### 生产构建

```bash
npm run build
```

这会生成：
- `main.js` - 打包后的插件代码
- `manifest.json` - 插件元数据
- `styles.css` - 样式文件

### 版本管理

更新版本号：

```bash
npm run version
```

这会自动更新：
- `manifest.json` 中的版本号
- `versions.json` 中的版本映射

## 常见问题

### Q: 如何在开发中测试新的提供商？

A: 在 `src/server/chat-handler.ts` 的 `generateResponse` 方法中添加测试代码，或者在设置中手动添加提供商配置。

### Q: 如何调试 Mastra 代理？

A: 在 `src/server/chat-handler.ts` 中添加日志语句，查看 Mastra 的返回值。

### Q: 如何修改聊天界面的样式？

A: 编辑 `styles.css` 文件，使用 CSS 变量支持主题适配。

### Q: 如何添加新的命令？

A: 在 `src/main.ts` 的 `onload` 方法中使用 `this.addCommand()` 添加新命令。

## 性能优化建议

1. **避免不必要的重新渲染** - 只在数据变化时更新 UI
2. **使用异步操作** - 不要在主线程中执行长时间操作
3. **缓存数据** - 缓存模型列表等频繁访问的数据
4. **优化消息历史** - 考虑限制内存中存储的消息数量

## 安全建议

1. **验证用户输入** - 所有用户输入都应该验证
2. **保护 API 密钥** - 不要在日志或错误消息中泄露密钥
3. **使用 HTTPS** - 在生产环境中使用 HTTPS
4. **限制权限** - 只请求必要的 Obsidian API 权限

## 相关资源

- [Obsidian 插件开发文档](https://docs.obsidian.md)
- [Mastra 框架文档](https://mastra.ai)
- [TypeScript 手册](https://www.typescriptlang.org/docs)
- [Express.js 文档](https://expressjs.com)
