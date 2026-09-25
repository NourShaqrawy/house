/**
 * خوارزمية تبسيط الديون (Greedy Settlement) — دالة نقية.
 *
 * الهدف: تحويل قائمة الأرصدة إلى أقل عدد من التحويلات التي تصفّي الجميع
 * (عدد التحويلات ≤ n−1).
 *
 * الخطوات:
 *  1. افصل الأشخاص إلى دائنين (موجب) ومدينين (سالب).
 *  2. رتّب كلاً تنازلياً حسب القيمة المطلقة.
 *  3. طالما يوجد الطرفان: أكبر مدين يحوّل لأكبر دائن
 *     مبلغ = min(|رصيد المدين|, رصيد الدائن)، ثم حدّث الاثنين.
 *
 * تعمل بالقروش داخلياً لضمان الدقة.
 */
import { toCents, fromCents } from './money'
import type { BalanceResult } from './balance'

export interface Transfer {
  from: string
  to: string
  amount: number // مبلغ عشري برقمين
}

export function suggestSettlements(balances: BalanceResult[]): Transfer[] {
  // حوّل للقروش وافصل المجموعتين (نتجاهل الأصفار)
  const creditors: { userId: string; cents: number }[] = []
  const debtors: { userId: string; cents: number }[] = []

  for (const b of balances) {
    const c = toCents(b.balance)
    if (c > 0) creditors.push({ userId: b.userId, cents: c })
    else if (c < 0) debtors.push({ userId: b.userId, cents: -c }) // نخزّن القيمة المطلقة
  }

  // ترتيب تنازلي حسب القيمة المطلقة
  creditors.sort((a, b) => b.cents - a.cents)
  debtors.sort((a, b) => b.cents - a.cents)

  const transfers: Transfer[] = []
  let ci = 0
  let di = 0

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci]
    const debtor = debtors[di]
    const amount = Math.min(creditor.cents, debtor.cents)

    if (amount > 0) {
      transfers.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: fromCents(amount),
      })
    }

    creditor.cents -= amount
    debtor.cents -= amount

    if (creditor.cents === 0) ci++
    if (debtor.cents === 0) di++
  }

  return transfers
}
