import { getAuthUserWithHousehold } from '../../utils/getAuthUser'
import { prisma } from '../../utils/prisma'

/** حذف طبخة (تُحذف مكوناتها عبر Cascade؛ المصاريف المرتبطة تبقى مع recipeId = null). */
export default defineEventHandler(async (event) => {
  const { householdId } = await getAuthUserWithHousehold(event)
  const id = getRouterParam(event, 'id')!

  const existing = await prisma.recipe.findFirst({
    where: { id, householdId },
    select: { id: true },
  })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'الطبخة غير موجودة' })

  await prisma.recipe.delete({ where: { id } })

  return { ok: true }
})
