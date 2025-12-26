import type { MessageAction } from '../models/actions.model';
import type { MessageAttachment } from '../models/attachment.model';
import type { ChatMessage, ChatMessageError, MessageSender, MessageStatus } from '../models/message.model';
import { generateId } from './id.utils';

/** Options for creating a message */
export interface CreateMessageOptions {
  readonly id?: string;
  readonly status?: MessageStatus;
  readonly senderName?: string;
  readonly avatar?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly actions?: readonly MessageAction[];
  readonly attachments?: readonly MessageAttachment[];
  readonly replyTo?: string;
}

/**
 * Create a message from self (current user)
 * @param content - Message content
 * @param options - Optional message properties
 * @returns New ChatMessage
 */
export function createSelfMessage(content: string, options?: CreateMessageOptions): ChatMessage {
  return createMessage('self', content, options);
}

/**
 * Create a message from another user
 * @param content - Message content
 * @param senderName - Name of the sender
 * @param options - Optional message properties
 * @returns New ChatMessage
 */
export function createOtherMessage(
  content: string,
  senderName?: string,
  options?: CreateMessageOptions
): ChatMessage {
  return createMessage('other', content, {
    senderName,
    ...options,
  });
}

/**
 * Create a system message
 * @param content - Message content
 * @param options - Optional message properties
 * @returns New ChatMessage
 */
export function createSystemMessage(content: string, options?: CreateMessageOptions): ChatMessage {
  return createMessage('system', content, options);
}

/**
 * Create a message with the given sender and content
 * @param sender - Message sender type
 * @param content - Message content
 * @param options - Optional message properties
 * @returns New ChatMessage
 */
export function createMessage(
  sender: MessageSender,
  content: string,
  options?: CreateMessageOptions
): ChatMessage {
  return {
    id: options?.id ?? generateId('msg'),
    sender,
    content,
    timestamp: new Date(),
    status: options?.status ?? (sender === 'self' ? 'sending' : 'sent'),
    senderName: options?.senderName,
    avatar: options?.avatar,
    metadata: options?.metadata,
    actions: options?.actions,
    attachments: options?.attachments,
    replyTo: options?.replyTo,
  };
}

/**
 * Update the status of a message in an array
 * @param messages - Array of messages
 * @param messageId - ID of message to update
 * @param status - New status
 * @returns New array with updated message
 */
export function updateMessageStatus(
  messages: readonly ChatMessage[],
  messageId: string,
  status: MessageStatus
): ChatMessage[] {
  return messages.map((m) =>
    m.id === messageId
      ? { ...m, status, error: status === 'error' ? m.error : undefined }
      : m
  );
}

/**
 * Update a message with an error
 * @param messages - Array of messages
 * @param messageId - ID of message to update
 * @param error - Error information
 * @returns New array with updated message
 */
export function updateMessageError(
  messages: readonly ChatMessage[],
  messageId: string,
  error: ChatMessageError
): ChatMessage[] {
  return messages.map((m) =>
    m.id === messageId ? { ...m, status: 'error' as const, error } : m
  );
}

/**
 * Append content to a message (for streaming responses)
 * @param messages - Array of messages
 * @param messageId - ID of message to update
 * @param chunk - Content chunk to append
 * @returns New array with updated message
 */
export function appendMessageContent(
  messages: readonly ChatMessage[],
  messageId: string,
  chunk: string
): ChatMessage[] {
  return messages.map((m) =>
    m.id === messageId ? { ...m, content: m.content + chunk } : m
  );
}

/**
 * Find a message by ID
 * @param messages - Array of messages
 * @param messageId - ID of message to find
 * @returns The message or undefined
 */
export function findMessage(
  messages: readonly ChatMessage[],
  messageId: string
): ChatMessage | undefined {
  return messages.find((m) => m.id === messageId);
}

/**
 * Get the last message in an array
 * @param messages - Array of messages
 * @returns The last message or undefined
 */
export function getLastMessage(messages: readonly ChatMessage[]): ChatMessage | undefined {
  return messages.length > 0 ? messages[messages.length - 1] : undefined;
}

/**
 * Get the last message sent by self
 * @param messages - Array of messages
 * @returns The last self message or undefined
 */
export function getLastSelfMessage(messages: readonly ChatMessage[]): ChatMessage | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].sender === 'self') {
      return messages[i];
    }
  }
  return undefined;
}

/**
 * Check if a message is from self
 * @param message - Message to check
 * @returns Whether the message is from self
 */
export function isSelfMessage(message: ChatMessage): boolean {
  return message.sender === 'self';
}

/**
 * Check if a message is a system message
 * @param message - Message to check
 * @returns Whether the message is a system message
 */
export function isSystemMessage(message: ChatMessage): boolean {
  return message.sender === 'system';
}

/**
 * Check if a message has actions
 * @param message - Message to check
 * @returns Whether the message has actions
 */
export function hasActions(message: ChatMessage): boolean {
  return message.actions !== undefined && message.actions.length > 0;
}

/**
 * Check if a message has attachments
 * @param message - Message to check
 * @returns Whether the message has attachments
 */
export function hasAttachments(message: ChatMessage): boolean {
  return message.attachments !== undefined && message.attachments.length > 0;
}

/**
 * Check if a message has pending (unanswered) actions
 * @param message - Message to check
 * @returns Whether the message has pending actions
 */
export function hasPendingActions(message: ChatMessage): boolean {
  if (!message.actions) {
    return false;
  }
  return message.actions.some((action) => !action.responded);
}

/**
 * Mark a message as edited
 * @param messages - Array of messages
 * @param messageId - ID of message to update
 * @param newContent - New content
 * @returns New array with updated message
 */
export function updateMessageContent(
  messages: readonly ChatMessage[],
  messageId: string,
  newContent: string
): ChatMessage[] {
  return messages.map((m) =>
    m.id === messageId
      ? { ...m, content: newContent, edited: true, editedAt: new Date() }
      : m
  );
}

/**
 * Remove a message from an array
 * @param messages - Array of messages
 * @param messageId - ID of message to remove
 * @returns New array without the message
 */
export function removeMessage(
  messages: readonly ChatMessage[],
  messageId: string
): ChatMessage[] {
  return messages.filter((m) => m.id !== messageId);
}
