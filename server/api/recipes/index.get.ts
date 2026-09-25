import { getAuthUserWithHousehold } from '../../utils/getAuthUser'
import { prisma } from '../../utils/prisma'
import { serializeRecipe } from '../../utils/serialize'

/** قائمة طبخات البيت مع سعرها التقريبي الكلي. */
export default defineEventHandler(async (event) => {
  const { householdId } = await getAuthUserWithHousehold(event)

  const recipes = await prisma.recipe.findMany({
    where: { householdId },
    include: {
      ingredients: true,
      createdBy: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return { recipes: recipes.map(serializeRecipe) }
})
