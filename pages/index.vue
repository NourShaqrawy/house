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
    /* بعض المتصفحات تمنع النسخ بدون https */
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

const { data: balData } = await useFetch<{ balances: Balance[] }>('/api/balances')
const { data: sugData } = await useFetch<{ transfers: Transfer[] }>('/api/settlements/suggest')
const { data: expData } = await useFetch<{ expenses: Expense[] }>('/api/expenses')

const myBalance = computed(
  () => balData.value?.balances.find((b) => b.userId === profile.value?.id)?.balance ?? 0,
)
const recentExpenses = computed(() => (expData.value?.expenses ?? []).slice(0, 6))
const iOwe = computed(() =>
  (sugData.value?.transfers ?? []).filter((t) => t.from === profile.value?.id),
)
const owedToMe = computed(() =>
  (sugData.value?.transfers ?? []).filter((t) => t.to === profile.value?.id),
)
</script>

<template>
  <div class="dash">
    <!-- الصف العلوي: الرصيد + كود الدعوة -->
    <div class="top-grid">
      <div class="card balance-card" :class="myBalance >= 0 ? 'pos' : 'neg'">
        <div class="bc-label text-muted">
          <AppIcon name="wallet" :size="18" /> رصيدك الآن
        </div>
        <div class="balance-amount num">{{ signedMoney(myBalance) }}</div>
        <div class="balance-hint">
          <template v-if="myBalance > 0">لك عند الآخرين</template>
          <template v-else-if="myBalance < 0">مستحقّ عليك للآخرين</template>
          <template v-else>حسابك مصفّى</template>
        </div>
      </div>

      <div v-if="household" class="card invite-card">
        <div class="invite-label text-muted">
          <AppIcon name="users" :size="18" /> كود دعوة البيت
        </div>
        <div class="num invite-code">{{ household.inviteCode }}</div>
        <button class="btn btn-gold btn-copy" @click="copyInvite">
          <AppIcon :name="copied ? 'check' : 'copy'" :size="17" />
          {{ copied ? 'تم النسخ' : 'نسخ الكود' }}
        </button>
      </div>
    </div>

    <!-- الصف السفلي: التسوية + أحدث المصاريف -->
    <div class="bottom-grid">
      <section class="col">
        <div class="section-head">
          <h2><AppIcon name="handshake" :size="18" /> تسوية حسابك</h2>
          <NuxtLink to="/settle" class="link-sm">الكل</NuxtLink>
        </div>
        <div v-if="iOwe.length || owedToMe.length" class="stack-sm">
          <div v-for="(t, i) in iOwe" :key="'o' + i" class="card debt-row owe">
            <div class="debt-text"><span class="text-muted">ادفع لـ</span> <b>{{ t.to_name }}</b></div>
            <div class="num amount text-danger">{{ money(t.amount) }}</div>
          </div>
          <div v-for="(t, i) in owedToMe" :key="'c' + i" class="card debt-row cred">
            <div class="debt-text"><b>{{ t.from_name }}</b> <span class="text-muted">يدفع لك</span></div>
            <div class="num amount text-success">{{ money(t.amount) }}</div>
          </div>
        </div>
        <div v-else class="card empty">
          <AppIcon name="check" :size="22" />
          <span>حسابك مصفّى — لا مستحقّات</span>
        </div>
      </section>

      <section class="col">
        <div class="section-head">
          <h2><AppIcon name="receipt" :size="18" /> أحدث المصاريف</h2>
          <NuxtLink to="/expenses" class="link-sm">الكل</NuxtLink>
        </div>
        <div v-if="recentExpenses.length" class="stack-sm">
          <NuxtLink
            v-for="e in recentExpenses"
            :key="e.id"
            to="/expenses"
            class="card row expense-row"
          >
            <div class="ex-left">
              <div class="ex-icon"><AppIcon name="receipt" :size="18" /></div>
              <div>
                <div class="exp-title">{{ e.title }}</div>
                <div class="text-muted exp-meta">{{ e.payer.name }} · {{ date(e.expenseDate) }}</div>
              </div>
            </div>
            <div class="num amount">{{ money(e.amount) }}</div>
          </NuxtLink>
        </div>
        <div v-else class="card empty">
          <AppIcon name="receipt" :size="22" />
          <NuxtLink to="/expenses">أضف أول مصروف</NuxtLink>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.dash {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.top-grid,
.bottom-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
}
.stack-sm {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* بطاقة الرصيد */
.balance-card {
  padding: 24px;
  position: relative;
  overflow: hidden;
}
.balance-card::after {
  content: '';
  position: absolute;
  inset-block-start: -40px;
  inset-inline-end: -40px;
  width: 140px;
  height: 140px;
  border-radius: 50%;
  opacity: 0.5;
}
.balance-card.pos {
  background: linear-gradient(135deg, var(--color-primary-soft), #fff);
}
.balance-card.pos::after {
  background: radial-gradient(var(--color-gold-soft), transparent 70%);
}
.balance-card.neg {
  background: linear-gradient(135deg, var(--color-danger-soft), #fff);
}
.bc-label,
.invite-label {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 14px;
}
.balance-amount {
  font-size: 36px;
  font-weight: 800;
  margin: 8px 0 4px;
}
.balance-card.pos .balance-amount {
  color: var(--color-primary);
}
.balance-card.neg .balance-amount {
  color: var(--color-danger);
}
.balance-hint {
  font-size: 14px;
  color: var(--color-text-muted);
}

/* بطاقة الدعوة */
.invite-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: linear-gradient(135deg, var(--color-gold-soft), #fff);
  border-color: #efe1b8;
}
.invite-code {
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 6px;
  color: var(--color-gold-hover);
}
.btn-copy {
  align-self: flex-start;
}

/* الأقسام */
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}
.section-head h2 {
  font-size: 16px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.link-sm {
  font-size: 13px;
  font-weight: 600;
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
.expense-row:hover {
  border-color: var(--color-primary);
  transform: translateY(-1px);
}
.ex-left {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.ex-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  display: grid;
  place-items: center;
  flex-shrink: 0;
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

.debt-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-inline-start: 4px solid transparent;
}
.debt-row.owe {
  border-inline-start-color: var(--color-danger);
}
.debt-row.cred {
  border-inline-start-color: var(--color-success);
}
.debt-text {
  font-size: 15px;
}

.empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-align: center;
  color: var(--color-text-muted);
  padding: 22px;
  font-size: 14px;
}

/* شبكة على الشاشات الكبيرة لملء المساحة */
@media (min-width: 760px) {
  .top-grid {
    grid-template-columns: 1.3fr 1fr;
  }
  .bottom-grid {
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }
}
</style>
