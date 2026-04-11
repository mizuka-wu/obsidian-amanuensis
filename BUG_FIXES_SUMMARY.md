# 代码审查与 Bug 修复总结

## 审查日期
2026-04-05

## 修复的严重 Bug

### 1. ✅ 全局插件实例注册缺失
**文件**: `src/main.ts`
**问题**: 后端的 `ChatHandler` 依赖全局变量 `__amanuensisPlugin` 来访问插件配置，但插件实例从未被注册到全局作用域。
**影响**: 所有聊天请求都会失败，返回"无法访问插件配置"错误。
**修复**: 在 `onload()` 方法中添加全局注册：
```typescript
(globalThis as any).__amanuensisPlugin = this;
```

### 2. ✅ 消息 ID 碰撞风险
**文件**: `src/ui/view.ts`
**问题**: 使用 `Date.now()` 和 `Date.now() + 1` 生成消息 ID，在高频场景下会产生重复 ID，导致删除消息时删除错误的消息。
**影响**: 用户删除消息时可能删除错误的消息。
**修复**: 
- 创建 `src/ui/id-generator.ts` 使用时间戳 + 递增计数器生成唯一 ID
- 在 `onClose()` 时重置计数器以避免长期运行的 ID 溢出

### 3. ✅ 硬编码服务器地址
**文件**: `src/ui/view.ts`
**问题**: 在两处硬编码了 `http://localhost:8761`，如果用户在设置中更改端口，UI 仍然连接到硬编码的端口。
**影响**: 端口更改后无法连接到服务器。
**修复**:
- 创建 `src/ui/server-config.ts` 动态获取服务器地址
- 从全局插件实例读取端口配置
- 替换所有硬编码的 URL 为动态函数调用

## 修复的中等问题

### 4. ✅ 缺少错误处理和超时机制
**文件**: `src/ui/view.ts`
**问题**: 
- 模型列表加载失败时没有用户可见的错误提示
- 聊天请求没有超时机制，服务器无响应时 UI 会永久卡住
**影响**: 用户体验差，无法判断是加载失败还是没有模型。
**修复**:
- 在 `loadAvailableModels()` 中添加 HTTP 错误状态检查和日志
- 在 `sendMessage()` 中使用 `Promise.race()` 实现 30 秒超时机制
- 超时时显示清晰的错误消息

### 5. ✅ 不安全的 JSON 响应处理
**文件**: `src/ui/view.ts`
**问题**: 直接将 `response.json` 转换为 `ChatResponse` 类型，没有验证响应结构。
**影响**: 服务器返回意外格式时会导致运行时错误。
**修复**:
- 创建 `src/ui/response-validator.ts` 验证响应格式
- 在处理响应前进行类型检查和验证

### 6. ✅ 类型定义重复
**文件**: `src/server/chat-handler.ts`
**问题**: `ModelConfig`、`ProviderConfig`、`PluginSettings`、`PluginInstance` 等类型在 `chat-handler.ts` 中定义，但应该在共享的 `types.ts` 中定义。
**影响**: 代码重复，维护困难。
**修复**:
- 将所有类型定义移到 `src/server/types.ts`
- 在 `chat-handler.ts` 中导入这些类型
- 保持代码 DRY 原则

## 新增文件

| 文件 | 目的 |
|------|------|
| `src/ui/id-generator.ts` | 生成唯一的消息 ID |
| `src/ui/server-config.ts` | 动态获取服务器地址配置 |
| `src/ui/response-validator.ts` | 验证聊天响应格式 |

## 修改的文件

| 文件 | 修改内容 |
|------|---------|
| `src/main.ts` | 添加全局插件实例注册 |
| `src/ui/view.ts` | 使用新的 ID 生成器、服务器配置、响应验证器；添加超时机制 |
| `src/server/chat-handler.ts` | 导入共享的类型定义 |
| `src/server/types.ts` | 添加模型和提供商配置类型 |

## 构建验证

✅ **TypeScript 编译**: 成功
✅ **ESLint 检查**: 通过（源代码无错误）
✅ **npm run build**: 成功

## 测试建议

1. **消息 ID 唯一性**: 快速发送多条消息，验证每条消息都有唯一 ID
2. **消息删除**: 删除消息时验证删除的是正确的消息
3. **端口配置**: 修改设置中的端口，验证 UI 能正确连接到新端口
4. **超时处理**: 停止服务器，发送消息，验证 30 秒后显示超时错误
5. **错误处理**: 测试网络错误、无效响应等场景

## 代码质量改进

- ✅ 移除了全局变量的不安全访问
- ✅ 添加了类型验证和错误处理
- ✅ 消除了代码重复
- ✅ 改进了用户体验（超时提示、错误消息）
- ✅ 增强了系统的可维护性和可扩展性
