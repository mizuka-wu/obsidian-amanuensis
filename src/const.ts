// 基础配置相关
export const BASIC_CONFIG_SECTION_TITLE = "基础配置";
export const BASIC_CONFIG_PORT_LABEL = "端口号";
export const BASIC_CONFIG_PORT_DESC = "服务器端口号";
export const BASIC_CONFIG_PORT_PLACEHOLDER = "7861";

// 服务器设置相关 (旧版，保留兼容)
export const SERVER_PORT_LABEL = "端口号";
export const SERVER_PORT_DESC = "服务器端口号";
export const SERVER_PORT_PLACEHOLDER = "7861";

// Provider 相关
export const PROVIDER_SECTION_TITLE = "模型源 (Providers)";
export const PROVIDER_EMPTY_TEXT = "暂无配置 Provider，点击下方按钮添加。";
export const PROVIDER_ADD_BUTTON = "+ 添加 Provider";
export const PROVIDER_MANAGE_BUTTON = "管理";
export const PROVIDER_DELETE_BUTTON = "删除";
export const PROVIDER_DELETE_CONFIRM = (name: string) =>
	`确定要删除 Provider "${name}" 吗？`;

export const PROVIDER_MODAL_TITLE_ADD = "添加 Provider";
export const PROVIDER_MODAL_TITLE_EDIT = "编辑 Provider";
export const PROVIDER_NAME_LABEL = "名称";
export const PROVIDER_NAME_DESC = "Provider 的显示名称";
export const PROVIDER_NAME_PLACEHOLDER = "例如: OpenAI";
export const PROVIDER_TYPE_LABEL = "类型";
export const PROVIDER_TYPE_DESC = "选择 Provider 类型";
export const PROVIDER_BASEURL_LABEL = "Base URL";
export const PROVIDER_BASEURL_DESC = "API 基础地址";
export const PROVIDER_BASEURL_PLACEHOLDER = "例如: https://api.openai.com/v1";
export const PROVIDER_APIKEY_LABEL = "API Key";
export const PROVIDER_APIKEY_DESC = "API 密钥（可选）";
export const PROVIDER_APIKEY_PLACEHOLDER = "sk-...";
export const PROVIDER_MODAL_CANCEL = "取消";
export const PROVIDER_MODAL_SAVE = "保存";
export const PROVIDER_VALIDATION_EMPTY = "名称和 Base URL 不能为空";
export const PROVIDER_VALIDATION_URL_INVALID =
	"Base URL 格式无效，请输入有效的 URL（例如: https://api.openai.com/v1）";
export const PROVIDER_SAVE_ERROR = "保存 Provider 失败，请查看控制台了解详情";
export const PROVIDER_CUSTOM_DESC = "需要 OpenAI 兼容格式的 API";

// Model 相关
export const MODEL_SECTION_TITLE = "模型菜单 (Models)";
export const MODEL_EMPTY_TEXT = "暂无配置模型，点击下方按钮添加。";
export const MODEL_ADD_BUTTON = "+ 添加模型";
export const MODEL_DELETE_BUTTON = "删除";
export const MODEL_SET_DEFAULT_BUTTON = "设为默认";
export const MODEL_DELETE_CONFIRM = (name: string) =>
	`确定要删除模型 "${name}" 吗？`;
export const MODEL_PROVIDER_PREFIX = "Provider: ";
export const MODEL_ID_PREFIX = " | 模型ID: ";
export const MODEL_DEFAULT_BADGE = " | [默认]";
export const MODEL_PROVIDER_UNKNOWN = "未知 Provider";
export const MODEL_ADD_TOOLTIP = "请先添加至少一个 provider";

export const MODEL_MODAL_TITLE = "添加模型";
export const MODEL_PROVIDER_LABEL = "模型来源 (Provider)";
export const MODEL_PROVIDER_DESC = "选择 Provider";
export const MODEL_NAME_LABEL = "显示名称";
export const MODEL_NAME_DESC = "模型在菜单中的显示名称";
export const MODEL_NAME_PLACEHOLDER = "例如: GPT-4o";
export const MODEL_ID_LABEL = "模型标识";
export const MODEL_ID_DESC = "API 请求时使用的模型 ID";
export const MODEL_ID_PLACEHOLDER = "例如: gpt-4o";
export const MODEL_MODAL_NO_PROVIDERS =
	"没有可用的 Provider，请先添加至少一个 Provider。";
export const MODEL_MODAL_CANCEL = "取消";
export const MODEL_MODAL_ADD = "添加";
export const MODEL_VALIDATION_EMPTY = "所有字段都不能为空";
export const MODEL_SAVE_ERROR = "添加模型失败，请查看控制台了解详情";

// Provider 类型选项
export const PROVIDER_TYPE_OPTIONS = {
	openai: "OpenAI",
	anthropic: "Anthropic",
	ollama: "Ollama",
	lmstudio: "LM Studio",
	custom: "Custom",
};

// 确认对话框
export const CONFIRM_MODAL_CANCEL = "取消";
export const CONFIRM_MODAL_CONFIRM = "确定";

// 验证错误提示（使用 Notice 替代 alert）
export const NOTICE_VALIDATION_ERROR_PREFIX = "验证错误: ";
