import type {
  ActionButton,
  ActionOption,
  ButtonsAction,
  ButtonVariant,
  ConfirmAction,
  MessageAction,
  MessageActionEvent,
  MultiSelectAction,
  SelectAction,
} from '../models/actions.model';
import type { ChatMessage } from '../models/message.model';
import { generateId } from './id.utils';

/** Options for creating a confirm action */
export interface CreateConfirmActionOptions {
  readonly id?: string;
  readonly confirmText?: string;
  readonly cancelText?: string;
  readonly confirmVariant?: ButtonVariant;
  readonly cancelVariant?: ButtonVariant;
  readonly disabled?: boolean;
}

/** Options for creating a select action */
export interface CreateSelectActionOptions {
  readonly id?: string;
  readonly label?: string;
  readonly placeholder?: string;
  readonly searchable?: boolean;
  readonly disabled?: boolean;
}

/** Options for creating a multi-select action */
export interface CreateMultiSelectActionOptions {
  readonly id?: string;
  readonly label?: string;
  readonly minSelect?: number;
  readonly maxSelect?: number;
  readonly submitText?: string;
  readonly disabled?: boolean;
}

/** Options for creating a buttons action */
export interface CreateButtonsActionOptions {
  readonly id?: string;
  readonly layout?: 'horizontal' | 'vertical' | 'grid';
  readonly columns?: number;
  readonly disabled?: boolean;
}

/**
 * Create a confirm action
 * @param options - Configuration options
 * @returns ConfirmAction
 */
export function createConfirmAction(options?: CreateConfirmActionOptions): ConfirmAction {
  return {
    type: 'confirm',
    id: options?.id ?? generateId('action'),
    confirmText: options?.confirmText,
    cancelText: options?.cancelText,
    confirmVariant: options?.confirmVariant ?? 'primary',
    cancelVariant: options?.cancelVariant ?? 'secondary',
    disabled: options?.disabled,
    responded: false,
  };
}

/**
 * Create a select action
 * @param options - Array of options to select from
 * @param config - Configuration options
 * @returns SelectAction
 */
export function createSelectAction(
  options: readonly ActionOption[],
  config?: CreateSelectActionOptions
): SelectAction {
  return {
    type: 'select',
    id: config?.id ?? generateId('action'),
    options,
    label: config?.label,
    placeholder: config?.placeholder,
    searchable: config?.searchable,
    disabled: config?.disabled,
    responded: false,
  };
}

/**
 * Create a multi-select action
 * @param options - Array of options to select from
 * @param config - Configuration options
 * @returns MultiSelectAction
 */
export function createMultiSelectAction(
  options: readonly ActionOption[],
  config?: CreateMultiSelectActionOptions
): MultiSelectAction {
  return {
    type: 'multi-select',
    id: config?.id ?? generateId('action'),
    options,
    label: config?.label,
    minSelect: config?.minSelect,
    maxSelect: config?.maxSelect,
    submitText: config?.submitText,
    disabled: config?.disabled,
    responded: false,
  };
}

/**
 * Create a buttons action
 * @param buttons - Array of buttons
 * @param config - Configuration options
 * @returns ButtonsAction
 */
export function createButtonsAction(
  buttons: readonly ActionButton[],
  config?: CreateButtonsActionOptions
): ButtonsAction {
  return {
    type: 'buttons',
    id: config?.id ?? generateId('action'),
    buttons,
    layout: config?.layout ?? 'horizontal',
    columns: config?.columns,
    disabled: config?.disabled,
    responded: false,
  };
}

/**
 * Create an action option
 * @param id - Option ID
 * @param label - Option label
 * @param description - Optional description
 * @param icon - Optional icon
 * @returns ActionOption
 */
export function createActionOption(
  id: string,
  label: string,
  description?: string,
  icon?: string
): ActionOption {
  return { id, label, description, icon };
}

/**
 * Create an action button
 * @param id - Button ID
 * @param label - Button label
 * @param variant - Button variant
 * @param icon - Optional icon
 * @returns ActionButton
 */
export function createActionButton(
  id: string,
  label: string,
  variant: ButtonVariant = 'secondary',
  icon?: string
): ActionButton {
  return { id, label, variant, icon };
}

/**
 * Update an action's response in a messages array
 * @param messages - Array of messages
 * @param event - Action event containing the response
 * @returns New array with updated message
 */
export function updateActionResponse(
  messages: readonly ChatMessage[],
  event: MessageActionEvent
): ChatMessage[] {
  return messages.map((message) => {
    if (message.id !== event.messageId) {
      return message;
    }

    const updatedActions = message.actions?.map((action) => {
      if (action.id !== event.actionId) {
        return action;
      }

      return updateAction(action, event);
    });

    return { ...message, actions: updatedActions };
  });
}

/**
 * Update a single action with a response
 * @param action - The action to update
 * @param event - The action event
 * @returns Updated action
 */
function updateAction(action: MessageAction, event: MessageActionEvent): MessageAction {
  switch (event.type) {
    case 'confirm':
      return {
        ...action,
        responded: true,
        response: event.response,
      } as ConfirmAction;
    case 'select':
      return {
        ...action,
        responded: true,
        response: event.response,
      } as SelectAction;
    case 'multi-select':
      return {
        ...action,
        responded: true,
        response: event.response,
      } as MultiSelectAction;
    case 'buttons':
      return {
        ...action,
        responded: true,
        response: event.response,
      } as ButtonsAction;
    default:
      return action;
  }
}

/**
 * Check if an action has been responded to
 * @param action - The action to check
 * @returns Whether the action has been responded to
 */
export function isActionResponded(action: MessageAction): boolean {
  return action.responded === true;
}

/**
 * Check if an action is disabled
 * @param action - The action to check
 * @returns Whether the action is disabled
 */
export function isActionDisabled(action: MessageAction): boolean {
  return action.disabled === true || action.responded === true;
}

/**
 * Get the response from an action
 * @param action - The action
 * @returns The response value or undefined
 */
export function getActionResponse(
  action: MessageAction
): boolean | string | readonly string[] | undefined {
  return action.response;
}

/**
 * Find an action by ID in a message
 * @param message - The message to search
 * @param actionId - The action ID to find
 * @returns The action or undefined
 */
export function findAction(
  message: ChatMessage,
  actionId: string
): MessageAction | undefined {
  return message.actions?.find((a) => a.id === actionId);
}

/**
 * Get all pending (unanswered) actions from a message
 * @param message - The message to search
 * @returns Array of pending actions
 */
export function getPendingActions(message: ChatMessage): readonly MessageAction[] {
  return message.actions?.filter((a) => !a.responded) ?? [];
}
