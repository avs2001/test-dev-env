/*
 * ngx-chat - Angular Chat Component Library
 * Public API Surface
 */

// Components
export { ChatComponent } from './lib/components/chat/chat.component';
export { ChatHeaderComponent } from './lib/components/chat-header/chat-header.component';
export { ChatMessagesComponent } from './lib/components/chat-messages/chat-messages.component';
export { ChatMessageBubbleComponent } from './lib/components/chat-message-bubble/chat-message-bubble.component';
export { ChatSenderComponent } from './lib/components/chat-sender/chat-sender.component';
export { ChatTypingIndicatorComponent } from './lib/components/chat-typing-indicator/chat-typing-indicator.component';
export { ChatMessageActionsComponent } from './lib/components/chat-message-actions/chat-message-actions.component';

// Directives
export { ChatHeaderContentDirective } from './lib/directives/chat-header-content.directive';
export { ChatDropZoneDirective } from './lib/directives/chat-drop-zone.directive';

// Services
export { ChatConfigService } from './lib/services/chat-config.service';
export { ChatA11yService } from './lib/services/chat-a11y.service';
export { ChatAttachmentService } from './lib/services/chat-attachment.service';
export { ChatErrorRecoveryService } from './lib/services/chat-error-recovery.service';

// Service types
export type { FileValidationResult } from './lib/services/chat-attachment.service';
export type { QueuedMessage } from './lib/services/chat-error-recovery.service';

// Configuration
export { CHAT_CONFIG, DEFAULT_CHAT_CONFIG, DEFAULT_BEHAVIOR_CONFIG, DEFAULT_VALIDATION_CONFIG, DEFAULT_MARKDOWN_CONFIG, DEFAULT_ATTACHMENT_CONFIG, DEFAULT_VIRTUAL_SCROLL_CONFIG, DEFAULT_ERROR_RECOVERY_CONFIG, DEFAULT_KEYBOARD_CONFIG } from './lib/models/config.model';
export type { ChatConfig, ChatConfigInput, ChatBehaviorConfig, ChatValidationConfig, ChatMarkdownConfig, ChatAttachmentConfig, ChatVirtualScrollConfig, ChatErrorRecoveryConfig, ChatKeyboardConfig } from './lib/models/config.model';

// I18n
export { CHAT_I18N, DEFAULT_CHAT_I18N } from './lib/models/i18n.model';
export type { ChatI18n } from './lib/models/i18n.model';

// Message Models
export type { ChatMessage, MessageSender, MessageStatus, ChatMessageError, ChatErrorCode, ChatSendEvent, ChatTypingEvent, TypingIndicator } from './lib/models/message.model';

// Action Models
export type { MessageAction, MessageActionType, MessageActionEvent, ConfirmAction, SelectAction, MultiSelectAction, ButtonsAction, ConfirmActionEvent, SelectActionEvent, MultiSelectActionEvent, ButtonsActionEvent, ActionOption, ActionButton, ButtonVariant } from './lib/models/actions.model';

// Attachment Models
export type { MessageAttachment, PendingAttachment, AttachmentType, AttachmentUploadStatus, AttachmentProgressEvent, AttachmentRemoveEvent } from './lib/models/attachment.model';

// Error Models
export { ERROR_CODES, createError, isRetryable, incrementRetryCount } from './lib/models/error.model';

// Message Utilities
export { createSelfMessage, createOtherMessage, createSystemMessage, createMessage, updateMessageStatus, updateMessageError, appendMessageContent, findMessage, getLastMessage, getLastSelfMessage, isSelfMessage, isSystemMessage, hasActions, hasAttachments, hasPendingActions, updateMessageContent, removeMessage } from './lib/utils/message.utils';
export type { CreateMessageOptions } from './lib/utils/message.utils';

// Action Utilities
export { createConfirmAction, createSelectAction, createMultiSelectAction, createButtonsAction, createActionOption, createActionButton, updateActionResponse, isActionResponded, isActionDisabled, getActionResponse, findAction, getPendingActions } from './lib/utils/action.utils';
export type { CreateConfirmActionOptions, CreateSelectActionOptions, CreateMultiSelectActionOptions, CreateButtonsActionOptions } from './lib/utils/action.utils';

// Validation Utilities
export { validateMessage, sanitizeContent, isEmpty, isEffectivelyEmpty, getCharacterCount, getWordCount, truncate, containsUrl, extractUrls } from './lib/utils/validation.utils';
export type { ValidationResult } from './lib/utils/validation.utils';

// Grouping Utilities
export { groupMessages, shouldGroupMessages, isFirstInGroup, isLastInGroup, getPositionInGroup, findGroupByMessageId, getMessagesWithGroupInfo } from './lib/utils/grouping.utils';
export type { MessageGroup } from './lib/utils/grouping.utils';

// Attachment Utilities
export { getAttachmentType, createPendingAttachment, createAttachment, formatFileSize, isMimeTypeAllowed, isMimeTypeBlocked, getFileExtension, getFileIcon, revokePendingAttachmentUrls, isImageFile, isVideoFile, isAudioFile, getImageDimensions } from './lib/utils/attachment.utils';

// ID Utilities
export { generateId, generateShortId, isValidId, resetIdCounter } from './lib/utils/id.utils';

// Animations
export { chatAnimations, messageEnterAnimation, messageLeaveAnimation, typingPulseAnimation, errorShakeAnimation, fadeInOutAnimation, slideUpAnimation, scaleAnimation } from './lib/animations/chat.animations';

// Provider Functions
export { provideChat, provideChatConfig, provideChatI18n } from './lib/provide-chat';
export type { ProvideChatOptions } from './lib/provide-chat';
