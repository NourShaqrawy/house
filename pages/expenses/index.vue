<script setup lang="ts">
const { money, date } = useFormat()
const { profile } = useMe()

interface Member {
  id: string
  name: string
}
interface Share {
  user: { id: string; name: string }
  shareAmount: number
}
interface Expense {
  id: string
  title: string
  amount: number
  note: string | null
  splitType: string
  expenseDate: string
  payer: { id: string; name: string }
  shares: Share[]
}

const { data: memData } = await useFetch<{ members: Member[] }>('/api/households/members')
const { data: expData, refresh } = await useFetch<{ expenses: Expense[] }>('/api/expenses')
const members = computed(() => memData.value?.members ?? [])

// حصّة المستخدم الحالي في مصروف معيّن (0 إن لم يكن مشاركاً)
function myShare(e: Expense): number {
  return e.shares.find((s) => s.user.id === profile.value?.id)?.shareAmount ?? 0
}

// إجمالي ما على المستخدم من كل المصاريف المعروضة (مجموع حصصه)
const myTotalShare = computed(() =>
  (expData.value?.expenses ?? []).reduce((sum, e) => sum + myShare(e), 0),
)
// إجمالي ما دفعه المستخدم (مجموع مصاريف هو دافعها)
const myTotalPaid = computed(() =>
  (expData.value?.expenses ?? [])
    .filter((e) => e.payer.id === profile.value?.id)
    .reduce((sum, e) => sum + e.amount, 0),
)

// توسيع/طيّ بطاقات المصاريف
const expanded = ref<Set<string>>(new Set())
function toggleExpand(id: string) {
  const s = new Set(expanded.value)
  if (s.has(id)) s.delete(id)
  else s.add(id)
  expanded.value = s
}

// ---- نموذج الإضافة ----
const showForm = ref(false)
const saving = ref(false)
const formError = ref('')

const form = reactive({
  title: '',
  amount: '' as string | number,
  note: '',
  split_type: 'equal' as 'equal' | 'custom' | 'percentage',
  expense_date: new Date().toISOString().slice(0, 10),
  participants: [] as string[],
  customShares: {} as Record<string, string>,
  percentages: {} as Record<string, string>,
})

function resetForm() {
  form.title = ''
  form.amount = ''
  form.note = ''
  form.split_type = 'equal'
  form.expense_date = new Date().toISOString().slice(0, 10)
  form.participants = members.value.map((m) => m.id) // الكل افتراضياً
  form.customShares = {}
  form.percentages = {}
}

function toggleForm() {
  showForm.value = !showForm.value
  if (showForm.value) resetForm()
}

function toggleParticipant(id: string) {
  const i = form.participants.indexOf(id)
  if (i >= 0) form.participants.splice(i, 1)
  else form.participants.push(id)
}

async function submit() {
  formError.value = ''
  const amount = Number(form.amount)
  if (!form.title.trim()) return (formError.value = 'العنوان مطلوب')
  if (!(amount > 0)) return (formError.value = 'المبلغ يجب أن يكون موجباً')

  const body: Record<string, unknown> = {
    title: form.title.trim(),
    amount,
    note: form.note.trim() || undefined,
    split_type: form.split_type,
    expense_date: form.expense_date,
  }

  if (form.split_type === 'equal') {
    if (form.participants.length === 0) return (formError.value = 'اختر مشاركاً واحداً على الأقل')
    body.participants = form.participants
  } else if (form.split_type === 'custom') {
    body.shares = members.value
      .filter((m) => form.customShares[m.id])
      .map((m) => ({ user_id: m.id, share_amount: Number(form.customShares[m.id]) }))
  } else {
    body.percentages = members.value
      .filter((m) => form.percentages[m.id])
      .map((m) => ({ user_id: m.id, percentage: Number(form.percentages[m.id]) }))
  }

  saving.value = true
  try {
    await $fetch('/api/expenses', { method: 'POST', body })
    showForm.value = false
    await refresh()
  } catch (e: unknown) {
    formError.value = errMsg(e)
  } finally {
    saving.value = false
  }
}

async function remove(id: string) {
  if (!confirm('حذف هذا المصروف؟')) return
  await $fetch(`/api/expenses/${id}`, { method: 'DELETE' })
  await refresh()
}

