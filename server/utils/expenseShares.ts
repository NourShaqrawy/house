/**
 * resolveExpenseShares — يحوّل مدخلات الطلب (حسب نوع التقسيم) إلى قائمة
 * حصص جاهزة للتخزين، بعد التحقق من صحّتها وأن المشاركين ينتمون للبيت.
 */
import { splitEqual, splitCustom, splitPercentage } from './splitShares'
import type { ShareResult } from './splitShares'

export type SplitTypeInput = 'equal' | 'custom' | 'percentage'

export interface ResolveSharesArgs {
  splitType: SplitTypeInput
  amount: number
  /** لـ equal */
  participants?: string[]
  /** لـ custom */
  shares?: { user_id: string; share_amount: number }[]
  /** لـ percentage */
  percentages?: { user_id: string; percentage: number }[]
  /** كل الأعضاء المسموح بهم في البيت (للتحقق) */
  allowedUserIds: Set<string>
}

function assertAllowed(ids: string[], allowed: Set<string>) {
  for (const id of ids) {
    if (!allowed.has(id)) {
      throw createError({
        statusCode: 400,
        statusMessage: `المشارك ${id} ليس عضواً في هذا البيت`,
      })
    }
  }
  if (ids.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'يجب اختيار مشارك واحد على الأقل' })
  }
  // منع التكرار
  if (new Set(ids).size !== ids.length) {
    throw createError({ statusCode: 400, statusMessage: 'يوجد مشارك مكرر' })
  }
}

export function resolveExpenseShares(args: ResolveSharesArgs): ShareResult[] {
  const { splitType, amount, allowedUserIds } = args

  if (!(amount > 0)) {
    throw createError({ statusCode: 400, statusMessage: 'المبلغ يجب أن يكون أكبر من صفر' })
  }

  try {
    if (splitType === 'equal') {
      const ids = args.participants ?? []
      assertAllowed(ids, allowedUserIds)
      return splitEqual(amount, ids)
    }

    if (splitType === 'custom') {
      const shares = args.shares ?? []
      assertAllowed(
        shares.map((s) => s.user_id),
        allowedUserIds,
      )
      return splitCustom(
        amount,
        shares.map((s) => ({ userId: s.user_id, shareAmount: s.share_amount })),
      )
    }

    if (splitType === 'percentage') {
      const pcts = args.percentages ?? []
      assertAllowed(
        pcts.map((p) => p.user_id),
        allowedUserIds,
      )
      return splitPercentage(
        amount,
        pcts.map((p) => ({ userId: p.user_id, percentage: p.percentage })),
      )
    }

    throw createError({ statusCode: 400, statusMessage: 'نوع تقسيم غير معروف' })
  } catch (err: unknown) {
    // أخطاء الدوال النقية (مثل عدم تطابق المجموع) نحوّلها إلى 400
    if (err && typeof err === 'object' && 'statusCode' in err) throw err
    const message = err instanceof Error ? err.message : 'خطأ في تقسيم الحصص'
    throw createError({ statusCode: 400, statusMessage: message })
  }
}
