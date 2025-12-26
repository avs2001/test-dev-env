import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  ChatMessage,
  createOtherMessage,
  createSelfMessage,
  createSystemMessage,
  updateMessageStatus,
  appendMessageContent,
  TypingIndicator,
  generateId,
} from 'ngx-chat';
import { ChatApiService, ChatApiEvent } from './chat-api.service';

/**
 * Service for managing chat state and coordinating with the API.
 */
@Injectable({ providedIn: 'root' })
export class ChatStateService {
  private readonly api = inject(ChatApiService);
  private readonly destroyRef = inject(DestroyRef);

  // State signals
  private readonly messagesSignal = signal<ChatMessage[]>([]);
  private readonly isTypingSignal = signal(false);
  private readonly typingIndicatorSignal = signal<TypingIndicator | undefined>(undefined);
  private readonly conversationIdSignal = signal<string | undefined>(undefined);
  private readonly isProcessingSignal = signal(false);
  private readonly workingDirectorySignal = signal('/home/user/test-dev-env');

  // Current streaming message ID
  private currentStreamingMessageId: string | null = null;

  // Public readonly signals
  readonly messages = this.messagesSignal.asReadonly();
  readonly isTyping = this.isTypingSignal.asReadonly();
  readonly typingIndicator = this.typingIndicatorSignal.asReadonly();
  readonly conversationId = this.conversationIdSignal.asReadonly();
  readonly isProcessing = this.isProcessingSignal.asReadonly();
  readonly workingDirectory = this.workingDirectorySignal.asReadonly();

  /** Whether chat is ready to send */
  readonly canSend = computed(() => !this.isProcessingSignal());

  /** Connection status from API */
  readonly connectionStatus = this.api.connectionStatus;

  constructor() {
    // Subscribe to API events
    this.api.events$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      this.handleApiEvent(event);
    });

    // Connect to SSE stream on initialization
    this.api.connectToStream();

    // Add initial welcome message
    this.addSystemMessage('Welcome! I\'m connected to a multi-agent AI platform. Ask me anything!');
  }

  /**
   * Send a message
   * @param content - Message content
   */
  async sendMessage(content: string): Promise<void> {
    if (this.isProcessingSignal()) {
      return;
    }

    // Add user message
    const userMessage = createSelfMessage(content, { status: 'sending' });
    this.messagesSignal.update((msgs) => [...msgs, userMessage]);

    this.isProcessingSignal.set(true);
    this.isTypingSignal.set(true);
    this.typingIndicatorSignal.set({ name: 'Agent' });

    try {
      // Send to API
      const response = await this.api.sendMessage({
        content,
        workingDirectory: this.workingDirectorySignal(),
        conversationId: this.conversationIdSignal(),
      });

      // Update conversation ID if new
      if (!this.conversationIdSignal()) {
        this.conversationIdSignal.set(response.conversationId);
      }

      // Update user message status
      this.messagesSignal.update((msgs) => updateMessageStatus(msgs, userMessage.id, 'sent'));

      // Create placeholder for streaming response
      this.currentStreamingMessageId = generateId('msg');
      const agentMessage = createOtherMessage('', 'Agent', {
        id: this.currentStreamingMessageId,
        status: 'sending',
      });
      this.messagesSignal.update((msgs) => [...msgs, agentMessage]);
    } catch (error) {
      // Handle error
      this.messagesSignal.update((msgs) => updateMessageStatus(msgs, userMessage.id, 'error'));
      this.addSystemMessage(`Error: ${error instanceof Error ? error.message : 'Failed to send message'}`);
      this.isProcessingSignal.set(false);
      this.isTypingSignal.set(false);
      this.typingIndicatorSignal.set(undefined);
    }
  }

  /**
   * Retry a failed message
   * @param messageId - ID of message to retry
   */
  retryMessage(messageId: string): void {
    const message = this.messagesSignal().find((m) => m.id === messageId);
    if (message && message.status === 'error') {
      // Remove the failed message and re-send
      this.messagesSignal.update((msgs) => msgs.filter((m) => m.id !== messageId));
      this.sendMessage(message.content);
    }
  }

  /**
   * Set the working directory
   * @param directory - Directory path
   */
  setWorkingDirectory(directory: string): void {
    this.workingDirectorySignal.set(directory);
  }

  /**
   * Clear the chat history
   */
  clearChat(): void {
    this.messagesSignal.set([]);
    this.conversationIdSignal.set(undefined);
    this.isProcessingSignal.set(false);
    this.isTypingSignal.set(false);
    this.currentStreamingMessageId = null;
    this.addSystemMessage('Chat cleared. Start a new conversation!');
  }

  /**
   * Add a system message
   * @param content - Message content
   */
  private addSystemMessage(content: string): void {
    const message = createSystemMessage(content);
    this.messagesSignal.update((msgs) => [...msgs, message]);
  }

  /**
   * Handle API events
   * @param event - The API event
   */
  private handleApiEvent(event: ChatApiEvent): void {
    switch (event.type) {
      case 'started':
        this.typingIndicatorSignal.set({
          name: event.agentId ? `${event.agentId}` : 'Agent',
        });
        break;

      case 'progress':
        if (event.content) {
          this.typingIndicatorSignal.set({
            name: event.content,
          });
        }
        break;

      case 'output':
        if (event.content && this.currentStreamingMessageId) {
          this.messagesSignal.update((msgs) =>
            appendMessageContent(msgs, this.currentStreamingMessageId!, event.content!)
          );
        }
        break;

      case 'tool':
        // Could show tool usage in UI
        if (event.data) {
          this.typingIndicatorSignal.set({
            name: `Using ${event.data['tool'] ?? 'tool'}...`,
          });
        }
        break;

      case 'completed':
        if (this.currentStreamingMessageId) {
          this.messagesSignal.update((msgs) =>
            updateMessageStatus(msgs, this.currentStreamingMessageId!, 'sent')
          );
        }
        this.isProcessingSignal.set(false);
        this.isTypingSignal.set(false);
        this.typingIndicatorSignal.set(undefined);
        this.currentStreamingMessageId = null;
        break;

      case 'error':
        if (event.error) {
          if (this.currentStreamingMessageId) {
            // Update the streaming message with error content
            this.messagesSignal.update((msgs) => {
              const updated = appendMessageContent(msgs, this.currentStreamingMessageId!, `\n\nError: ${event.error}`);
              return updateMessageStatus(updated, this.currentStreamingMessageId!, 'error');
            });
          } else {
            this.addSystemMessage(`Error: ${event.error}`);
          }
        }
        this.isProcessingSignal.set(false);
        this.isTypingSignal.set(false);
        this.typingIndicatorSignal.set(undefined);
        this.currentStreamingMessageId = null;
        break;

      case 'agent_event':
        // Handle internal agent events if needed
        break;
    }
  }
}
