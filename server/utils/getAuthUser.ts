/**
 * getAuthUser — helper مركزي للتحقق من مستخدم الطلب في كل server route محمي.
 *
 * الخطوات:
 *  1. يستخرج JWT من هيدر Authorization (Bearer ...) أو من كوكيز Supabase.
 *  2. يتحقق منه عبر Supabase (@nuxtjs/supabase يوفّر serverSupabaseUser).
 *  3. يجلب profile المقابل من قاعدة البيانات عبر Prisma.
 *  4. يرمي 401 إن لم يكن هناك مستخدم صالح.
 *
 * يُعيد كائن الـ profile كاملاً (بما فيه householdId).
 */
import type { H3Event } from 'h3'
import { serverSupabaseUser } from '#supabase/server'
import { prisma } from './prisma'
import type { Profile } from '@prisma/client'

export async function getAuthUser(event: H3Event): Promise<Profile> {
  const user = await serverSupabaseUser(event).catch(() => null)

  if (!user) {
    throw createError({ statusCode: 401, statusMessage: 'غير مصرّح — سجّل الدخول' })
  }

  let profile = await prisma.profile.findUnique({ where: { id: user.id } })

  // شبكة أمان: لو لم يُنشئ الـ trigger الـ profile بعد، ننشئه الآن.
  if (!profile) {
    profile = await prisma.profile.create({
      data: {
        id: user.id,
        name:
          (user.user_metadata?.name as string | undefined) ||
          user.email?.split('@')[0] ||
          'مستخدم',
      },
    })
  }

  return profile
}

/**
 * getAuthUserWithHousehold — مثل السابق لكنه يضمن أن المستخدم منتمٍ لبيت،
 * ويعيد { profile, householdId }. يرمي 400 إن لم يكن في بيت.
 */
export async function getAuthUserWithHousehold(
  event: H3Event,
): Promise<{ profile: Profile; householdId: string }> {
  const profile = await getAuthUser(event)
  if (!profile.householdId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'يجب الانضمام إلى بيت أولاً',
    })
  }
  return { profile, householdId: profile.householdId }
}
