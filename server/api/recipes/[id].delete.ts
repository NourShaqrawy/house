import { getAuthUserWithHousehold } from '../../utils/getAuthUser'
import { prisma } from '../../utils/prisma'

/** حذف طبخة (تُحذف مكوناتها عبر Cascade؛ المصاريف المرتبطة تبقى مع recipeId = null). */
export default defineEventHandler(async (event) => {
  const { profile, householdId } = await getAuthUserWithHousehold(event)
  const id = getRouterParam(event, 'id')!

  const existing = await prisma.recipe.findFirst({
    where: { id, householdId },
    select: { id: true, createdById: true },
  })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'الطبخة غير موجودة' })

  // فقط من أنشأ الطبخة يمكنه حذفها (التعديل يبقى تعاونياً لكل الأعضاء)
  if (existing.createdById !== profile.id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'لا يمكنك حذف طبخة أنشأها شخص آخر',
    })
  }

  await prisma.recipe.delete({ where: { id } })

  return { ok: true }
})
