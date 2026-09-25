import { getAuthUserWithHousehold } from '../../utils/getAuthUser'
import { prisma } from '../../utils/prisma'

/** إلغاء تسوية مسجّلة (لتصحيح خطأ). يسمح به لطرفَي التسوية فقط. */
export default defineEventHandler(async (event) => {
  const { profile, householdId } = await getAuthUserWithHousehold(event)
  const id = getRouterParam(event, 'id')!

  const existing = await prisma.settlement.findFirst({
    where: { id, householdId },
    select: { id: true, fromUserId: true, toUserId: true },
  })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'التسوية غير موجودة' })

  if (profile.id !== existing.fromUserId && profile.id !== existing.toUserId) {
    throw createError({
      statusCode: 403,
      statusMessage: 'يمكنك إلغاء تسوية أنت طرف فيها فقط',
    })
  }

  await prisma.settlement.delete({ where: { id } })
  return { ok: true }
})
