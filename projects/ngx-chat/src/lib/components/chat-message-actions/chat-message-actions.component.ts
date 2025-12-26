import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { CHAT_I18N } from '../../models/i18n.model';
import type {
  ButtonsAction,
  ConfirmAction,
  MessageAction,
  MessageActionEvent,
  MultiSelectAction,
  SelectAction,
} from '../../models/actions.model';
import { slideUpAnimation } from '../../animations/chat.animations';

/**
 * Component that renders message actions based on their type.
 */
@Component({
  selector: 'ngx-chat-message-actions',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet],
  animations: [slideUpAnimation],
  host: {
    class: 'ngx-chat-message-actions',
    '[@slideUp]': '',
  },
  template: `
    <div class="ngx-chat-message-actions__container">
      @for (action of actions(); track action.id) {
        @switch (action.type) {
          @case ('confirm') {
            <ng-container
              *ngTemplateOutlet="confirmTpl; context: { $implicit: asConfirm(action) }"
            />
          }
          @case ('select') {
            <ng-container
              *ngTemplateOutlet="selectTpl; context: { $implicit: asSelect(action) }"
            />
          }
          @case ('multi-select') {
            <ng-container
              *ngTemplateOutlet="multiSelectTpl; context: { $implicit: asMultiSelect(action) }"
            />
          }
          @case ('buttons') {
            <ng-container
              *ngTemplateOutlet="buttonsTpl; context: { $implicit: asButtons(action) }"
            />
          }
        }
      }
    </div>

    <!-- Confirm Action Template -->
    <ng-template #confirmTpl let-action>
      <div class="ngx-chat-message-actions__confirm">
        @if (action.responded) {
          <span class="ngx-chat-message-actions__response">
            {{ action.response ? i18n.confirmed : i18n.cancelled }}
          </span>
        } @else {
          <button
            type="button"
            class="ngx-chat-message-actions__btn ngx-chat-message-actions__btn--primary"
            [disabled]="action.disabled"
            (click)="onConfirm(action, true)"
          >
            {{ action.confirmText ?? i18n.confirmYes }}
          </button>
          <button
            type="button"
            class="ngx-chat-message-actions__btn ngx-chat-message-actions__btn--secondary"
            [disabled]="action.disabled"
            (click)="onConfirm(action, false)"
          >
            {{ action.cancelText ?? i18n.confirmNo }}
          </button>
        }
      </div>
    </ng-template>

    <!-- Select Action Template -->
    <ng-template #selectTpl let-action>
      <div class="ngx-chat-message-actions__select">
        @if (action.label) {
          <span class="ngx-chat-message-actions__label">{{ action.label }}</span>
        }
        @if (action.responded) {
          <span class="ngx-chat-message-actions__response">
            {{ getOptionLabel(action, action.response) }}
          </span>
        } @else {
          <div
            class="ngx-chat-message-actions__options"
            role="listbox"
            [attr.aria-label]="action.label"
          >
            @for (option of action.options; track option.id) {
              <button
                type="button"
                role="option"
                class="ngx-chat-message-actions__option"
                [disabled]="action.disabled || option.disabled"
                [attr.aria-selected]="false"
                (click)="onSelect(action, option.id)"
              >
                {{ option.label }}
              </button>
            }
          </div>
        }
      </div>
    </ng-template>

    <!-- Multi-Select Action Template -->
    <ng-template #multiSelectTpl let-action>
      <div class="ngx-chat-message-actions__multi-select">
        @if (action.label) {
          <span class="ngx-chat-message-actions__label">{{ action.label }}</span>
        }
        @if (action.responded) {
          <span class="ngx-chat-message-actions__response">
            {{ getMultiSelectResponse(action) }}
          </span>
        } @else {
          <div
            class="ngx-chat-message-actions__options"
            role="listbox"
            aria-multiselectable="true"
            [attr.aria-label]="action.label"
          >
            @for (option of action.options; track option.id) {
              <button
                type="button"
                role="option"
                class="ngx-chat-message-actions__option"
                [class.ngx-chat-message-actions__option--selected]="isSelected(action.id, option.id)"
                [disabled]="action.disabled || option.disabled || isMaxSelected(action)"
                [attr.aria-selected]="isSelected(action.id, option.id)"
                (click)="toggleSelection(action.id, option.id)"
              >
                {{ option.label }}
              </button>
            }
          </div>
          @if (getSelectionCount(action.id) > 0) {
            <div class="ngx-chat-message-actions__submit-row">
              <span class="ngx-chat-message-actions__count">
                {{ i18n.selectedCount.replace('{count}', getSelectionCount(action.id).toString()) }}
              </span>
              <button
                type="button"
                class="ngx-chat-message-actions__btn ngx-chat-message-actions__btn--primary"
                [disabled]="!canSubmitMultiSelect(action)"
                (click)="onMultiSelectSubmit(action)"
              >
                {{ action.submitText ?? i18n.submit }}
              </button>
            </div>
          }
        }
      </div>
    </ng-template>

    <!-- Buttons Action Template -->
    <ng-template #buttonsTpl let-action>
      <div
        class="ngx-chat-message-actions__buttons"
        [class.ngx-chat-message-actions__buttons--horizontal]="action.layout === 'horizontal'"
        [class.ngx-chat-message-actions__buttons--vertical]="action.layout === 'vertical'"
        [class.ngx-chat-message-actions__buttons--grid]="action.layout === 'grid'"
      >
        @if (action.responded) {
          <span class="ngx-chat-message-actions__response">
            {{ getButtonLabel(action, action.response) }}
          </span>
        } @else {
          @for (button of action.buttons; track button.id) {
            <button
              type="button"
              class="ngx-chat-message-actions__btn"
              [class.ngx-chat-message-actions__btn--primary]="button.variant === 'primary'"
              [class.ngx-chat-message-actions__btn--secondary]="button.variant === 'secondary' || !button.variant"
              [class.ngx-chat-message-actions__btn--danger]="button.variant === 'danger'"
              [class.ngx-chat-message-actions__btn--ghost]="button.variant === 'ghost'"
              [disabled]="action.disabled || button.disabled"
              (click)="onButton(action, button.id)"
            >
              {{ button.label }}
            </button>
          }
        }
      </div>
    </ng-template>
  `,
  styleUrl: './chat-message-actions.component.scss',
})
export class ChatMessageActionsComponent {
  protected readonly i18n = inject(CHAT_I18N);

