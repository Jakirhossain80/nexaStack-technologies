import Link from 'next/link';

import type { FaqItem } from '@/config/faq';

const INLINE_LINK_CLASSES =
  'rounded-field text-primary-blue underline-offset-4 focus-ring hover:text-primary-blue-hover hover:underline';

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Renders `item.answer`, swapping any `inlineLinks` substrings for real links — same text
 * either way. Shared by the homepage FAQ section and `/faq` so both render answers identically
 * rather than duplicating this logic.
 */
export function renderFaqAnswer(item: FaqItem) {
  const links = item.inlineLinks;
  if (!links || links.length === 0) return item.answer;

  const pattern = new RegExp(`(${links.map((link) => escapeRegExp(link.text)).join('|')})`, 'g');
  return item.answer.split(pattern).map((part, index) => {
    const link = links.find((candidate) => candidate.text === part);
    return link ? (
      <Link key={index} href={link.href} className={INLINE_LINK_CLASSES}>
        {part}
      </Link>
    ) : (
      <span key={index}>{part}</span>
    );
  });
}
