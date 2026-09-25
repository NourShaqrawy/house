/**
 * حالة المستخدم الحالي + بيته، محمّلة مرة واحدة ومشتركة عبر التطبيق.
 */
interface Profile {
  id: string
  name: string
  avatar: string | null
  householdId: string | null
}
interface Household {
  id: string
  name: string
  inviteCode: string
  currency: string | null
}

export function useMe() {
  const profile = useState<Profile | null>('me:profile', () => null)
  const household = useState<Household | null>('me:household', () => null)
  const loaded = useState<boolean>('me:loaded', () => false)

  const refresh = async () => {
    // useRequestFetch يمرّر كوكيز الطلب أثناء SSR (بعكس $fetch العادي)،
    // ويتصرّف كـ $fetch على العميل — ضروري لصحّة المصادقة في أول تحميل.
    const apiFetch = useRequestFetch()
    try {
      const data = await apiFetch<{ profile: Profile; household: Household | null }>('/api/me')
      profile.value = data.profile
      household.value = data.household
      if (data.household?.currency) {
        useState<string>('currency').value = data.household.currency
      }
    } catch {
      profile.value = null
      household.value = null
    } finally {
      loaded.value = true
    }
  }

  return { profile, household, loaded, refresh }
}
