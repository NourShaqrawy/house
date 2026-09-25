import { describe, it, expect } from 'vitest'
import { suggestSettlements } from '../server/utils/settlement'
import { computeBalances } from '../server/utils/balance'
import type { ExpenseForBalance } from '../server/utils/balance'

describe('suggestSettlements', () => {
  it('المثال الذهبي: B→A بـ 10 و C→A بـ 10', () => {
    const balances = [
      { userId: 'A', balance: 20 },
      { userId: 'B', balance: -10 },
      { userId: 'C', balance: -10 },
    ]
    const transfers = suggestSettlements(balances)
    expect(transfers).toHaveLength(2)
    const total = transfers.reduce((a, t) => a + t.amount, 0)
    expect(total).toBe(20)
    for (const t of transfers) {
      expect(t.to).toBe('A')
      expect(['B', 'C']).toContain(t.from)
      expect(t.amount).toBe(10)
    }
  })

  it('لا تحويلات عندما تكون كل الأرصدة صفر', () => {
    const transfers = suggestSettlements([
      { userId: 'A', balance: 0 },
      { userId: 'B', balance: 0 },
    ])
    expect(transfers).toHaveLength(0)
  })

  it('عدد التحويلات ≤ n−1', () => {
    const balances = [
      { userId: 'A', balance: 40 },
      { userId: 'B', balance: -15 },
      { userId: 'C', balance: -15 },
      { userId: 'D', balance: -10 },
    ]
    const transfers = suggestSettlements(balances)
    expect(transfers.length).toBeLessThanOrEqual(balances.length - 1)
    // المجموع المحوّل = مجموع الأرصدة الموجبة
    expect(transfers.reduce((a, t) => a + t.amount, 0)).toBe(40)
  })

  it('تكامل: أرصدة محسوبة ثم تسوية → تصفية كاملة', () => {
    const expenses: ExpenseForBalance[] = [
      {
        payerId: 'A',
        amount: 90,
        shares: [
          { userId: 'A', shareAmount: 30 },
          { userId: 'B', shareAmount: 30 },
          { userId: 'C', shareAmount: 30 },
        ],
      },
      {
        payerId: 'B',
        amount: 30,
        shares: [
          { userId: 'A', shareAmount: 10 },
          { userId: 'B', shareAmount: 10 },
          { userId: 'C', shareAmount: 10 },
        ],
      },
    ]
    const balances = computeBalances(['A', 'B', 'C'], expenses)
    const transfers = suggestSettlements(balances)
    // بعد تطبيق التحويلات المقترحة كتسويات، يجب أن تصبح كل الأرصدة صفراً
    const asSettlements = transfers.map((t) => ({
      fromUserId: t.from,
      toUserId: t.to,
      amount: t.amount,
    }))
    const after = computeBalances(['A', 'B', 'C'], expenses, asSettlements)
    for (const b of after) expect(b.balance).toBe(0)
  })
})
