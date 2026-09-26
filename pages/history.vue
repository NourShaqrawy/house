<script setup lang="ts">
const { money, date } = useFormat()

interface Settlement {
  id: string
  amount: number
  note: string | null
  settledAt: string
  fromUser: { id: string; name: string }
  toUser: { id: string; name: string }
}

const { data: histData, refresh } = await useFetch<{ settlements: Settlement[] }>('/api/settlements')
const refreshing = ref(false)
async function reload() {
  refreshing.value = true
  try { await refresh() } finally { refreshing.value = false }
}
</script>

<template>
  <div class="stack">
    <PageHeader title="سجل التسويات" icon="clock" :refreshing="refreshing" @refresh="reload" />
    <p class="text-muted sub">كل التحويلات التي تمّت بين أفراد البيت (لا يمكن التراجع عنها).</p>

    <div v-if="histData?.settlements.length" class="stack-sm">
      <div v-for="s in histData.settlements" :key="s.id" class="card row">
        <div class="left">
          <div class="ico"><AppIcon name="check" :size="18" /></div>
          <div>
            <div class="names"><b>{{ s.fromUser.name }}</b> <span class="verb text-muted">دفع لـ</span> <b>{{ s.toUser.name }}</b></div>
            <div class="text-muted meta">{{ date(s.settledAt) }}<template v-if="s.note"> · {{ s.note }}</template></div>
          </div>
        </div>
        <span class="num amount text-success">{{ money(s.amount) }}</span>
      </div>
    </div>
    <div v-else class="card empty">
      <AppIcon name="clock" :size="22" /> لا تسويات مسجّلة بعد.
    </div>
  </div>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.stack-sm {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.page-title {
  font-size: 20px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.sub {
  font-size: 13px;
  margin: 0;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
}
.left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.ico {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--color-success-soft);
  color: var(--color-success);
  display: grid;
  place-items: center;
  flex-shrink: 0;
}
.names {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
}
.verb {
  font-size: 13px;
}
.meta {
  font-size: 12px;
  margin-top: 2px;
}
.amount {
  font-weight: 700;
}
.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
  color: var(--color-text-muted);
  padding: 24px;
}
</style>
