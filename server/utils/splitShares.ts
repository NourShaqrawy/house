/**
 * تقسيم مبلغ مصروف على المشاركين — دالة نقية قابلة للاختبار.
 *
 * تدعم ثلاثة أنواع:
 *  - equal:      يقسم بالتساوي مع توزيع باقي القروش بشكل عادل.
 *  - custom:     مبالغ محددة يدخلها المستخدم (يتحقق أن مجموعها = المبلغ).
 *  - percentage: نسب مئوية تُحوّل لمبالغ مع توزيع باقي القروش (أكبر كسر أولاً).
 *
 * القاعدة الصارمة: مجموع الحصص = المبلغ الكلي بالضبط (بدقة القرش).
 */
import { toCents, fromCents } from './money'

export interface ShareResult {
  userId: string
  shareAmount: number // مبلغ عشري برقمين
}

export interface CustomShareInput {
  userId: string
  shareAmount: number
}

export interface PercentageShareInput {
  userId: string
  percentage: number // مثل 33.33
}

/** تقسيم بالتساوي مع توزيع باقي القروش على أوائل المشاركين. */
export function splitEqual(amount: number, participantIds: string[]): ShareResult[] {
  if (participantIds.length === 0) throw new Error('يجب وجود مشارك واحد على الأقل')
  const total = toCents(amount)
  const n = participantIds.length
  const base = Math.floor(total / n)
  let remainder = total - base * n // عدد القروش المتبقية (0..n-1)

  return participantIds.map((userId) => {
    let cents = base
    if (remainder > 0) {
      cents += 1
      remainder -= 1
    }
    return { userId, shareAmount: fromCents(cents) }
  })
}

/** تقسيم مخصّص — يتحقق أن مجموع الحصص = المبلغ الكلي. */
export function splitCustom(amount: number, shares: CustomShareInput[]): ShareResult[] {
  if (shares.length === 0) throw new Error('يجب وجود حصة واحدة على الأقل')
  const total = toCents(amount)
  const sum = shares.reduce((acc, s) => acc + toCents(s.shareAmount), 0)
  if (sum !== total) {
    throw new Error(
      `مجموع الحصص (${fromCents(sum)}) لا يساوي المبلغ الكلي (${fromCents(total)})`,
    )
  }
  return shares.map((s) => ({ userId: s.userId, shareAmount: fromCents(toCents(s.shareAmount)) }))
}

/** تقسيم بالنسب المئوية — يتحقق أن المجموع = 100، ويوزّع باقي القروش بطريقة أكبر الكسور. */
export function splitPercentage(amount: number, shares: PercentageShareInput[]): ShareResult[] {
  if (shares.length === 0) throw new Error('يجب وجود حصة واحدة على الأقل')
  const pctSum = shares.reduce((acc, s) => acc + s.percentage, 0)
  // نسمح بهامش بسيط جداً لأخطاء إدخال العشريات
  if (Math.abs(pctSum - 100) > 0.01) {
    throw new Error(`مجموع النسب (${pctSum}) يجب أن يساوي 100`)
  }

  const total = toCents(amount)
  // احسب الحصة المبدئية (floor) واحتفظ بالكسر لتوزيع الباقي
  const provisional = shares.map((s) => {
    const exact = (total * s.percentage) / 100
    const floor = Math.floor(exact)
    return { userId: s.userId, floor, frac: exact - floor }
  })

  let distributed = provisional.reduce((acc, p) => acc + p.floor, 0)
  let leftover = total - distributed // قروش يجب توزيعها

  // وزّع القروش المتبقية على أصحاب أكبر كسر
  const order = [...provisional].sort((a, b) => b.frac - a.frac)
  const bonus = new Map<string, number>()
  for (let i = 0; i < order.length && leftover > 0; i++) {
    bonus.set(order[i].userId, 1)
    leftover--
  }

  return provisional.map((p) => ({
    userId: p.userId,
    shareAmount: fromCents(p.floor + (bonus.get(p.userId) ?? 0)),
  }))
}
