<script setup lang="ts">
const { money, signedMoney, date } = useFormat()
const { profile } = useMe()

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

// مبلغ الدفع لكل تحويل مقترح (قابل للتعديل — يسمح بالدفع الجزئي)
const payInputs = reactive<Record<string, string>>({})
watch(
  sugData,
  (d) => {
    const next: Record<string, string> = {}
    for (const tr of d?.transfers ?? []) next[`${tr.from}-${tr.to}`] = String(tr.amount)
    Object.keys(payInputs).forEach((k) => delete payInputs[k])
    Object.assign(payInputs, next)
  },
  { immediate: true },
)

// المستخدم طرف في التحويل؟ (يستطيع تسجيله)
function iAmParty(t: Transfer): boolean {
  return profile.value?.id === t.from || profile.value?.id === t.to
}

async function pay(t: Transfer) {
  const key = `${t.from}-${t.to}`
  const amount = Number(payInputs[key])
  if (!(amount > 0)) {
    alert('أدخل مبلغاً موجباً')
    return
  }
  if (amount > t.amount + 0.001) {
    if (!confirm(`المبلغ (${amount}) أكبر من المستحق (${t.amount}). المتابعة؟`)) return
  }
  busy.value = key
  try {
    await $fetch('/api/settlements', {
      method: 'POST',
      body: { from_user_id: t.from, to_user_id: t.to, amount },
    })
    await Promise.all([refreshBal(), refreshSug(), refreshHist()])
  } catch (e) {
    alert(e && typeof e === 'object' && 'statusMessage' in e ? (e as any).statusMessage : 'خطأ')
  } finally {
    busy.value = null
  }
}

async function deleteSettlement(s: Settlement) {
  if (!confirm('إلغاء هذه التسوية؟ سيُعاد المبلغ إلى الأرصدة.')) return
  busy.value = 'del-' + s.id
  try {
    await $fetch(`/api/settlements/${s.id}`, { method: 'DELETE' })
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
      <p class="text-muted sub">يمكنك دفع كامل المبلغ أو جزء منه — عدّل الرقم قبل الضغط على "دفع".</p>
      <div v-if="sugData?.transfers.length" class="stack-sm">
        <div v-for="(t, i) in sugData.transfers" :key="i" class="card transfer">
          <div class="transfer-info">
            <div class="transfer-line">
              <b>{{ t.from_name }}</b>
              <span class="arrow">←</span>
              <b>{{ t.to_name }}</b>
            </div>
            <div class="num transfer-amount">المستحق: {{ money(t.amount) }}</div>
          </div>
          <div v-if="iAmParty(t)" class="pay-box">
            <input
              v-model="payInputs[`${t.from}-${t.to}`]"
              type="number"
              step="0.01"
              min="0"
              class="pay-input num"
            />
            <button
              class="btn btn-primary btn-sm"
              :disabled="busy === `${t.from}-${t.to}`"
              @click="pay(t)"
            >
              {{ busy === `${t.from}-${t.to}` ? '...' : 'دفع' }}
            </button>
          </div>
          <span v-else class="text-muted not-party">بين طرفين آخرين</span>
        </div>
      </div>
      <div v-else class="card empty">
        <AppIcon name="check" :size="20" /> كل الحسابات مصفّاة
      </div>
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
          <div class="hist-side">
            <span class="num amount">{{ money(s.amount) }}</span>
            <button
              v-if="s.fromUser.id === profile?.id || s.toUser.id === profile?.id"
              class="undo-btn"
              :disabled="busy === 'del-' + s.id"
              @click="deleteSettlement(s)"
            >
              إلغاء
            </button>
          </div>
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
.sub {
  font-size: 13px;
  margin: -6px 0 10px;
}
.pay-box {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pay-input {
  width: 110px;
  padding: 8px 10px;
  text-align: center;
}
.not-party {
  font-size: 13px;
}
.hist-side {
  display: flex;
  align-items: center;
  gap: 12px;
}
.undo-btn {
  background: none;
  border: none;
  color: var(--color-danger);
  font-size: 13px;
  cursor: pointer;
  font-family: inherit;
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
  gap: 10px;
  flex-wrap: wrap;
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
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
  color: var(--color-text-muted);
  padding: 20px;
  font-size: 14px;
}
</style>
