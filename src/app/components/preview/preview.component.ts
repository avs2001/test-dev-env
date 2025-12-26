import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-preview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="preview-container">
      <div class="preview-header">
        <div class="preview-title">
          <svg class="preview-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="3" y1="9" x2="21" y2="9"/>
            <line x1="9" y1="21" x2="9" y2="9"/>
          </svg>
          <span>Preview</span>
        </div>
        <div class="preview-controls">
          <input
            type="text"
            class="preview-url-input"
            [ngModel]="urlInput()"
            (ngModelChange)="urlInput.set($event)"
            (keydown.enter)="loadUrl()"
            placeholder="http://localhost:4200"
            aria-label="Preview URL"
          />
          <button
            type="button"
            class="preview-btn"
            (click)="loadUrl()"
            title="Load URL"
            aria-label="Load URL"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <polyline points="9,10 4,15 9,20"/>
              <path d="M20 4v7a4 4 0 0 1-4 4H4"/>
            </svg>
          </button>
          <button
            type="button"
            class="preview-btn"
            (click)="refresh()"
            title="Refresh preview"
            aria-label="Refresh preview"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <polyline points="23 4 23 10 17 10"/>
              <polyline points="1 20 1 14 7 14"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
            </svg>
          </button>
          <button
            type="button"
            class="preview-btn"
            (click)="openInNewTab()"
            title="Open in new tab"
            aria-label="Open in new tab"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="preview-content">
        @if (currentUrl()) {
          <iframe
            #previewFrame
            class="preview-iframe"
            [src]="currentUrl()"
            title="Application Preview"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          ></iframe>
        } @else {
          <div class="preview-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <circle cx="6" cy="6" r="0.5" fill="currentColor"/>
              <circle cx="9" cy="6" r="0.5" fill="currentColor"/>
              <circle cx="12" cy="6" r="0.5" fill="currentColor"/>
            </svg>
            <p>Enter a URL above to preview your application</p>
            <span class="preview-hint">Typically http://localhost:4200 for Angular apps</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
    }

    .preview-container {
      display: flex;
      flex-direction: column;
      height: 100%;
      background-color: #ffffff;
      border-left: 1px solid #e0e0e0;
      border-right: 1px solid #e0e0e0;
    }

    .preview-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 8px 12px;
      background-color: #f8f9fa;
      border-bottom: 1px solid #e0e0e0;
      flex-wrap: wrap;
    }

    .preview-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      font-size: 0.875rem;
      color: #374151;
    }

    .preview-icon {
      color: #6366f1;
    }

    .preview-controls {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      min-width: 200px;
    }

    .preview-url-input {
      flex: 1;
      padding: 6px 10px;
      font-size: 0.8125rem;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      outline: none;
      transition: border-color 0.15s ease;
      min-width: 150px;
    }

    .preview-url-input:focus {
      border-color: #6366f1;
      box-shadow: 0 0 0 2px rgb(99 102 241 / 0.1);
    }

    .preview-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      padding: 0;
      background-color: #ffffff;
      border: 1px solid #d1d5db;
      border-radius: 4px;
      cursor: pointer;
      color: #6b7280;
      transition: all 0.15s ease;
    }

    .preview-btn:hover {
      background-color: #f3f4f6;
      color: #374151;
      border-color: #9ca3af;
    }

    .preview-btn:focus-visible {
      outline: 2px solid #6366f1;
      outline-offset: 2px;
    }

    .preview-content {
      flex: 1;
      position: relative;
      overflow: hidden;
      background-color: #f5f5f5;
    }

    .preview-iframe {
      width: 100%;
      height: 100%;
      border: none;
      background-color: #ffffff;
    }

    .preview-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      gap: 16px;
      color: #9ca3af;
      text-align: center;
      padding: 24px;
    }

    .preview-placeholder p {
      margin: 0;
      font-size: 0.9375rem;
      color: #6b7280;
    }

    .preview-hint {
      font-size: 0.8125rem;
      color: #9ca3af;
    }
  `,
})
export class PreviewComponent {
  readonly initialUrl = input<string>('');

  readonly urlChange = output<string>();

  protected readonly urlInput = signal('http://localhost:4200');
  protected readonly currentUrl = signal('');

  private readonly previewFrame = viewChild<ElementRef<HTMLIFrameElement>>('previewFrame');

  constructor() {
    // Initialize with input if provided
    const initial = this.initialUrl();
    if (initial) {
      this.urlInput.set(initial);
      this.currentUrl.set(initial);
    }
  }

  protected loadUrl(): void {
    const url = this.urlInput();
    if (url) {
      this.currentUrl.set(url);
      this.urlChange.emit(url);
    }
  }

  protected refresh(): void {
    const frame = this.previewFrame();
    if (frame) {
      const currentSrc = frame.nativeElement.src;
      frame.nativeElement.src = '';
      // Small delay to ensure the frame clears before reloading
      setTimeout(() => {
        frame.nativeElement.src = currentSrc;
      }, 50);
    }
  }

  protected openInNewTab(): void {
    const url = this.currentUrl();
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }

  /** Public method to trigger refresh from parent */
  triggerRefresh(): void {
    this.refresh();
  }
}
