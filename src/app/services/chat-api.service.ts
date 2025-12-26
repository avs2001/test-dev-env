import { Injectable, signal, computed, inject, NgZone } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, firstValueFrom } from 'rxjs';

/** API base URL */
const API_BASE_URL = 'http://localhost:3000/api';

/** Request to send a chat message */
export interface SendMessageRequest {
  content: string;
  workingDirectory: string;
  conversationId?: string;
}

/** Response from sending a message */
export interface SendMessageResponse {
  success: boolean;
  conversationId: string;
  messageId: string;
}

/** SSE event from the API */
export interface ChatApiEvent {
  type: 'started' | 'progress' | 'output' | 'tool' | 'completed' | 'error' | 'agent_event';
  conversationId?: string;
  messageId?: string;
  agentId?: string;
  content?: string;
  error?: string;
  data?: Record<string, unknown>;
  timestamp?: string;
}

/** Agent info from the API */
export interface AgentInfo {
  id: string;
  name: string;
  description: string;
}

/** Conversation info */
export interface ConversationInfo {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Service for communicating with the Multi-Agent Platform API.
 */
@Injectable({ providedIn: 'root' })
export class ChatApiService {
  private readonly http = inject(HttpClient);
  private readonly ngZone = inject(NgZone);

  private eventSource: EventSource | null = null;
  private readonly eventsSubject = new Subject<ChatApiEvent>();

  /** Stream of API events */
  readonly events$ = this.eventsSubject.asObservable();

  /** Current connection status */
  private readonly connectionStatusSignal = signal<'disconnected' | 'connecting' | 'connected'>('disconnected');
  readonly connectionStatus = this.connectionStatusSignal.asReadonly();

  /** Whether currently connected to SSE stream */
  readonly isConnected = computed(() => this.connectionStatusSignal() === 'connected');

  /**
   * Send a message to the agent platform
   * @param request - Message request
   * @returns Promise with response
   */
  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    const response = await firstValueFrom(
      this.http.post<SendMessageResponse>(`${API_BASE_URL}/chat/messages`, request)
    );
    return response;
  }

  /**
   * Connect to the SSE event stream
   * @param conversationId - Optional conversation ID to filter events
   */
  connectToStream(conversationId?: string): void {
    // Close existing connection if any
    this.disconnectFromStream();

    this.connectionStatusSignal.set('connecting');

    const url = conversationId
      ? `${API_BASE_URL}/chat/stream?conversationId=${conversationId}`
      : `${API_BASE_URL}/chat/stream`;

    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => {
      this.ngZone.run(() => {
        this.connectionStatusSignal.set('connected');
      });
    };

    this.eventSource.onmessage = (event) => {
      this.ngZone.run(() => {
        try {
          const data = JSON.parse(event.data) as ChatApiEvent;
          this.eventsSubject.next(data);
        } catch {
          // Ignore parse errors
        }
      });
    };

    // Handle specific event types
    const eventTypes = ['started', 'progress', 'output', 'tool', 'completed', 'error', 'agent_event'];
    for (const type of eventTypes) {
      this.eventSource.addEventListener(type, (event: MessageEvent) => {
        this.ngZone.run(() => {
          try {
            const data = JSON.parse(event.data) as ChatApiEvent;
            this.eventsSubject.next({ ...data, type: type as ChatApiEvent['type'] });
          } catch {
            // Ignore parse errors
          }
        });
      });
    }

    this.eventSource.onerror = () => {
      this.ngZone.run(() => {
        this.connectionStatusSignal.set('disconnected');
        this.eventsSubject.next({
          type: 'error',
          error: 'Connection lost. Attempting to reconnect...',
        });
      });
    };
  }

  /**
   * Disconnect from the SSE event stream
   */
  disconnectFromStream(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.connectionStatusSignal.set('disconnected');
  }

  /**
   * Get list of available agents
   * @returns Observable with agents
   */
  getAgents(): Observable<{ success: boolean; agents: AgentInfo[] }> {
    return this.http.get<{ success: boolean; agents: AgentInfo[] }>(`${API_BASE_URL}/chat/agents`);
  }

  /**
   * Get list of conversations
   * @param limit - Maximum number to return
   * @returns Observable with conversations
   */
  getConversations(limit = 50): Observable<{ success: boolean; conversations: ConversationInfo[] }> {
    return this.http.get<{ success: boolean; conversations: ConversationInfo[] }>(
      `${API_BASE_URL}/chat/conversations?limit=${limit}`
    );
  }

  /**
   * Cancel a running task
   * @param taskId - Task ID to cancel
   * @returns Observable with result
   */
  cancelTask(taskId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${API_BASE_URL}/chat/tasks/${taskId}`);
  }

  /**
   * Check API health
   * @returns Observable with health status
   */
  healthCheck(): Observable<{ success: boolean; status: string; timestamp: string }> {
    return this.http.get<{ success: boolean; status: string; timestamp: string }>(
      `${API_BASE_URL}/chat/health`
    );
  }
}
