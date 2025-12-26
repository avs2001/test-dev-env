import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  ChatComponent,
  ChatHeaderContentDirective,
  ChatSendEvent,
  MessageActionEvent,
} from 'ngx-chat';
import { ChatStateService } from './services/chat-state.service';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChatComponent, ChatHeaderContentDirective, FormsModule],
  template: `
    <div class="app-container">
      <ngx-chat
        [messages]="chatState.messages()"
        [isTyping]="chatState.isTyping()"
        [typingIndicator]="chatState.typingIndicator()"
        [disabled]="!chatState.canSend()"
        (send)="onSend($event)"
        (action)="onAction($event)"
        (retry)="onRetry($event)"
      >
        <ng-template ngxChatHeaderContent>
          <div class="header-content">
            <div class="header-title">
              <svg class="header-icon" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
              </svg>
              <span>Multi-Agent AI Platform</span>
            </div>
            <div class="header-status">
              @switch (chatState.connectionStatus()) {
                @case ('connected') {
                  <span class="status-indicator status-indicator--connected"></span>
                  <span class="status-text">Connected</span>
                }
                @case ('connecting') {
                  <span class="status-indicator status-indicator--connecting"></span>
                  <span class="status-text">Connecting...</span>
                }
                @case ('disconnected') {
                  <span class="status-indicator status-indicator--disconnected"></span>
                  <span class="status-text">Disconnected</span>
                }
              }
            </div>
          </div>
        </ng-template>
      </ngx-chat>

      <div class="sidebar">
        <h3 class="sidebar-title">Settings</h3>

        <div class="form-group">
          <label class="form-label" for="workingDir">Working Directory</label>
          <input
            type="text"
            id="workingDir"
            class="form-input"
            [ngModel]="chatState.workingDirectory()"
            (ngModelChange)="onWorkingDirectoryChange($event)"
            placeholder="/path/to/project"
          />
          <span class="form-hint">Directory where agents can operate</span>
        </div>

        <div class="actions">
          <button class="btn btn--secondary" (click)="clearChat()">
            Clear Chat
          </button>
        </div>

        <div class="agent-info">
          <h4>Available Agents</h4>
          <ul class="agent-list">
            <li><strong>Code Agent</strong> - Development tasks</li>
            <li><strong>Research Agent</strong> - Web research</li>
            <li><strong>Data Agent</strong> - Data processing</li>
            <li><strong>Writer Agent</strong> - Documentation</li>
            <li><strong>Angular Agent</strong> - Angular development</li>
          </ul>
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100vh;
      width: 100vw;
    }

    .app-container {
      display: grid;
      grid-template-columns: 1fr 280px;
      height: 100%;
      background-color: #f5f5f5;
    }

    ngx-chat {
      height: 100%;
      border-right: 1px solid #e0e0e0;
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      gap: 16px;
    }

    .header-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      font-size: 1rem;
    }

    .header-icon {
      color: #3b82f6;
    }

    .header-status {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      color: #6b7280;
    }

    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .status-indicator--connected {
      background-color: #10b981;
    }

    .status-indicator--connecting {
      background-color: #f59e0b;
      animation: pulse 1.5s infinite;
    }

    .status-indicator--disconnected {
      background-color: #ef4444;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .sidebar {
      display: flex;
      flex-direction: column;
      gap: 16px;
      padding: 16px;
      background-color: #ffffff;
      overflow-y: auto;
    }

    .sidebar-title {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .form-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }

    .form-input {
      padding: 8px 12px;
      font-size: 0.875rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      outline: none;
      transition: border-color 0.15s ease;
    }

    .form-input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgb(59 130 246 / 0.1);
    }

    .form-hint {
      font-size: 0.75rem;
      color: #6b7280;
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    .btn {
      padding: 8px 16px;
      font-size: 0.875rem;
      font-weight: 500;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      transition: background-color 0.15s ease;
    }

    .btn--secondary {
      background-color: #f3f4f6;
      color: #374151;
    }

    .btn--secondary:hover {
      background-color: #e5e7eb;
    }

    .agent-info {
      margin-top: auto;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
    }

    .agent-info h4 {
      margin: 0 0 8px 0;
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
    }

    .agent-list {
      margin: 0;
      padding: 0 0 0 16px;
      font-size: 0.75rem;
      color: #6b7280;
      line-height: 1.8;
    }

    .agent-list strong {
      color: #374151;
    }

    @media (max-width: 768px) {
      .app-container {
        grid-template-columns: 1fr;
      }

      .sidebar {
        display: none;
      }
    }
  `,
})
export class App {
  protected readonly chatState = inject(ChatStateService);

  protected onSend(event: ChatSendEvent): void {
    this.chatState.sendMessage(event.content);
  }

  protected onAction(event: MessageActionEvent): void {
    // Handle action events if needed
    console.log('Action:', event);
  }

  protected onRetry(messageId: string): void {
    this.chatState.retryMessage(messageId);
  }

  protected onWorkingDirectoryChange(directory: string): void {
    this.chatState.setWorkingDirectory(directory);
  }

  protected clearChat(): void {
    this.chatState.clearChat();
  }
}
