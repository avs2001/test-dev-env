import {
  animate,
  keyframes,
  style,
  transition,
  trigger,
} from '@angular/animations';

/** Animation for message entering the chat */
export const messageEnterAnimation = trigger('messageEnter', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(10px)' }),
    animate(
      '200ms ease-out',
      style({ opacity: 1, transform: 'translateY(0)' })
    ),
  ]),
]);

/** Animation for message leaving the chat */
export const messageLeaveAnimation = trigger('messageLeave', [
  transition(':leave', [
    animate(
      '150ms ease-in',
      style({ opacity: 0, transform: 'translateY(-10px)' })
    ),
  ]),
]);

/** Animation for typing indicator dots */
export const typingPulseAnimation = trigger('typingPulse', [
  transition('* => *', [
    animate(
      '1.5s ease-in-out',
      keyframes([
        style({ opacity: 0.4, offset: 0 }),
        style({ opacity: 1, offset: 0.5 }),
        style({ opacity: 0.4, offset: 1 }),
      ])
    ),
  ]),
]);

/** Animation for error shake effect */
export const errorShakeAnimation = trigger('errorShake', [
  transition(':enter', [
    animate(
      '400ms ease-in-out',
      keyframes([
        style({ transform: 'translateX(0)', offset: 0 }),
        style({ transform: 'translateX(-5px)', offset: 0.1 }),
        style({ transform: 'translateX(5px)', offset: 0.3 }),
        style({ transform: 'translateX(-5px)', offset: 0.5 }),
        style({ transform: 'translateX(5px)', offset: 0.7 }),
        style({ transform: 'translateX(-3px)', offset: 0.9 }),
        style({ transform: 'translateX(0)', offset: 1 }),
      ])
    ),
  ]),
]);

/** Simple fade in/out animation */
export const fadeInOutAnimation = trigger('fadeInOut', [
  transition(':enter', [
    style({ opacity: 0 }),
    animate('150ms ease-out', style({ opacity: 1 })),
  ]),
  transition(':leave', [animate('100ms ease-in', style({ opacity: 0 }))]),
]);

/** Slide up animation for action buttons */
export const slideUpAnimation = trigger('slideUp', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(20px)' }),
    animate(
      '200ms ease-out',
      style({ opacity: 1, transform: 'translateY(0)' })
    ),
  ]),
]);

/** Scale animation for buttons */
export const scaleAnimation = trigger('scale', [
  transition(':enter', [
    style({ transform: 'scale(0.9)', opacity: 0 }),
    animate('150ms ease-out', style({ transform: 'scale(1)', opacity: 1 })),
  ]),
]);

/** Collection of all chat animations */
export const chatAnimations = [
  messageEnterAnimation,
  messageLeaveAnimation,
  typingPulseAnimation,
  errorShakeAnimation,
  fadeInOutAnimation,
  slideUpAnimation,
  scaleAnimation,
];
