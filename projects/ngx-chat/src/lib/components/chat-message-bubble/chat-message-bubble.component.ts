import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ChatMessageActionsComponent } from '../chat-message-actions/chat-message-actions.component';
import { ChatConfigService } from '../../services/chat-config.service';
import { CHAT_I18N } from '../../models/i18n.model';
import type { ChatMessage } from '../../models/message.model';
import type { MessageActionEvent } from '../../models/actions.model';
import { messageEnterAnimation } from '../../animations/chat.animations';

/**
 * Component that displays a single chat message bubble.
 */
@Component({
  selector: 'ngx-chat-message-bubble',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, ChatMessageActionsComponent],
  animations: [messageEnterAnimation],
  host: {
    class: 'ngx-chat-message-bubble',
    '[class.ngx-chat-message-bubble--self]': 'isSelf()',
    '[class.ngx-chat-message-bubble--other]': 'isOther()',
    '[class.ngx-chat-message-bubble--system]': 'isSystem()',
    '[class.ngx-chat-message-bubble--error]': 'hasError()',
    '[class.ngx-chat-message-bubble--first]': 'isFirstInGroup()',
    '[class.ngx-chat-message-bubble--last]': 'isLastInGroup()',
    '[attr.data-message-id]': 'message().id',
    '[@messageEnter]': '',
  },
  template: `
    <div class="ngx-chat-message-bubble__container">
      @if (showAvatar() && isLastInGroup()) {
        <div class="ngx-chat-message-bubble__avatar">
          @if (message().avatar) {
            <img
              [src]="message().avatar"
              [alt]="message().senderName ?? ''"
              class="ngx-chat-message-bubble__avatar-img"
            />
          } @else {
            <div class="ngx-chat-message-bubble__avatar-placeholder">
              {{ avatarInitial() }}
            </div>
          }
        </div>
      } @else if (showAvatar()) {
        <div class="ngx-chat-message-bubble__avatar-spacer"></div>
      }

      <div class="ngx-chat-message-bubble__content-wrapper">
        @if (showSenderName() && isFirstInGroup() && !isSelf()) {
          <span class="ngx-chat-message-bubble__sender-name">
            {{ message().senderName }}
          </span>
        }

        <div
          class="ngx-chat-message-bubble__bubble"
          [attr.aria-label]="ariaLabel()"
        >
          <div class="ngx-chat-message-bubble__text">
            {{ message().content }}
          </div>

          @if (message().actions?.length) {
            <ngx-chat-message-actions
              [messageId]="message().id"
              [actions]="message().actions!"
              (action)="action.emit($event)"
            />
          }
        </div>

        @if (showTimestamp() && isLastInGroup()) {
          <div class="ngx-chat-message-bubble__meta">
            <span class="ngx-chat-message-bubble__time">
              {{ message().timestamp | date: timestampFormat() }}
            </span>

            @if (message().edited) {
              <span class="ngx-chat-message-bubble__edited">
                {{ i18n.edited }}
              </span>
            }

            @if (isSelf()) {
              <span class="ngx-chat-message-bubble__status">
                {{ statusText() }}
              </span>
            }
          </div>
        }

        @if (hasError()) {
          <div class="ngx-chat-message-bubble__error">
            <span class="ngx-chat-message-bubble__error-text">
              {{ message().error?.message }}
            </span>
            @if (message().error?.retryable) {
              <button
                type="button"
                class="ngx-chat-message-bubble__retry-btn"
                (click)="retry.emit(message().id)"
              >
                {{ i18n.retry }}
              </button>
            }
          </div>
        }
      </div>
    </div>
  `,
  styleUrl: './chat-message-bubble.component.scss',
})
export class ChatMessageBubbleComponent {
  private readonly configService = inject(ChatConfigService);
  protected readonly i18n = inject(CHAT_I18N);

  // Inputs
  /** The message to display */
  readonly message = input.required<ChatMessage>();

  /** Whether this is the first message in a group */
  readonly isFirstInGroup = input(true);

  /** Whether this is the last message in a group */
  readonly isLastInGroup = input(true);

  // Outputs
  /** Emitted when an action is triggered */
  readonly action = output<MessageActionEvent>();

  /** Emitted when retry is requested */
  readonly retry = output<string>();

  // Computed properties
  protected readonly isSelf = computed(() => this.message().sender === 'self');
  protected readonly isOther = computed(() => this.message().sender === 'other');
  protected readonly isSystem = computed(() => this.message().sender === 'system');
  protected readonly hasError = computed(() => this.message().status === 'error');

  protected readonly showAvatar = computed(() => {
    const config = this.configService.getConfig().behavior;
    return config.showAvatar && !this.isSelf() && !this.isSystem();
  });

  protected readonly showSenderName = computed(() => {
    const config = this.configService.getConfig().behavior;
    return config.showSenderName && !this.isSystem();
  });

  protected readonly showTimestamp = computed(() => {
    return this.configService.getConfig().behavior.showTimestamps;
  });

  protected readonly timestampFormat = computed(() => {
    const options = this.configService.getConfig().behavior.timestampFormat;
    // Convert Intl.DateTimeFormatOptions to Angular date pipe format
    // This is a simplified conversion
    return 'shortTime';
  });

  protected readonly avatarInitial = computed(() => {
    const name = this.message().senderName;
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  });

  protected readonly statusText = computed(() => {
    const status = this.message().status;
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
      default:
        return '';
    }
  });

  protected readonly ariaLabel = computed(() => {
    const msg = this.message();
    const sender = msg.sender === 'self'
      ? this.i18n.you
      : (msg.senderName ?? this.i18n.other);
    return `${sender}: ${msg.content}`;
  });
}
