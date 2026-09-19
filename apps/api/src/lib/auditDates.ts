/**
 * The audit view filters by DATE (two `<input type="date">` values, `YYYY-MM-DD`). A date means a day
 * on the founder's clock, not on the server's: NexaStack works on Asia/Dhaka time (UTC+6, no daylight
 * saving), so "19 September" runs from 00:00 to 23:59:59.999 at +06:00, which is 18:00 the previous
 * evening to 17:59:59.999 UTC. Reading the date as UTC would put events from the early morning of a day
 * into the previous day's results.
 *
 * Both ends are inclusive. Pure, so it can be tested without a database.
 */

const DHAKA_OFFSET = '+06:00';

export interface DateRange {
  gte?: Date;
  lte?: Date;
}

export function dhakaDayRange(from: string | undefined, to: string | undefined): DateRange {
  const range: DateRange = {};
  if (from) range.gte = new Date(`${from}T00:00:00.000${DHAKA_OFFSET}`);
  if (to) range.lte = new Date(`${to}T23:59:59.999${DHAKA_OFFSET}`);
  return range;
}
