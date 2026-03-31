## ADDED Requirements

### Requirement: ModelEntry 数据类型定义
系统 SHALL 定义 ModelEntry 类型，包含以下字段：
- id: string（唯一标识）
- name: string（显示名称）
- modelId: string（实际请求用的模型标识）
- providerId: string（关联的 ProviderProfile ID）
- enabled: boolean（是否启用）

#### Scenario: ModelEntry 类型完整性
- **WHEN** 系统声明 ModelEntry 对象
- **THEN** 对象 SHALL 包含所有必需字段
- **AND** 字段类型 SHALL 符合 TypeScript 类型定义

### Requirement: ModelEntry 生命周期管理
系统 SHALL 支持 ModelEntry 的增删改查操作。

#### Scenario: 添加模型
- **WHEN** 用户选择 Provider 并输入 modelId
- **THEN** 系统 SHALL 生成唯一 id
- **AND** 创建 ModelEntry 对象
- **AND** 保存到 settings.models
- **AND** enabled 默认为 true

#### Scenario: 更新模型
- **WHEN** 用户修改 ModelEntry 字段
- **THEN** 系统 SHALL 更新对应 ModelEntry
- **AND** 保持原有 id 不变

#### Scenario: 删除模型
- **WHEN** 用户删除 ModelEntry
- **THEN** 系统 SHALL 从 settings.models 移除该模型
- **AND** 如果该模型为 defaultModelId，则清除默认设置

### Requirement: 模型启用/禁用控制
系统 SHALL 允许用户启用或禁用 ModelEntry。

#### Scenario: 禁用模型
- **WHEN** 用户禁用某个 ModelEntry
- **THEN** 系统 SHALL 设置 enabled = false
- **AND** 该模型 SHALL 不再出现在可用模型列表中
- **AND** 不影响 existing 调用（已选中的模型仍可工作）

#### Scenario: 启用模型
- **WHEN** 用户启用已禁用的 ModelEntry
- **THEN** 系统 SHALL 设置 enabled = true
- **AND** 该模型 SHALL 重新出现在可用模型列表中

### Requirement: 默认模型设置
系统 SHALL 支持设置默认模型（defaultModelId）。

#### Scenario: 设置默认模型
- **WHEN** 用户将某个 ModelEntry 设为默认
- **THEN** 系统 SHALL 更新 settings.defaultModelId
- **AND** 仅一个模型可为默认（唯一性）

#### Scenario: 获取默认模型
- **WHEN** 系统需要获取默认模型
- **THEN** SHALL 使用 defaultModelId 查找对应的 ModelEntry
- **AND** 如果 defaultModelId 不存在或对应模型已禁用，返回 null

### Requirement: 模型与 Provider 解耦
系统 SHALL 支持同一个 Provider 配置派生多个 ModelEntry。

#### Scenario: 同一 Provider 多模型
- **WHEN** 用户基于同一个 providerId 创建多个 ModelEntry
- **THEN** 系统 SHALL 允许创建
- **AND** 每个 ModelEntry SHALL 独立管理启用状态和默认设置
