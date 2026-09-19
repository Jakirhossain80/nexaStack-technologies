/**
 * Whether an account that holds a valid session may actually act. Pure, so the rule can be tested
 * without a database, and used by BOTH places that need it (`validateSession` and `requireSession`).
 *
 * - `suspended`: refused outright. A suspended account's very next request fails, whether or not its
 *   sessions have been revoked yet, so suspension can never lag behind.
 * - `password_change_required`: the account is still on the temporary password a super_admin gave it.
 *   Only the routes that let it change that password (and sign out) are allowed; everything else is
 *   refused by the API, not just hidden by the UI.
 * - `ok`.
 *
 * A MISSING `status` is active and a missing `mustChangePassword` is false: accounts created before
 * these fields existed have neither.
 */

export type SessionAccess = 'ok' | 'suspended' | 'password_change_required';

export interface AccessSubject {
  status?: string | null | undefined;
  mustChangePassword?: boolean | null | undefined;
}

export function evaluateSessionAccess(
  user: AccessSubject,
  options: { allowPasswordChange: boolean },
): SessionAccess {
  if (user.status === 'suspended') return 'suspended';
  if (user.mustChangePassword === true && !options.allowPasswordChange) {
    return 'password_change_required';
  }
  return 'ok';
}
