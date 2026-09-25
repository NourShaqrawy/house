import { getAuthUserWithHousehold } from '../../utils/getAuthUser'
import { prisma } from '../../utils/prisma'
import { serializeExpense } from '../../utils/serialize'

/** تفاصيل مصروف واحد (ضمن بيت المستخدم فقط). */
export default defineEventHandler(async (event) => {
  const { householdId } = await getAuthUserWithHousehold(event)
  const id = getRouterParam(event, 'id')!

  const expense = await prisma.expense.findFirst({
    where: { id, householdId },
    include: {
      payer: { select: { id: true, name: true, avatar: true } },
      shares: { include: { user: { select: { id: true, name: true } } } },
      recipe: { select: { id: true, name: true } },
    },
  })

  if (!expense) throw createError({ statusCode: 404, statusMessage: 'المصروف غير موجود' })

  return { expense: serializeExpense(expense) }
})
