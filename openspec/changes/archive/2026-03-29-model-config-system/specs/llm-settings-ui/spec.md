## ADDED Requirements

### Requirement: 设置页整体结构
系统 SHALL 提供 Obsidian 原生风格的设置界面，包含两个主要区域：
- Provider 管理区
- 模型列表区

#### Scenario: 设置页布局
- **WHEN** 用户打开插件设置
- **THEN** 页面 SHALL 显示 Provider 管理区和模型列表区
- **AND** 使用 Obsidian Setting API 组件

### Requirement: Provider 管理界面
系统 SHALL 在设置页显示所有 ProviderProfile 的列表。

#### Scenario: Provider 列表展示
- **WHEN** 设置页加载
- **THEN** 系统 SHALL 显示所有 ProviderProfile 的 name 和 type
- **AND** 每个 Provider SHALL 有「管理」按钮

#### Scenario: Provider 添加
- **WHEN** 用户点击「添加 Provider」或「管理」按钮
- **THEN** 系统 SHALL 弹出 Provider 配置模态框
- **AND** 模态框 SHALL 包含 name、type、baseUrl、apiKey 输入字段

### Requirement: Provider 配置模态框
系统 SHALL 提供模态框用于创建或编辑 ProviderProfile。

#### Scenario: 模态框字段
- **WHEN** 模态框打开
- **THEN** 系统 SHALL 显示：
  - 名称输入框（name）
  - 类型下拉框（ProviderType）
  - BaseURL 输入框
  - API Key 输入框（密码样式，可显示/隐藏）
  - 保存按钮
  - 取消按钮

#### Scenario: 保存 Provider
- **WHEN** 用户填写字段并点击保存
- **THEN** 系统 SHALL 验证字段（非空检查）
- **AND** 创建或更新 ProviderProfile
- **AND** 关闭模态框
- **AND** 刷新设置页显示

### Requirement: 模型列表界面
系统 SHALL 在设置页显示所有 ModelEntry 的列表。

#### Scenario: 模型列表展示
- **WHEN** 设置页加载
- **THEN** 系统 SHALL 显示所有 ModelEntry
- **AND** 显示状态：启用/禁用、是否为默认
- **AND** 提供操作按钮：设为默认、删除

### Requirement: 添加模型模态框
系统 SHALL 提供模态框用于添加新的 ModelEntry。

#### Scenario: 模态框字段
- **WHEN** 用户点击「添加模型」按钮
- **THEN** 系统 SHALL 弹出添加模型模态框
- **AND** 模态框 SHALL 包含：
  - Provider 选择下拉框（从现有 providers 中选择）
  - 模型名称输入框（name，用于显示）
  - 模型标识输入框（modelId，用于 API 请求）
  - 确认按钮
  - 取消按钮

#### Scenario: Provider 为空时
- **WHEN** 用户点击「添加模型」但无 Provider 配置
- **THEN** 系统 SHALL 提示用户先添加 Provider
- **AND** 提供跳转添加 Provider 的选项

#### Scenario: 保存模型
- **WHEN** 用户选择 Provider 并填写 modelId 后确认
- **THEN** 系统 SHALL 验证字段（非空、providerId 存在）
- **AND** 创建 ModelEntry（id 自动生成，enabled 默认为 true）
- **AND** 关闭模态框
- **AND** 刷新模型列表

### Requirement: 模型操作
系统 SHALL 支持在设置页对模型进行操作。

#### Scenario: 启用/禁用模型
- **WHEN** 用户点击模型的启用/禁用开关
- **THEN** 系统 SHALL 切换 enabled 状态
- **AND** 更新 settings
- **AND** 刷新列表显示

#### Scenario: 设为默认模型
- **WHEN** 用户点击「设为默认」按钮
- **THEN** 系统 SHALL 更新 settings.defaultModelId
- **AND** 取消其他模型的默认状态
- **AND** 刷新列表显示

#### Scenario: 删除模型
- **WHEN** 用户点击「删除」按钮
- **THEN** 系统 SHALL 确认删除操作
- **AND** 移除该 ModelEntry
- **AND** 如果为默认模型，清除 defaultModelId
- **AND** 刷新列表显示

### Requirement: Obsidian 原生 UI 风格
系统 SHALL 遵循 Obsidian 的 UI 设计规范。

#### Scenario: 样式一致性
- **WHEN** 渲染设置页组件
- **THEN** SHALL 使用 Obsidian Setting 类
- **AND** 使用 obsidian.css 变量
- **AND** 支持浅色/深色主题自动切换
