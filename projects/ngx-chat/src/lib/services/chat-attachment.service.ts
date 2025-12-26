import { inject, Injectable } from '@angular/core';
import type { AttachmentType, PendingAttachment } from '../models/attachment.model';
import { ChatConfigService } from './chat-config.service';
import {
  createPendingAttachment,
  getAttachmentType,
  isMimeTypeAllowed,
  isMimeTypeBlocked,
} from '../utils/attachment.utils';

/** Result of file validation */
export interface FileValidationResult {
  readonly valid: boolean;
  readonly error?: string;
}

/**
 * Service for handling file attachments in the chat.
 */
@Injectable({ providedIn: 'root' })
export class ChatAttachmentService {
  private readonly configService = inject(ChatConfigService);

  /**
   * Validate a file against the current configuration
   * @param file - The file to validate
   * @returns Validation result
   */
  validateFile(file: File): FileValidationResult {
    const config = this.configService.getSection('attachments');

    // Check if attachments are enabled
    if (!config.enabled) {
      return { valid: false, error: 'Attachments are disabled' };
    }

    // Check file size
    if (file.size > config.maxFileSize) {
      return { valid: false, error: 'File is too large' };
    }

    // Check blocked MIME types first
    if (isMimeTypeBlocked(file.type, config.blockedMimeTypes)) {
      return { valid: false, error: 'File type is not allowed' };
    }

    // Check allowed MIME types
    if (!isMimeTypeAllowed(file.type, config.allowedMimeTypes)) {
      return { valid: false, error: 'File type is not allowed' };
    }

    return { valid: true };
  }

  /**
   * Validate multiple files
   * @param files - Files to validate
   * @returns Array of validation results
   */
  validateFiles(files: FileList | File[]): FileValidationResult[] {
    const results: FileValidationResult[] = [];
    const config = this.configService.getSection('attachments');

    const fileArray = Array.from(files);

    // Check max files per message
    if (fileArray.length > config.maxFilesPerMessage) {
      return fileArray.map(() => ({
        valid: false,
        error: `Maximum ${config.maxFilesPerMessage} files allowed`,
      }));
    }

    for (const file of fileArray) {
      results.push(this.validateFile(file));
    }

    return results;
  }

  /**
   * Create pending attachments from files
   * @param files - Files to process
   * @returns Array of pending attachments and validation errors
   */
  createPendingAttachments(
    files: FileList | File[]
  ): { attachments: PendingAttachment[]; errors: string[] } {
    const attachments: PendingAttachment[] = [];
    const errors: string[] = [];

    const fileArray = Array.from(files);
    const validations = this.validateFiles(fileArray);

    for (let i = 0; i < fileArray.length; i++) {
      const validation = validations[i];
      if (validation.valid) {
        attachments.push(createPendingAttachment(fileArray[i]));
      } else {
        errors.push(`${fileArray[i].name}: ${validation.error}`);
      }
    }

    return { attachments, errors };
  }

  /**
   * Create a preview URL for a file
   * @param file - The file to preview
   * @returns Preview URL or null
   */
  createPreview(file: File): string | null {
    const type = getAttachmentType(file.type);
    if (type === 'image' || type === 'video') {
      return URL.createObjectURL(file);
    }
    return null;
  }

  /**
   * Revoke a preview URL
   * @param url - The URL to revoke
   */
  revokePreview(url: string): void {
    URL.revokeObjectURL(url);
  }

  /**
   * Get the attachment type for a file
   * @param file - The file
   * @returns AttachmentType
   */
  getType(file: File): AttachmentType {
    return getAttachmentType(file.type);
  }

  /**
   * Check if image compression should be applied
   * @param file - The file to check
   * @returns Whether compression should be applied
   */
  shouldCompressImage(file: File): boolean {
    const config = this.configService.getSection('attachments');
    return config.imageCompression && file.type.startsWith('image/');
  }

  /**
   * Get maximum file size configured
   * @returns Maximum file size in bytes
   */
  getMaxFileSize(): number {
    return this.configService.getSection('attachments').maxFileSize;
  }

  /**
   * Get maximum files per message
   * @returns Maximum number of files
   */
  getMaxFilesPerMessage(): number {
    return this.configService.getSection('attachments').maxFilesPerMessage;
  }

  /**
   * Check if drag and drop is enabled
   * @returns Whether drag and drop is enabled
   */
  isDragAndDropEnabled(): boolean {
    const config = this.configService.getSection('attachments');
    return config.enabled && config.dragAndDrop;
  }

  /**
   * Check if paste from clipboard is enabled
   * @returns Whether paste is enabled
   */
  isPasteEnabled(): boolean {
    const config = this.configService.getSection('attachments');
    return config.enabled && config.pasteFromClipboard;
  }
}
