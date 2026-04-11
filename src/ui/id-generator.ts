/**
 * ID 生成器
 * 提供唯一的消息 ID
 */

let messageIdCounter = 0;
let lastTimestamp = 0;

export function generateMessageId(): string {
	const timestamp = Date.now();

	// 如果时间戳相同，继续递增计数器
	if (timestamp === lastTimestamp) {
		messageIdCounter++;
	} else {
		// 时间戳变化，重置计数器
		lastTimestamp = timestamp;
		messageIdCounter = 0;
	}

	return `msg-${timestamp}-${messageIdCounter}`;
}

export function resetIdCounter(): void {
	messageIdCounter = 0;
	lastTimestamp = 0;
}
