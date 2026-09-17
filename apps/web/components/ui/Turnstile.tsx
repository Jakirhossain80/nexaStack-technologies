'use client';

import { useEffect, useId, useRef } from 'react';

import { env } from '@/lib/env';

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

interface TurnstileRenderOptions {
  sitekey: string;
  callback: (token: string) => void;
  'expired-callback'?: () => void;
  'error-callback'?: () => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileRenderOptions) => string;
      remove: (widgetId: string) => void;
    };
  }
}

let scriptLoadPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  scriptLoadPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Cloudflare Turnstile'));
    document.head.appendChild(script);
  });
  return scriptLoadPromise;
}

export interface TurnstileWidgetProps {
  onVerify: (token: string) => void;
  onExpire: () => void;
}

/**
 * Cloudflare Turnstile widget, loaded via its plain `<script>` (no npm package needed — root
 * CLAUDE.md 5/21: no new dependency beyond the approved stack). Renders nothing when
 * `NEXT_PUBLIC_TURNSTILE_SITE_KEY` isn't configured; `/api/contact` treats a missing token as
 * "verification not yet configured" and skips the check rather than blocking submissions.
 */
export function TurnstileWidget({ onVerify, onExpire }: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetId = useId();
  const siteKey = env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !containerRef.current) return;

    let renderedId: string | undefined;
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !containerRef.current || !window.turnstile) return;
        renderedId = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: onVerify,
          'expired-callback': onExpire,
          'error-callback': onExpire,
        });
      })
      .catch((err: unknown) => {
        console.error('[contact] Turnstile widget failed to load', err);
      });

    return () => {
      cancelled = true;
      if (renderedId && window.turnstile) window.turnstile.remove(renderedId);
    };
  }, [siteKey, onVerify, onExpire]);

  if (!siteKey) return null;

  return <div ref={containerRef} id={`turnstile-${widgetId}`} />;
}
