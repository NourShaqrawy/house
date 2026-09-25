import { getAuthUserWithHousehold } from '../../../utils/getAuthUser'
import { prisma } from '../../../utils/prisma'
import { resolveExpenseShares } from '../../../utils/expenseShares'
import type { SplitTypeInput } from '../../../utils/expenseShares'
import { serializeExpense } from '../../../utils/serialize'

interface Body {
  amount?: number // اختياري: الافتراضي = السعر التقريبي للطبخة
  title?: string
  note?: string
  split_type?: SplitTypeInput
  expense_date?: string
  participants?: string[]
  shares?: { user_id: string; share_amount: number }[]
  percentages?: { user_id: string; percentage: number }[]
}

/**
 * "طبخ" وصفة → ينشئ مصروفاً مرتبطاً بها.
 * القيمة الافتراضية = مجموع الأسعار التقريبية للمكونات (قابلة للتعديل عبر amount).
 * الدافع = المستخدم الحالي.
 */
export default defineEventHandler(async (event) => {
  const { profile, householdId } = await getAuthUserWithHousehold(event)
  const id = getRouterParam(event, 'id')!
  const body = await readBody<Body>(event)

  const recipe = await prisma.recipe.findFirst({
    where: { id, householdId },
    include: { ingredients: { select: { estimatedPrice: true } } },
  })
  if (!recipe) throw createError({ statusCode: 404, statusMessage: 'الطبخة غير موجودة' })

  // احسب السعر التقريبي الافتراضي
  const estimated = recipe.ingredients.reduce(
    (acc, i) => acc + (i.estimatedPrice ? Number(i.estimatedPrice.toString()) : 0),
    0,
  )
  const amount = body.amount ?? Math.round(estimated * 100) / 100

  if (!(amount > 0))
    throw createError({
      statusCode: 400,
      statusMessage: 'لا يوجد سعر تقريبي للطبخة — أدخل المبلغ يدوياً',
    })

  const splitType = body.split_type ?? 'equal'

  const members = await prisma.profile.findMany({
    where: { householdId },
    select: { id: true },
  })
  const allowed = new Set(members.map((m) => m.id))

  const shares = resolveExpenseShares({
    splitType,
    amount,
    participants: body.participants,
    shares: body.shares,
    percentages: body.percentages,
    allowedUserIds: allowed,
  })

  const expense = await prisma.expense.create({
    data: {
      householdId,
      payerId: profile.id,
      title: body.title?.trim() || `طبخة: ${recipe.name}`,
      amount,
      note: body.note?.trim() || null,
      splitType,
      recipeId: recipe.id,
      expenseDate: body.expense_date ? new Date(body.expense_date) : new Date(),
      shares: {
        create: shares.map((s) => ({ userId: s.userId, shareAmount: s.shareAmount })),
      },
    },
    include: {
      payer: { select: { id: true, name: true, avatar: true } },
      shares: { include: { user: { select: { id: true, name: true } } } },
      recipe: { select: { id: true, name: true } },
    },
  })

  setResponseStatus(event, 201)
  return { expense: serializeExpense(expense) }
})
