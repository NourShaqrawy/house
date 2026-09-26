<script setup lang="ts">
/** رأس صفحة موحّد: زر رجوع + العنوان + زر تحديث (+ إجراءات إضافية عبر slot). */
withDefaults(
  defineProps<{ title: string; icon?: string; refreshing?: boolean; back?: boolean }>(),
  { refreshing: false, back: true },
)
const emit = defineEmits<{ refresh: [] }>()
const router = useRouter()

function goBack() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>

<template>
  <header class="ph">
    <button v-if="back" class="ph-btn" aria-label="رجوع" @click="goBack">
      <AppIcon name="back" :size="20" />
    </button>
    <h1 class="ph-title">
      <AppIcon v-if="icon" :name="icon" :size="19" />
      <span>{{ title }}</span>
    </h1>
    <div class="ph-actions">
      <slot name="actions" />
      <button class="ph-btn" aria-label="تحديث" :disabled="refreshing" @click="emit('refresh')">
        <span v-if="refreshing" class="spinner dark" />
        <AppIcon v-else name="refresh" :size="19" />
      </button>
    </div>
  </header>
</template>

<style scoped>
.ph {
  display: flex;
  align-items: center;
  gap: 10px;
}
.ph-title {
  flex: 1;
  min-width: 0;
  font-size: 19px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.ph-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}
.ph-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  cursor: pointer;
  transition: background var(--t), border-color var(--t), color var(--t);
}
.ph-btn:hover {
  background: var(--color-primary-soft);
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.ph-btn:disabled {
  opacity: 0.6;
  cursor: default;
}
</style>
