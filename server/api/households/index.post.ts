import { getAuthUser } from '../../utils/getAuthUser'
import { prisma } from '../../utils/prisma'
import { generateInviteCode } from '../../utils/inviteCode'

/** إنشاء بيت جديد. المنشئ يصبح المالك وينضم إليه تلقائياً. */
export default defineEventHandler(async (event) => {
  const profile = await getAuthUser(event)
  const body = await readBody<{ name?: string; currency?: string }>(event)

  const name = body?.name?.trim()
  if (!name) {
    throw createError({ statusCode: 400, statusMessage: 'اسم البيت مطلوب' })
  }

  // ولّد كوداً فريداً (نحاول عدة مرات لتفادي التصادم النادر)
  let inviteCode = generateInviteCode()
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.household.findUnique({ where: { inviteCode } })
    if (!exists) break
    inviteCode = generateInviteCode()
  }

  // ننشئ البيت وننقل المستخدم إليه في معاملة واحدة
  const household = await prisma.$transaction(async (tx) => {
    const h = await tx.household.create({
      data: {
        name,
        ownerId: profile.id,
        inviteCode,
        currency: body?.currency?.trim() || 'SAR',
      },
    })
    await tx.profile.update({
      where: { id: profile.id },
      data: { householdId: h.id },
    })
    return h
  })

  return { household }
})
