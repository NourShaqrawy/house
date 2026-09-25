/**
 * أدوات الأموال — العملة تُعامَل بوحدات صحيحة فقط (بلا فواصل عشرية).
 * كل الحسابات المالية (تقسيم الحصص، الأرصدة، التسوية) تعمل بأعداد صحيحة،
 * وباقي القسمة يُوزّع كوحدات كاملة بحيث يبقى المجموع مساوياً للمبلغ تماماً.
 *
 * (الأسماء toCents/fromCents محفوظة تاريخياً؛ الوحدة الآن = 1 عملة كاملة.)
 */

/** حوّل مبلغاً إلى عدد صحيح (يُقرّب لأقرب وحدة كاملة). */
export function toCents(amount: number | string): number {
  const n = typeof amount === 'string' ? Number(amount) : amount
  if (!Number.isFinite(n)) throw new Error(`مبلغ غير صالح: ${amount}`)
  return Math.round(n)
}

/** إرجاع القيمة كعدد صحيح. */
export function fromCents(cents: number): number {
  return Math.round(cents)
}

/** تقريب إلى عدد صحيح. */
export function round2(amount: number): number {
  return Math.round(amount)
}
