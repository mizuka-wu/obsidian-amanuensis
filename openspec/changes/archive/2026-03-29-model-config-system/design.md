## Context

当前 Obsidian 插件缺少标准化的模型配置机制，用户需重复输入 API Token，模型与厂商绑定过紧。本设计基于 Obsidian 官方插件规范，结合 AI/Copilot 类插件的最佳实践。

## Goals / Non-Goals

**Goals:**
- 实现 ProviderProfile 和 ModelEntry 的解耦设计
- 提供 Obsidian 原生风格的设置界面
- 支持多厂商配置（OpenAI、DeepSeek、Anthropic、Ollama、Custom）
- 实现 Token 缓存机制，避免重复输入
- 支持模型自由组合和复用

**Non-Goals:**
- 不支持模型自动拉取（未来扩展）
- 不支持多账号切换（当前仅单账号）
- 不实现跨设备配置同步
- 不构建复杂路由或引入外部依赖

## Decisions

### 1. 数据结构采用解耦设计

**Decision**: 使用 `ProviderProfile` 存储连接配置，`ModelEntry` 存储模型元数据。

**Rationale**: 
- 一个 Provider 可派生多个模型（如 OpenAI → GPT-4o, GPT-4-turbo）
- API Token 仅需输入一次，多处复用
- 模型列表和 Provider 配置独立管理，符合单一职责原则

**Alternative considered**: 扁平化设计（每个模型存完整配置）。Rejected：重复存储 Token，配置冗长。

### 2. 使用 Obsidian 原生 Settings 机制

**Decision**: 使用 `loadData()` / `saveData()` 存储配置，原生 `PluginSettingTab` 构建界面。

**Rationale**:
- 符合 Obsidian 插件规范，无额外依赖
- 用户操作习惯一致
- 自动处理 JSON 序列化

**Alternative considered**: 自定义持久化方案。Rejected：引入不必要的复杂性。

### 3. 界面采用「列表 + 模态框」模式

**Decision**: Provider 列表使用设置项，添加/编辑使用模态框（Modal）。

**Rationale**:
- 列表显示精简信息，模态框承载完整表单
- 避免设置页过于冗长
- 符合 Obsidian 原生 UX（如核心插件的设置）

**Alternative considered**: 内联编辑模式。Rejected：增加界面复杂度。

### 4. API Key 明文存储于 data.json

**Decision**: 使用 Obsidian `data.json` 存储，依赖文件系统权限保护。

**Rationale**:
- 无加密需求（本地使用）
- 兼容 Obsidian 标准插件规范
- 用户可在文件系统中自主管理

**Risks**: 
- 如果 vault 被共享，Token 可能泄露
- 未来可支持可选的密钥环集成

### 5. 使用 TypeScript 严格类型

**Decision**: 定义完整的数据类型接口，使用严格类型检查。

**Rationale**:
- 确保数据结构一致性
- IDE 自动补全
- 编译期发现类型错误

## Risks / Trade-offs

| Risk | Mitigation |
|------|-----------|
| Token 泄露风险（data.json 明文） | 文档警告；未来可选加密或密钥环 |
| 配置迁移复杂 | 设计时预留字段扩展，避免破坏性变更 |
| Provider API 变更 | 抽象层隔离，单个 Provider 适配不影响整体 |
| 模型列表增长 | UI 支持滚动，未来可添加搜索过滤 |

## Migration Plan

**首次部署**：
1. 自动创建默认空配置（providers: {}, models: []）
2. 用户在设置页手动添加第一个 Provider
3. 添加模型后即可使用

**未来版本升级**：
- 保持数据结构向后兼容
- 新增字段采用可选设计
- 必要时在 onload 中执行数据迁移

## Open Questions

1. 是否需要支持 Provider 连通性测试？（建议初期不实现，简化）
2. Custom Provider 的扩展字段如何定义？（预留 extraConfig: Record<string, string>）
3. 模型排序是否支持手动拖拽？（初期不支持，按添加顺序）
