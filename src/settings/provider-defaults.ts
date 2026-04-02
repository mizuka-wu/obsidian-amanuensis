import type { ProviderType } from "../types/settings";
import { getProviderConfig, type ProviderConfig } from "../providers";

export type { ProviderConfig };

/**
 * @deprecated 使用 getProviderConfig 从 providers/index.ts
 */
export function getProviderDefaults(type: ProviderType): ProviderConfig {
	return getProviderConfig(type);
}
