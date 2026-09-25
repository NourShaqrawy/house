import { defineConfig } from 'vitest/config'

export default defineConfig({
  // اختبارات المنطق النقي مستقلة عن Nuxt — لا نقرأ tsconfig الخاص به
  // (الذي يمتدّ من .nuxt/tsconfig.json غير الموجود إلا بعد nuxt prepare).
  esbuild: {
    tsconfigRaw: {
      compilerOptions: {
        target: 'es2022',
        useDefineForClassFields: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
