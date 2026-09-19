import mongoose from 'mongoose';

import { AdminUser } from '../models/AdminUser.js';

/**
 * Admin ids to their email addresses, in one query, for showing "who did this". An account that no
 * longer exists is simply absent from the map (the UI shows it as unknown).
 *
 * The enquiry and quotation services each keep a private copy of this lookup; new code should use
 * this one.
 */
export async function adminEmailsById(ids: readonly string[]): Promise<Map<string, string>> {
  const unique = [...new Set(ids)];
  if (unique.length === 0) return new Map();

  // `trusted`: `sanitizeFilter` would otherwise turn `$in` into `$eq`. The ids come from our own
  // records, never from the request.
  const objectIds = unique.map((value) => new mongoose.Types.ObjectId(value));
  const admins = await AdminUser.find({ _id: mongoose.trusted({ $in: objectIds }) })
    .select('email')
    .lean();
  return new Map(admins.map((admin) => [String(admin._id), admin.email]));
}
