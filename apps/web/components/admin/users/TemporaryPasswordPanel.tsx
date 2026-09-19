'use client';

import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export interface TemporaryPasswordPanelProps {
  email: string;
  temporaryPassword: string;
  /** Whether the account was just created or had its password reset, for the wording. */
  kind: 'created' | 'reset';
  onDismiss: () => void;
}

/**
 * The one moment a temporary password is visible. The server does not keep it in readable form and
 * cannot show it again, so this panel says so plainly and stays until it is dismissed on purpose (a
 * page refresh or navigating away loses it: that is by design, and reset creates a new one).
 *
 * Focus moves to the heading when it appears so a keyboard or screen-reader user lands on it. Copying
 * is confirmed in words in an always-mounted live region (not by a colour change or a tooltip), and if
 * the browser refuses clipboard access the message says to select and copy it by hand.
 */
export function TemporaryPasswordPanel({
  email,
  temporaryPassword,
  kind,
  onDismiss,
}: Readonly<TemporaryPasswordPanelProps>) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [copyMessage, setCopyMessage] = useState('');

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopyMessage('Copied to the clipboard.');
    } catch {
      setCopyMessage('Could not copy automatically. Select the password and copy it yourself.');
    }
  }

  return (
    <section
      aria-labelledby="temporary-password-heading"
      className="mt-8 rounded-card border border-primary-blue bg-surface p-5 shadow-card"
    >
      <h2
        id="temporary-password-heading"
        ref={headingRef}
        tabIndex={-1}
        className="text-card font-semibold text-primary focus-ring"
      >
        {kind === 'created' ? 'Account created' : 'Password reset'}: copy the temporary password now
      </h2>
      <p className="mt-2 text-body text-secondary">
        This is the only time it is shown. It cannot be looked up later; if it is lost, use{' '}
        <span className="font-medium text-primary">Reset password</span> on the account for a new
        one. Give it to <span className="font-medium break-all text-primary">{email}</span> through
        a private channel. They will be asked to choose their own password the first time they sign
        in.
      </p>

      <label
        htmlFor="temporary-password-value"
        className="mt-4 block text-label font-medium text-primary"
      >
        Temporary password
      </label>
      {/* A read-only field, not a paragraph: it has a real label, a screen reader reads it, and a
          keyboard user can focus it and copy by hand if the Copy button is unavailable. */}
      <Input
        id="temporary-password-value"
        readOnly
        type="text"
        value={temporaryPassword}
        autoComplete="off"
        spellCheck={false}
        onFocus={(event) => event.currentTarget.select()}
        className="mt-1 bg-background-alt font-mono"
      />

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => void copy()}>
          Copy password
        </Button>
        <Button type="button" variant="secondary" onClick={onDismiss}>
          I have saved it, hide it
        </Button>
      </div>

      <p role="status" aria-live="polite" className="mt-3 min-h-6 text-body text-primary">
        {copyMessage}
      </p>
    </section>
  );
}
