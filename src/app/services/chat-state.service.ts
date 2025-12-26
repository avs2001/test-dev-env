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

/** Activity log entry types */
export type ActivityType =
  | 'routing'
  | 'agent_start'
  | 'agent_complete'
  | 'tool_call'
  | 'tool_result'
  | 'subagent_start'
  | 'subagent_stop'
  | 'progress'
  | 'error'
  | 'info';

/** Activity log entry */
export interface ActivityLogEntry {
  id: string;
  type: ActivityType;
  timestamp: Date;
  message: string;
  details?: Record<string, unknown>;
  agentId?: string;
  agentName?: string;
  taskId?: string;
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
  private readonly activityLogSignal = signal<ActivityLogEntry[]>([]);
  private readonly verboseModeSignal = signal(true);

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
  readonly activityLog = this.activityLogSignal.asReadonly();
  readonly verboseMode = this.verboseModeSignal.asReadonly();

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
   * Toggle verbose mode
   */
  toggleVerboseMode(): void {
    this.verboseModeSignal.update((v) => !v);
  }

  /**
   * Set verbose mode
   */
  setVerboseMode(enabled: boolean): void {
    this.verboseModeSignal.set(enabled);
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
    this.activityLogSignal.set([]);

    this.addActivity('info', 'Message sent, waiting for routing...');

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

      this.addActivity('info', `Conversation: ${response.conversationId}`, {
        messageId: response.messageId,
      });

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
      this.addActivity('error', `Failed to send: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          this.addActivity('info', 'Task cancelled by user');
        },
        error: () => {
          this.addSystemMessage('Failed to cancel task.');
          this.addActivity('error', 'Failed to cancel task');
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
    this.activityLogSignal.set([]);
    this.addSystemMessage('Chat cleared. Start a new conversation!');
  }

  /**
   * Clear the activity log
   */
  clearActivityLog(): void {
    this.activityLogSignal.set([]);
  }

  /**
   * Add an activity log entry
   */
  private addActivity(
    type: ActivityType,
    message: string,
    details?: Record<string, unknown>,
    agentId?: string,
    agentName?: string,
    taskId?: string
  ): void {
    const entry: ActivityLogEntry = {
      id: generateId('act'),
      type,
      timestamp: new Date(),
      message,
      details,
      agentId,
      agentName,
      taskId,
    };
    this.activityLogSignal.update((log) => [...log, entry]);

    // In verbose mode, also add as system message for important events
    if (this.verboseModeSignal()) {
      const icon = this.getActivityIcon(type);
      const prefix = agentName ? `[${agentName}] ` : '';
      this.addVerboseMessage(`${icon} ${prefix}${message}`);
    }
  }

  /**
   * Get icon for activity type
   */
  private getActivityIcon(type: ActivityType): string {
    switch (type) {
      case 'routing':
        return '🔀';
      case 'agent_start':
        return '🤖';
      case 'agent_complete':
        return '✅';
      case 'tool_call':
        return '🔧';
      case 'tool_result':
        return '📋';
      case 'subagent_start':
        return '👥';
      case 'subagent_stop':
        return '👤';
      case 'progress':
        return '⏳';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      default:
        return '•';
    }
  }

  /**
   * Add a verbose message (smaller/less prominent system message)
   */
  private addVerboseMessage(content: string): void {
    const message = createSystemMessage(content);
    this.messagesSignal.update((msgs) => [...msgs, message]);
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
        this.addActivity(
          'info',
          `Processing started`,
          { conversationId: event.conversationId, messageId: event.messageId },
          event.agentId,
          event.agentName
        );
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
        this.addActivity('info', 'Processing completed');
        this.finishProcessing();
        break;

      // Agent task events
      case 'task_started':
        this.currentTaskId = event.taskId ?? null;
        this.currentAgentSignal.set(event.agentName ?? event.agentId);
        this.typingIndicatorSignal.set({
          name: `${event.agentName ?? event.agentId ?? 'Agent'} working...`,
        });
        const tools = (event.data?.['tools'] as string[]) ?? [];
        this.addActivity(
          'agent_start',
          `Agent started: ${event.agentName ?? event.agentId}`,
          {
            taskId: event.taskId,
            prompt: event.data?.['prompt'],
            tools,
          },
          event.agentId,
          event.agentName,
          event.taskId
        );
        if (tools.length > 0) {
          this.addActivity(
            'info',
            `Available tools: ${tools.join(', ')}`,
            undefined,
            event.agentId,
            event.agentName
          );
        }
        break;

      case 'task_progress':
        if (event.data) {
          const stage = event.data['stage'] as string | undefined;
          const message = event.data['message'] as string | undefined;
          const percentage = event.data['percentage'] as number | undefined;

          if (stage === 'routing' && event.data['decision']) {
            const decision = event.data['decision'] as string;
            this.typingIndicatorSignal.set({
              name: `Routing to ${decision}...`,
            });
            this.addActivity(
              'routing',
              `Routing decision: ${decision}`,
              { stage, decision },
              event.agentId,
              event.agentName,
              event.taskId
            );
          } else if (message) {
            this.typingIndicatorSignal.set({ name: message });
            this.addActivity(
              'progress',
              percentage !== undefined ? `${message} (${percentage}%)` : message,
              { stage, percentage, ...event.data },
              event.agentId,
              event.agentName,
              event.taskId
            );
          }
        } else if (event.content) {
          this.typingIndicatorSignal.set({ name: event.content });
          this.addActivity(
            'progress',
            event.content,
            undefined,
            event.agentId,
            event.agentName,
            event.taskId
          );
        }
        break;

      case 'task_output':
        if (event.content && this.currentStreamingMessageId) {
          this.messagesSignal.update((msgs) =>
            appendMessageContent(msgs, this.currentStreamingMessageId!, event.content!)
          );
        }
        // Don't log every output chunk to avoid spam
        break;

      case 'task_completed':
        if (event.data) {
          const duration = event.data['duration'] as number | undefined;
          const usage = event.data['usage'] as { inputTokens?: number; outputTokens?: number } | undefined;
          const costUsd = event.data['costUsd'] as number | undefined;
          const result = event.data['result'] as string | undefined;

          if (result && this.currentStreamingMessageId) {
            const currentMessage = this.messagesSignal().find(
              (m) => m.id === this.currentStreamingMessageId
            );
            if (currentMessage && !currentMessage.content) {
              this.messagesSignal.update((msgs) =>
                appendMessageContent(msgs, this.currentStreamingMessageId!, result)
              );
            }
          }

          let completionMsg = `Task completed`;
          if (duration) {
            completionMsg += ` in ${duration}ms`;
          }
          if (usage) {
            completionMsg += ` | Tokens: ${usage.inputTokens ?? 0} in, ${usage.outputTokens ?? 0} out`;
          }
          if (costUsd !== undefined) {
            completionMsg += ` | Cost: $${costUsd.toFixed(4)}`;
          }

          this.addActivity(
            'agent_complete',
            completionMsg,
            { duration, usage, costUsd },
            event.agentId,
            event.agentName,
            event.taskId
          );
        }
        break;

      case 'task_failed':
        const errorMsg = (event.error ?? event.data?.['error']) as string | undefined;
        const recoverable = event.data?.['recoverable'] as boolean | undefined;
        const errorCode = event.data?.['code'] as string | undefined;

        if (errorMsg) {
          if (this.currentStreamingMessageId) {
            this.messagesSignal.update((msgs) => {
              const updated = appendMessageContent(
                msgs,
                this.currentStreamingMessageId!,
                `\n\nError: ${errorMsg}`
              );
              return updateMessageStatus(updated, this.currentStreamingMessageId!, 'error');
            });
          }
        }

        this.addActivity(
          'error',
          `Task failed: ${errorMsg ?? 'Unknown error'}${errorCode ? ` (${errorCode})` : ''}${recoverable ? ' [recoverable]' : ''}`,
          { error: errorMsg, code: errorCode, recoverable },
          event.agentId,
          event.agentName,
          event.taskId
        );
        this.finishProcessing();
        break;

      case 'task_cancelled':
        this.addActivity(
          'info',
          'Task was cancelled',
          undefined,
          event.agentId,
          event.agentName,
          event.taskId
        );
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

          this.toolCallsSignal.update((calls) => [...calls, { tool, input, toolUseId }]);

          // Format input for display
          let inputSummary = '';
          if (input) {
            if (input['file_path']) {
              inputSummary = ` → ${input['file_path']}`;
            } else if (input['pattern']) {
              inputSummary = ` → "${input['pattern']}"`;
            } else if (input['command']) {
              inputSummary = ` → ${(input['command'] as string).substring(0, 50)}...`;
            } else if (input['query']) {
              inputSummary = ` → "${input['query']}"`;
            }
          }

          this.addActivity(
            'tool_call',
            `Calling: ${tool}${inputSummary}`,
            { tool, input, toolUseId },
            event.agentId,
            event.agentName,
            event.taskId
          );
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

          // Summarize output for display
          let outputSummary = '';
          if (output && typeof output === 'string') {
            const lines = output.split('\n').length;
            const chars = output.length;
            if (chars > 100) {
              outputSummary = ` (${lines} lines, ${chars} chars)`;
            } else {
              outputSummary = `: ${output.substring(0, 50)}${output.length > 50 ? '...' : ''}`;
            }
          }

          this.addActivity(
            'tool_result',
            `${tool} ${success ? 'succeeded' : 'failed'}${outputSummary}`,
            { tool, success, outputLength: output?.length, toolUseId },
            event.agentId,
            event.agentName,
            event.taskId
          );
        }
        break;

      // Subagent events
      case 'subagent_start':
        if (event.data) {
          const subagentId = event.data['subagentId'] as string | undefined;
          const agentType = event.data['agentType'] as string | undefined;

          this.typingIndicatorSignal.set({
            name: `Starting ${agentType ?? 'subagent'}...`,
          });

          this.addActivity(
            'subagent_start',
            `Subagent started: ${agentType ?? subagentId ?? 'unknown'}`,
            { subagentId, agentType },
            event.agentId,
            event.agentName,
            event.taskId
          );
        }
        break;

      case 'subagent_stop':
        if (event.data) {
          const subagentId = event.data['subagentId'] as string | undefined;
          const agentType = event.data['agentType'] as string | undefined;

          this.addActivity(
            'subagent_stop',
            `Subagent finished: ${agentType ?? subagentId ?? 'unknown'}`,
            { subagentId, agentType },
            event.agentId,
            event.agentName,
            event.taskId
          );
        }
        break;

      // Routing
      case 'routing_decision':
        if (event.data?.['decision']) {
          const decision = event.data['decision'] as string;
          this.typingIndicatorSignal.set({
            name: `Routing to ${decision}...`,
          });
          this.addActivity(
            'routing',
            `Supervisor routing to: ${decision}`,
            { decision },
            event.agentId,
            event.agentName,
            event.taskId
          );
        }
        break;

      // Legacy event types (for backwards compatibility)
      case 'progress':
        if (event.content) {
          this.typingIndicatorSignal.set({ name: event.content });
          this.addActivity('progress', event.content, undefined, event.agentId, event.agentName);
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
          const tool = event.data['tool'] as string;
          this.typingIndicatorSignal.set({
            name: `Using ${tool}...`,
          });
          this.addActivity('tool_call', `Using tool: ${tool}`, event.data, event.agentId, event.agentName);
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
          }
          this.addActivity('error', event.error, undefined, event.agentId, event.agentName);
        }
        this.finishProcessing();
        break;

      case 'agent_event':
        // Log all agent events for debugging
        if (event.content || event.data) {
          this.addActivity(
            'info',
            event.content ?? 'Agent event',
            event.data,
            event.agentId,
            event.agentName,
            event.taskId
          );
        }
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
