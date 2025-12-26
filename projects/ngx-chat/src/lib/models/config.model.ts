import { InjectionToken } from '@angular/core';

/** Behavior configuration for chat */
export interface ChatBehaviorConfig {
  readonly sendOnEnter: boolean;
  readonly showTimestamps: boolean;
  readonly timestampFormat: Intl.DateTimeFormatOptions;
  readonly autoScroll: boolean;
  readonly groupMessages: boolean;
  readonly groupTimeThreshold: number;
  readonly sendCooldown: number;
  readonly typingDebounce: number;
  readonly scrollNearBottomThreshold: number;
  readonly showSenderName: boolean;
  readonly showAvatar: boolean;
  readonly avatarPosition: 'top' | 'bottom';
}

/** Validation configuration for messages */
export interface ChatValidationConfig {
  readonly minMessageLength: number;
  readonly maxMessageLength: number;
  readonly forbiddenPatterns: readonly RegExp[];
  readonly sanitize: boolean;
  readonly trimWhitespace: boolean;
  readonly allowEmptyContent: boolean;
  readonly maxWordLength: number;
  readonly normalizeUnicode: boolean;
  readonly stripInvisibleChars: boolean;
}

/** Markdown rendering configuration */
export interface ChatMarkdownConfig {
  readonly enabled: boolean;
  readonly syntaxHighlight: boolean;
  readonly allowedTags: readonly string[];
  readonly allowLinks: boolean;
  readonly linkTarget: '_blank' | '_self';
  readonly allowImages: boolean;
}

/** Attachment handling configuration */
export interface ChatAttachmentConfig {
  readonly enabled: boolean;
  readonly maxFileSize: number;
  readonly maxFilesPerMessage: number;
  readonly allowedMimeTypes: readonly string[];
  readonly blockedMimeTypes: readonly string[];
  readonly imageCompression: boolean;
  readonly imageCompressionQuality: number;
  readonly maxImageDimensions: { readonly width: number; readonly height: number };
  readonly thumbnailSize: { readonly width: number; readonly height: number };
  readonly dragAndDrop: boolean;
  readonly pasteFromClipboard: boolean;
}

/** Virtual scroll configuration */
export interface ChatVirtualScrollConfig {
  readonly enabled: boolean;
  readonly itemHeight: number;
  readonly bufferSize: number;
  readonly threshold: number;
}

/** Error recovery configuration */
export interface ChatErrorRecoveryConfig {
  readonly autoRetry: boolean;
  readonly maxRetries: number;
  readonly retryDelay: number;
  readonly exponentialBackoff: boolean;
  readonly maxRetryDelay: number;
  readonly offlineQueue: boolean;
  readonly maxQueueSize: number;
}

/** Keyboard configuration */
export interface ChatKeyboardConfig {
  readonly sendOnEnter: boolean;
  readonly sendOnCtrlEnter: boolean;
  readonly escToClear: boolean;
  readonly escToCancelAction: boolean;
  readonly arrowKeysForActions: boolean;
  readonly upToEditLast: boolean;
  readonly focusTrap: boolean;
}

/** Complete chat configuration */
export interface ChatConfig {
  readonly behavior: ChatBehaviorConfig;
  readonly validation: ChatValidationConfig;
  readonly markdown: ChatMarkdownConfig;
  readonly attachments: ChatAttachmentConfig;
  readonly virtualScroll: ChatVirtualScrollConfig;
  readonly errorRecovery: ChatErrorRecoveryConfig;
  readonly keyboard: ChatKeyboardConfig;
  readonly theme: 'light' | 'dark' | 'auto';
  readonly direction: 'ltr' | 'rtl' | 'auto';
}

/** Partial configuration for user input */
export type ChatConfigInput = {
  readonly [K in keyof ChatConfig]?: Partial<ChatConfig[K]>;
};

/** Default behavior configuration */
export const DEFAULT_BEHAVIOR_CONFIG: ChatBehaviorConfig = {
  sendOnEnter: true,
  showTimestamps: true,
  timestampFormat: { hour: 'numeric', minute: 'numeric' },
  autoScroll: true,
  groupMessages: true,
  groupTimeThreshold: 60000, // 1 minute
  sendCooldown: 0,
  typingDebounce: 300,
  scrollNearBottomThreshold: 100,
  showSenderName: true,
  showAvatar: true,
  avatarPosition: 'bottom',
};

/** Default validation configuration */
export const DEFAULT_VALIDATION_CONFIG: ChatValidationConfig = {
  minMessageLength: 0,
  maxMessageLength: 10000,
  forbiddenPatterns: [],
  sanitize: true,
  trimWhitespace: true,
  allowEmptyContent: false,
  maxWordLength: 100,
  normalizeUnicode: true,
  stripInvisibleChars: true,
};

/** Default markdown configuration */
export const DEFAULT_MARKDOWN_CONFIG: ChatMarkdownConfig = {
  enabled: false,
  syntaxHighlight: false,
  allowedTags: ['p', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li', 'a', 'blockquote'],
  allowLinks: true,
  linkTarget: '_blank',
  allowImages: false,
};

/** Default attachment configuration */
export const DEFAULT_ATTACHMENT_CONFIG: ChatAttachmentConfig = {
  enabled: false,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFilesPerMessage: 5,
  allowedMimeTypes: ['image/*', 'application/pdf', 'text/*'],
  blockedMimeTypes: ['application/x-executable', 'application/x-msdownload'],
  imageCompression: true,
  imageCompressionQuality: 0.8,
  maxImageDimensions: { width: 2048, height: 2048 },
  thumbnailSize: { width: 200, height: 200 },
  dragAndDrop: true,
  pasteFromClipboard: true,
};

/** Default virtual scroll configuration */
export const DEFAULT_VIRTUAL_SCROLL_CONFIG: ChatVirtualScrollConfig = {
  enabled: false,
  itemHeight: 80,
  bufferSize: 5,
  threshold: 100,
};

/** Default error recovery configuration */
export const DEFAULT_ERROR_RECOVERY_CONFIG: ChatErrorRecoveryConfig = {
  autoRetry: true,
  maxRetries: 3,
  retryDelay: 1000,
  exponentialBackoff: true,
  maxRetryDelay: 30000,
  offlineQueue: true,
  maxQueueSize: 50,
};

/** Default keyboard configuration */
export const DEFAULT_KEYBOARD_CONFIG: ChatKeyboardConfig = {
  sendOnEnter: true,
  sendOnCtrlEnter: false,
  escToClear: false,
  escToCancelAction: true,
  arrowKeysForActions: true,
  upToEditLast: false,
  focusTrap: false,
};

/** Default complete configuration */
export const DEFAULT_CHAT_CONFIG: ChatConfig = {
  behavior: DEFAULT_BEHAVIOR_CONFIG,
  validation: DEFAULT_VALIDATION_CONFIG,
  markdown: DEFAULT_MARKDOWN_CONFIG,
  attachments: DEFAULT_ATTACHMENT_CONFIG,
  virtualScroll: DEFAULT_VIRTUAL_SCROLL_CONFIG,
  errorRecovery: DEFAULT_ERROR_RECOVERY_CONFIG,
  keyboard: DEFAULT_KEYBOARD_CONFIG,
  theme: 'auto',
  direction: 'auto',
};

/** Injection token for chat configuration */
export const CHAT_CONFIG = new InjectionToken<ChatConfig>('CHAT_CONFIG', {
  providedIn: 'root',
  factory: () => DEFAULT_CHAT_CONFIG,
});
