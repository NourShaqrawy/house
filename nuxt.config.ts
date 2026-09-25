// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',
  devtools: { enabled: true },

  // تطبيق محميّ بالكامل خلف تسجيل الدخول → نصيّره على العميل (SPA).
  // هذا يضمن توفّر جلسة Supabase دائماً عند التحقق من العضوية، ويتجنّب
  // مشكلة عدم تمرير كوكيز الجلسة أثناء SSR. مسارات الـ API تبقى تعمل.
  ssr: false,

  modules: ['@nuxtjs/supabase'],

  css: ['~/assets/css/main.css'],

  // إعداد وحدة Supabase. نربط أسماء المتغيّرات كما في المواصفات
  // (SUPABASE_ANON_KEY بدل SUPABASE_KEY الافتراضي).
  supabase: {
    url: process.env.SUPABASE_URL,
    key: process.env.SUPABASE_ANON_KEY,
    serviceKey: process.env.SUPABASE_SERVICE_KEY,
    redirectOptions: {
      login: '/auth/login',
      callback: '/confirm',
      // الصفحات المسموحة بدون تسجيل دخول
      exclude: ['/auth/login', '/auth/register'],
    },
  },

  // متغيرات الخادم فقط (سرية) + العامة
  runtimeConfig: {
    // سرية — الخادم فقط
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY,
    databaseUrl: process.env.DATABASE_URL,
    public: {
      // متاحة للعميل (تُملأ تلقائياً من وحدة supabase أيضاً)
    },
  },

  app: {
    pageTransition: { name: 'page', mode: 'out-in' },
    head: {
      htmlAttrs: { lang: 'ar', dir: 'rtl' },
      title: 'مصاريف البيت',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'theme-color', content: '#ffffff' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700&display=swap',
        },
      ],
    },
  },

  typescript: {
    strict: true,
  },
})
