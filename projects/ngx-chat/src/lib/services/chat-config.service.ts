import { inject, Injectable, signal } from '@angular/core';
import {
  CHAT_CONFIG,
  ChatConfig,
  ChatConfigInput,
  DEFAULT_CHAT_CONFIG,
} from '../models/config.model';

/**
 * Service for managing chat configuration.
 * Provides access to the current configuration and methods to update it.
 */
@Injectable({ providedIn: 'root' })
export class ChatConfigService {
  private readonly injectedConfig = inject(CHAT_CONFIG, { optional: true });
  private readonly configSignal = signal<ChatConfig>(
    this.mergeConfig(DEFAULT_CHAT_CONFIG, this.injectedConfig ?? {})
  );

  /**
   * Get the current configuration as a readonly signal
   */
  readonly config = this.configSignal.asReadonly();

  /**
   * Get the current configuration value
   * @returns Current ChatConfig
   */
  getConfig(): ChatConfig {
    return this.configSignal();
  }

  /**
   * Update the configuration with partial values
   * @param update - Partial configuration to merge
   */
  updateConfig(update: ChatConfigInput): void {
    this.configSignal.update((current) => this.mergeConfig(current, update));
  }

  /**
   * Reset configuration to defaults
   */
  resetConfig(): void {
    this.configSignal.set(
      this.mergeConfig(DEFAULT_CHAT_CONFIG, this.injectedConfig ?? {})
    );
  }

  /**
   * Get a specific configuration section
   * @param section - The configuration section key
   * @returns The configuration section
   */
  getSection<K extends keyof ChatConfig>(section: K): ChatConfig[K] {
    return this.configSignal()[section];
  }

  /**
   * Merge two configurations together
   * @param base - Base configuration
   * @param update - Configuration updates
   * @returns Merged configuration
   */
  private mergeConfig(base: ChatConfig, update: ChatConfigInput): ChatConfig {
    return {
      behavior: { ...base.behavior, ...update.behavior },
      validation: { ...base.validation, ...update.validation },
      markdown: { ...base.markdown, ...update.markdown },
      attachments: { ...base.attachments, ...update.attachments },
      virtualScroll: { ...base.virtualScroll, ...update.virtualScroll },
      errorRecovery: { ...base.errorRecovery, ...update.errorRecovery },
      keyboard: { ...base.keyboard, ...update.keyboard },
      theme: update.theme ?? base.theme,
      direction: update.direction ?? base.direction,
    };
  }
}
