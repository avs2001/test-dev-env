import { Directive, TemplateRef, inject } from '@angular/core';

/**
 * Directive for projecting custom content into the chat header.
 *
 * @example
 * ```html
 * <ngx-chat [messages]="messages()">
 *   <ng-template ngxChatHeaderContent>
 *     <span>Custom Header Content</span>
 *   </ng-template>
 * </ngx-chat>
 * ```
 */
@Directive({
  selector: '[ngxChatHeaderContent]',
})
export class ChatHeaderContentDirective {
  readonly templateRef = inject(TemplateRef);
}
