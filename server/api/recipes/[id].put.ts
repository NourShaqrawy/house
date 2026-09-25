import { getAuthUserWithHousehold } from '../../utils/getAuthUser'
import { prisma } from '../../utils/prisma'
import { serializeRecipe } from '../../utils/serialize'

interface IngredientInput {
  name?: string
  quantity?: string
  estimated_price?: number
}
interface Body {
  name?: string
  description?: string | null
  servings?: number | null
  ingredients?: IngredientInput[]
}

/** تعديل طبخة. إن مُرّرت ingredients تُستبدل قائمة المكونات بالكامل. */
export default defineEventHandler(async (event) => {
  const { householdId } = await getAuthUserWithHousehold(event)
  const id = getRouterParam(event, 'id')!
  const body = await readBody<Body>(event)

  const existing = await prisma.recipe.findFirst({
    where: { id, householdId },
    select: { id: true },
  })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'الطبخة غير موجودة' })

  const recipe = await prisma.$transaction(async (tx) => {
    await tx.recipe.update({
      where: { id },
      data: {
        ...(body.name !== undefined ? { name: body.name.trim() } : {}),
        ...(body.description !== undefined
          ? { description: body.description?.trim() || null }
          : {}),
        ...(body.servings !== undefined ? { servings: body.servings } : {}),
      },
    })

    if (body.ingredients !== undefined) {
      await tx.recipeIngredient.deleteMany({ where: { recipeId: id } })
      const ingredients = body.ingredients
        .filter((i) => i.name?.trim())
        .map((i) => ({
          recipeId: id,
          name: i.name!.trim(),
          quantity: i.quantity?.trim() || null,
          estimatedPrice:
            i.estimated_price !== undefined && i.estimated_price !== null
              ? i.estimated_price
              : null,
        }))
      if (ingredients.length) await tx.recipeIngredient.createMany({ data: ingredients })
    }

    return tx.recipe.findUnique({
      where: { id },
      include: {
        ingredients: true,
        createdBy: { select: { id: true, name: true } },
      },
    })
  })

  return { recipe: serializeRecipe(recipe) }
})
