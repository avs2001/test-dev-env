import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ChatMessageBubbleComponent } from '../chat-message-bubble/chat-message-bubble.component';
import { ChatTypingIndicatorComponent } from '../chat-typing-indicator/chat-typing-indicator.component';
import { ChatConfigService } from '../../services/chat-config.service';
import { ChatA11yService } from '../../services/chat-a11y.service';
import { CHAT_I18N } from '../../models/i18n.model';
import type { ChatMessage, TypingIndicator } from '../../models/message.model';
import type { MessageActionEvent } from '../../models/actions.model';
import { getMessagesWithGroupInfo } from '../../utils/grouping.utils';

/**
 * Component that displays the list of chat messages.
 */
@Component({
  selector: 'ngx-chat-messages',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ChatMessageBubbleComponent, ChatTypingIndicatorComponent],
  host: {
    class: 'ngx-chat-messages',
    role: 'log',
    'aria-live': 'polite',
    '[attr.aria-label]': 'i18n.ariaMessageList',
  },
  template: `
    <div
      #scrollContainer
      class="ngx-chat-messages__scroll-container"
      (scroll)="onScroll($event)"
    >
      <div class="ngx-chat-messages__content" role="list">
        @if (messages().length === 0) {
          <div class="ngx-chat-messages__empty">
            {{ i18n.emptyState }}
          </div>
        } @else {
          @for (item of messagesWithGroupInfo(); track item.message.id) {
            <ngx-chat-message-bubble
              role="listitem"
              [message]="item.message"
              [isFirstInGroup]="item.isFirst"
              [isLastInGroup]="item.isLast"
              (action)="action.emit($event)"
              (retry)="retry.emit($event)"
            />
          }
        }

        @if (isTyping()) {
          <ngx-chat-typing-indicator [indicator]="typingIndicator()" />
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      flex: 1;
      min-height: 0;
      overflow: hidden;
    }

    .ngx-chat-messages__scroll-container {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      overscroll-behavior: contain;
      scroll-behavior: smooth;
    }

    .ngx-chat-messages__content {
      display: flex;
      flex-direction: column;
      gap: var(--ngx-chat-spacing-xs, 4px);
      padding: var(--ngx-chat-spacing-md, 16px);
      min-height: 100%;
    }

    .ngx-chat-messages__empty {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1;
      color: var(--ngx-chat-system-color, #6b7280);
      font-size: var(--ngx-chat-font-size-sm, 12px);
      text-align: center;
      padding: var(--ngx-chat-spacing-lg, 24px);
    }
  `,
})
export class ChatMessagesComponent {
  private readonly configService = inject(ChatConfigService);
  private readonly a11yService = inject(ChatA11yService);
  private readonly injector = inject(Injector);
  protected readonly i18n = inject(CHAT_I18N);

  private readonly scrollContainer = viewChild<ElementRef<HTMLElement>>('scrollContainer');

  // Inputs
  /** Array of messages to display */
  readonly messages = input<readonly ChatMessage[]>([]);

  /** Whether someone is typing */
  readonly isTyping = input(false);

  /** Typing indicator information */
  readonly typingIndicator = input<TypingIndicator | undefined>(undefined);

  // Outputs
  /** Emitted when an action is triggered */
  readonly action = output<MessageActionEvent>();

  /** Emitted when a retry is requested */
  readonly retry = output<string>();

  /** Emitted when more messages should be loaded */
  readonly loadMore = output<void>();

  // State
  private readonly shouldAutoScroll = signal(true);
  private readonly isNearBottom = signal(true);
  private lastMessageCount = 0;

  // Computed
  protected readonly messagesWithGroupInfo = computed(() => {
    const config = this.configService.getConfig().behavior;
    if (!config.groupMessages) {
      return this.messages().map((message) => ({
        message,
        isFirst: true,
        isLast: true,
        groupId: `group-${message.id}`,
      }));
    }
    return getMessagesWithGroupInfo(this.messages(), config.groupTimeThreshold);
  });

  constructor() {
    // Auto-scroll when new messages arrive
    effect(() => {
      const messages = this.messages();
      const shouldAutoScroll = this.shouldAutoScroll();
      const nearBottom = this.isNearBottom();

      // Schedule DOM operation for after render
      afterNextRender(
        () => {
          const container = this.scrollContainer()?.nativeElement;
          if (!container) return;

          // Check if new messages were added
          if (messages.length > this.lastMessageCount) {
            const newMessages = messages.slice(this.lastMessageCount);
            const lastNewMessage = newMessages[newMessages.length - 1];

            // Announce new message from others
            if (lastNewMessage && lastNewMessage.sender !== 'self') {
              this.a11yService.announceNewMessage(lastNewMessage);
            }

            // Auto-scroll if enabled and near bottom
            if (shouldAutoScroll && nearBottom) {
              this.scrollToBottom(container);
            }
          }

          this.lastMessageCount = messages.length;
        },
        { injector: this.injector }
      );
    });

    // Handle typing indicator announcement
    effect(() => {
      const isTyping = this.isTyping();
      const indicator = this.typingIndicator();

      if (isTyping) {
        this.a11yService.announceTyping(indicator?.name);
      }
    });
  }

  protected onScroll(event: Event): void {
    const target = event.target as HTMLElement;
    const threshold = this.configService.getConfig().behavior.scrollNearBottomThreshold;

    const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight;
    this.isNearBottom.set(scrollBottom <= threshold);

    // Check if scrolled to top for load more
    if (target.scrollTop === 0 && this.messages().length > 0) {
      this.loadMore.emit();
    }
  }

  private scrollToBottom(container: HTMLElement): void {
    container.scrollTop = container.scrollHeight;
  }

  /**
   * Scroll to a specific message
   * @param messageId - ID of the message to scroll to
   */
  scrollToMessage(messageId: string): void {
    const container = this.scrollContainer()?.nativeElement;
    if (!container) return;

    const messageElement = container.querySelector(`[data-message-id="${messageId}"]`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  /**
   * Enable or disable auto-scrolling
   * @param enabled - Whether auto-scroll should be enabled
   */
  setAutoScroll(enabled: boolean): void {
    this.shouldAutoScroll.set(enabled);
  }
}
