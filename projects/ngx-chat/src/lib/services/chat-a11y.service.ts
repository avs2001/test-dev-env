import { inject, Injectable } from '@angular/core';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { CHAT_I18N } from '../models/i18n.model';
import type { ChatMessage, MessageStatus } from '../models/message.model';

/**
 * Service for managing accessibility features in the chat component.
 * Handles screen reader announcements and ARIA management.
 */
@Injectable({ providedIn: 'root' })
export class ChatA11yService {
  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private readonly i18n = inject(CHAT_I18N);

  /**
   * Announce a new message to screen readers
   * @param message - The message to announce
   */
  announceNewMessage(message: ChatMessage): void {
    const senderName = this.getSenderDisplayName(message);
    const text = this.i18n.ariaNewMessage.replace('{sender}', senderName);
    const announcement = `${text}: ${this.truncateForAnnouncement(message.content)}`;
    this.liveAnnouncer.announce(announcement, 'polite');
  }

  /**
   * Announce typing status to screen readers
   * @param name - Name of the person typing (optional)
   */
  announceTyping(name?: string): void {
    const text = name
      ? this.i18n.typing.replace('{name}', name)
      : this.i18n.someoneTyping;
    this.liveAnnouncer.announce(text, 'polite');
  }

  /**
   * Announce an error to screen readers
   * @param message - Error message to announce
   */
  announceError(message: string): void {
    this.liveAnnouncer.announce(message, 'assertive');
  }

  /**
   * Announce a status change
   * @param status - The new status
   */
  announceStatus(status: MessageStatus): void {
    const statusText = this.getStatusText(status);
    const text = this.i18n.ariaMessageStatus.replace('{status}', statusText);
    this.liveAnnouncer.announce(text, 'polite');
  }

  /**
   * Announce an action response
   * @param actionType - Type of action
   * @param response - The response
   */
  announceActionResponse(actionType: string, response: string): void {
    this.liveAnnouncer.announce(`${this.i18n.selected}: ${response}`, 'polite');
  }

  /**
   * Announce multiple selections
   * @param count - Number of items selected
   */
  announceSelectionCount(count: number): void {
    const text = this.i18n.selectedCount.replace('{count}', count.toString());
    this.liveAnnouncer.announce(text, 'polite');
  }

  /**
   * Clear any pending announcements
   */
  clear(): void {
    this.liveAnnouncer.clear();
  }

  /**
   * Get display name for a sender
   * @param message - The message
   * @returns Display name
   */
  private getSenderDisplayName(message: ChatMessage): string {
    if (message.sender === 'self') {
      return this.i18n.you;
    }
    if (message.sender === 'system') {
      return this.i18n.system;
    }
    return message.senderName ?? this.i18n.other;
  }

  /**
   * Get status text for display
   * @param status - Message status
   * @returns Status text
   */
  private getStatusText(status: MessageStatus): string {
    switch (status) {
      case 'pending':
      case 'sending':
        return this.i18n.sending;
      case 'sent':
        return this.i18n.sent;
      case 'delivered':
        return this.i18n.delivered;
      case 'read':
        return this.i18n.read;
      case 'error':
        return this.i18n.error;
    }
  }

  /**
   * Truncate content for announcement to prevent overly long announcements
   * @param content - Content to truncate
   * @param maxLength - Maximum length (default: 200)
   * @returns Truncated content
   */
  private truncateForAnnouncement(content: string, maxLength = 200): string {
    if (content.length <= maxLength) {
      return content;
    }
    return content.substring(0, maxLength) + '...';
  }
}
