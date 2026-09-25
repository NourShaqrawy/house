import { getAuthUserWithHousehold } from '../../utils/getAuthUser'
import { prisma } from '../../utils/prisma'
import { resolveExpenseShares } from '../../utils/expenseShares'
import type { SplitTypeInput } from '../../utils/expenseShares'
import { serializeExpense } from '../../utils/serialize'

interface Body {
  title?: string
  amount?: number
  note?: string | null
  split_type?: SplitTypeInput
  expense_date?: string
  participants?: string[]
  shares?: { user_id: string; share_amount: number }[]
  percentages?: { user_id: string; percentage: number }[]
}

/** تعديل مصروف. إن تغيّر المبلغ/التقسيم/المشاركون تُعاد الحصص بالكامل. */
export default defineEventHandler(async (event) => {
  const { profile, householdId } = await getAuthUserWithHousehold(event)
  const id = getRouterParam(event, 'id')!
  const body = await readBody<Body>(event)

  const existing = await prisma.expense.findFirst({
    where: { id, householdId },
    select: { id: true, amount: true, splitType: true, payerId: true },
  })
  if (!existing) throw createError({ statusCode: 404, statusMessage: 'المصروف غير موجود' })

  // فقط من أضاف المصروف (الدافع) يمكنه تعديله
  if (existing.payerId !== profile.id) {
    throw createError({
      statusCode: 403,
      statusMessage: 'لا يمكنك تعديل مصروف أضافه شخص آخر',
    })
  }

  // هل نحتاج إعادة حساب الحصص؟ (إذا مُرّر أي من مدخلات التقسيم أو المبلغ)
  const recompute =
    body.amount !== undefined ||
    body.split_type !== undefined ||
    body.participants !== undefined ||
    body.shares !== undefined ||
    body.percentages !== undefined

  let newShares: { userId: string; shareAmount: number }[] | null = null
  const amount = body.amount ?? Number(existing.amount.toString())
  const splitType = (body.split_type ?? existing.splitType) as SplitTypeInput

  if (recompute) {
    const members = await prisma.profile.findMany({
      where: { householdId },
      select: { id: true },
    })
    const allowed = new Set(members.map((m) => m.id))
    newShares = resolveExpenseShares({
      splitType,
      amount,
      participants: body.participants,
      shares: body.shares,
      percentages: body.percentages,
      allowedUserIds: allowed,
    })
  }

  const expense = await prisma.$transaction(async (tx) => {
    await tx.expense.update({
      where: { id },
      data: {
        ...(body.title !== undefined ? { title: body.title.trim() } : {}),
        ...(body.amount !== undefined ? { amount: body.amount } : {}),
        ...(body.note !== undefined ? { note: body.note?.trim() || null } : {}),
        ...(body.split_type !== undefined ? { splitType } : {}),
        ...(body.expense_date !== undefined
          ? { expenseDate: new Date(body.expense_date) }
          : {}),
      },
    })

    if (newShares) {
      await tx.expenseShare.deleteMany({ where: { expenseId: id } })
      await tx.expenseShare.createMany({
        data: newShares.map((s) => ({
          expenseId: id,
          userId: s.userId,
          shareAmount: s.shareAmount,
        })),
      })
    }

    return tx.expense.findUnique({
      where: { id },
      include: {
        payer: { select: { id: true, name: true, avatar: true } },
        shares: { include: { user: { select: { id: true, name: true } } } },
      },
    })
  })

  return { expense: serializeExpense(expense) }
})
