<script setup lang="ts">
definePageMeta({ layout: false })

// صفحة استقبال إعادة التوجيه بعد تأكيد البريد / رابط الدخول.
const user = useSupabaseUser()
watchEffect(() => {
  if (user.value) navigateTo('/')
})
</script>

<template>
  <div class="wrap">
    <p class="text-muted">جارٍ تسجيل الدخول…</p>
  </div>
</template>

<style scoped>
.wrap {
  min-height: 100vh;
  display: grid;
  place-items: center;
}
</style>
