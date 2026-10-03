/**
 * Oct 2026 Jamie paycheck plan — net $2,407.38 × 2 = $4,814.76/mo.
 * DD lands in Jamie Chime Checking, then splits each paycheck.
 */
export const JAMIE_PAYCHECK_PLAN = {
  perCheck: 2407.38,
  monthly: 4814.76,
  /** Transfer to joint Chime Savings (settlement pot — former CC payments). */
  toSavingsPerCheck: 1607.38,
  toSavingsMonthly: 3214.76,
  /** Stays in Jamie Chime Checking as personal float. */
  keepInChimePerCheck: 650,
  keepInChimeMonthly: 1300,
  /** Transfer to Jamie USAA Checking (fun money). */
  funMoneyPerCheck: 150,
  funMoneyMonthly: 300,
} as const;
