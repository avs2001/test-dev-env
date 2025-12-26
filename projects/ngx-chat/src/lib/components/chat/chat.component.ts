import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  inject,
  input,
  output,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ChatHeaderComponent } from '../chat-header/chat-header.component';
import { ChatMessagesComponent } from '../chat-messages/chat-messages.component';
import { ChatSenderComponent } from '../chat-sender/chat-sender.component';
import { ChatHeaderContentDirective } from '../../directives/chat-header-content.directive';
import { ChatDropZoneDirective } from '../../directives/chat-drop-zone.directive';
import { ChatConfigService } from '../../services/chat-config.service';
import type { ChatMessage, ChatSendEvent, ChatTypingEvent, TypingIndicator } from '../../models/message.model';
import type { MessageActionEvent } from '../../models/actions.model';
import type { PendingAttachment } from '../../models/attachment.model';

/**
 * Main chat component that combines header, messages, and sender.
 *
 * @example
 * ```html
 * <ngx-chat
 *   [messages]="messages()"
 *   [isTyping]="isTyping()"
 *   [typingIndicator]="typingIndicator()"
 *   (send)="onSend($event)"
 *   (action)="onAction($event)"
 *   (typing)="onTyping($event)"
 * >
 *   <ng-template ngxChatHeaderContent>
 *     <span>Chat Title</span>
 *   </ng-template>
 * </ngx-chat>
 * ```
 */
@Component({
  selector: 'ngx-chat',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    ChatHeaderComponent,
    ChatMessagesComponent,
    ChatSenderComponent,
    ChatDropZoneDirective,
  ],
  host: {
    class: 'ngx-chat',
    '[class.ngx-chat--dark]': 'isDarkTheme()',
    '[class.ngx-chat--rtl]': 'isRtl()',
    '[attr.dir]': 'direction()',
  },
  template: `
    <div
      class="ngx-chat__container"
      ngxChatDropZone
      (filesDropped)="onFilesDropped($event)"
      (invalidFiles)="onInvalidFiles($event)"
    >
      <ngx-chat-header>
        @if (headerContent(); as template) {
          <ng-container *ngTemplateOutlet="template.templateRef" />
        }
      </ngx-chat-header>

      <ngx-chat-messages
        [messages]="messages()"
        [isTyping]="isTyping()"
        [typingIndicator]="typingIndicator()"
        (action)="action.emit($event)"
        (retry)="retry.emit($event)"
        (loadMore)="loadMore.emit()"
      />

      <ngx-chat-sender
        [disabled]="disabled()"
        [placeholder]="placeholder()"
        [pendingAttachments]="pendingAttachments()"
        (send)="send.emit($event)"
        (typing)="typing.emit($event)"
        (attachmentRemove)="attachmentRemove.emit($event)"
      />
    </div>
  `,
  styleUrl: './chat.component.scss',
})
export class ChatComponent {
  private readonly configService = inject(ChatConfigService);

  // Content projection
  protected readonly headerContent = contentChild(ChatHeaderContentDirective);

  // Inputs
  /** Array of chat messages to display */
  readonly messages = input<readonly ChatMessage[]>([]);

  /** Whether someone is currently typing */
  readonly isTyping = input(false);

  /** Information about who is typing */
  readonly typingIndicator = input<TypingIndicator | undefined>(undefined);

  /** Whether the sender input is disabled */
  readonly disabled = input(false);

  /** Placeholder text for the message input */
  readonly placeholder = input<string | undefined>(undefined);

  /** Pending attachments to show in the sender */
  readonly pendingAttachments = input<readonly PendingAttachment[]>([]);

  // Outputs
  /** Emitted when a message is sent */
  readonly send = output<ChatSendEvent>();

  /** Emitted when an action is triggered */
  readonly action = output<MessageActionEvent>();

  /** Emitted when typing status changes */
  readonly typing = output<ChatTypingEvent>();

  /** Emitted when a message retry is requested */
  readonly retry = output<string>();

  /** Emitted when more messages should be loaded */
  readonly loadMore = output<void>();

  /** Emitted when files are dropped */
  readonly filesDropped = output<FileList>();

  /** Emitted when an attachment is removed */
  readonly attachmentRemove = output<string>();

  /** Emitted when invalid files are dropped */
  readonly invalidFiles = output<string[]>();

  // Computed properties
  protected readonly isDarkTheme = computed(() => {
    const theme = this.configService.getConfig().theme;
    if (theme === 'auto') {
      return typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return theme === 'dark';
  });

  protected readonly isRtl = computed(() => {
    const dir = this.configService.getConfig().direction;
    if (dir === 'auto') {
      return typeof document !== 'undefined' &&
        document.documentElement.dir === 'rtl';
    }
    return dir === 'rtl';
  });

  protected readonly direction = computed(() => {
    return this.isRtl() ? 'rtl' : 'ltr';
  });

  protected onFilesDropped(files: FileList): void {
    this.filesDropped.emit(files);
  }

  protected onInvalidFiles(errors: string[]): void {
    this.invalidFiles.emit(errors);
  }
}
