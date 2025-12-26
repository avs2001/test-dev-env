import { EnvironmentProviders, makeEnvironmentProviders, Provider } from '@angular/core';
import {
  CHAT_CONFIG,
  ChatConfig,
  ChatConfigInput,
  DEFAULT_CHAT_CONFIG,
} from './models/config.model';
import { CHAT_I18N, ChatI18n, DEFAULT_CHAT_I18N } from './models/i18n.model';

/**
 * Options for providing the chat library
 */
export interface ProvideChatOptions {
  /**
   * Chat configuration (partial - will be merged with defaults)
   */
  config?: ChatConfigInput;

  /**
   * Internationalization strings (partial - will be merged with defaults)
   */
  i18n?: Partial<ChatI18n>;
}

/**
 * Merge configuration with defaults
 */
function mergeConfig(defaults: ChatConfig, input?: ChatConfigInput): ChatConfig {
  if (!input) return defaults;

  return {
    behavior: { ...defaults.behavior, ...input.behavior },
    validation: { ...defaults.validation, ...input.validation },
    markdown: { ...defaults.markdown, ...input.markdown },
    attachments: { ...defaults.attachments, ...input.attachments },
    virtualScroll: { ...defaults.virtualScroll, ...input.virtualScroll },
    errorRecovery: { ...defaults.errorRecovery, ...input.errorRecovery },
    keyboard: { ...defaults.keyboard, ...input.keyboard },
    theme: input.theme ?? defaults.theme,
    direction: input.direction ?? defaults.direction,
  };
}

/**
 * Merge i18n strings with defaults
 */
function mergeI18n(defaults: ChatI18n, input?: Partial<ChatI18n>): ChatI18n {
  if (!input) return defaults;
  return { ...defaults, ...input };
}

/**
 * Provide the chat library with optional configuration.
 *
 * @example
 * ```typescript
 * // app.config.ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideChat({
 *       config: {
 *         behavior: {
 *           sendOnEnter: true,
 *           showTimestamps: true,
 *         },
 *         theme: 'auto',
 *       },
 *       i18n: {
 *         send: 'Send',
 *         placeholder: 'Type a message...',
 *       }
 *     })
 *   ]
 * };
 * ```
 */
export function provideChat(options?: ProvideChatOptions): EnvironmentProviders {
  const providers: Provider[] = [];

  // Provide merged configuration
  const config = mergeConfig(DEFAULT_CHAT_CONFIG, options?.config);
  providers.push({
    provide: CHAT_CONFIG,
    useValue: config,
  });

  // Provide merged i18n
  const i18n = mergeI18n(DEFAULT_CHAT_I18N, options?.i18n);
  providers.push({
    provide: CHAT_I18N,
    useValue: i18n,
  });

  return makeEnvironmentProviders(providers);
}

/**
 * Provide chat for a specific component/module with custom configuration.
 * This allows overriding the global configuration for a specific context.
 *
 * @example
 * ```typescript
 * @Component({
 *   providers: [provideChatConfig({ theme: 'dark' })]
 * })
 * export class DarkChatComponent { }
 * ```
 */
export function provideChatConfig(config: ChatConfigInput): Provider {
  return {
    provide: CHAT_CONFIG,
    useValue: mergeConfig(DEFAULT_CHAT_CONFIG, config),
  };
}

/**
 * Provide custom i18n strings for a specific component/module.
 *
 * @example
 * ```typescript
 * @Component({
 *   providers: [provideChatI18n({ send: 'Enviar' })]
 * })
 * export class SpanishChatComponent { }
 * ```
 */
export function provideChatI18n(i18n: Partial<ChatI18n>): Provider {
  return {
    provide: CHAT_I18N,
    useValue: mergeI18n(DEFAULT_CHAT_I18N, i18n),
  };
}
