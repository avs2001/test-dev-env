import type { ChatMessage, MessageSender } from '../models/message.model';

/** A group of related messages */
export interface MessageGroup {
  readonly id: string;
  readonly messages: readonly ChatMessage[];
  readonly sender: MessageSender;
  readonly startTime: Date;
  readonly endTime: Date;
}

/**
 * Group consecutive messages from the same sender within a time threshold
 * @param messages - Array of messages to group
 * @param thresholdMs - Time threshold in milliseconds (default: 60000 = 1 minute)
 * @returns Array of message groups
 */
export function groupMessages(
  messages: readonly ChatMessage[],
  thresholdMs = 60000
): MessageGroup[] {
  if (messages.length === 0) {
    return [];
  }

  const groups: MessageGroup[] = [];
  let currentGroup: ChatMessage[] = [messages[0]];

  for (let i = 1; i < messages.length; i++) {
    const prev = messages[i - 1];
    const current = messages[i];

    if (shouldGroupMessages(prev, current, thresholdMs)) {
      currentGroup.push(current);
    } else {
      groups.push(createGroup(currentGroup));
      currentGroup = [current];
    }
  }

  // Push the last group
  if (currentGroup.length > 0) {
    groups.push(createGroup(currentGroup));
  }

  return groups;
}

/**
 * Determine if two consecutive messages should be grouped together
 * @param prev - Previous message
 * @param current - Current message
 * @param thresholdMs - Time threshold in milliseconds
 * @returns Whether the messages should be grouped
 */
export function shouldGroupMessages(
  prev: ChatMessage,
  current: ChatMessage,
  thresholdMs: number
): boolean {
  // System messages are never grouped
  if (prev.sender === 'system' || current.sender === 'system') {
    return false;
  }

  // Different senders cannot be grouped
  if (prev.sender !== current.sender) {
    return false;
  }

  // Messages with actions are not grouped
  if (prev.actions?.length || current.actions?.length) {
    return false;
  }

  // Messages with attachments are not grouped
  if (prev.attachments?.length || current.attachments?.length) {
    return false;
  }

  // Check time difference
  const timeDiff = current.timestamp.getTime() - prev.timestamp.getTime();
  if (timeDiff > thresholdMs) {
    return false;
  }

  return true;
}

/**
 * Create a message group from an array of messages
 * @param messages - Array of messages (must not be empty)
 * @returns MessageGroup
 */
function createGroup(messages: ChatMessage[]): MessageGroup {
  const first = messages[0];
  const last = messages[messages.length - 1];

  return {
    id: `group-${first.id}`,
    messages,
    sender: first.sender,
    startTime: first.timestamp,
    endTime: last.timestamp,
  };
}

/**
 * Check if a message is the first in its group
 * @param message - The message to check
 * @param group - The group containing the message
 * @returns Whether the message is first in the group
 */
export function isFirstInGroup(message: ChatMessage, group: MessageGroup): boolean {
  return group.messages[0].id === message.id;
}

/**
 * Check if a message is the last in its group
 * @param message - The message to check
 * @param group - The group containing the message
 * @returns Whether the message is last in the group
 */
export function isLastInGroup(message: ChatMessage, group: MessageGroup): boolean {
  return group.messages[group.messages.length - 1].id === message.id;
}

/**
 * Get the position of a message within its group
 * @param message - The message to check
 * @param group - The group containing the message
 * @returns Position: 'first', 'middle', 'last', or 'only'
 */
export function getPositionInGroup(
  message: ChatMessage,
  group: MessageGroup
): 'first' | 'middle' | 'last' | 'only' {
  if (group.messages.length === 1) {
    return 'only';
  }

  const index = group.messages.findIndex((m) => m.id === message.id);
  if (index === 0) {
    return 'first';
  }
  if (index === group.messages.length - 1) {
    return 'last';
  }
  return 'middle';
}

/**
 * Find the group containing a specific message
 * @param groups - Array of groups to search
 * @param messageId - ID of the message to find
 * @returns The group containing the message, or undefined
 */
export function findGroupByMessageId(
  groups: readonly MessageGroup[],
  messageId: string
): MessageGroup | undefined {
  return groups.find((g) => g.messages.some((m) => m.id === messageId));
}

/**
 * Get messages with their group position metadata
 * @param messages - Array of messages
 * @param thresholdMs - Time threshold for grouping
 * @returns Messages with position metadata
 */
export function getMessagesWithGroupInfo(
  messages: readonly ChatMessage[],
  thresholdMs = 60000
): Array<{
  message: ChatMessage;
  isFirst: boolean;
  isLast: boolean;
  groupId: string;
}> {
  const groups = groupMessages(messages, thresholdMs);
  const result: Array<{
    message: ChatMessage;
    isFirst: boolean;
    isLast: boolean;
    groupId: string;
  }> = [];

  for (const group of groups) {
    for (let i = 0; i < group.messages.length; i++) {
      result.push({
        message: group.messages[i],
        isFirst: i === 0,
        isLast: i === group.messages.length - 1,
        groupId: group.id,
      });
    }
  }

  return result;
}
