import type { CapacitorConfig } from '@capacitor/cli'

// ملاحظة: هذا التطبيق fullstack ومصادقته بالكوكيز، لذا نستخدم أسلوب
// server.url — يحمّل الـ WebView الموقع المستضاف (نفس الأصل) فتعمل
// المصادقة والـ API كما في الموقع. استبدل الرابط بعنوان Render الحيّ.
const config: CapacitorConfig = {
  appId: 'com.beit.expenses',
  appName: 'مصاريف البيت',
  webDir: 'capacitor-shell',
  server: {
    url: 'https://house-nqa2.onrender.com',
    cleartext: false,
    androidScheme: 'https',
  },
}

export default config
