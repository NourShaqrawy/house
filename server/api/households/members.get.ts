import { getAuthUserWithHousehold } from '../../utils/getAuthUser'
import { prisma } from '../../utils/prisma'

/** أعضاء بيت المستخدم الحالي. */
export default defineEventHandler(async (event) => {
  const { householdId } = await getAuthUserWithHousehold(event)

  const members = await prisma.profile.findMany({
    where: { householdId },
    select: { id: true, name: true, avatar: true },
    orderBy: { createdAt: 'asc' },
  })

  return { members }
})
