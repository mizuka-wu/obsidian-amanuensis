## Why

当前 AI 插件缺少标准化的模型配置机制。用户需要在多处重复输入 API Token，模型与厂商绑定过紧，无法灵活组合和复用。Obsidian 用户期望原生一致的配置体验。

## What Changes

- 引入 ProviderProfile 概念：统一存储 API Token 和 BaseURL，支持多厂商（OpenAI、DeepSeek、Anthropic、Ollama、Custom）
- 引入 ModelEntry 概念：模型与 Provider 解耦，一个 Provider 可派生多个模型，每个模型可独立启用/禁用/设为默认
- 重构 Settings 数据结构：支持 providers 和 models 的独立配置
- 新增设置界面：Provider 管理页、模型列表页、添加模型模态框
- 实现 Token 缓存机制：复用鉴权信息，避免重复输入
- 统一模型调用链路：ModelEntry → ProviderProfile → HTTP Request

## Capabilities

### New Capabilities

- `provider-profile`: Provider 配置管理，包含 API Token 和 BaseURL 的存储、缓存和校验
- `model-entry`: 模型条目管理，支持模型与 Provider 的关联、启用/禁用、默认设置
- `model-selection`: 模型选择界面，提供下拉菜单和设置面板
- `llm-settings-ui`: Obsidian 原生风格的设置界面，包含 Provider 管理、模型列表、添加模型模态框

### Modified Capabilities

- 无（本项目为新功能，不涉及现有 spec 修改）

## Impact

- **数据层**: Settings 数据结构扩展，新增 `providers` 和 `models` 字段
- **UI 层**: 新增设置标签页和多个模态框组件
- **API 层**: 模型调用方式从直接配置改为通过 ProviderProfile 解析
- **安全**: API Key 存储在 `data.json` 中，依赖 Obsidian 的文件权限保护
- **存储**: 配置存储于 `.obsidian/plugins/<plugin-id>/data.json`，不参与跨设备同步
