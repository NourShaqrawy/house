import { getAuthUserWithHousehold } from '../../utils/getAuthUser'
import { prisma } from '../../utils/prisma'

/** حذف مصروف (تُحذف حصصه تلقائياً عبر Cascade). */
export default defineEventHandler(async (event) => {
  const { profile, householdId } = await getAuthUserWithHousehold(event)
  const id = getRouterParam(event, 'id')!

  const existing = await prisma.expense.findFirst({
    where: { id, householdId },
    select: { id: true, payerId: true },
  })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'المصروف غير موجود' })

  // فقط من أضاف المصروف (الدافع) يمكنه حذفه
  if (existing.payerId !== profile.id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'لا يمكنك حذف مصروف أضافه شخص آخر',
    })
  }

  await prisma.expense.delete({ where: { id } })

  return { ok: true }
})
