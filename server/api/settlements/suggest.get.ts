import { getAuthUserWithHousehold } from '../../utils/getAuthUser'
import { loadHouseholdBalances } from '../../utils/householdBalances'
import { suggestSettlements } from '../../utils/settlement'

/** التحويلات المقترحة (خوارزمية التبسيط) لتصفية أرصدة البيت. */
export default defineEventHandler(async (event) => {
  const { householdId } = await getAuthUserWithHousehold(event)
  const { balances, nameOf } = await loadHouseholdBalances(householdId)

  const transfers = suggestSettlements(
    balances.map((b) => ({ userId: b.userId, balance: b.balance })),
  )

  return {
    transfers: transfers.map((t) => ({
      from: t.from,
      from_name: nameOf.get(t.from) ?? 'غير معروف',
      to: t.to,
      to_name: nameOf.get(t.to) ?? 'غير معروف',
      amount: t.amount,
    })),
  }
})