function errMsg(e: unknown): string {
  if (e && typeof e === 'object' && 'statusMessage' in e) return String((e as any).statusMessage)
  return e instanceof Error ? e.message : 'حدث خطأ'
}

const splitLabel: Record<string, string> = {
  equal: 'بالتساوي',
  custom: 'مخصّص',
  percentage: 'نِسَب',
}
</script>

<template>
  <div class="stack">
    <div class="section-head">
      <h1 class="page-title">المصاريف</h1>
      <button class="btn btn-primary" @click="toggleForm">
        {{ showForm ? 'إلغاء' : '+ إضافة مصروف' }}
      </button>
    </div>

    <!-- نموذج الإضافة -->
    <div v-if="showForm" class="card form-card">
      <div class="field">
        <label>العنوان</label>
        <input v-model="form.title" placeholder="مثال: طبخة الكبة" />
      </div>
      <div class="grid-2">
        <div class="field">
          <label>المبلغ الكلي</label>
          <input v-model="form.amount" type="number" step="0.01" min="0" placeholder="0.00" />
        </div>
        <div class="field">
          <label>التاريخ</label>
          <input v-model="form.expense_date" type="date" />
        </div>
      </div>
      <div class="field">
        <label>ملاحظة (اختياري)</label>
        <input v-model="form.note" placeholder="..." />
      </div>

      <div class="field">
        <label>طريقة التقسيم</label>
        <div class="seg">
          <button
            v-for="opt in (['equal', 'custom', 'percentage'] as const)"
            :key="opt"
            type="button"
            :class="['seg-btn', { active: form.split_type === opt }]"
            @click="form.split_type = opt"
          >
            {{ splitLabel[opt] }}
          </button>
        </div>
      </div>

      <!-- اختيار المشاركين حسب النوع -->
      <div class="field">
        <label>المشاركون</label>

        <div v-if="form.split_type === 'equal'" class="members">
          <label v-for="m in members" :key="m.id" class="chk">
            <input
              type="checkbox"
              :checked="form.participants.includes(m.id)"
              @change="toggleParticipant(m.id)"
            />
            <span>{{ m.name }}</span>
          </label>
        </div>

        <div v-else-if="form.split_type === 'custom'" class="member-inputs">
          <div v-for="m in members" :key="m.id" class="member-input">
            <span class="member-name">{{ m.name }}</span>
            <input
              v-model="form.customShares[m.id]"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
            />
          </div>
          <p class="text-muted hint">اترك الحقل فارغاً لمن لا يشارك. مجموع الحصص = المبلغ الكلي.</p>
        </div>

        <div v-else class="member-inputs">
          <div v-for="m in members" :key="m.id" class="member-input">
            <span class="member-name">{{ m.name }}</span>
            <input
              v-model="form.percentages[m.id]"
              type="number"
              step="0.01"
              min="0"
              max="100"
              placeholder="%"
            />
          </div>
          <p class="text-muted hint">مجموع النِسَب = 100٪.</p>
        </div>
      </div>

      <p v-if="formError" class="text-danger msg">{{ formError }}</p>
      <button class="btn btn-primary full" :disabled="saving" @click="submit">
        {{ saving ? 'جارٍ الحفظ...' : 'حفظ المصروف' }}
      </button>
    </div>

    <!-- ملخّص المستخدم -->
    <div v-if="expData?.expenses.length" class="summary">
      <div class="card sum-card owe">
        <div class="text-muted sum-label">إجمالي ما عليك (حصصك)</div>
        <div class="num sum-val text-danger">{{ money(myTotalShare) }}</div>
      </div>
      <div class="card sum-card paid">
        <div class="text-muted sum-label">إجمالي ما دفعته</div>
        <div class="num sum-val text-success">{{ money(myTotalPaid) }}</div>
      </div>
    </div>

    <!-- القائمة -->
    <div v-if="expData?.expenses.length" class="stack-sm">
      <div v-for="e in expData.expenses" :key="e.id" class="card exp">
        <!-- الرأس القابل للنقر -->
        <button class="exp-head" @click="toggleExpand(e.id)">
          <div class="exp-head-main">
            <div class="exp-title">{{ e.title }}</div>
            <div class="text-muted exp-meta">
              دفع {{ e.payer.name }} · {{ date(e.expenseDate) }}
            </div>
          </div>
          <div class="exp-head-side">
            <div class="num amount">{{ money(e.amount) }}</div>
            <div v-if="myShare(e) > 0" class="num my-share">عليك: {{ money(myShare(e)) }}</div>
          </div>
          <span class="chevron" :class="{ open: expanded.has(e.id) }">▾</span>
        </button>

        <!-- التفاصيل عند الفتح -->
        <div v-if="expanded.has(e.id)" class="exp-details">
          <div v-if="e.note" class="exp-note text-muted">📝 {{ e.note }}</div>
          <div class="split-tag text-muted">التقسيم: {{ splitLabel[e.splitType] }}</div>
          <div class="shares-list">
            <div
              v-for="s in e.shares"
              :key="s.user.id"
              class="share-line"
              :class="{ me: s.user.id === profile?.id }"
            >
              <span>{{ s.user.name }}<span v-if="s.user.id === profile?.id"> (أنت)</span></span>
              <span class="num">{{ money(s.shareAmount) }}</span>
            </div>
          </div>
          <button v-if="e.payer.id === profile?.id" class="btn btn-ghost del-btn2" @click="remove(e.id)">
            حذف المصروف
          </button>
        </div>
      </div>
    </div>
    <div v-else class="card empty">لا مصاريف بعد.</div>
  </div>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.stack-sm {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.page-title {
  font-size: 20px;
  margin: 0;
}
.form-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.seg {
  display: flex;
  gap: 6px;
}
.seg-btn {
  flex: 1;
  padding: 9px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-muted);
  cursor: pointer;
}
.seg-btn.active {
  background: var(--color-primary-soft);
  border-color: var(--color-primary);
  color: var(--color-primary);
}
.members {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.chk {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
  margin: 0;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  cursor: pointer;
}
.chk input {
  width: auto;
}
.member-inputs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.member-input {
  display: flex;
  align-items: center;
  gap: 10px;
}
.member-name {
  flex: 1;
  font-weight: 500;
}
.member-input input {
  width: 130px;
}
.hint {
  font-size: 12px;
  margin: 4px 0 0;
}
.full {
  width: 100%;
  margin-top: 8px;
}
.msg {
  font-size: 14px;
}
.summary {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.sum-card {
  text-align: center;
  padding: 14px 8px;
}
.sum-label {
  font-size: 12px;
}
.sum-val {
  font-size: 19px;
  font-weight: 700;
  margin-top: 4px;
}
.exp {
  padding: 0;
  overflow: hidden;
}
.exp-head {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  background: none;
  border: none;
  font-family: inherit;
  text-align: start;
  cursor: pointer;
  padding: 14px 16px;
  color: inherit;
}
.exp-head-main {
  flex: 1;
  min-width: 0;
}
.exp-title {
  font-weight: 600;
  font-size: 16px;
}
.exp-meta {
  font-size: 12px;
  margin-top: 2px;
}
.exp-head-side {
  text-align: end;
}
.amount {
  font-weight: 700;
  font-size: 16px;
}
.my-share {
  font-size: 12px;
  color: var(--color-danger);
  font-weight: 600;
  margin-top: 2px;
}
.chevron {
  color: var(--color-text-muted);
  transition: transform 0.2s;
  font-size: 14px;
}
.chevron.open {
  transform: rotate(180deg);
}
.exp-details {
  padding: 0 16px 14px;
  border-top: 1px solid var(--color-border);
  padding-top: 12px;
}
.exp-note {
  font-size: 13px;
  margin-bottom: 8px;
}
.split-tag {
  font-size: 12px;
  margin-bottom: 8px;
}
.shares-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.share-line {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  padding: 6px 10px;
  background: var(--color-bg);
  border-radius: var(--radius-sm);
}
.share-line.me {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 600;
}
.del-btn2 {
  margin-top: 12px;
  color: var(--color-danger);
  border-color: #fecdca;
  font-size: 13px;
  padding: 8px 14px;
}
.empty {
  text-align: center;
  color: var(--color-text-muted);
  padding: 24px;
}
</style>
