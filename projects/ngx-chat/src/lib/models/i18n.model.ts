import { InjectionToken } from '@angular/core';

/** Internationalization strings for the chat component */
export interface ChatI18n {
  // Actions
  readonly send: string;
  readonly cancel: string;
  readonly confirm: string;
  readonly submit: string;
  readonly retry: string;

  // Input
  readonly placeholder: string;
  readonly emptyState: string;

  // Status
  readonly typing: string; // "{name} is typing..."
  readonly someoneTyping: string;
  readonly sending: string;
  readonly sent: string;
  readonly delivered: string;
  readonly read: string;
  readonly error: string;

  // Confirm action
  readonly confirmYes: string;
  readonly confirmNo: string;
  readonly confirmed: string;
  readonly cancelled: string;

  // Selection
  readonly selected: string;
  readonly selectedCount: string; // "{count} selected"
  readonly noOptions: string;
  readonly searchPlaceholder: string;

  // Attachments
  readonly attachment: string;
  readonly attachments: string;
  readonly fileTooLarge: string;
  readonly fileTypeNotAllowed: string;
  readonly uploadFailed: string;
  readonly removeAttachment: string;

  // Loading
  readonly loading: string;
  readonly loadMore: string;

  // Accessibility
  readonly ariaMessageList: string;
  readonly ariaMessageInput: string;
  readonly ariaNewMessage: string; // "New message from {sender}"
  readonly ariaSendButton: string;
  readonly ariaAttachButton: string;
  readonly ariaTypingIndicator: string;
  readonly ariaMessageStatus: string;

  // Sender names
  readonly you: string;
  readonly other: string;
  readonly system: string;

  // Timestamps
  readonly edited: string;
  readonly today: string;
  readonly yesterday: string;
  readonly justNow: string;
  readonly minutesAgo: string; // "{count} minutes ago"

  // Errors
  readonly networkError: string;
  readonly serverError: string;
  readonly rateLimited: string;
  readonly unknownError: string;
}

/** Default English i18n strings */
export const DEFAULT_CHAT_I18N: ChatI18n = {
  // Actions
  send: 'Send',
  cancel: 'Cancel',
  confirm: 'Confirm',
  submit: 'Submit',
  retry: 'Retry',

  // Input
  placeholder: 'Type a message...',
  emptyState: 'No messages yet',

  // Status
  typing: '{name} is typing...',
  someoneTyping: 'Someone is typing...',
  sending: 'Sending...',
  sent: 'Sent',
  delivered: 'Delivered',
  read: 'Read',
  error: 'Failed to send',

  // Confirm action
  confirmYes: 'Yes',
  confirmNo: 'No',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',

  // Selection
  selected: 'Selected',
  selectedCount: '{count} selected',
  noOptions: 'No options available',
  searchPlaceholder: 'Search...',

  // Attachments
  attachment: 'Attachment',
  attachments: 'Attachments',
  fileTooLarge: 'File is too large',
  fileTypeNotAllowed: 'File type not allowed',
  uploadFailed: 'Upload failed',
  removeAttachment: 'Remove attachment',

  // Loading
  loading: 'Loading...',
  loadMore: 'Load more',

  // Accessibility
  ariaMessageList: 'Chat messages',
  ariaMessageInput: 'Type your message',
  ariaNewMessage: 'New message from {sender}',
  ariaSendButton: 'Send message',
  ariaAttachButton: 'Attach file',
  ariaTypingIndicator: '{name} is typing',
  ariaMessageStatus: 'Message status: {status}',

  // Sender names
  you: 'You',
  other: 'Other',
  system: 'System',

  // Timestamps
  edited: 'Edited',
  today: 'Today',
  yesterday: 'Yesterday',
  justNow: 'Just now',
  minutesAgo: '{count} minutes ago',

  // Errors
  networkError: 'Network connection failed',
  serverError: 'Server error occurred',
  rateLimited: 'Too many requests, please wait',
  unknownError: 'An unexpected error occurred',
};

/** Injection token for i18n strings */
export const CHAT_I18N = new InjectionToken<ChatI18n>('CHAT_I18N', {
  providedIn: 'root',
  factory: () => DEFAULT_CHAT_I18N,
});
