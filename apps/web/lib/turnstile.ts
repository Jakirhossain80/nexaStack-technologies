import { serverEnv } from './env.server';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export type TurnstileVerification =
  | { outcome: 'skipped' }
  | { outcome: 'passed' }
  | { outcome: 'failed' };

/**
 * Verifies a Cloudflare Turnstile token server-side (root CLAUDE.md 5, 11.4). If
 * `TURNSTILE_SECRET_KEY` isn't configured — expected in local development, since no keys are
 * provisioned yet — this skips verification and logs a warning rather than blocking every
 * submission or silently pretending the check passed.
 */
export async function verifyTurnstileToken(token: string | undefined): Promise<TurnstileVerification> {
  if (!serverEnv.TURNSTILE_SECRET_KEY) {
    console.warn(
      '[contact] TURNSTILE_SECRET_KEY not set — spam verification skipped. Configure it before deploying.',
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
    console.error('[contact] Turnstile verification request failed', err);
    return { outcome: 'failed' };
  }
}
