import { getAuthUserWithHousehold } from '../../utils/getAuthUser'
import { prisma } from '../../utils/prisma'

/** حذف مصروف (تُحذف حصصه تلقائياً عبر Cascade). */
export default defineEventHandler(async (event) => {
  const { householdId } = await getAuthUserWithHousehold(event)
  const id = getRouterParam(event, 'id')!

  const existing = await prisma.expense.findFirst({
    where: { id, householdId },
    select: { id: true },
  })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'المصروف غير موجود' })

  await prisma.expense.delete({ where: { id } })

  return { ok: true }
})
