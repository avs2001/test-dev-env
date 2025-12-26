import { Directive, inject, output, signal } from '@angular/core';
import { ChatAttachmentService } from '../services/chat-attachment.service';

/**
 * Directive for handling drag and drop file uploads.
 *
 * @example
 * ```html
 * <div ngxChatDropZone (filesDropped)="onFilesDropped($event)">
 *   Drop files here
 * </div>
 * ```
 */
@Directive({
  selector: '[ngxChatDropZone]',
  host: {
    '[class.ngx-chat-drop-zone]': 'true',
    '[class.ngx-chat-drop-zone--active]': 'isDragOver()',
    '(dragenter)': 'onDragEnter($event)',
    '(dragleave)': 'onDragLeave($event)',
    '(dragover)': 'onDragOver($event)',
    '(drop)': 'onDrop($event)',
  },
})
export class ChatDropZoneDirective {
  private readonly attachmentService = inject(ChatAttachmentService);

  /** Emitted when files are dropped */
  readonly filesDropped = output<FileList>();

  /** Emitted when invalid files are dropped */
  readonly invalidFiles = output<string[]>();

  /** Whether a drag operation is over the zone */
  protected readonly isDragOver = signal(false);

  private dragCounter = 0;

  protected onDragEnter(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.attachmentService.isDragAndDropEnabled()) {
      return;
    }

    this.dragCounter++;
    if (this.hasFiles(event)) {
      this.isDragOver.set(true);
    }
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this.dragCounter--;
    if (this.dragCounter === 0) {
      this.isDragOver.set(false);
    }
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.attachmentService.isDragAndDropEnabled()) {
      return;
    }

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();

    this.isDragOver.set(false);
    this.dragCounter = 0;

    if (!this.attachmentService.isDragAndDropEnabled()) {
      return;
    }

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      const { errors } = this.attachmentService.createPendingAttachments(files);

      if (errors.length > 0) {
        this.invalidFiles.emit(errors);
      }

      this.filesDropped.emit(files);
    }
  }

  private hasFiles(event: DragEvent): boolean {
    if (!event.dataTransfer) {
      return false;
    }

    const types = event.dataTransfer.types;
    return types.includes('Files');
  }
}
