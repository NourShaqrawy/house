import { describe, it, expect } from 'vitest'
import { computeBalances } from '../server/utils/balance'
import type {
  ExpenseForBalance,
  SettlementForBalance,
} from '../server/utils/balance'

const byId = (res: { userId: string; balance: number }[]) =>
  Object.fromEntries(res.map((r) => [r.userId, r.balance]))

describe('computeBalances', () => {
  it('المثال الذهبي: A دفع 30 مقسومة على 3', () => {
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
    const res = byId(computeBalances(['A', 'B', 'C'], expenses))
    expect(res.A).toBe(20)
    expect(res.B).toBe(-10)
    expect(res.C).toBe(-10)
  })

  it('مجموع كل الأرصدة = صفر دائماً', () => {
    const expenses: ExpenseForBalance[] = [
      {
        payerId: 'A',
        amount: 10,
        shares: [
          { userId: 'A', shareAmount: 3.34 },
          { userId: 'B', shareAmount: 3.33 },
          { userId: 'C', shareAmount: 3.33 },
        ],
      },
      {
        payerId: 'B',
        amount: 55.5,
        shares: [
          { userId: 'A', shareAmount: 27.75 },
          { userId: 'B', shareAmount: 27.75 },
        ],
      },
    ]
    const res = computeBalances(['A', 'B', 'C'], expenses)
    const total = res.reduce((a, r) => a + r.balance, 0)
    expect(Math.round(total * 100)).toBe(0)
  })

  it('دمج الدَّين القديم: B مدين لـ A بـ 50 ثم اشترى B طبخة 30 مقسومة على 3', () => {
    // نمثّل الدَّين القديم كمصروف سابق: A دفع 100 والحصص A=50, B=50
    // → A: +50, B: -50 (أي B مدين لـ A بـ 50)
    const oldDebt: ExpenseForBalance = {
      payerId: 'A',
      amount: 100,
      shares: [
        { userId: 'A', shareAmount: 50 },
        { userId: 'B', shareAmount: 50 },
      ],
    }
    // ثم B اشترى طبخة 30 مقسومة على 3 (حصة A منها 10)
    const newExpense: ExpenseForBalance = {
      payerId: 'B',
      amount: 30,
      shares: [
        { userId: 'A', shareAmount: 10 },
        { userId: 'B', shareAmount: 10 },
        { userId: 'C', shareAmount: 10 },
      ],
    }
    const res = byId(computeBalances(['A', 'B', 'C'], [oldDebt, newExpense]))
    // A: دفع 100، حصصه 50+10=60 → +40 ... أي B صار مديناً لـ A بـ 40 (بعد خصم مساهمته)
    // B: دفع 30، حصصه 50+10=60 → -30
    // C: دفع 0، حصته 10 → -10
    expect(res.A).toBe(40)
    expect(res.B).toBe(-30)
    expect(res.C).toBe(-10)
    // المجموع صفر
    expect(res.A + res.B + res.C).toBe(0)
  })

  it('التسوية تعيد رصيد الطرفين نحو الصفر', () => {
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
      { fromUserId: 'B', toUserId: 'A', amount: 10 },
      { fromUserId: 'C', toUserId: 'A', amount: 10 },
    ]
    const res = byId(computeBalances(['A', 'B', 'C'], expenses, settlements))
    expect(res.A).toBe(0)
    expect(res.B).toBe(0)
    expect(res.C).toBe(0)
  })
})
