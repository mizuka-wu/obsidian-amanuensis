import { ItemView, WorkspaceLeaf, requestUrl } from "obsidian";
import { AI_TEXTS } from "./ai-const";
import type { ModelEntry } from "../types/settings";

export const AI_VIEW_TYPE = "ai-assistant-view";

interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	timestamp: number;
}

interface ChatResponse {
	response?: string;
	error?: string;
}

export class AIView extends ItemView {
	private messages: ChatMessage[] = [];
	private isLoading = false;
	private messagesContainer: HTMLDivElement | null = null;
	private input: HTMLTextAreaElement | null = null;
	private selectedModelId: string | null = null;
	private availableModels: ModelEntry[] = [];

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType(): string {
		return AI_VIEW_TYPE;
	}

	getDisplayText(): string {
		return AI_TEXTS.VIEW_DISPLAY_TEXT;
	}

	getIcon(): string {
		return "sparkles";
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

		this.focusInput();
	}

	async onClose(): Promise<void> {
		this.messages = [];
	}

	private async loadAvailableModels(): Promise<void> {
		try {
			const response = await requestUrl({
				url: "http://localhost:8761/api/models",
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
			}
		} catch (error) {
			console.error("Failed to load models:", error);
			this.availableModels = [];
		}
	}

	private createHeader(container: HTMLElement): void {
		const header = container.createDiv("ai-view-header");
		const title = header.createEl("h2");
		title.textContent = AI_TEXTS.VIEW_TITLE;
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

		select.addEventListener("change", (e) => {
			const target = e.target as HTMLSelectElement;
			this.selectedModelId = target.value || null;
		});
	}

	private createMessagesContainer(container: HTMLElement): void {
		this.messagesContainer = container.createDiv("ai-messages-container");

		if (this.messages.length === 0) {
			const emptyState =
				this.messagesContainer.createDiv("ai-empty-state");
			const icon = emptyState.createDiv("empty-icon");
			icon.textContent = AI_TEXTS.EMPTY_STATE_ICON;
			const text = emptyState.createEl("p");
			text.textContent = AI_TEXTS.EMPTY_STATE_TITLE;
			const hint = emptyState.createEl("p", { cls: "empty-hint" });
			hint.textContent = AI_TEXTS.EMPTY_STATE_HINT;
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
		this.input.placeholder = AI_TEXTS.INPUT_PLACEHOLDER;
		this.input.addEventListener("keydown", (e) => {
			if (e.key === "Enter" && !e.shiftKey) {
				e.preventDefault();
				void this.sendMessage();
			}
		});
		this.input.addEventListener("input", () => {
			this.autoResizeTextarea();
		});

		const sendBtn = inputWrapper.createEl("button", {
			cls: "composer-send-btn",
		});
		sendBtn.textContent = AI_TEXTS.SEND_BUTTON_TEXT;
		sendBtn.title = AI_TEXTS.SEND_BUTTON_TITLE;
		sendBtn.addEventListener("click", () => {
			void this.sendMessage();
		});
	}

	private autoResizeTextarea(): void {
		if (!this.input) return;
		this.input.setCssProps({
			height: "auto",
		});
		this.input.setCssProps({
			height: Math.min(this.input.scrollHeight, 120) + "px",
		});
	}

	private focusInput(): void {
		if (this.input) {
			this.input.focus();
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
			copyBtn.textContent = AI_TEXTS.COPY_BUTTON_TEXT;
			copyBtn.title = AI_TEXTS.COPY_BUTTON_TITLE;
			copyBtn.addEventListener("click", () => {
				void navigator.clipboard.writeText(message.content);
			});

			const deleteBtn = actionsDiv.createEl("button", {
				cls: "action-btn",
			});
			deleteBtn.textContent = AI_TEXTS.DELETE_BUTTON_TEXT;
			deleteBtn.title = AI_TEXTS.DELETE_BUTTON_TITLE;
			deleteBtn.addEventListener("click", () => {
				this.messages = this.messages.filter(
					(m) => m.id !== message.id,
				);
				this.renderMessages();
			});
		}

		if (this.isLoading) {
			const loadingEl = messagesDiv.createDiv("message-loading");
			for (let i = 0; i < 3; i++) {
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
				id: Date.now().toString(),
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
			id: Date.now().toString(),
			role: "user",
			content: message,
			timestamp: Date.now(),
		};

		this.messages.push(userMessage);
		this.renderMessages();

		this.isLoading = true;
		this.renderMessages();

		try {
			const response = await requestUrl({
				url: "http://localhost:8761/api/chat",
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					message,
					modelId: this.selectedModelId,
				}),
			});

			if (response.status !== 200) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}

			const data = response.json as ChatResponse;
			const assistantMessage: ChatMessage = {
				id: (Date.now() + 1).toString(),
				role: "assistant",
				content: data.response || AI_TEXTS.NO_RESPONSE,
				timestamp: Date.now(),
			};

			this.messages.push(assistantMessage);
		} catch (error) {
			const errorMessage: ChatMessage = {
				id: (Date.now() + 1).toString(),
				role: "assistant",
				content: `${AI_TEXTS.ERROR_PREFIX}: ${error instanceof Error ? error.message : "Unknown error"}`,
				timestamp: Date.now(),
			};
			this.messages.push(errorMessage);
			console.error("Chat error:", error);
		} finally {
			this.isLoading = false;
			this.renderMessages();
			this.focusInput();
		}
	}
}
