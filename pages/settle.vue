<script setup lang="ts">
const { money, signedMoney, date } = useFormat()

interface Balance {
  userId: string
  name: string
  balance: number
}
interface Transfer {
  from: string
  from_name: string
  to: string
  to_name: string
  amount: number
}
interface Settlement {
  id: string
  amount: number
  note: string | null
  settledAt: string
  fromUser: { id: string; name: string }
  toUser: { id: string; name: string }
}

const { data: balData, refresh: refreshBal } = await useFetch<{ balances: Balance[] }>(
  '/api/balances',
)
const { data: sugData, refresh: refreshSug } = await useFetch<{ transfers: Transfer[] }>(
  '/api/settlements/suggest',
)
const { data: histData, refresh: refreshHist } = await useFetch<{ settlements: Settlement[] }>(
  '/api/settlements',
)

const busy = ref<string | null>(null)

async function confirmTransfer(t: Transfer) {
  const key = `${t.from}-${t.to}-${t.amount}`
  busy.value = key
  try {
    await $fetch('/api/settlements', {
      method: 'POST',
      body: { from_user_id: t.from, to_user_id: t.to, amount: t.amount },
    })
    await Promise.all([refreshBal(), refreshSug(), refreshHist()])
  } catch (e) {
    alert(e && typeof e === 'object' && 'statusMessage' in e ? (e as any).statusMessage : 'خطأ')
  } finally {
    busy.value = null
  }
}
</script>

<template>
  <div class="stack">
    <h1 class="page-title">التسوية</h1>

    <!-- الأرصدة -->
    <section>
      <h2 class="sec">أرصدة الجميع</h2>
      <div class="stack-sm">
        <div v-for="b in balData?.balances" :key="b.userId" class="card row">
          <span>{{ b.name }}</span>
          <span
            class="num bal"
            :class="b.balance > 0 ? 'text-success' : b.balance < 0 ? 'text-danger' : 'text-muted'"
          >
            {{ signedMoney(b.balance) }}
          </span>
        </div>
      </div>
    </section>

    <!-- التحويلات المقترحة -->
    <section>
      <h2 class="sec">من يحوّل لمن</h2>
      <div v-if="sugData?.transfers.length" class="stack-sm">
        <div v-for="(t, i) in sugData.transfers" :key="i" class="card transfer">
          <div class="transfer-info">
            <div class="transfer-line">
              <b>{{ t.from_name }}</b>
              <span class="arrow">←</span>
              <b>{{ t.to_name }}</b>
            </div>
            <div class="num transfer-amount">{{ money(t.amount) }}</div>
          </div>
          <button
            class="btn btn-primary btn-sm"
            :disabled="busy === `${t.from}-${t.to}-${t.amount}`"
            @click="confirmTransfer(t)"
          >
            {{ busy === `${t.from}-${t.to}-${t.amount}` ? '...' : '✓ تم التحويل' }}
          </button>
        </div>
      </div>
      <div v-else class="card empty">كل الحسابات مصفّاة ✓</div>
    </section>

    <!-- سجل التسويات -->
    <section>
      <h2 class="sec">سجل التسويات</h2>
      <div v-if="histData?.settlements.length" class="stack-sm">
        <div v-for="s in histData.settlements" :key="s.id" class="card row">
          <div>
            <div><b>{{ s.fromUser.name }}</b> ← <b>{{ s.toUser.name }}</b></div>
            <div class="text-muted meta">{{ date(s.settledAt) }}</div>
          </div>
          <span class="num amount">{{ money(s.amount) }}</span>
        </div>
      </div>
      <div v-else class="card empty">لا تسويات مسجّلة بعد.</div>
    </section>
  </div>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.stack-sm {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.page-title {
  font-size: 20px;
  margin: 0;
}
.sec {
  font-size: 16px;
  margin: 0 0 10px;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
}
.bal {
  font-weight: 700;
}
.transfer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
}
.transfer-line {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
}
.arrow {
  color: var(--color-text-muted);
}
.transfer-amount {
  font-weight: 700;
  color: var(--color-primary);
  margin-top: 2px;
}
.btn-sm {
  padding: 8px 14px;
  font-size: 13px;
}
.amount {
  font-weight: 700;
}
.meta {
  font-size: 12px;
}
.empty {
  text-align: center;
  color: var(--color-text-muted);
  padding: 20px;
  font-size: 14px;
}
</style>
