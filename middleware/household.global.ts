/**
 * يوجّه المستخدم المسجّل الذي لا ينتمي لأي بيت إلى شاشة الإعداد (onboarding).
 * (المصادقة نفسها يديرها redirect الخاص بوحدة @nuxtjs/supabase.)
 */
export default defineNuxtRouteMiddleware(async (to) => {
  const publicPages = ['/auth/login', '/auth/register', '/confirm']
  if (publicPages.includes(to.path)) return

  const user = useSupabaseUser()
  if (!user.value) return // الوحدة ستعيد التوجيه لتسجيل الدخول

  const { profile, household, loaded, refresh } = useMe()
  if (!loaded.value) await refresh()

  // إن تعذّر تحميل الملف الشخصي (فشل مؤقت في الشبكة/المصادقة) لا نحوّل
  // المستخدم خطأً إلى onboarding — نتركه يحاول مجدداً.
  if (!profile.value) return

  if (!household.value && to.path !== '/onboarding') {
    return navigateTo('/onboarding')
  }
  if (household.value && to.path === '/onboarding') {
    return navigateTo('/')
  }
})
