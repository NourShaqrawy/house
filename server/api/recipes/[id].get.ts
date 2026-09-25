import { getAuthUserWithHousehold } from '../../utils/getAuthUser'
import { prisma } from '../../utils/prisma'
import { serializeRecipe } from '../../utils/serialize'

/** تفاصيل طبخة (مع المكونات والسعر الكلي التقريبي). */
export default defineEventHandler(async (event) => {
  const { householdId } = await getAuthUserWithHousehold(event)
  const id = getRouterParam(event, 'id')!

  const recipe = await prisma.recipe.findFirst({
    where: { id, householdId },
    include: {
      ingredients: true,
      createdBy: { select: { id: true, name: true } },
    },
  })

  if (!recipe) throw createError({ statusCode: 404, statusMessage: 'الطبخة غير موجودة' })

  return { recipe: serializeRecipe(recipe) }
})
