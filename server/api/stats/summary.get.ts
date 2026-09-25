import { getAuthUserWithHousehold } from '../../utils/getAuthUser'
import { prisma } from '../../utils/prisma'

/**
 * ملخص إحصائي للبيت خلال فترة:
 *   ?from=YYYY-MM-DD  ?to=YYYY-MM-DD
 * يعيد: مجموع ما دفعه كل شخص، الإجمالي، المتوسط الأسبوعي، الأكثر/الأقل دفعاً.
 */
export default defineEventHandler(async (event) => {
  const { householdId } = await getAuthUserWithHousehold(event)
  const q = getQuery(event)

  const dateFilter: Record<string, Date> = {}
  if (q.from) dateFilter.gte = new Date(String(q.from))
  if (q.to) dateFilter.lte = new Date(String(q.to))

  const where: Record<string, unknown> = { householdId }
  if (Object.keys(dateFilter).length) where.expenseDate = dateFilter

  const [members, grouped, agg] = await Promise.all([
    prisma.profile.findMany({
      where: { householdId },
      select: { id: true, name: true },
    }),
    prisma.expense.groupBy({
      by: ['payerId'],
      where,
      _sum: { amount: true },
      _count: true,
    }),
    prisma.expense.aggregate({
      where,
      _sum: { amount: true },
      _count: true,
      _min: { expenseDate: true },
      _max: { expenseDate: true },
    }),
  ])

  const paidByUser = new Map(
    grouped.map((g) => [g.payerId, Number(g._sum.amount?.toString() ?? '0')]),
  )

  const perPerson = members.map((m) => ({
    userId: m.id,
    name: m.name,
    totalPaid: paidByUser.get(m.id) ?? 0,
  }))

  const total = Number(agg._sum.amount?.toString() ?? '0')

  // المتوسط الأسبوعي (بناءً على المدى الزمني الفعلي للمصاريف)
  let weeklyAverage = 0
  if (agg._min.expenseDate && agg._max.expenseDate) {
    const ms = agg._max.expenseDate.getTime() - agg._min.expenseDate.getTime()
    const weeks = Math.max(1, ms / (7 * 24 * 60 * 60 * 1000))
    weeklyAverage = Math.round((total / weeks) * 100) / 100
  }

  // الأكثر/الأقل دفعاً (من بين من دفع فعلياً على الأقل مرة، وإلا كل الأعضاء)
  const sorted = [...perPerson].sort((a, b) => b.totalPaid - a.totalPaid)
  const topPayer = sorted[0] ?? null
  const bottomPayer = sorted[sorted.length - 1] ?? null

  return {
    total: Math.round(total * 100) / 100,
    count: agg._count,
    weeklyAverage,
    perPerson,
    topPayer,
    bottomPayer,
  }
})
