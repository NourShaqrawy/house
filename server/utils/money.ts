/**
 * أدوات الأموال — نعمل داخلياً بوحدة "القروش" (أعداد صحيحة) لضمان
 * الدقة التامة وتفادي أخطاء الفاصلة العائمة. كل الحسابات المالية
 * الحساسة (تقسيم الحصص، الأرصدة، التسوية) تمرّ من هنا.
 */

/** حوّل مبلغاً عشرياً (مثل 30.00) إلى قروش (3000). */
export function toCents(amount: number | string): number {
  const n = typeof amount === 'string' ? Number(amount) : amount
  if (!Number.isFinite(n)) throw new Error(`مبلغ غير صالح: ${amount}`)
  // نضرب في 100 ونقرّب لأقرب قرش لتفادي مثل 0.1*100 = 9.9999999
  return Math.round(n * 100)
}

/** حوّل القروش (3000) إلى مبلغ عشري برقمين (30.00). */
export function fromCents(cents: number): number {
  return Math.round(cents) / 100
}

/** تقريب مبلغ عشري إلى رقمين. */
export function round2(amount: number): number {
  return fromCents(toCents(amount))
}
