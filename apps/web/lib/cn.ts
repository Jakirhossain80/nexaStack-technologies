import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * tailwind-merge must know the custom token scales, otherwise it cannot tell a font-size token
 * (`text-body`) from a colour token (`text-primary`) and would drop one of them.
 * Keep in sync with the @theme block in styles/globals.css.
 */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['hero', 'page', 'section', 'card', 'body', 'body-lg', 'label'],
      radius: ['field', 'btn', 'card', 'media'],
      shadow: ['card', 'card-hover'],
      container: ['content'],
      spacing: ['section-sm', 'section-md', 'section-lg', 'gutter-sm', 'gutter-md', 'gutter-lg'],
    },
  },
});

/** Merge conditional class names, resolving Tailwind conflicts (later classes win). */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
