import { getAuthUser } from '../../utils/getAuthUser'
import { prisma } from '../../utils/prisma'

/** الانضمام إلى بيت عبر كود الدعوة. */
export default defineEventHandler(async (event) => {
  const profile = await getAuthUser(event)
  const body = await readBody<{ inviteCode?: string }>(event)

  const inviteCode = body?.inviteCode?.trim().toUpperCase()
  if (!inviteCode) {
    throw createError({ statusCode: 400, statusMessage: 'كود الدعوة مطلوب' })
  }

  const household = await prisma.household.findUnique({ where: { inviteCode } })
  if (!household) {
    throw createError({ statusCode: 404, statusMessage: 'كود دعوة غير صالح' })
  }

  await prisma.profile.update({
    where: { id: profile.id },
    data: { householdId: household.id },
  })

  return { household }
})
