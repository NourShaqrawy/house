<script setup lang="ts">
const { refresh } = useMe()

const tab = ref<'create' | 'join'>('create')
const householdName = ref('')
const currency = ref('SAR')
const inviteCode = ref('')
const loading = ref(false)
const error = ref('')

async function createHousehold() {
  error.value = ''
  if (!householdName.value.trim()) {
    error.value = 'اسم البيت مطلوب'
    return
  }
  loading.value = true
  try {
    await $fetch('/api/households', {
      method: 'POST',
      body: { name: householdName.value.trim(), currency: currency.value.trim() || 'SAR' },
    })
    await refresh()
    await navigateTo('/')
  } catch (e: unknown) {
    error.value = errMsg(e)
  } finally {
    loading.value = false
  }
}

async function joinHousehold() {
  error.value = ''
  if (!inviteCode.value.trim()) {
    error.value = 'كود الدعوة مطلوب'
    return
  }
  loading.value = true
  try {
    await $fetch('/api/households/join', {
      method: 'POST',
      body: { inviteCode: inviteCode.value.trim() },
    })
    await refresh()
    await navigateTo('/')
  } catch (e: unknown) {
    error.value = errMsg(e)
  } finally {
    loading.value = false
  }
}

function errMsg(e: unknown): string {
  if (e && typeof e === 'object' && 'statusMessage' in e) return String((e as any).statusMessage)
  return e instanceof Error ? e.message : 'حدث خطأ'
}
</script>

<template>
  <div class="onb-wrap">
    <div class="card onb-card">
      <h1 class="onb-title">أهلاً بك 👋</h1>
      <p class="text-muted">أنشئ بيتاً جديداً أو انضمّ لبيت موجود بكود الدعوة.</p>

      <div class="tabs">
        <button :class="['tab', { active: tab === 'create' }]" @click="tab = 'create'">
          إنشاء بيت
        </button>
        <button :class="['tab', { active: tab === 'join' }]" @click="tab = 'join'">
          الانضمام بكود
        </button>
      </div>

      <form v-if="tab === 'create'" @submit.prevent="createHousehold">
        <div class="field">
          <label>اسم البيت</label>
          <input v-model="householdName" placeholder="مثال: شقة الرياض" />
        </div>
        <div class="field">
          <label>العملة</label>
          <input v-model="currency" placeholder="SAR" style="direction: ltr; text-align: left" />
        </div>
        <p v-if="error" class="text-danger msg">{{ error }}</p>
        <button class="btn btn-primary full" :disabled="loading">
          {{ loading ? '...' : 'إنشاء' }}
        </button>
      </form>

      <form v-else @submit.prevent="joinHousehold">
        <div class="field">
          <label>كود الدعوة</label>
          <input
            v-model="inviteCode"
            placeholder="ABC123"
            style="direction: ltr; text-align: left; text-transform: uppercase"
          />
        </div>
        <p v-if="error" class="text-danger msg">{{ error }}</p>
        <button class="btn btn-primary full" :disabled="loading">
          {{ loading ? '...' : 'انضمام' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.onb-wrap {
  min-height: 70vh;
  display: grid;
  place-items: center;
}
.onb-card {
  width: 100%;
  max-width: 420px;
  padding: 24px;
}
.onb-title {
  margin: 0 0 4px;
}
.tabs {
  display: flex;
  gap: 8px;
  margin: 18px 0;
}
.tab {
  flex: 1;
  padding: 10px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-muted);
}
.tab.active {
  background: var(--color-primary-soft);
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.full {
  width: 100%;
}
.msg {
  font-size: 14px;
}
</style>
