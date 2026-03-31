## 1. 基础类型定义

- [x] 1.1 定义 ProviderType 枚举（'openai' | 'anthropic' | 'ollama' | 'lmstudio' | 'custom'）
- [x] 1.2 定义 ProviderProfile 接口（id, type, name, baseUrl, apiKey）
- [x] 1.3 定义 ModelEntry 接口（id, name, modelId, providerId, enabled）
- [x] 1.4 更新 PluginSettings 接口（新增 providers 和 models 字段）
- [x] 1.5 定义 DEFAULT_SETTINGS 默认值（providers: {}, models: [], defaultModelId: undefined）

## 2. Provider 管理服务

- [x] 2.1 创建 Provider 管理类（ProviderManager）
- [x] 2.2 实现 createProvider() 方法（生成唯一 ID，验证字段）
- [x] 2.3 实现 updateProvider() 方法（更新字段，保持 ID）
- [x] 2.4 实现 deleteProvider() 方法（从 settings.providers 移除）
- [x] 2.5 实现 getProviderById() 方法
- [x] 2.6 实现 getAllProviders() 方法
- [x] 2.7 实现 fetchOllamaModels() 方法（调用 /api/tags 接口，解析 models 数组）
- [x] 2.8 实现 fetchLMStudioModels() 方法（调用 /api/v1/models 接口，解析 llm 类型模型）
- [x] 2.9 实现 getProviderModels() 通用方法（根据 provider type 分发到具体实现）

## 3. ModelEntry 管理服务

- [x] 3.1 创建 ModelEntry 管理类（ModelManager）
- [x] 3.2 实现 addModel() 方法（生成唯一 ID，验证 providerId 存在）
- [x] 3.3 实现 updateModel() 方法
- [x] 3.4 实现 deleteModel() 方法（清理 defaultModelId 如果删除的是默认模型）
- [x] 3.5 实现 toggleModelEnabled() 方法（切换 enabled 状态）
- [x] 3.6 实现 setDefaultModel() 方法（更新 defaultModelId）
- [x] 3.7 实现 getModelById() 方法
- [x] 3.8 实现 getEnabledModels() 方法（返回所有 enabled=true 的模型）
- [x] 3.9 实现 getDefaultModel() 方法

## 4. 设置页基础结构

- [x] 4.1 创建 LLMSettingsTab 类继承 PluginSettingTab
- [x] 4.2 实现 display() 方法主布局（Provider 区 + 模型区）
- [x] 4.3 添加设置容器和样式类

## 5. Provider 配置模态框

- [x] 5.1 创建 ProviderModal 类继承 Modal
- [x] 5.2 实现模态框 UI（name 输入、type 下拉、baseUrl 输入、apiKey 密码输入）
- [x] 5.3 实现保存逻辑（验证字段非空，调用 ProviderManager）
- [x] 5.4 实现编辑模式（传入现有 Provider 预填充表单）
- [x] 5.5 实现关闭和取消逻辑

## 6. Provider 列表 UI

- [x] 6.1 实现 Provider 列表渲染（显示 name 和 type）
- [x] 6.2 为每个 Provider 添加「管理」按钮
- [x] 6.3 实现「添加 Provider」按钮
- [x] 6.4 实现 Provider 删除功能（带确认对话框）
- [x] 6.5 列表为空时显示引导提示

## 7. 添加模型模态框

- [x] 7.1 创建 AddModelModal 类继承 Modal
- [x] 7.2 实现 Provider 选择下拉框（从现有 providers 加载）
- [x] 7.3 实现 name 和 modelId 输入字段
- [x] 7.4 实现确认添加逻辑（验证 providerId 存在、字段非空）
- [x] 7.5 Provider 为空时显示引导（提示先添加 Provider）

## 8. 模型列表 UI

- [x] 8.1 实现模型列表渲染（显示 name、provider、启用状态）
- [x] 8.2 实现启用/禁用开关
- [x] 8.3 实现「设为默认」按钮（仅对启用模型显示）
- [x] 8.4 实现「删除」按钮（带确认对话框）
- [x] 8.5 默认模型显示特殊标识（如「默认」标签）
- [x] 8.6 实现「添加模型」按钮
- [x] 8.7 列表为空时显示引导提示

## 9. 模型选择组件

- [x] 9.1 创建 ModelDropdown 组件（继承 DropdownComponent 或自定义）
- [x] 9.2 实现从 enabled 模型加载选项
- [x] 9.3 实现默认选中逻辑（优先 defaultModelId）
- [x] 9.4 实现选择事件回调（返回 ModelEntry）
- [x] 9.5 空列表时显示占位提示

## 10. 模型调用链路

- [x] 10.1 创建 ModelResolver 类
- [x] 10.2 实现 resolveModelConfig() 方法（ModelEntry → 完整配置）
- [x] 10.3 返回结构包含：modelId, baseUrl, apiKey
- [x] 10.4 处理 Provider 不存在的情况（返回错误提示）

## 11. 数据持久化

- [x] 11.1 在 main.ts onload() 中加载 settings
- [x] 11.2 实现 settings 变更自动保存（调用 saveData）
- [x] 11.3 确保 providers 和 models 正确序列化/反序列化

## 12. 样式和主题适配

- [x] 12.1 使用 Obsidian Setting API 组件保持原生风格
- [x] 12.2 确保支持浅色/深色主题
- [x] 12.3 添加必要的自定义样式（styles.css）

## 13. 集成测试

- [x] 13.1 测试完整的 Provider 创建 → 模型添加 → 设置默认流程
- [x] 13.2 测试 Provider 删除后模型列表状态
- [x] 13.3 测试模型调用链路（resolveModelConfig）
- [x] 13.4 测试数据持久化（reload 后配置恢复）

## 14. 代码组织

- [x] 14.1 将类型定义移到 src/types/settings.ts
- [x] 14.2 将 Provider 管理逻辑移到 src/settings/provider-manager.ts
- [x] 14.3 将 Model 管理逻辑移到 src/settings/model-manager.ts
- [x] 14.4 将 UI 组件移到 src/settings/llm-settings-tab.ts
- [x] 14.5 保持 main.ts 最小化（仅注册设置 tab）
