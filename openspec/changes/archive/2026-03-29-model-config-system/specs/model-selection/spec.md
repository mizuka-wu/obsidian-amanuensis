## ADDED Requirements

### Requirement: 模型列表数据源
系统 SHALL 从 ModelEntry 中获取启用的模型列表。

#### Scenario: 获取可用模型列表
- **WHEN** 组件请求可用模型列表
- **THEN** 系统 SHALL 返回所有 enabled = true 的 ModelEntry
- **AND** 按创建顺序排序

#### Scenario: 空模型列表
- **WHEN** 无启用的 ModelEntry
- **THEN** 系统 SHALL 返回空数组
- **AND** UI SHALL 显示添加模型引导

### Requirement: 模型下拉选择组件
系统 SHALL 提供下拉选择器，允许用户从可用模型中选择。

#### Scenario: 下拉菜单显示
- **WHEN** 用户点击模型选择器
- **THEN** 系统 SHALL 显示所有 enabled ModelEntry 的 name
- **AND** 当前选中模型 SHALL 高亮显示

#### Scenario: 选择模型
- **WHEN** 用户点击某个模型选项
- **THEN** 系统 SHALL 触发选择事件
- **AND** 返回选中的 ModelEntry

#### Scenario: 默认选中
- **WHEN** 下拉选择器初始化
- **THEN** 如果 settings.defaultModelId 存在且对应模型启用
- **AND** 该模型 SHALL 默认选中

### Requirement: 模型标识解析
系统 SHALL 能够根据选中的模型获取完整的调用配置。

#### Scenario: 解析模型配置
- **WHEN** 选中某个 ModelEntry
- **THEN** 系统 SHALL 解析：
  - modelId（用于 API 请求）
  - providerId（关联的 Provider）
  - baseUrl 和 apiKey（从 ProviderProfile 获取）
