import type { MessageAction } from './actions.model';
import type { MessageAttachment } from './attachment.model';

/** Sender types for chat messages */
export type MessageSender = 'self' | 'other' | 'system';

/** Message status lifecycle */
export type MessageStatus =
  | 'pending' // Queued locally (offline)
  | 'sending' // In transit to server
  | 'sent' // Received by server
  | 'delivered' // Delivered to recipient(s)
  | 'read' // Read by recipient(s)
  | 'error'; // Failed to send

/** Error codes for chat message errors */
export type ChatErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'SERVER_ERROR'
  | 'RATE_LIMITED'
  | 'INVALID_CONTENT'
  | 'ATTACHMENT_TOO_LARGE'
  | 'ATTACHMENT_TYPE_NOT_ALLOWED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'UNKNOWN';

/** Error information attached to a message */
export interface ChatMessageError {
  readonly code: ChatErrorCode;
  readonly message: string;
  readonly retryable: boolean;
  readonly retryCount?: number;
  readonly lastRetryAt?: Date;
}

/** Core message interface (immutable) */
export interface ChatMessage {
  readonly id: string;
  readonly sender: MessageSender;
  readonly content: string;
  readonly timestamp: Date;
  readonly status?: MessageStatus;
  readonly senderName?: string;
  readonly avatar?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly actions?: readonly MessageAction[];
  readonly attachments?: readonly MessageAttachment[];
  readonly error?: ChatMessageError;
  readonly edited?: boolean;
  readonly editedAt?: Date;
  readonly replyTo?: string;
}

/** Event emitted when a message is sent */
export interface ChatSendEvent {
  readonly content: string;
  readonly attachments?: readonly MessageAttachment[];
  readonly replyTo?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/** Event emitted when typing status changes */
export interface ChatTypingEvent {
  readonly isTyping: boolean;
  readonly content?: string;
}

/** Typing indicator information */
export interface TypingIndicator {
  readonly name?: string;
  readonly avatar?: string;
}
