/**
 * حساب الديون الثنائية (pairwise) — دالة نقية.
 *
 * بعكس التبسيط الجماعي (الذي قد يجعل ج يدفع لأ رغم أنهما لم يتعاملا)،
 * هنا نتتبّع من يدين لمن مباشرةً حسب المصاريف الفعلية:
 *  - كل مشارك في مصروف يدين للدافع بحصّته.
 *  - نجمع الديون لكل زوج موجّه (مدين → دائن).
 *  - التسوية المسجّلة (X دفع لـ Y) تُنقص ما يدين به X لـ Y.
 *  - نصافي الاتجاهين لكل زوج (أ→ب مقابل ب→أ) ونُخرج الصافي فقط.
 *
 * لا يُوجَّه أي دَين عبر طرف ثالث.
 */
import { toCents, fromCents } from './money'
import type { ExpenseForBalance, SettlementForBalance } from './balance'

export interface Transfer {
  from: string
  to: string
  amount: number
}

export function computePairwiseTransfers(
  expenses: ExpenseForBalance[],
  settlements: SettlementForBalance[] = [],
): Transfer[] {
  // debt.get(debtor).get(creditor) = ما يدين به المدين للدائن (بالوحدات الصحيحة)
  const debt = new Map<string, Map<string, number>>()
  const add = (d: string, c: string, amt: number) => {
    if (d === c) return
    if (!debt.has(d)) debt.set(d, new Map())
    const m = debt.get(d)!
    m.set(c, (m.get(c) || 0) + amt)
  }

  for (const e of expenses) {
    for (const s of e.shares) {
      if (s.userId === e.payerId) continue
      add(s.userId, e.payerId, toCents(s.shareAmount)) // المشارك يدين للدافع
    }
  }

  for (const st of settlements) {
    // X دفع لـ Y → يُنقص دَين X تجاه Y
    add(st.fromUserId, st.toUserId, -toCents(st.amount))
  }

  const transfers: Transfer[] = []
  const done = new Set<string>()
  const key = (a: string, b: string) => [a, b].sort().join('|')

  for (const [d, m] of debt) {
    for (const c of m.keys()) {
      const k = key(d, c)
      if (done.has(k)) continue
      done.add(k)
      const ab = debt.get(d)?.get(c) || 0
      const ba = debt.get(c)?.get(d) || 0
      const net = ab - ba // موجب: d يدين لـ c
      if (net > 0) transfers.push({ from: d, to: c, amount: fromCents(net) })
      else if (net < 0) transfers.push({ from: c, to: d, amount: fromCents(-net) })
    }
  }

  // ترتيب ثابت (الأكبر أولاً) وإزالة الأصفار
  return transfers.filter((t) => t.amount > 0).sort((a, b) => b.amount - a.amount)
}
