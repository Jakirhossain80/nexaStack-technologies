import { serverEnv } from './env.server';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export type TurnstileVerification =
  | { outcome: 'skipped' }
  | { outcome: 'passed' }
  | { outcome: 'failed' }
  | { outcome: 'unavailable' };

/** Which public form is asking; only used to label the log line. */
export type TurnstileContext = 'contact' | 'quotation';

/**
 * Verifies a Cloudflare Turnstile token server-side (root CLAUDE.md 5, 11.4), for both public forms.
 *
 * If `TURNSTILE_SECRET_KEY` isn't configured:
 *  - in DEVELOPMENT (no keys are provisioned locally) verification is skipped with a warning, so the
 *    forms stay usable;
 *  - in PRODUCTION it FAILS CLOSED (`unavailable`, logged at error level). A public form must never
 *    silently run with no bot protection because one environment variable was forgotten: the caller
 *    answers 503, so the misconfiguration is noticed at once instead of after the spam arrives.
 */
export async function verifyTurnstileToken(
  token: string | undefined,
  context: TurnstileContext,
): Promise<TurnstileVerification> {
  if (!serverEnv.TURNSTILE_SECRET_KEY) {
    if (process.env.NODE_ENV === 'production') {
      console.error(
        `[${context}] TURNSTILE_SECRET_KEY is not set in production — refusing the submission. Configure it.`,
      );
      return { outcome: 'unavailable' };
    }
    console.warn(
      `[${context}] TURNSTILE_SECRET_KEY not set — spam verification skipped (development only).`,
    );
    return { outcome: 'skipped' };
  }

  if (!token) return { outcome: 'failed' };

  const body = new URLSearchParams({ secret: serverEnv.TURNSTILE_SECRET_KEY, response: token });

  try {
    const response = await fetch(VERIFY_URL, { method: 'POST', body });
    const result = (await response.json()) as { success?: boolean };
    return result.success ? { outcome: 'passed' } : { outcome: 'failed' };
  } catch (err) {
    console.error(`[${context}] Turnstile verification request failed`, err);
    return { outcome: 'failed' };
  }
}
