import { quotationSchema, ERROR_CODES, type ApiResponse } from '@nexastack/shared';
import mongoose from 'mongoose';
import { NextResponse } from 'next/server';

import { connectToDatabase } from '@/lib/mongodb';
import { QuotationSubmission } from '@/lib/models/QuotationSubmission';
import { notifyQuotationSubmission } from '@/lib/notifications';
import { checkQuotationRateLimit, getClientIp } from '@/lib/quotationRateLimit';

/**
 * Public `/quotation` submission endpoint. Runs in the Node.js runtime (the default for Route
 * Handlers) because Mongoose needs a TCP connection, which the Edge runtime doesn't support.
 *
 * Chosen over the Express API (apps/api), matching `/api/contact`'s reasoning: a public form
 * must never depend on a Render free-tier instance waking up from sleep (root CLAUDE.md 22.5).
 */

interface QuotationResponseData {
  referenceNumber: string;
}

function jsonSuccess(
  data: QuotationResponseData,
  status = 201,
): NextResponse<ApiResponse<QuotationResponseData>> {
  return NextResponse.json({ success: true, data }, { status });
}

function jsonError(
  status: number,
  code: (typeof ERROR_CODES)[keyof typeof ERROR_CODES],
  message: string,
  details?: { location: 'body'; path: string; message: string }[],
): NextResponse<ApiResponse<never>> {
  return NextResponse.json({ success: false, error: { code, message, details } }, { status });
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<unknown>>> {
  const ip = getClientIp(request);
  const rateLimit = checkQuotationRateLimit(ip);
  if (!rateLimit.allowed) {
    return jsonError(
      429,
      ERROR_CODES.RATE_LIMITED,
      'Too many requests have been sent from your connection. Please wait 15 minutes and try again.',
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(
      400,
      ERROR_CODES.INVALID_JSON,
      'Send the request body as JSON with the header Content-Type: application/json',
    );
  }

  const parsed = await quotationSchema.safeParseAsync(body);
  if (!parsed.success) {
    const details = parsed.error.issues.map((issue) => ({
      location: 'body' as const,
      path: issue.path.map(String).join('.'),
      message: issue.message,
    }));
    return jsonError(
      400,
      ERROR_CODES.VALIDATION_ERROR,
      'Some of the information sent needs attention. Check the details and try again.',
      details,
    );
  }

  // Generated before insert so the confirmation number is derived from the same _id that gets
  // persisted, never a value generated only for display and disconnected from a real record.
  const _id = new mongoose.Types.ObjectId();
  const referenceNumber = `NXQ-${_id.toHexString().slice(-8).toUpperCase()}`;

  try {
    await connectToDatabase();
    await QuotationSubmission.create({ _id, ...parsed.data, referenceNumber });
  } catch (err) {
    console.error('[quotation] Failed to persist submission', err);
    return jsonError(
      500,
      ERROR_CODES.INTERNAL_ERROR,
      'Something went wrong on our end. Please try again in a moment.',
    );
  }

  // Deferred email hook, now in one shared place (lib/notifications.ts) instead of a copy here.
  // Behaviour is unchanged: no provider is configured, so nothing is sent.
  notifyQuotationSubmission({ referenceNumber });

  return jsonSuccess({ referenceNumber }, 201);
}
