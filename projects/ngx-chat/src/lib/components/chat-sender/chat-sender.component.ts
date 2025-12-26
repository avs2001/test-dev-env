import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatConfigService } from '../../services/chat-config.service';
import { ChatA11yService } from '../../services/chat-a11y.service';
import { CHAT_I18N } from '../../models/i18n.model';
import type { ChatSendEvent, ChatTypingEvent } from '../../models/message.model';
import type { PendingAttachment } from '../../models/attachment.model';
import { validateMessage } from '../../utils/validation.utils';

/**
 * Component for sending messages.
 */
@Component({
  selector: 'ngx-chat-sender',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  host: {
    class: 'ngx-chat-sender',
  },
  template: `
    <div class="ngx-chat-sender__container">
      @if (pendingAttachments().length > 0) {
        <div class="ngx-chat-sender__attachments">
          @for (attachment of pendingAttachments(); track attachment.id) {
            <div class="ngx-chat-sender__attachment">
              @if (attachment.previewUrl) {
                <img
                  [src]="attachment.previewUrl"
                  [alt]="attachment.file.name"
                  class="ngx-chat-sender__attachment-preview"
                />
              } @else {
                <div class="ngx-chat-sender__attachment-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
                  </svg>
                </div>
              }
              <span class="ngx-chat-sender__attachment-name">
                {{ attachment.file.name }}
              </span>
              <button
                type="button"
                class="ngx-chat-sender__attachment-remove"
                [attr.aria-label]="i18n.removeAttachment"
                (click)="removeAttachment(attachment.id)"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
          }
        </div>
      }

      <div class="ngx-chat-sender__input-row">
        <textarea
          #textareaRef
          class="ngx-chat-sender__input"
          [value]="inputValue()"
          [placeholder]="placeholder() ?? i18n.placeholder"
          [disabled]="disabled()"
          [attr.aria-label]="i18n.ariaMessageInput"
          [attr.aria-invalid]="hasError()"
          [attr.aria-describedby]="hasError() ? 'sender-error' : null"
          rows="1"
          (input)="onInput($event)"
          (keydown)="onKeydown($event)"
        ></textarea>

        <button
          type="button"
          class="ngx-chat-sender__button"
          [class.ngx-chat-sender__button--disabled]="!canSend()"
          [disabled]="!canSend()"
          [attr.aria-label]="i18n.ariaSendButton"
          (click)="sendMessage()"
        >
          <svg
            class="ngx-chat-sender__button-icon"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
          <span class="ngx-chat-sender__button-text">{{ i18n.send }}</span>
        </button>
      </div>

      @if (hasError()) {
        <div id="sender-error" class="ngx-chat-sender__error" role="alert">
          {{ errorMessage() }}
        </div>
      }
    </div>
  `,
  styleUrl: './chat-sender.component.scss',
})
export class ChatSenderComponent {
  private readonly configService = inject(ChatConfigService);
  private readonly a11yService = inject(ChatA11yService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly i18n = inject(CHAT_I18N);

  private readonly textareaRef = viewChild<ElementRef<HTMLTextAreaElement>>('textareaRef');
  private typingTimeout: ReturnType<typeof setTimeout> | null = null;

  // Inputs
  /** Whether the sender is disabled */
  readonly disabled = input(false);

  /** Custom placeholder text */
  readonly placeholder = input<string | undefined>(undefined);

  /** Pending attachments */
  readonly pendingAttachments = input<readonly PendingAttachment[]>([]);

  // Outputs
  /** Emitted when a message is sent */
  readonly send = output<ChatSendEvent>();

  /** Emitted when typing status changes */
  readonly typing = output<ChatTypingEvent>();

  /** Emitted when an attachment is removed */
  readonly attachmentRemove = output<string>();

  // State
  protected readonly inputValue = signal('');
  protected readonly errorMessage = signal<string | null>(null);
  private isTyping = false;

  // Computed
  protected readonly hasError = computed(() => this.errorMessage() !== null);

  protected readonly canSend = computed(() => {
    if (this.disabled()) return false;
    if (this.hasError()) return false;

    const hasContent = this.inputValue().trim().length > 0;
    const hasAttachments = this.pendingAttachments().length > 0;

    return hasContent || hasAttachments;
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
      }
    });
  }

  protected onInput(event: Event): void {
    const target = event.target as HTMLTextAreaElement;
    this.inputValue.set(target.value);
    this.autoResize(target);
    this.validateInput(target.value);
    this.handleTyping(target.value);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const config = this.configService.getConfig().keyboard;

    // Send on Enter (without Shift)
    if (event.key === 'Enter' && !event.shiftKey && config.sendOnEnter) {
      event.preventDefault();
      this.sendMessage();
      return;
    }

    // Send on Ctrl/Cmd+Enter
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey) && config.sendOnCtrlEnter) {
      event.preventDefault();
      this.sendMessage();
      return;
    }

    // Escape to clear
    if (event.key === 'Escape' && config.escToClear) {
      this.clearInput();
    }
  }

  protected sendMessage(): void {
    if (!this.canSend()) return;

    const content = this.inputValue().trim();
    const validationConfig = this.configService.getConfig().validation;
    const validation = validateMessage(content, validationConfig);

    if (!validation.valid && !this.configService.getConfig().validation.allowEmptyContent) {
      this.errorMessage.set(validation.error ?? null);
      this.a11yService.announceError(validation.error ?? 'Invalid message');
      return;
    }

    const sendEvent: ChatSendEvent = {
      content: validation.sanitized ?? content,
    };

    this.send.emit(sendEvent);
    this.clearInput();
    this.emitTyping(false);
  }

  protected removeAttachment(attachmentId: string): void {
    this.attachmentRemove.emit(attachmentId);
  }

  private validateInput(value: string): void {
    const config = this.configService.getConfig().validation;

    // Only validate length while typing
    if (value.length > config.maxMessageLength) {
      this.errorMessage.set(`Message cannot exceed ${config.maxMessageLength} characters`);
    } else {
      this.errorMessage.set(null);
    }
  }

  private handleTyping(content: string): void {
    const hasContent = content.trim().length > 0;
    const debounce = this.configService.getConfig().behavior.typingDebounce;

    // Clear existing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }

    // Emit typing start
    if (hasContent && !this.isTyping) {
      this.emitTyping(true, content);
    }

    // Set timeout to emit typing stop
    if (hasContent) {
      this.typingTimeout = setTimeout(() => {
        this.emitTyping(false);
      }, debounce + 2000);
    } else if (this.isTyping) {
      this.emitTyping(false);
    }
  }

  private emitTyping(isTyping: boolean, content?: string): void {
    this.isTyping = isTyping;
    this.typing.emit({ isTyping, content });
  }

  private clearInput(): void {
    this.inputValue.set('');
    this.errorMessage.set(null);

    const textarea = this.textareaRef()?.nativeElement;
    if (textarea) {
      textarea.value = '';
      textarea.style.height = 'auto';
    }
  }

  private autoResize(textarea: HTMLTextAreaElement): void {
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  }

  /**
   * Focus the input textarea
   */
  focus(): void {
    this.textareaRef()?.nativeElement.focus();
  }

  /**
   * Clear the input
   */
  clear(): void {
    this.clearInput();
  }
}
