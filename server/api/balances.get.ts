import { getAuthUserWithHousehold } from '../utils/getAuthUser'
import { loadHouseholdBalances } from '../utils/householdBalances'

/** رصيد كل شخص الصافي في بيت المستخدم. */
export default defineEventHandler(async (event) => {
  const { householdId } = await getAuthUserWithHousehold(event)
  const { balances } = await loadHouseholdBalances(householdId)
  return { balances }
})
