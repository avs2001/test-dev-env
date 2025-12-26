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

/** Tool call info for display */
export interface ToolCallInfo {
  tool: string;
  input?: Record<string, unknown>;
  output?: string;
  success?: boolean;
  toolUseId?: string;
}

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
  private readonly currentAgentSignal = signal<string | undefined>(undefined);
  private readonly toolCallsSignal = signal<ToolCallInfo[]>([]);

  // Current streaming message ID
  private currentStreamingMessageId: string | null = null;
  private currentTaskId: string | null = null;

  // Public readonly signals
  readonly messages = this.messagesSignal.asReadonly();
  readonly isTyping = this.isTypingSignal.asReadonly();
  readonly typingIndicator = this.typingIndicatorSignal.asReadonly();
  readonly conversationId = this.conversationIdSignal.asReadonly();
  readonly isProcessing = this.isProcessingSignal.asReadonly();
  readonly workingDirectory = this.workingDirectorySignal.asReadonly();
  readonly currentAgent = this.currentAgentSignal.asReadonly();
  readonly toolCalls = this.toolCallsSignal.asReadonly();

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
    this.addSystemMessage("Welcome! I'm connected to a multi-agent AI platform. Ask me anything!");
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
    this.typingIndicatorSignal.set({ name: 'Routing...' });
    this.toolCallsSignal.set([]);

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
      this.addSystemMessage(
        `Error: ${error instanceof Error ? error.message : 'Failed to send message'}`
      );
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
   * Cancel the current task
   */
  cancelCurrentTask(): void {
    if (this.currentTaskId) {
      this.api.cancelTask(this.currentTaskId).subscribe({
        next: () => {
          this.addSystemMessage('Task cancelled.');
        },
        error: () => {
          this.addSystemMessage('Failed to cancel task.');
        },
      });
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
    this.currentTaskId = null;
    this.currentAgentSignal.set(undefined);
    this.toolCallsSignal.set([]);
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
      // Message lifecycle events
      case 'started':
        this.typingIndicatorSignal.set({
          name: event.agentName ?? event.agentId ?? 'Processing...',
        });
        break;

      case 'completed':
        if (event.content && this.currentStreamingMessageId) {
          // If we have final content, update the message
          this.messagesSignal.update((msgs) => {
            const existing = msgs.find((m) => m.id === this.currentStreamingMessageId);
            if (existing && !existing.content) {
              return appendMessageContent(msgs, this.currentStreamingMessageId!, event.content!);
            }
            return msgs;
          });
        }
        this.finishProcessing();
        break;

      // Agent task events
      case 'task_started':
        this.currentTaskId = event.taskId ?? null;
        this.currentAgentSignal.set(event.agentName ?? event.agentId);
        this.typingIndicatorSignal.set({
          name: `${event.agentName ?? event.agentId ?? 'Agent'} working...`,
        });
        break;

      case 'task_progress':
        if (event.data) {
          const stage = event.data['stage'] as string | undefined;
          const message = event.data['message'] as string | undefined;
          if (stage === 'routing' && event.data['decision']) {
            this.typingIndicatorSignal.set({
              name: `Routing to ${event.data['decision']}...`,
            });
          } else if (message) {
            this.typingIndicatorSignal.set({ name: message });
          }
        } else if (event.content) {
          this.typingIndicatorSignal.set({ name: event.content });
        }
        break;

      case 'task_output':
        if (event.content && this.currentStreamingMessageId) {
          this.messagesSignal.update((msgs) =>
            appendMessageContent(msgs, this.currentStreamingMessageId!, event.content!)
          );
        }
        break;

      case 'task_completed':
        if (event.data) {
          const result = event.data['result'] as string | undefined;
          const duration = event.data['duration'] as number | undefined;
          if (result && this.currentStreamingMessageId) {
            // Append result if content is empty
            const currentMessage = this.messagesSignal().find(
              (m) => m.id === this.currentStreamingMessageId
            );
            if (currentMessage && !currentMessage.content) {
              this.messagesSignal.update((msgs) =>
                appendMessageContent(msgs, this.currentStreamingMessageId!, result)
              );
            }
          }
          if (duration) {
            console.log(`Task completed in ${duration}ms`);
          }
        }
        break;

      case 'task_failed':
        if (event.error ?? event.data?.['error']) {
          const errorMsg = (event.error ?? event.data?.['error']) as string;
          if (this.currentStreamingMessageId) {
            this.messagesSignal.update((msgs) => {
              const updated = appendMessageContent(
                msgs,
                this.currentStreamingMessageId!,
                `\n\nError: ${errorMsg}`
              );
              return updateMessageStatus(updated, this.currentStreamingMessageId!, 'error');
            });
          } else {
            this.addSystemMessage(`Error: ${errorMsg}`);
          }
        }
        this.finishProcessing();
        break;

      case 'task_cancelled':
        this.addSystemMessage('Task was cancelled.');
        this.finishProcessing();
        break;

      // Tool events
      case 'tool_call':
        if (event.data) {
          const tool = event.data['tool'] as string;
          const input = event.data['input'] as Record<string, unknown> | undefined;
          const toolUseId = event.data['toolUseId'] as string | undefined;
          this.typingIndicatorSignal.set({
            name: `Using ${tool}...`,
          });
          this.toolCallsSignal.update((calls) => [
            ...calls,
            { tool, input, toolUseId },
          ]);
        }
        break;

      case 'tool_result':
        if (event.data) {
          const tool = event.data['tool'] as string;
          const output = event.data['output'] as string | undefined;
          const success = event.data['success'] as boolean | undefined;
          const toolUseId = event.data['toolUseId'] as string | undefined;
          // Update the matching tool call with result
          this.toolCallsSignal.update((calls) => {
            const index = calls.findIndex(
              (c) => c.tool === tool && (toolUseId ? c.toolUseId === toolUseId : !c.output)
            );
            if (index >= 0) {
              const updated = [...calls];
              updated[index] = { ...updated[index], output, success };
              return updated;
            }
            return calls;
          });
        }
        break;

      // Subagent events
      case 'subagent_start':
        if (event.data) {
          const agentType = event.data['agentType'] as string | undefined;
          this.typingIndicatorSignal.set({
            name: `Starting ${agentType ?? 'subagent'}...`,
          });
        }
        break;

      case 'subagent_stop':
        // Subagent finished, parent will continue
        break;

      // Routing
      case 'routing_decision':
        if (event.data?.['decision']) {
          this.typingIndicatorSignal.set({
            name: `Routing to ${event.data['decision']}...`,
          });
        }
        break;

      // Legacy event types (for backwards compatibility)
      case 'progress':
        if (event.content) {
          this.typingIndicatorSignal.set({ name: event.content });
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
        if (event.data) {
          this.typingIndicatorSignal.set({
            name: `Using ${event.data['tool'] ?? 'tool'}...`,
          });
        }
        break;

      case 'error':
        if (event.error) {
          if (this.currentStreamingMessageId) {
            this.messagesSignal.update((msgs) => {
              const updated = appendMessageContent(
                msgs,
                this.currentStreamingMessageId!,
                `\n\nError: ${event.error}`
              );
              return updateMessageStatus(updated, this.currentStreamingMessageId!, 'error');
            });
          } else {
            this.addSystemMessage(`Error: ${event.error}`);
          }
        }
        this.finishProcessing();
        break;

      case 'agent_event':
        // Handle internal agent events if needed
        break;
    }
  }

  /**
   * Clean up after processing completes
   */
  private finishProcessing(): void {
    if (this.currentStreamingMessageId) {
      this.messagesSignal.update((msgs) =>
        updateMessageStatus(msgs, this.currentStreamingMessageId!, 'sent')
      );
    }
    this.isProcessingSignal.set(false);
    this.isTypingSignal.set(false);
    this.typingIndicatorSignal.set(undefined);
    this.currentStreamingMessageId = null;
    this.currentTaskId = null;
    this.currentAgentSignal.set(undefined);
  }
}
