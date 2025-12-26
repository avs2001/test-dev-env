import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideChat } from 'ngx-chat';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    provideAnimations(),
    provideChat({
      config: {
        behavior: {
          sendOnEnter: true,
          showTimestamps: true,
          autoScroll: true,
          groupMessages: true,
          showSenderName: true,
          showAvatar: true,
        },
        keyboard: {
          sendOnEnter: true,
          sendOnCtrlEnter: true,
        },
        theme: 'auto',
      },
      i18n: {
        placeholder: 'Ask the AI agents anything...',
        send: 'Send',
        emptyState: 'No messages yet. Start a conversation!',
      },
    }),
  ],
};
