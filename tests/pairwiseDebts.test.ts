import { describe, it, expect } from 'vitest'
import { computePairwiseTransfers } from '../server/utils/pairwiseDebts'
import type { ExpenseForBalance, SettlementForBalance } from '../server/utils/balance'

describe('computePairwiseTransfers', () => {
  it('المثال الذهبي: A دفع 30 مقسومة على 3 → B و C يدفعان لـ A مباشرة', () => {
    const expenses: ExpenseForBalance[] = [
      {
        payerId: 'A',
        amount: 30,
        shares: [
          { userId: 'A', shareAmount: 10 },
          { userId: 'B', shareAmount: 10 },
          { userId: 'C', shareAmount: 10 },
        ],
      },
    ]
    const t = computePairwiseTransfers(expenses)
    expect(t).toHaveLength(2)
    for (const x of t) {
      expect(x.to).toBe('A')
      expect(['B', 'C']).toContain(x.from)
      expect(x.amount).toBe(10)
    }
  })

  it('لا يخلط ديون الأشخاص: محمد يدين لنور، وأحمد يدين لمحمد — لا يدفع أحمد لنور', () => {
    // محمد يدين لنور 50 (نور دفع مصروفاً وحصّة محمد 50)
    // أحمد يدين لمحمد 50 (محمد دفع مصروفاً وحصّة أحمد 50)
    const expenses: ExpenseForBalance[] = [
      {
        payerId: 'nour',
        amount: 100,
        shares: [
          { userId: 'nour', shareAmount: 50 },
          { userId: 'mohammad', shareAmount: 50 },
        ],
      },
      {
        payerId: 'mohammad',
        amount: 100,
        shares: [
          { userId: 'mohammad', shareAmount: 50 },
          { userId: 'ahmad', shareAmount: 50 },
        ],
      },
    ]
    const t = computePairwiseTransfers(expenses)
    // النتيجة الصحيحة: محمد→نور 50، أحمد→محمد 50 (وليس أحمد→نور)
    expect(t).toHaveLength(2)
    const has = (from: string, to: string, amount: number) =>
      t.some((x) => x.from === from && x.to === to && x.amount === amount)
    expect(has('mohammad', 'nour', 50)).toBe(true)
    expect(has('ahmad', 'mohammad', 50)).toBe(true)
    // تأكيد صريح: لا تحويل من أحمد إلى نور
    expect(t.some((x) => x.from === 'ahmad' && x.to === 'nour')).toBe(false)
  })

  it('يصافي الاتجاهين لنفس الزوج', () => {
    const expenses: ExpenseForBalance[] = [
      { payerId: 'A', amount: 30, shares: [{ userId: 'A', shareAmount: 0 }, { userId: 'B', shareAmount: 30 }] },
      { payerId: 'B', amount: 10, shares: [{ userId: 'B', shareAmount: 0 }, { userId: 'A', shareAmount: 10 }] },
    ]
    // B يدين لـ A بـ 30، A يدين لـ B بـ 10 → الصافي: B→A 20
    const t = computePairwiseTransfers(expenses)
    expect(t).toHaveLength(1)
    expect(t[0]).toMatchObject({ from: 'B', to: 'A', amount: 20 })
  })

  it('التسوية المسجّلة تُنقص دَين الزوج فقط', () => {
    const expenses: ExpenseForBalance[] = [
      {
        payerId: 'A',
        amount: 30,
        shares: [
          { userId: 'A', shareAmount: 10 },
          { userId: 'B', shareAmount: 10 },
          { userId: 'C', shareAmount: 10 },
        ],
      },
    ]
    const settlements: SettlementForBalance[] = [
      { fromUserId: 'B', toUserId: 'A', amount: 10 }, // B سدّد لـ A
    ]
    const t = computePairwiseTransfers(expenses, settlements)
    expect(t).toHaveLength(1)
    expect(t[0]).toMatchObject({ from: 'C', to: 'A', amount: 10 })
  })

  it('لا تحويلات عند التصفية الكاملة', () => {
    const expenses: ExpenseForBalance[] = [
      { payerId: 'A', amount: 20, shares: [{ userId: 'A', shareAmount: 10 }, { userId: 'B', shareAmount: 10 }] },
    ]
    const settlements: SettlementForBalance[] = [{ fromUserId: 'B', toUserId: 'A', amount: 10 }]
    expect(computePairwiseTransfers(expenses, settlements)).toHaveLength(0)
  })
})
