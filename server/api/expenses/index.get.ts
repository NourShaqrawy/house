import { getAuthUserWithHousehold } from '../../utils/getAuthUser'
import { prisma } from '../../utils/prisma'
import { serializeExpense } from '../../utils/serialize'

/**
 * قائمة المصاريف لبيت المستخدم، مع فلترة اختيارية:
 *   ?from=YYYY-MM-DD  ?to=YYYY-MM-DD  ?payer=<uuid>
 */
export default defineEventHandler(async (event) => {
  const { householdId } = await getAuthUserWithHousehold(event)
  const q = getQuery(event)

  const where: Record<string, unknown> = { householdId }

  if (q.payer) where.payerId = String(q.payer)

  const dateFilter: Record<string, Date> = {}
  if (q.from) dateFilter.gte = new Date(String(q.from))
  if (q.to) dateFilter.lte = new Date(String(q.to))
  if (Object.keys(dateFilter).length) where.expenseDate = dateFilter

  const expenses = await prisma.expense.findMany({
    where,
    include: {
      payer: { select: { id: true, name: true, avatar: true } },
      shares: { include: { user: { select: { id: true, name: true } } } },
    },
    orderBy: [{ expenseDate: 'desc' }, { createdAt: 'desc' }],
  })

  return { expenses: expenses.map(serializeExpense) }
})
