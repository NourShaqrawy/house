import { getAuthUserWithHousehold } from '../../utils/getAuthUser'
import { loadHouseholdBalances } from '../../utils/householdBalances'
import { computePairwiseTransfers } from '../../utils/pairwiseDebts'

/**
 * التحويلات المستحقّة بين كل زوج مباشرةً (بلا توجيه عبر طرف ثالث).
 * تعكس من يدين لمن فعلاً حسب المصاريف.
 */
export default defineEventHandler(async (event) => {
  const { householdId } = await getAuthUserWithHousehold(event)
  const { nameOf, expenseInput, settlementInput } = await loadHouseholdBalances(householdId)

  const transfers = computePairwiseTransfers(expenseInput, settlementInput)

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
