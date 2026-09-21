import Link from 'next/link';

import { WhyChooseIcon } from '@/components/ui/WhyChooseIcon';
import type { WhyChooseItem as WhyChooseItemData } from '@/config/why-choose';

export interface WhyChooseItemProps {
  item: WhyChooseItemData;
}

const INLINE_LINK_CLASSES =
  'rounded-field text-primary-blue underline underline-offset-4 focus-ring hover:text-primary-blue-hover';

/**
 * One plain trust statement: icon, title, description. Deliberately not a card — no
 * `border-default`, no `shadow-card`, nothing interactive at the item level (root CLAUDE.md's
 * "break the pattern" instruction for this section). The only link that can appear is the
 * optional `inlineLink` inside the description, styled like `Button`'s existing "text" variant
 * rather than a new link treatment.
 */
export function WhyChooseItem({ item }: WhyChooseItemProps) {
  const inlineLink = item.inlineLink;

  return (
    <div className="flex flex-col items-start gap-4">
      <span className="inline-flex size-12 items-center justify-center rounded-full bg-primary-blue/10 text-primary-blue">
        <WhyChooseIcon icon={item.icon} className="size-6" />
      </span>

      <h3 className="text-card font-semibold text-primary">{item.title}</h3>

      <p className="text-body text-secondary">
        {inlineLink
          ? item.description.split(inlineLink.text).map((part, index, parts) => (
              <span key={index}>
                {part}
                {index < parts.length - 1 && (
                  <Link href={inlineLink.href} className={INLINE_LINK_CLASSES}>
                    {inlineLink.text}
                  </Link>
                )}
              </span>
            ))
          : item.description}
      </p>
    </div>
  );
}
