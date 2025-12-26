/** Types of attachments */
export type AttachmentType = 'image' | 'file' | 'video' | 'audio';

/** Status of an attachment upload */
export type AttachmentUploadStatus = 'pending' | 'uploading' | 'processing' | 'complete' | 'error';

/** Completed attachment attached to a message */
export interface MessageAttachment {
  readonly id: string;
  readonly type: AttachmentType;
  readonly url: string;
  readonly name: string;
  readonly size: number;
  readonly mimeType: string;
  readonly thumbnail?: string;
  readonly dimensions?: { readonly width: number; readonly height: number };
  readonly duration?: number;
}

/** Pending attachment (upload in progress) */
export interface PendingAttachment {
  readonly id: string;
  readonly file: File;
  readonly type: AttachmentType;
  readonly previewUrl?: string;
  readonly status: AttachmentUploadStatus;
  readonly progress: number; // 0-100
  readonly error?: string;
}

/** Event when attachment upload progress changes */
export interface AttachmentProgressEvent {
  readonly attachmentId: string;
  readonly progress: number;
  readonly status: AttachmentUploadStatus;
}

/** Event when an attachment is removed */
export interface AttachmentRemoveEvent {
  readonly attachmentId: string;
}
