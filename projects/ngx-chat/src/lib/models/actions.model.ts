/** Button style variants */
export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

/** Action option for select/multi-select */
export interface ActionOption {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly icon?: string;
  readonly disabled?: boolean;
}

/** Action button for buttons action */
export interface ActionButton {
  readonly id: string;
  readonly label: string;
  readonly variant?: ButtonVariant;
  readonly icon?: string;
  readonly disabled?: boolean;
}

/** Confirm action - yes/no style confirmation */
export interface ConfirmAction {
  readonly type: 'confirm';
  readonly id: string;
  readonly confirmText?: string;
  readonly cancelText?: string;
  readonly confirmVariant?: ButtonVariant;
  readonly cancelVariant?: ButtonVariant;
  readonly disabled?: boolean;
  readonly responded?: boolean;
  readonly response?: boolean;
}

/** Select action - single selection from options */
export interface SelectAction {
  readonly type: 'select';
  readonly id: string;
  readonly options: readonly ActionOption[];
  readonly label?: string;
  readonly placeholder?: string;
  readonly searchable?: boolean;
  readonly disabled?: boolean;
  readonly responded?: boolean;
  readonly response?: string;
}

/** Multi-select action - multiple selection from options */
export interface MultiSelectAction {
  readonly type: 'multi-select';
  readonly id: string;
  readonly options: readonly ActionOption[];
  readonly label?: string;
  readonly minSelect?: number;
  readonly maxSelect?: number;
  readonly submitText?: string;
  readonly disabled?: boolean;
  readonly responded?: boolean;
  readonly response?: readonly string[];
}

/** Buttons action - clickable button options */
export interface ButtonsAction {
  readonly type: 'buttons';
  readonly id: string;
  readonly buttons: readonly ActionButton[];
  readonly layout?: 'horizontal' | 'vertical' | 'grid';
  readonly columns?: number;
  readonly disabled?: boolean;
  readonly responded?: boolean;
  readonly response?: string;
}

/** Union type for all action types */
export type MessageAction = ConfirmAction | SelectAction | MultiSelectAction | ButtonsAction;

/** Action type discriminator */
export type MessageActionType = MessageAction['type'];

/** Confirm action event */
export interface ConfirmActionEvent {
  readonly type: 'confirm';
  readonly actionId: string;
  readonly messageId: string;
  readonly response: boolean;
}

/** Select action event */
export interface SelectActionEvent {
  readonly type: 'select';
  readonly actionId: string;
  readonly messageId: string;
  readonly response: string;
  readonly option: ActionOption;
}

/** Multi-select action event */
export interface MultiSelectActionEvent {
  readonly type: 'multi-select';
  readonly actionId: string;
  readonly messageId: string;
  readonly response: readonly string[];
  readonly options: readonly ActionOption[];
}

/** Buttons action event */
export interface ButtonsActionEvent {
  readonly type: 'buttons';
  readonly actionId: string;
  readonly messageId: string;
  readonly response: string;
  readonly button: ActionButton;
}

/** Union type for all action events */
export type MessageActionEvent =
  | ConfirmActionEvent
  | SelectActionEvent
  | MultiSelectActionEvent
  | ButtonsActionEvent;
