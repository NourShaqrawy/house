import { getAuthUserWithHousehold } from '../../utils/getAuthUser'
import { prisma } from '../../utils/prisma'
import { serializeSettlement } from '../../utils/serialize'

/** سجل التسويات في البيت (الأحدث أولاً). */
export default defineEventHandler(async (event) => {
  const { householdId } = await getAuthUserWithHousehold(event)

  const settlements = await prisma.settlement.findMany({
    where: { householdId },
    include: {
      fromUser: { select: { id: true, name: true } },
      toUser: { select: { id: true, name: true } },
    },
    orderBy: { settledAt: 'desc' },
  })

  return { settlements: settlements.map(serializeSettlement) }
})
