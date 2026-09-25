import { getAuthUserWithHousehold } from '../../utils/getAuthUser'
import { prisma } from '../../utils/prisma'
import { resolveExpenseShares } from '../../utils/expenseShares'
import type { SplitTypeInput } from '../../utils/expenseShares'
import { serializeExpense } from '../../utils/serialize'

interface Body {
  title?: string
  amount?: number
  note?: string
  split_type?: SplitTypeInput
  expense_date?: string
  recipe_id?: string
  participants?: string[]
  shares?: { user_id: string; share_amount: number }[]
  percentages?: { user_id: string; percentage: number }[]
}

/** إنشاء مصروف جديد + حساب حصصه تلقائياً. الدافع = المستخدم الحالي (أو payer مُمرّر ضمن البيت). */
export default defineEventHandler(async (event) => {
  const { profile, householdId } = await getAuthUserWithHousehold(event)
  const body = await readBody<Body>(event)

  const title = body?.title?.trim()
  if (!title) throw createError({ statusCode: 400, statusMessage: 'العنوان مطلوب' })
  if (!body?.amount || !(body.amount > 0))
    throw createError({ statusCode: 400, statusMessage: 'المبلغ مطلوب ويجب أن يكون موجباً' })

  const splitType = body.split_type ?? 'equal'

  // أعضاء البيت المسموح بهم
  const members = await prisma.profile.findMany({
    where: { householdId },
    select: { id: true },
  })
  const allowed = new Set(members.map((m) => m.id))

  // إن كان مرتبطاً بطبخة، تحقق أنها تخص نفس البيت
  if (body.recipe_id) {
    const recipe = await prisma.recipe.findFirst({
      where: { id: body.recipe_id, householdId },
      select: { id: true },
    })
    if (!recipe) throw createError({ statusCode: 400, statusMessage: 'الطبخة غير موجودة في بيتك' })
  }

  const shares = resolveExpenseShares({
    splitType,
    amount: body.amount,
    participants: body.participants,
    shares: body.shares,
    percentages: body.percentages,
    allowedUserIds: allowed,
  })

  const expense = await prisma.expense.create({
    data: {
      householdId,
      payerId: profile.id, // الدافع هو المستخدم الحالي
      title,
      amount: body.amount,
      note: body.note?.trim() || null,
      splitType,
      recipeId: body.recipe_id || null,
      expenseDate: body.expense_date ? new Date(body.expense_date) : new Date(),
      shares: {
        create: shares.map((s) => ({ userId: s.userId, shareAmount: s.shareAmount })),
      },
    },
    include: {
      payer: { select: { id: true, name: true, avatar: true } },
      shares: { include: { user: { select: { id: true, name: true } } } },
    },
  })

  setResponseStatus(event, 201)
  return { expense: serializeExpense(expense) }
})
