'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { contactFormSchema, type ApiResponse, type ContactPageInput } from '@nexastack/shared';
import Link from 'next/link';
import { useCallback, useId, useState } from 'react';
import { useForm, useWatch, type Resolver } from 'react-hook-form';

import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { FieldError } from '@/components/ui/FieldError';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { TurnstileWidget } from '@/components/ui/Turnstile';
import { cn } from '@/lib/cn';

interface ContactFormFields {
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  subject: string;
  message: string;
  preferredContactMethod: string;
  consent: boolean;
}

const DEFAULT_VALUES: ContactFormFields = {
  fullName: '',
  email: '',
  phone: '',
  companyName: '',
  subject: '',
  message: '',
  preferredContactMethod: '',
  consent: false,
};

const CONTACT_METHODS = [
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'whatsapp', label: 'WhatsApp' },
] as const;

const REQUIRED_MARK = (
  <span aria-hidden="true" className="text-error">
    {' '}
    *
  </span>
);

const LABEL_CLASSES = 'block text-label font-medium text-primary';

/**
 * The `/contact` page's general-inquiry form. Client Component: needs state, validation and a
 * fetch call. Submits to `apps/web/app/api/contact/route.ts`, validated there against the same
 * `contactFormSchema` used here (root CLAUDE.md 10 — client validation is convenience only).
 */
export function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [serverError, setServerError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | undefined>(undefined);

  const handleTurnstileVerify = useCallback((token: string) => setTurnstileToken(token), []);
  const handleTurnstileExpire = useCallback(() => setTurnstileToken(undefined), []);

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormFields, unknown, ContactPageInput>({
    // The schema's input type requires literal enum/boolean values that don't match a form's
    // uncontrolled string/false defaults before anything is selected — the resolver still
    // validates the real submitted values correctly at runtime.
    resolver: zodResolver(contactFormSchema) as unknown as Resolver<
      ContactFormFields,
      unknown,
      ContactPageInput
    >,
    defaultValues: DEFAULT_VALUES,
  });

  const phoneValue = useWatch({ control, name: 'phone' });
  const phoneHintId = useId();

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);
    setStatus('submitting');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, turnstileToken }),
      });
      const body = (await response.json()) as ApiResponse<{ received: true }>;

      if (!body.success) {
        let mappedToField = false;
        for (const detail of body.error.details ?? []) {
          if (detail.path in DEFAULT_VALUES) {
            setError(detail.path as keyof ContactFormFields, { type: 'server', message: detail.message });
            mappedToField = true;
          }
        }
        if (!mappedToField) setServerError(body.error.message);
        setStatus('idle');
        return;
      }

      setStatus('success');
    } catch {
      setServerError('Something went wrong sending your message. Please check your connection and try again.');
      setStatus('idle');
    }
  });

  if (status === 'success') {
    return (
      <div role="status" className="rounded-card border border-default bg-surface p-8">
        <h2 className="text-card font-semibold tracking-tight text-primary">Message received</h2>
        <p className="mt-3 text-body-lg text-secondary">
          Thanks for reaching out — we&rsquo;ll get back to you as soon as possible.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      {serverError && (
        <p role="alert" className="rounded-field border border-error bg-surface px-4 py-3 text-body text-error">
          {serverError}
        </p>
      )}

      <div>
        <label htmlFor="fullName" className={LABEL_CLASSES}>
          Full name{REQUIRED_MARK}
        </label>
        <Input
          id="fullName"
          autoComplete="name"
          invalid={Boolean(errors.fullName)}
          aria-required="true"
          aria-describedby="fullName-error"
          className="mt-2"
          {...register('fullName')}
        />
        <FieldError id="fullName-error" message={errors.fullName?.message} />
      </div>

      <div>
        <label htmlFor="email" className={LABEL_CLASSES}>
          Email address{REQUIRED_MARK}
        </label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          invalid={Boolean(errors.email)}
          aria-required="true"
          aria-describedby="email-error"
          className="mt-2"
          {...register('email')}
        />
        <FieldError id="email-error" message={errors.email?.message} />
      </div>

      <div>
        <label htmlFor="phone" className={LABEL_CLASSES}>
          Phone or WhatsApp number (optional)
        </label>
        <Input
          id="phone"
          type="tel"
          autoComplete="tel"
          invalid={Boolean(errors.phone)}
          aria-describedby="phone-error"
          className="mt-2"
          {...register('phone')}
        />
        <FieldError id="phone-error" message={errors.phone?.message} />
      </div>

      <div>
        <label htmlFor="companyName" className={LABEL_CLASSES}>
          Company name (optional)
        </label>
        <Input
          id="companyName"
          autoComplete="organization"
          invalid={Boolean(errors.companyName)}
          aria-describedby="companyName-error"
          className="mt-2"
          {...register('companyName')}
        />
        <FieldError id="companyName-error" message={errors.companyName?.message} />
      </div>

      <div>
        <label htmlFor="subject" className={LABEL_CLASSES}>
          Subject{REQUIRED_MARK}
        </label>
        <Input
          id="subject"
          invalid={Boolean(errors.subject)}
          aria-required="true"
          aria-describedby="subject-error"
          className="mt-2"
          {...register('subject')}
        />
        <FieldError id="subject-error" message={errors.subject?.message} />
      </div>

      <div>
        <label htmlFor="message" className={LABEL_CLASSES}>
          Message{REQUIRED_MARK}
        </label>
        <Textarea
          id="message"
          rows={6}
          invalid={Boolean(errors.message)}
          aria-required="true"
          aria-describedby="message-error"
          className="mt-2"
          {...register('message')}
        />
        <FieldError id="message-error" message={errors.message?.message} />
      </div>

      <fieldset>
        <legend className={LABEL_CLASSES}>Preferred contact method{REQUIRED_MARK}</legend>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:gap-6">
          {CONTACT_METHODS.map((method) => {
            const deemphasized = method.value !== 'email' && !phoneValue;
            return (
              <label
                key={method.value}
                className={cn(
                  'flex min-h-11 items-center gap-2 text-body',
                  deemphasized ? 'text-secondary' : 'text-primary',
                )}
              >
                <input
                  type="radio"
                  value={method.value}
                  aria-describedby={deemphasized ? phoneHintId : undefined}
                  className="size-4 accent-primary-blue focus-ring"
                  {...register('preferredContactMethod')}
                />
                {method.label}
              </label>
            );
          })}
        </div>
        {!phoneValue && (
          <p id={phoneHintId} className="mt-2 text-label text-secondary">
            Add a phone or WhatsApp number above to be reachable by Phone or WhatsApp.
          </p>
        )}
        <FieldError id="preferredContactMethod-error" message={errors.preferredContactMethod?.message} />
      </fieldset>

      <div className="flex gap-3">
        <Checkbox
          id="consent"
          invalid={Boolean(errors.consent)}
          aria-required="true"
          aria-describedby="consent-error"
          {...register('consent')}
        />
        <label htmlFor="consent" className="text-body text-secondary">
          I agree to be contacted about my inquiry and understand my information will be handled
          per the{' '}
          <Link href="/privacy-policy" className="text-primary-blue underline underline-offset-4 hover:text-primary-blue-hover">
            privacy policy
          </Link>
          .{REQUIRED_MARK}
        </label>
      </div>
      <FieldError id="consent-error" message={errors.consent?.message} />

      <TurnstileWidget onVerify={handleTurnstileVerify} onExpire={handleTurnstileExpire} />

      <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
        {isSubmitting ? 'Sending…' : 'Send message'}
      </Button>
    </form>
  );
}
