## ADDED Requirements

### Requirement: ProviderProfile 数据类型定义

系统 SHALL 定义 ProviderProfile 类型，包含以下字段：

- id: string（唯一标识）
- type: ProviderType（厂商类型）
- name: string（显示名称）
- baseUrl: string（API 基础地址）
- apiKey: string（鉴权令牌）

#### Scenario: ProviderProfile 类型完整性

- **WHEN** 系统声明 ProviderProfile 对象
- **THEN** 对象 SHALL 包含所有必需字段
- **AND** 字段类型 SHALL 符合 TypeScript 类型定义

### Requirement: ProviderType 枚举定义

系统 SHALL 支持以下 ProviderType 值：'openai', 'anthropic', 'ollama', 'lmstudio', 'custom'。

#### Scenario: ProviderType 类型安全

- **WHEN** 开发者指定 ProviderType
- **THEN** 值 SHALL 必须是预定义枚举之一
- **AND** TypeScript 编译器 SHALL 拒绝非法值

### Requirement: ProviderProfile 增删改查

系统 SHALL 支持 ProviderProfile 的以下操作：

- 创建新的 ProviderProfile
- 读取（查询）现有 ProviderProfile
- 更新 ProviderProfile 字段
- 删除 ProviderProfile

#### Scenario: 创建 Provider

- **WHEN** 用户输入 name, type, baseUrl, apiKey
- **THEN** 系统 SHALL 生成唯一 id
- **AND** 创建 ProviderProfile 对象
- **AND** 保存到 settings.providers

#### Scenario: 更新 Provider

- **WHEN** 用户修改 Provider 字段
- **THEN** 系统 SHALL 更新对应 ProviderProfile
- **AND** 保持原有 id 不变
- **AND** 关联的 ModelEntry providerId SHALL 自动指向更新后的配置

#### Scenario: 删除 Provider

- **WHEN** 用户删除 ProviderProfile
- **THEN** 系统 SHALL 移除该 Provider
- **AND** 保留关联的 ModelEntry（变为无效引用，提示用户重新配置）

### Requirement: API Key 存储策略

系统 SHALL 使用 Obsidian 的 saveData 机制将 apiKey 存储在 data.json 中。

#### Scenario: API Key 持久化

- **WHEN** 用户保存 ProviderProfile
- **THEN** apiKey SHALL 被序列化并写入 data.json
- **AND** 下次加载时 SHALL 自动恢复

#### Scenario: API Key 明文存储

- **WHEN** 查看 data.json 内容
- **THEN** apiKey SHALL 以明文形式存储
- **AND** 依赖文件系统权限进行保护

### Requirement: Ollama 模型列表获取

系统 SHALL 支持从 Ollama Provider 获取可用模型列表。

#### Scenario: Ollama 模型列表 API 调用

- **WHEN** 用户请求获取 Ollama 模型列表
- **THEN** 系统 SHALL 向 `{baseUrl}/api/tags` 发送 GET 请求
- **AND** SHALL 返回模型名称列表

#### Scenario: Ollama 模型列表解析

- **WHEN** 系统接收到 Ollama `/api/tags` 响应
- **THEN** 系统 SHALL 解析 JSON 响应中的 `models` 数组
- **AND** 提取每个模型的 `name` 字段作为可用模型标识

#### Scenario: Ollama 模型数据结构

- **WHEN** 解析 Ollama 模型响应
- **THEN** 系统 SHALL 识别以下字段：
  - `name`: 模型唯一标识（用于 API 请求）
  - `model`: 模型完整名称
  - `modified_at`: 最后修改时间
  - `size`: 模型大小（字节）
  - `digest`: 模型摘要哈希
  - `details`: 模型详细信息对象
    - `format`: 模型格式（如 "gguf"）
    - `family`: 模型家族（如 "gemma"）
    - `families`: 模型家族数组
    - `parameter_size`: 参数量（如 "4.3B"）
    - `quantization_level`: 量化级别（如 "Q4_K_M"）

### Requirement: LM Studio 模型列表获取

系统 SHALL 支持从 LM Studio Provider 获取可用模型列表。

#### Scenario: LM Studio 模型列表 API 调用

- **WHEN** 用户请求获取 LM Studio 模型列表
- **THEN** 系统 SHALL 向 `{baseUrl}/api/v1/models` 发送 GET 请求
- **AND** SHALL 返回模型列表数据

#### Scenario: LM Studio 模型列表解析

- **WHEN** 系统接收到 LM Studio `/api/v1/models` 响应
- **THEN** 系统 SHALL 解析 JSON 响应中的 `models` 数组
- **AND** 提取每个模型的 `key` 字段作为模型标识
- **AND** 提取 `type` 为 `llm` 的条目（排除 embedding 模型）

#### Scenario: LM Studio 模型数据结构

- **WHEN** 解析 LM Studio 模型响应
- **THEN** 系统 SHALL 识别以下字段：
  - `key`: 模型唯一标识（用于 API 请求）
  - `display_name`: 模型显示名称
  - `type`: 模型类型（"llm" 或 "embedding"）
  - `loaded_instances`: 已加载实例数组（非空表示模型已加载可用）
