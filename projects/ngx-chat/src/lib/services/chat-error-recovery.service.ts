import { computed, inject, Injectable, signal } from '@angular/core';
import type { ChatMessage, ChatMessageError } from '../models/message.model';
import { ChatConfigService } from './chat-config.service';

/** A message queued for retry */
export interface QueuedMessage {
  readonly message: ChatMessage;
  readonly queuedAt: Date;
  readonly attempts: number;
}

/**
 * Service for handling message error recovery and offline queue.
 */
@Injectable({ providedIn: 'root' })
export class ChatErrorRecoveryService {
  private readonly configService = inject(ChatConfigService);
  private readonly queueSignal = signal<QueuedMessage[]>([]);
  private readonly onlineSignal = signal(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  /** Number of queued messages */
  readonly queuedCount = computed(() => this.queueSignal().length);

  /** Current online status */
  readonly isOnline = this.onlineSignal.asReadonly();

  /** Whether there are queued messages */
  readonly hasQueuedMessages = computed(() => this.queueSignal().length > 0);

  constructor() {
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.onlineSignal.set(true));
      window.addEventListener('offline', () => this.onlineSignal.set(false));
    }
  }

  /**
   * Add a message to the retry queue
   * @param message - Message to queue
   */
  enqueue(message: ChatMessage): void {
    const config = this.configService.getSection('errorRecovery');

    if (!config.offlineQueue) {
      return;
    }

    this.queueSignal.update((queue) => {
      // Check max queue size
      if (queue.length >= config.maxQueueSize) {
        // Remove oldest message
        queue = queue.slice(1);
      }

      // Check if message is already queued
      if (queue.some((q) => q.message.id === message.id)) {
        return queue.map((q) =>
          q.message.id === message.id
            ? { ...q, attempts: q.attempts + 1 }
            : q
        );
      }

      return [
        ...queue,
        {
          message,
          queuedAt: new Date(),
          attempts: 0,
        },
      ];
    });
  }

  /**
   * Remove a message from the queue
   * @param messageId - ID of message to remove
   */
  dequeue(messageId: string): void {
    this.queueSignal.update((queue) =>
      queue.filter((q) => q.message.id !== messageId)
    );
  }

  /**
   * Get all queued messages
   * @returns Array of queued messages
   */
  getQueue(): QueuedMessage[] {
    return this.queueSignal();
  }

  /**
   * Flush and return all queued messages, clearing the queue
   * @returns Array of queued messages
   */
  flushQueue(): QueuedMessage[] {
    const queue = this.queueSignal();
    this.queueSignal.set([]);
    return queue;
  }

  /**
   * Clear the entire queue
   */
  clearQueue(): void {
    this.queueSignal.set([]);
  }

  /**
   * Calculate retry delay with optional exponential backoff
   * @param attempts - Number of previous attempts
   * @returns Delay in milliseconds
   */
  getRetryDelay(attempts: number): number {
    const config = this.configService.getSection('errorRecovery');

    if (!config.exponentialBackoff) {
      return config.retryDelay;
    }

    const delay = config.retryDelay * Math.pow(2, attempts);
    return Math.min(delay, config.maxRetryDelay);
  }

  /**
   * Check if an error should be retried
   * @param error - The error to check
   * @returns Whether retry should be attempted
   */
  shouldRetry(error: ChatMessageError): boolean {
    if (!error.retryable) {
      return false;
    }

    const config = this.configService.getSection('errorRecovery');

    if (!config.autoRetry) {
      return false;
    }

    return (error.retryCount ?? 0) < config.maxRetries;
  }

  /**
   * Check if auto-retry is enabled
   * @returns Whether auto-retry is enabled
   */
  isAutoRetryEnabled(): boolean {
    return this.configService.getSection('errorRecovery').autoRetry;
  }

  /**
   * Get maximum number of retries configured
   * @returns Maximum retries
   */
  getMaxRetries(): number {
    return this.configService.getSection('errorRecovery').maxRetries;
  }

  /**
   * Check if offline queue is enabled
   * @returns Whether offline queue is enabled
   */
  isOfflineQueueEnabled(): boolean {
    return this.configService.getSection('errorRecovery').offlineQueue;
  }
}
