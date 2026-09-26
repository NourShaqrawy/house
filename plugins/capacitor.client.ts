import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'

/**
 * سلوكيات خاصة بالتطبيق الأصلي (APK):
 * زر الرجوع في الهاتف — إن أمكن الرجوع داخل التطبيق نرجع، وإلا نطلب
 * تأكيد الخروج قبل إغلاق التطبيق.
 */
export default defineNuxtPlugin(() => {
  if (!Capacitor.isNativePlatform()) return

  const router = useRouter()

  App.addListener('backButton', ({ canGoBack }) => {
    const atRoot = router.currentRoute.value.path === '/'
    if (canGoBack && !atRoot) {
      router.back()
    } else {
      if (confirm('هل تريد الخروج من التطبيق؟')) {
        App.exitApp()
      }
    }
  })
})
