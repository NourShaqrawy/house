import { getAuthUser } from '../utils/getAuthUser'
import { prisma } from '../utils/prisma'

/** بيانات المستخدم الحالي + profile + بيته (إن وُجد). */
export default defineEventHandler(async (event) => {
  const profile = await getAuthUser(event)

  const household = profile.householdId
    ? await prisma.household.findUnique({ where: { id: profile.householdId } })
    : null

  return { profile, household }
})
