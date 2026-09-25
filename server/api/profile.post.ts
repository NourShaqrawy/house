import { getAuthUser } from '../utils/getAuthUser'
import { prisma } from '../utils/prisma'

/** إنشاء/تحديث بيانات profile للمستخدم الحالي (الاسم، الأفاتار). */
export default defineEventHandler(async (event) => {
  const profile = await getAuthUser(event)
  const body = await readBody<{ name?: string; avatar?: string }>(event)

  const name = body?.name?.trim()
  if (name !== undefined && name.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'الاسم لا يمكن أن يكون فارغاً' })
  }

  const updated = await prisma.profile.update({
    where: { id: profile.id },
    data: {
      ...(name ? { name } : {}),
      ...(body?.avatar !== undefined ? { avatar: body.avatar } : {}),
    },
  })

  return { profile: updated }
})
