import { getAuthUserWithHousehold } from '../../utils/getAuthUser'
import { prisma } from '../../utils/prisma'
import { serializeSettlement } from '../../utils/serialize'

interface Body {
  from_user_id?: string
  to_user_id?: string
  amount?: number
  note?: string
}

/** تسجيل تسوية فعلية (تحويل تمّ بين طرفين). */
export default defineEventHandler(async (event) => {
  const { profile, householdId } = await getAuthUserWithHousehold(event)
  const body = await readBody<Body>(event)

  const { from_user_id, to_user_id, amount } = body ?? {}

  if (!from_user_id || !to_user_id)
    throw createError({ statusCode: 400, statusMessage: 'الطرفان مطلوبان' })
  if (from_user_id === to_user_id)
    throw createError({ statusCode: 400, statusMessage: 'لا يمكن التحويل لنفس الشخص' })
  if (!amount || !(amount > 0))
    throw createError({ statusCode: 400, statusMessage: 'المبلغ يجب أن يكون موجباً' })

  // يجب أن يكون المستخدم طرفاً في التسوية (الدافع أو المستلم) — لا يسجّل
  // أحد تسوية بين شخصين آخرين.
  if (profile.id !== from_user_id && profile.id !== to_user_id)
    throw createError({
      statusCode: 403,
      statusMessage: 'يمكنك تسجيل تسوية أنت طرف فيها فقط',
    })

  // تحقق أن الطرفين عضوان في البيت
  const members = await prisma.profile.findMany({
    where: { householdId, id: { in: [from_user_id, to_user_id] } },
    select: { id: true },
  })
  if (members.length !== 2)
    throw createError({ statusCode: 400, statusMessage: 'أحد الطرفين ليس عضواً في البيت' })

  const settlement = await prisma.settlement.create({
    data: {
      householdId,
      fromUserId: from_user_id,
      toUserId: to_user_id,
      amount,
      note: body.note?.trim() || null,
    },
  })

  setResponseStatus(event, 201)
  return { settlement: serializeSettlement(settlement) }
})
