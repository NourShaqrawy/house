<script setup lang="ts">
const { money, signedMoney } = useFormat()
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

const { data: balData, refresh: refreshBal } = await useFetch<{ balances: Balance[] }>(
  '/api/balances',
)
const { data: sugData, refresh: refreshSug } = await useFetch<{ transfers: Transfer[] }>(
  '/api/settlements/suggest',
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

function iAmParty(t: Transfer): boolean {
  return profile.value?.id === t.from || profile.value?.id === t.to
}

async function pay(t: Transfer) {
  const key = `${t.from}-${t.to}`
  const amount = Math.round(Number(payInputs[key]))
  if (!(amount > 0)) {
    alert('أدخل مبلغاً موجباً')
    return
  }
  if (amount > t.amount) {
    if (!confirm(`المبلغ (${amount}) أكبر من المستحق (${t.amount}). المتابعة؟`)) return
  }
  // تأكيد نهائي — التسوية لا يمكن التراجع عنها بعد تسجيلها
  if (!confirm(`تأكيد الدفع لـ ${t.to_name}: ${amount}؟ لا يمكن التراجع بعد التأكيد.`)) return
  busy.value = key
  try {
    await $fetch('/api/settlements', {
      method: 'POST',
      body: { from_user_id: t.from, to_user_id: t.to, amount },
    })
    await Promise.all([refreshBal(), refreshSug()])
  } catch (e) {
    alert(e && typeof e === 'object' && 'statusMessage' in e ? (e as any).statusMessage : 'خطأ')
  } finally {
    busy.value = null
  }
}
</script>

<template>
  <div class="stack">
    <div class="head-row">
      <h1 class="page-title"><AppIcon name="handshake" :size="20" /> التسوية</h1>
      <NuxtLink to="/history" class="link-sm"><AppIcon name="clock" :size="15" /> السجل</NuxtLink>
    </div>

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
      <p class="text-muted sub">يمكنك دفع كامل المبلغ أو جزء منه — عدّل الرقم قبل الضغط على "دفع". التسوية نهائية بعد التأكيد.</p>
      <div v-if="sugData?.transfers.length" class="stack-sm">
        <div v-for="(t, i) in sugData.transfers" :key="i" class="card transfer">
          <div class="transfer-info">
            <div class="transfer-line">
              <b>{{ t.from_name }}</b>
              <AppIcon name="arrow" :size="15" class="arrow" />
              <b>{{ t.to_name }}</b>
            </div>
            <div class="num transfer-amount">المستحق: {{ money(t.amount) }}</div>
          </div>
          <div v-if="iAmParty(t)" class="pay-box">
            <input
              v-model="payInputs[`${t.from}-${t.to}`]"
              type="number"
              step="1"
              min="0"
              inputmode="numeric"
              class="pay-input num"
            />
            <button
              class="btn btn-primary btn-sm"
              :disabled="busy === `${t.from}-${t.to}`"
              @click="pay(t)"
            >
              <span v-if="busy === `${t.from}-${t.to}`" class="spinner sm" />
              <template v-else>دفع</template>
            </button>
          </div>
          <span v-else class="text-muted not-party">بين طرفين آخرين</span>
        </div>
      </div>
      <div v-else class="card empty">
        <AppIcon name="check" :size="20" /> كل الحسابات مصفّاة
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
.head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.page-title {
  font-size: 20px;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.link-sm {
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 5px;
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
  min-width: 64px;
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
