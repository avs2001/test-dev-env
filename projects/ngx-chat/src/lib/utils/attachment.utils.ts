import type { AttachmentType, MessageAttachment, PendingAttachment } from '../models/attachment.model';
import { generateId } from './id.utils';

/**
 * Determine the attachment type from a MIME type
 * @param mimeType - The MIME type to check
 * @returns AttachmentType
 */
export function getAttachmentType(mimeType: string): AttachmentType {
  if (mimeType.startsWith('image/')) {
    return 'image';
  }
  if (mimeType.startsWith('video/')) {
    return 'video';
  }
  if (mimeType.startsWith('audio/')) {
    return 'audio';
  }
  return 'file';
}

/**
 * Create a pending attachment from a file
 * @param file - The file to create an attachment from
 * @returns PendingAttachment
 */
export function createPendingAttachment(file: File): PendingAttachment {
  const type = getAttachmentType(file.type);
  let previewUrl: string | undefined;

  // Create preview URL for images and videos
  if (type === 'image' || type === 'video') {
    previewUrl = URL.createObjectURL(file);
  }

  return {
    id: generateId('att'),
    file,
    type,
    previewUrl,
    status: 'pending',
    progress: 0,
  };
}

/**
 * Create a completed attachment (typically from server response)
 * @param data - Attachment data
 * @returns MessageAttachment
 */
export function createAttachment(data: {
  id?: string;
  type: AttachmentType;
  url: string;
  name: string;
  size: number;
  mimeType: string;
  thumbnail?: string;
  dimensions?: { width: number; height: number };
  duration?: number;
}): MessageAttachment {
  return {
    id: data.id ?? generateId('att'),
    type: data.type,
    url: data.url,
    name: data.name,
    size: data.size,
    mimeType: data.mimeType,
    thumbnail: data.thumbnail,
    dimensions: data.dimensions,
    duration: data.duration,
  };
}

/**
 * Format file size for display
 * @param bytes - Size in bytes
 * @returns Formatted size string (e.g., "1.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) {
    return '0 Bytes';
  }

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Check if a MIME type matches an allowed pattern
 * @param mimeType - The MIME type to check
 * @param allowedTypes - Array of allowed patterns (e.g., ['image/*', 'application/pdf'])
 * @returns Whether the MIME type is allowed
 */
export function isMimeTypeAllowed(mimeType: string, allowedTypes: readonly string[]): boolean {
  return allowedTypes.some((pattern) => {
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -1);
      return mimeType.startsWith(prefix);
    }
    return mimeType === pattern;
  });
}

/**
 * Check if a MIME type is blocked
 * @param mimeType - The MIME type to check
 * @param blockedTypes - Array of blocked patterns
 * @returns Whether the MIME type is blocked
 */
export function isMimeTypeBlocked(mimeType: string, blockedTypes: readonly string[]): boolean {
  return isMimeTypeAllowed(mimeType, blockedTypes);
}

/**
 * Get file extension from filename
 * @param filename - The filename
 * @returns The file extension (without dot) or empty string
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1 || lastDot === filename.length - 1) {
    return '';
  }
  return filename.substring(lastDot + 1).toLowerCase();
}

/**
 * Get an icon name based on file type
 * @param mimeType - The MIME type
 * @returns Icon identifier string
 */
export function getFileIcon(mimeType: string): string {
  const type = getAttachmentType(mimeType);

  switch (type) {
    case 'image':
      return 'image';
    case 'video':
      return 'video';
    case 'audio':
      return 'audio';
    default:
      break;
  }

  // More specific file type icons
  if (mimeType === 'application/pdf') {
    return 'pdf';
  }
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
    return 'spreadsheet';
  }
  if (mimeType.includes('document') || mimeType.includes('word')) {
    return 'document';
  }
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) {
    return 'presentation';
  }
  if (mimeType.startsWith('text/')) {
    return 'text';
  }
  if (mimeType.includes('zip') || mimeType.includes('compressed') || mimeType.includes('archive')) {
    return 'archive';
  }

  return 'file';
}

/**
 * Revoke object URLs for pending attachments to free memory
 * @param attachments - Array of pending attachments
 */
export function revokePendingAttachmentUrls(attachments: readonly PendingAttachment[]): void {
  for (const attachment of attachments) {
    if (attachment.previewUrl) {
      URL.revokeObjectURL(attachment.previewUrl);
    }
  }
}

/**
 * Check if a file is an image
 * @param file - The file to check
 * @returns Whether the file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * Check if a file is a video
 * @param file - The file to check
 * @returns Whether the file is a video
 */
export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/');
}

/**
 * Check if a file is an audio file
 * @param file - The file to check
 * @returns Whether the file is audio
 */
export function isAudioFile(file: File): boolean {
  return file.type.startsWith('audio/');
}

/**
 * Get image dimensions from a file
 * @param file - The image file
 * @returns Promise resolving to dimensions or null
 */
export function getImageDimensions(
  file: File
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(null);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };

    img.src = url;
  });
}
