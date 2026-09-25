<script setup lang="ts">
const { money } = useFormat()

interface PerPerson {
  userId: string
  name: string
  totalPaid: number
}
interface Summary {
  total: number
  count: number
  weeklyAverage: number
  perPerson: PerPerson[]
  topPayer: PerPerson | null
  bottomPayer: PerPerson | null
}

const from = ref('')
const to = ref('')

const query = computed(() => {
  const q: Record<string, string> = {}
  if (from.value) q.from = from.value
  if (to.value) q.to = to.value
  return q
})

const { data, refresh } = await useFetch<Summary>('/api/stats/summary', { query })

const maxPaid = computed(() =>
  Math.max(1, ...(data.value?.perPerson.map((p) => p.totalPaid) ?? [1])),
)
</script>

<template>
  <div class="stack">
    <h1 class="page-title">الإحصائيات</h1>

    <div class="card filters">
      <div class="field">
        <label>من</label>
        <input v-model="from" type="date" @change="refresh()" />
      </div>
      <div class="field">
        <label>إلى</label>
        <input v-model="to" type="date" @change="refresh()" />
      </div>
    </div>

    <div class="kpis">
      <div class="card kpi">
        <div class="text-muted">إجمالي المصاريف</div>
        <div class="num kpi-val">{{ money(data?.total) }}</div>
      </div>
      <div class="card kpi">
        <div class="text-muted">عدد المصاريف</div>
        <div class="num kpi-val">{{ data?.count ?? 0 }}</div>
      </div>
      <div class="card kpi">
        <div class="text-muted">المتوسط الأسبوعي</div>
        <div class="num kpi-val">{{ money(data?.weeklyAverage) }}</div>
      </div>
    </div>

    <section>
      <h2 class="sec">ما دفعه كل شخص</h2>
      <div class="stack-sm">
        <div v-for="p in data?.perPerson" :key="p.userId" class="bar-row">
          <div class="bar-head">
            <span>{{ p.name }}</span>
            <span class="num">{{ money(p.totalPaid) }}</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill" :style="{ width: (p.totalPaid / maxPaid) * 100 + '%' }" />
          </div>
        </div>
      </div>
    </section>

    <div v-if="data?.topPayer" class="card highlights">
      <div>🥇 الأكثر دفعاً: <b>{{ data.topPayer.name }}</b> ({{ money(data.topPayer.totalPaid) }})</div>
      <div v-if="data.bottomPayer">
        🥉 الأقل دفعاً: <b>{{ data.bottomPayer.name }}</b> ({{ money(data.bottomPayer.totalPaid) }})
      </div>
    </div>
  </div>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.stack-sm {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.page-title {
  font-size: 20px;
  margin: 0;
}
.filters {
  display: flex;
  gap: 12px;
}
.filters .field {
  flex: 1;
  margin: 0;
}
.kpis {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
}
.kpi {
  text-align: center;
  padding: 14px 8px;
}
.kpi .text-muted {
  font-size: 12px;
}
.kpi-val {
  font-size: 17px;
  font-weight: 700;
  margin-top: 4px;
}
.sec {
  font-size: 16px;
  margin: 0 0 10px;
}
.bar-head {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  margin-bottom: 4px;
}
.bar-track {
  height: 12px;
  background: var(--color-bg);
  border-radius: 999px;
  overflow: hidden;
}
.bar-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 999px;
  transition: width 0.3s;
  min-width: 2px;
}
.highlights {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 15px;
}
@media (max-width: 420px) {
  .kpis {
    grid-template-columns: 1fr;
  }
}
</style>