  /** Message ID this action belongs to */
  readonly messageId = input.required<string>();

  /** Actions to display */
  readonly actions = input.required<readonly MessageAction[]>();

  /** Emitted when an action is triggered */
  readonly action = output<MessageActionEvent>();

  // State for multi-select
  private readonly selections = signal<Map<string, Set<string>>>(new Map());

  // Type guard helpers
  protected asConfirm(action: MessageAction): ConfirmAction {
    return action as ConfirmAction;
  }

  protected asSelect(action: MessageAction): SelectAction {
    return action as SelectAction;
  }

  protected asMultiSelect(action: MessageAction): MultiSelectAction {
    return action as MultiSelectAction;
  }

  protected asButtons(action: MessageAction): ButtonsAction {
    return action as ButtonsAction;
  }

  // Confirm action handler
  protected onConfirm(action: ConfirmAction, response: boolean): void {
    this.action.emit({
      type: 'confirm',
      actionId: action.id,
      messageId: this.messageId(),
      response,
    });
  }

  // Select action handler
  protected onSelect(action: SelectAction, optionId: string): void {
    const option = action.options.find((o) => o.id === optionId);
    if (!option) return;

    this.action.emit({
      type: 'select',
      actionId: action.id,
      messageId: this.messageId(),
      response: optionId,
      option,
    });
  }

  // Multi-select helpers
  protected isSelected(actionId: string, optionId: string): boolean {
    return this.selections().get(actionId)?.has(optionId) ?? false;
  }

  protected getSelectionCount(actionId: string): number {
    return this.selections().get(actionId)?.size ?? 0;
  }

  protected isMaxSelected(action: MultiSelectAction): boolean {
    if (!action.maxSelect) return false;
    return this.getSelectionCount(action.id) >= action.maxSelect;
  }

  protected canSubmitMultiSelect(action: MultiSelectAction): boolean {
    const count = this.getSelectionCount(action.id);
    if (action.minSelect && count < action.minSelect) return false;
    return count > 0;
  }

  protected toggleSelection(actionId: string, optionId: string): void {
    this.selections.update((map) => {
      const newMap = new Map(map);
      let set = newMap.get(actionId);

      if (!set) {
        set = new Set();
        newMap.set(actionId, set);
      } else {
        set = new Set(set);
        newMap.set(actionId, set);
      }

      if (set.has(optionId)) {
        set.delete(optionId);
      } else {
        set.add(optionId);
      }

      return newMap;
    });
  }

  protected onMultiSelectSubmit(action: MultiSelectAction): void {
    const selectedIds = Array.from(this.selections().get(action.id) ?? []);
    const selectedOptions = action.options.filter((o) => selectedIds.includes(o.id));

    this.action.emit({
      type: 'multi-select',
      actionId: action.id,
      messageId: this.messageId(),
      response: selectedIds,
      options: selectedOptions,
    });
  }

  // Buttons action handler
  protected onButton(action: ButtonsAction, buttonId: string): void {
    const button = action.buttons.find((b) => b.id === buttonId);
    if (!button) return;

    this.action.emit({
      type: 'buttons',
      actionId: action.id,
      messageId: this.messageId(),
      response: buttonId,
      button,
    });
  }

  // Label helpers
  protected getOptionLabel(action: SelectAction, optionId?: string): string {
    if (!optionId) return '';
    return action.options.find((o) => o.id === optionId)?.label ?? optionId;
  }

  protected getMultiSelectResponse(action: MultiSelectAction): string {
    if (!action.response) return '';
    return action.response
      .map((id) => action.options.find((o) => o.id === id)?.label ?? id)
      .join(', ');
  }

  protected getButtonLabel(action: ButtonsAction, buttonId?: string): string {
    if (!buttonId) return '';
    return action.buttons.find((b) => b.id === buttonId)?.label ?? buttonId;
  }
}
