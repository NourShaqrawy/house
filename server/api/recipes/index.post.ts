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
  description?: string
  servings?: number
  ingredients?: IngredientInput[]
}

/** إنشاء طبخة جديدة + مكوناتها. */
export default defineEventHandler(async (event) => {
  const { profile, householdId } = await getAuthUserWithHousehold(event)
  const body = await readBody<Body>(event)

  const name = body?.name?.trim()
  if (!name) throw createError({ statusCode: 400, statusMessage: 'اسم الطبخة مطلوب' })

  const ingredients = (body.ingredients ?? [])
    .filter((i) => i.name?.trim())
    .map((i) => ({
      name: i.name!.trim(),
      quantity: i.quantity?.trim() || null,
      estimatedPrice:
        i.estimated_price !== undefined && i.estimated_price !== null
          ? i.estimated_price
          : null,
    }))

  const recipe = await prisma.recipe.create({
    data: {
      householdId,
      name,
      description: body.description?.trim() || null,
      servings: body.servings ?? null,
      createdById: profile.id,
      ingredients: { create: ingredients },
    },
    include: {
      ingredients: true,
      createdBy: { select: { id: true, name: true } },
    },
  })

  setResponseStatus(event, 201)
  return { recipe: serializeRecipe(recipe) }
})
