/**
 * AI 助手视图
 * 主要的聊天界面实现
 */

import { ItemView, WorkspaceLeaf, requestUrl } from "obsidian";
import { UI_TEXTS, UI_CONFIG } from "./constants";
import type { ChatMessage, ModelEntry } from "./types";
import { generateMessageId, resetIdCounter } from "./id-generator";
import { getModelsUrl, getChatUrl, getServerBaseUrl } from "./server-config";
import { validateChatResponse } from "./response-validator";

export class AIAssistantView extends ItemView {
	private messages: ChatMessage[] = [];
	private isLoading = false;
	private messagesContainer: HTMLDivElement | null = null;
	private input: HTMLTextAreaElement | null = null;
	private sendBtn: HTMLButtonElement | null = null;
	private selectedModelId: string | null = null;
	private availableModels: ModelEntry[] = [];

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return UI_CONFIG.VIEW_TYPE;
	}

	getDisplayText(): string {
		return UI_TEXTS.VIEW_DISPLAY_TEXT;
	}

	getIcon(): string {
		return UI_CONFIG.VIEW_ICON;
	}

	async onOpen(): Promise<void> {
		const container = this.containerEl.children[1] as HTMLElement;
		container.empty();

		const root = container.createDiv("ai-view-container");

		this.createHeader(root);
		await this.loadAvailableModels();
		this.createModelSelector(root);
		this.createMessagesContainer(root);
		this.createComposer(root);
		this.updateSendButtonState();

		await this.resetBackendConversation();
		this.focusInput();
	}

	async onClose(): Promise<void> {
		this.messages = [];
		resetIdCounter();
	}

	private async resetBackendConversation(): Promise<void> {
		try {
			await requestUrl({
				url: `${getServerBaseUrl()}/api/chat/reset`,
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			});
		} catch (error) {
			console.warn(
				"Failed to reset backend conversation:",
				error instanceof Error ? error.message : String(error),
			);
		}
	}

	private async loadAvailableModels(): Promise<void> {
		try {
			const response = await requestUrl({
				url: getModelsUrl(),
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (response.status === 200) {
				const data = response.json as { models?: ModelEntry[] };
				this.availableModels = data.models || [];
				if (
					this.availableModels.length > 0 &&
					this.availableModels[0]
				) {
					this.selectedModelId = this.availableModels[0].id;
				}
			} else {
				console.error(`Failed to load models: HTTP ${response.status}`);
				this.availableModels = [];
			}
		} catch (error) {
			console.error("Failed to load models:", error);
			this.availableModels = [];
		}
	}

	private createHeader(container: HTMLElement): void {
		const header = container.createDiv("ai-view-header");
		const title = header.createEl("h2");
		title.textContent = UI_TEXTS.VIEW_TITLE;
	}

	private createModelSelector(container: HTMLElement): void {
		const selectorContainer = container.createDiv(
			"ai-model-selector-container",
		);

		const label = selectorContainer.createEl("label", {
			cls: "ai-model-label",
		});
		label.textContent = "选择模型:";

		const select = selectorContainer.createEl("select", {
			cls: "ai-model-select",
		});

		if (this.availableModels.length === 0) {
			const option = select.createEl("option");
			option.value = "";
			option.textContent = "未配置模型";
			option.disabled = true;
			option.selected = true;
		} else {
			this.availableModels.forEach((model) => {
				const option = select.createEl("option");
				option.value = model.id;
				option.textContent = `${model.name} (${model.modelId})`;
				if (model.id === this.selectedModelId) {
					option.selected = true;
				}
			});
		}

		this.registerDomEvent(select, "change", (e) => {
			const target = e.target as HTMLSelectElement;
			this.selectedModelId = target.value || null;
			this.updateSendButtonState();
		});
	}

	private createMessagesContainer(container: HTMLElement): void {
		this.messagesContainer = container.createDiv("ai-messages-container");

		if (this.messages.length === 0) {
			const emptyState =
				this.messagesContainer.createDiv("ai-empty-state");
			const icon = emptyState.createDiv("empty-icon");
			icon.textContent = UI_TEXTS.EMPTY_STATE_ICON;
			const text = emptyState.createEl("p");
			text.textContent = UI_TEXTS.EMPTY_STATE_TITLE;
			const hint = emptyState.createEl("p", { cls: "empty-hint" });
			hint.textContent = UI_TEXTS.EMPTY_STATE_HINT;
		} else {
			this.renderMessages();
		}
	}

	private createComposer(container: HTMLElement): void {
		const composer = container.createDiv("ai-composer");

		const inputWrapper = composer.createDiv("composer-input-wrapper");

		this.input = inputWrapper.createEl("textarea", {
			cls: "composer-input",
		});
		this.input.placeholder = UI_TEXTS.INPUT_PLACEHOLDER;
		this.registerDomEvent(this.input, "keydown", (e) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				void this.sendMessage();
			}
		});
		this.registerDomEvent(this.input, "input", () => {
			this.autoResizeTextarea();
		});

		this.sendBtn = inputWrapper.createEl("button", {
			cls: "composer-send-btn",
		});
		this.sendBtn.textContent = UI_TEXTS.SEND_BUTTON_TEXT;
		this.sendBtn.title = UI_TEXTS.SEND_BUTTON_TITLE;
		this.sendBtn.disabled = !this.selectedModelId;
		this.registerDomEvent(this.sendBtn, "click", () => {
			void this.sendMessage();
		});
	}

	private autoResizeTextarea(): void {
		if (!this.input) return;
		this.input.setCssProps({
			height: "auto",
		});
		this.input.setCssProps({
			height:
				Math.min(
					this.input.scrollHeight,
					UI_CONFIG.TEXTAREA_MAX_HEIGHT,
				) + "px",
		});
	}

	private focusInput(): void {
		if (this.input) {
			this.input.focus();
		}
	}

	private updateSendButtonState(): void {
		if (this.sendBtn) {
			this.sendBtn.disabled = !this.selectedModelId;
		}
	}

	private renderMessages(): void {
		if (!this.messagesContainer) return;
		this.messagesContainer.empty();

		const messagesDiv = this.messagesContainer.createDiv("ai-messages");

		for (const message of this.messages) {
			const messageEl = messagesDiv.createDiv(
				`ai-message ${message.role}`,
			);

			const contentDiv = messageEl.createDiv("message-content");
			const textEl = contentDiv.createDiv("message-text");
			textEl.textContent = message.content;

			const actionsDiv = contentDiv.createDiv("message-actions");

			const copyBtn = actionsDiv.createEl("button", {
				cls: "action-btn",
			});
			copyBtn.textContent = UI_TEXTS.COPY_BUTTON_TEXT;
			copyBtn.title = UI_TEXTS.COPY_BUTTON_TITLE;
			this.registerDomEvent(copyBtn, "click", () => {
				void navigator.clipboard.writeText(message.content);
			});

			const deleteBtn = actionsDiv.createEl("button", {
				cls: "action-btn",
			});
			deleteBtn.textContent = UI_TEXTS.DELETE_BUTTON_TEXT;
			deleteBtn.title = UI_TEXTS.DELETE_BUTTON_TITLE;
			this.registerDomEvent(deleteBtn, "click", () => {
				this.messages = this.messages.filter(
					(m) => m.id !== message.id,
				);
				void this.deleteMessageFromBackend(message.id);
				this.renderMessages();
			});
		}

		if (this.isLoading) {
			const loadingEl = messagesDiv.createDiv("message-loading");
			for (let i = 0; i < UI_CONFIG.LOADING_DOTS_COUNT; i++) {
				loadingEl.createEl("span");
			}
		}

		this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
	}

	private async sendMessage(): Promise<void> {
		if (!this.input || this.isLoading) return;

		const message = this.input.value.trim();
		if (!message) return;

		if (!this.selectedModelId) {
			const errorMessage: ChatMessage = {
				id: generateMessageId(),
				role: "assistant",
				content: "错误: 请先选择一个模型",
				timestamp: Date.now(),
			};
			this.messages.push(errorMessage);
			this.renderMessages();
			return;
		}

		this.input.value = "";
		this.input.setCssProps({
			height: "auto",
		});

		const userMessage: ChatMessage = {
			id: generateMessageId(),
			role: "user",
			content: message,
			timestamp: Date.now(),
		};

		this.messages.push(userMessage);
		this.renderMessages();

		this.isLoading = true;
		this.renderMessages();

		const timeoutMs = 30000;
		let timeoutId: number | null = null;

		try {
			const response = await Promise.race([
				requestUrl({
					url: getChatUrl(),
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						message,
						modelId: this.selectedModelId,
					}),
				}),
				new Promise<never>((_, reject) => {
					timeoutId = window.setTimeout(() => {
						reject(
							new Error(
								"请求超时（30秒）。请检查服务器是否正常运行。",
							),
						);
					}, timeoutMs);
				}),
			]);

			if (response.status !== 200) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const validatedData = validateChatResponse(response.json);
			const assistantMessage: ChatMessage = {
				id: generateMessageId(),
				role: "assistant",
				content:
					validatedData.response ||
					validatedData.error ||
					UI_TEXTS.NO_RESPONSE,
				timestamp: Date.now(),
			};

			this.messages.push(assistantMessage);
		} catch (error) {
			const errorMessage: ChatMessage = {
				id: generateMessageId(),
				role: "assistant",
				content: `${UI_TEXTS.ERROR_PREFIX}: ${error instanceof Error ? error.message : "Unknown error"}`,
				timestamp: Date.now(),
			};
			this.messages.push(errorMessage);
			console.error("Chat error:", error);
		} finally {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
			this.isLoading = false;
			this.renderMessages();
			this.focusInput();
		}
	}

	private async deleteMessageFromBackend(messageId: string): Promise<void> {
		try {
			await requestUrl({
				url: `${getServerBaseUrl()}/api/chat/delete`,
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ messageId }),
			});
		} catch (error) {
			console.warn(
				"Failed to delete message from backend:",
				error instanceof Error ? error.message : String(error),
			);
		}
	}
}
