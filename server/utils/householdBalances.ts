/**
 * تحميل بيانات البيت وحساب الأرصدة الصافية (مع الأسماء).
 * تُستخدم من /api/balances و /api/settlements/suggest لتفادي تكرار المنطق.
 */
import { prisma } from './prisma'
import { computeBalances } from './balance'
import type { ExpenseForBalance, SettlementForBalance } from './balance'

export interface NamedBalance {
  userId: string
  name: string
  balance: number
}

export async function loadHouseholdBalances(householdId: string): Promise<{
  balances: NamedBalance[]
  nameOf: Map<string, string>
}> {
  const [members, expenses, settlements] = await Promise.all([
    prisma.profile.findMany({
      where: { householdId },
      select: { id: true, name: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.expense.findMany({
      where: { householdId },
      select: {
        payerId: true,
        amount: true,
        shares: { select: { userId: true, shareAmount: true } },
      },
    }),
    prisma.settlement.findMany({
      where: { householdId },
      select: { fromUserId: true, toUserId: true, amount: true },
    }),
  ])

  const nameOf = new Map(members.map((m) => [m.id, m.name]))

  const expenseInput: ExpenseForBalance[] = expenses.map((e) => ({
    payerId: e.payerId,
    amount: Number(e.amount.toString()),
    shares: e.shares.map((s) => ({
      userId: s.userId,
      shareAmount: Number(s.shareAmount.toString()),
    })),
  }))

  const settlementInput: SettlementForBalance[] = settlements.map((s) => ({
    fromUserId: s.fromUserId,
    toUserId: s.toUserId,
    amount: Number(s.amount.toString()),
  }))

  const raw = computeBalances(
    members.map((m) => m.id),
    expenseInput,
    settlementInput,
  )

  const balances: NamedBalance[] = raw.map((b) => ({
    userId: b.userId,
    name: nameOf.get(b.userId) ?? 'غير معروف',
    balance: b.balance,
  }))

  return { balances, nameOf }
}
