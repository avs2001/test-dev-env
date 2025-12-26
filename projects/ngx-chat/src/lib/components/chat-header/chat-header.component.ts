import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Header component for the chat.
 * Supports custom content projection.
 */
@Component({
  selector: 'ngx-chat-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ngx-chat-header',
    role: 'banner',
  },
  template: `
    <div class="ngx-chat-header__content">
      <ng-content />
      @if (!hasContent()) {
        <span class="ngx-chat-header__title">{{ title() }}</span>
      }
    </div>
  `,
  styles: `
    :host {
      display: flex;
      align-items: center;
      min-height: var(--ngx-chat-header-height, 56px);
      padding: 0 var(--ngx-chat-spacing-md, 16px);
      background-color: var(--ngx-chat-bg, #ffffff);
      border-bottom: 1px solid var(--ngx-chat-border, #e5e7eb);
    }

    .ngx-chat-header__content {
      display: flex;
      align-items: center;
      gap: var(--ngx-chat-spacing-sm, 8px);
      flex: 1;
      min-width: 0;
    }

    .ngx-chat-header__title {
      font-weight: 600;
      font-size: 1rem;
      color: var(--ngx-chat-other-color, #1f2937);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `,
})
export class ChatHeaderComponent {
  /** Title to display when no custom content is provided */
  readonly title = input('Chat');

  /** Whether custom content is projected */
  readonly hasContent = input(false);
}
