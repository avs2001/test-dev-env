import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CHAT_I18N } from '../../models/i18n.model';
import type { TypingIndicator } from '../../models/message.model';
import { fadeInOutAnimation } from '../../animations/chat.animations';

/**
 * Component that displays a typing indicator.
 */
@Component({
  selector: 'ngx-chat-typing-indicator',
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [fadeInOutAnimation],
  host: {
    class: 'ngx-chat-typing-indicator',
    role: 'status',
    '[attr.aria-label]': 'ariaLabel()',
    '[@fadeInOut]': '',
  },
  template: `
    <div class="ngx-chat-typing-indicator__container">
      @if (indicator()?.avatar) {
        <img
          [src]="indicator()!.avatar"
          [alt]="indicator()?.name ?? ''"
          class="ngx-chat-typing-indicator__avatar"
        />
      }
      <div class="ngx-chat-typing-indicator__bubble">
        <div class="ngx-chat-typing-indicator__dots">
          <span class="ngx-chat-typing-indicator__dot"></span>
          <span class="ngx-chat-typing-indicator__dot"></span>
          <span class="ngx-chat-typing-indicator__dot"></span>
        </div>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      margin-bottom: var(--ngx-chat-spacing-sm, 8px);
    }

    .ngx-chat-typing-indicator__container {
      display: flex;
      align-items: flex-end;
      gap: var(--ngx-chat-spacing-sm, 8px);
    }

    .ngx-chat-typing-indicator__avatar {
      width: var(--ngx-chat-avatar-size, 32px);
      height: var(--ngx-chat-avatar-size, 32px);
      border-radius: 50%;
      object-fit: cover;
    }

    .ngx-chat-typing-indicator__bubble {
      display: inline-flex;
      align-items: center;
      padding: var(--ngx-chat-spacing-sm, 8px) var(--ngx-chat-spacing-md, 16px);
      background-color: var(--ngx-chat-other-bg, #f3f4f6);
      border-radius: var(--ngx-chat-bubble-radius, 16px);
      border-bottom-left-radius: 4px;
    }

    .ngx-chat-typing-indicator__dots {
      display: flex;
      gap: 4px;
    }

    .ngx-chat-typing-indicator__dot {
      width: 8px;
      height: 8px;
      background-color: var(--ngx-chat-system-color, #6b7280);
      border-radius: 50%;
      animation: typing-bounce 1.4s infinite ease-in-out;

      &:nth-child(1) {
        animation-delay: 0s;
      }

      &:nth-child(2) {
        animation-delay: 0.2s;
      }

      &:nth-child(3) {
        animation-delay: 0.4s;
      }
    }

    @keyframes typing-bounce {
      0%,
      60%,
      100% {
        transform: translateY(0);
        opacity: 0.4;
      }
      30% {
        transform: translateY(-4px);
        opacity: 1;
      }
    }
  `,
})
export class ChatTypingIndicatorComponent {
  protected readonly i18n = inject(CHAT_I18N);

  /** Typing indicator information */
  readonly indicator = input<TypingIndicator | undefined>(undefined);

  protected readonly ariaLabel = computed(() => {
    const ind = this.indicator();
    if (ind?.name) {
      return this.i18n.ariaTypingIndicator.replace('{name}', ind.name);
    }
    return this.i18n.someoneTyping;
  });
}
