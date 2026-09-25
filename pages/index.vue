<script setup lang="ts">
const { profile, household } = useMe()
const { money, signedMoney, date } = useFormat()

const copied = ref(false)
async function copyInvite() {
  if (!household.value?.inviteCode) return
  try {
    await navigator.clipboard.writeText(household.value.inviteCode)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch {
    // بعض المتصفحات تمنع النسخ بدون https — المستخدم ينسخ يدوياً
  }
}

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
interface Expense {
  id: string
  title: string
  amount: number
  expenseDate: string
  payer: { id: string; name: string }
}

const { data: balData, refresh: refreshBal } = await useFetch<{ balances: Balance[] }>(
  '/api/balances',
)
const { data: sugData } = await useFetch<{ transfers: Transfer[] }>('/api/settlements/suggest')
const { data: expData } = await useFetch<{ expenses: Expense[] }>('/api/expenses')

const myBalance = computed(
  () => balData.value?.balances.find((b) => b.userId === profile.value?.id)?.balance ?? 0,
)
const recentExpenses = computed(() => (expData.value?.expenses ?? []).slice(0, 5))
</script>

<template>
  <div class="stack">
    <!-- بطاقة رصيدك -->
    <div class="card balance-card" :class="myBalance >= 0 ? 'pos' : 'neg'">
      <div class="text-muted">رصيدك الآن</div>
      <div class="balance-amount">{{ signedMoney(myBalance) }}</div>
      <div class="balance-hint">
        <template v-if="myBalance > 0">لك عند الآخرين 🎉</template>
        <template v-else-if="myBalance < 0">عليك للآخرين</template>
        <template v-else>حسابك مصفّى ✓</template>
      </div>
    </div>

    <!-- كود دعوة البيت -->
    <div v-if="household" class="card invite-card">
      <div class="invite-info">
        <div class="text-muted invite-label">كود دعوة البيت</div>
        <div class="num invite-code">{{ household.inviteCode }}</div>
      </div>
      <button class="btn btn-ghost btn-copy" @click="copyInvite">
        {{ copied ? '✓ نُسخ' : 'نسخ' }}
      </button>
    </div>

    <!-- التحويلات المقترحة -->
    <section>
      <div class="section-head">
        <h2>التحويلات المقترحة</h2>
        <NuxtLink to="/settle" class="link-sm">تفاصيل</NuxtLink>
      </div>
      <div v-if="sugData?.transfers.length" class="stack-sm">
        <div v-for="(t, i) in sugData.transfers" :key="i" class="card row">
          <div><b>{{ t.from_name }}</b> ← <b>{{ t.to_name }}</b></div>
          <div class="num amount">{{ money(t.amount) }}</div>
        </div>
      </div>
      <div v-else class="card empty">لا توجد تحويلات — كل الحسابات مصفّاة ✓</div>
    </section>

    <!-- أحدث المصاريف -->
    <section>
      <div class="section-head">
        <h2>أحدث المصاريف</h2>
        <NuxtLink to="/expenses" class="link-sm">الكل</NuxtLink>
      </div>
      <div v-if="recentExpenses.length" class="stack-sm">
        <NuxtLink
          v-for="e in recentExpenses"
          :key="e.id"
          :to="`/expenses`"
          class="card row expense-row"
        >
          <div>
            <div class="exp-title">{{ e.title }}</div>
            <div class="text-muted exp-meta">{{ e.payer.name }} · {{ date(e.expenseDate) }}</div>
          </div>
          <div class="num amount">{{ money(e.amount) }}</div>
        </NuxtLink>
      </div>
      <div v-else class="card empty">
        لا مصاريف بعد.
        <NuxtLink to="/expenses">أضف أول مصروف</NuxtLink>
      </div>
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
.balance-card {
  text-align: center;
  padding: 28px;
}
.balance-card.pos {
  background: var(--color-success-soft);
  border-color: #abefc6;
}
.balance-card.neg {
  background: var(--color-danger-soft);
  border-color: #fecdca;
}
.balance-amount {
  font-size: 34px;
  font-weight: 700;
  margin: 6px 0;
}
.balance-card.pos .balance-amount {
  color: var(--color-success);
}
.balance-card.neg .balance-amount {
  color: var(--color-danger);
}
.balance-hint {
  font-size: 14px;
  color: var(--color-text-muted);
}
.invite-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  background: var(--color-primary-soft);
  border-color: #c7d7fe;
}
.invite-label {
  font-size: 13px;
}
.invite-code {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 3px;
  color: var(--color-primary);
}
.btn-copy {
  padding: 8px 16px;
  font-size: 14px;
  white-space: nowrap;
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.section-head h2 {
  font-size: 17px;
  margin: 0;
}
.link-sm {
  font-size: 13px;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
}
.expense-row {
  color: inherit;
}
.exp-title {
  font-weight: 600;
}
.exp-meta {
  font-size: 12px;
}
.amount {
  font-weight: 700;
}
.empty {
  text-align: center;
  color: var(--color-text-muted);
  padding: 20px;
  font-size: 14px;
}
</style>
