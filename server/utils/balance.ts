/**
 * حساب الرصيد الصافي لكل شخص — دالة نقية قابلة للاختبار.
 *
 * القاعدة الذهبية:
 *   رصيد الشخص = (مجموع ما دفعه فعلياً في المصاريف)
 *              − (مجموع حصصه من كل المصاريف)
 *              + (تعديل التسويات)
 *
 * تعديل التسويات — ملاحظة مهمة عن الإشارة:
 *   السلوك المطلوب صراحةً في المواصفات هو أن التحويل الفعلي
 *   "يعيد رصيد الطرفين نحو الصفر". المدين (رصيد سالب) عندما
 *   يدفع تسوية يجب أن يرتفع رصيده نحو الصفر، والدائن (رصيد موجب)
 *   عندما يستلم يجب أن ينخفض رصيده نحو الصفر. لذلك:
 *     - الدافع (from):   balance += amount
 *     - المستلم (to):    balance -= amount
 *   (هذا هو ما يصفّي المثال الذهبي B→A و C→A بالكامل.)
 *
 * تحقّق ثابت: مجموع كل الأرصدة = صفر دائماً.
 */
import { toCents, fromCents } from './money'

export interface ExpenseForBalance {
  payerId: string
  amount: number
  shares: { userId: string; shareAmount: number }[]
}

export interface SettlementForBalance {
  fromUserId: string
  toUserId: string
  amount: number
}

export interface BalanceResult {
  userId: string
  balance: number // مبلغ عشري برقمين؛ موجب = له، سالب = عليه
}

export function computeBalances(
  memberIds: string[],
  expenses: ExpenseForBalance[],
  settlements: SettlementForBalance[] = [],
): BalanceResult[] {
  // نجمع كل شيء بالقروش
  const cents = new Map<string, number>()
  for (const id of memberIds) cents.set(id, 0)

  const add = (id: string, delta: number) => {
    // لو ظهر شخص غير مُدرج في memberIds (مثلاً غادر البيت) نُضيفه أيضاً
    cents.set(id, (cents.get(id) ?? 0) + delta)
  }

  for (const exp of expenses) {
    add(exp.payerId, toCents(exp.amount)) // ما دفعه
    for (const share of exp.shares) {
      add(share.userId, -toCents(share.shareAmount)) // حصته (سالب)
    }
  }

  for (const s of settlements) {
    add(s.fromUserId, toCents(s.amount)) // الدافع يرتفع نحو الصفر
    add(s.toUserId, -toCents(s.amount)) // المستلم ينخفض نحو الصفر
  }

  return [...cents.entries()].map(([userId, c]) => ({
    userId,
    balance: fromCents(c),
  }))
}
