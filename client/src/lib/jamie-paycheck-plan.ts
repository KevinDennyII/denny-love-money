/**
 * Oct 2026 Jamie paycheck plan — net $2,407.38 × 2 = $4,814.76/mo.
 * DD lands in Jamie Chime Checking, then splits. Two buckets confirmed; float + USAA TBD.
 */
export const JAMIE_PAYCHECK_PLAN = {
  perCheck: 2407.38,
  monthly: 4814.76,
  /** Joint Chime Savings — settlement pot (former CC payments). */
  settlementMonthly: 1700,
  settlementPerCheck: 850,
  /** Jamie Chime Savings — family sink / travel funds. */
  familySinkMonthly: 300,
  familySinkPerCheck: 150,
  /** Jamie Chime Checking float — amount TBD. */
  keepInChimeMonthly: null as number | null,
  keepInChimePerCheck: null as number | null,
  /** Jamie USAA Checking — amount TBD. */
  usaaMonthly: null as number | null,
  usaaPerCheck: null as number | null,
  /** Confirmed monthly pieces so far. */
  confirmedMonthly: 2000,
} as const;

export function paycheckTbdMonthly(): number {
  return JAMIE_PAYCHECK_PLAN.monthly - JAMIE_PAYCHECK_PLAN.confirmedMonthly;
}
