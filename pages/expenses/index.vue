<script setup lang="ts">
const { money, date } = useFormat()
const { profile } = useMe()

interface Member { id: string; name: string }
interface Share { user: { id: string; name: string }; shareAmount: number }
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

const refreshing = ref(false)
async function reload() {
  refreshing.value = true
  try { await refresh() } finally { refreshing.value = false }
}

function myShare(e: Expense): number {
  return e.shares.find((s) => s.user.id === profile.value?.id)?.shareAmount ?? 0
}
function shareOf(e: Expense, uid: string): number {
  return e.shares.find((s) => s.user.id === uid)?.shareAmount ?? 0
}

// ---------- الفلترة ----------
const showFilter = ref(false)
const fFrom = ref('')
const fTo = ref('')
const fA = ref('')
const fB = ref('')

const filtered = computed(() => {
  let list = expData.value?.expenses ?? []
  if (fFrom.value) list = list.filter((e) => e.expenseDate.slice(0, 10) >= fFrom.value)
  if (fTo.value) list = list.filter((e) => e.expenseDate.slice(0, 10) <= fTo.value)
  const a = fA.value, b = fB.value
  if (a && b) {
    list = list.filter(
      (e) =>
        (e.payer.id === a && e.shares.some((s) => s.user.id === b)) ||
        (e.payer.id === b && e.shares.some((s) => s.user.id === a)),
    )
  } else if (a) {
    list = list.filter((e) => e.payer.id === a || e.shares.some((s) => s.user.id === a))
  }
  return list
})

const nameOf = (id: string) => members.value.find((m) => m.id === id)?.name ?? ''
// ملخّص "بين شخصين": كم دفع أ لـ ب والعكس
const pairSummary = computed(() => {
  if (!(fA.value && fB.value)) return null
  const a = fA.value, b = fB.value
  let aPaidForB = 0, bPaidForA = 0
  for (const e of filtered.value) {
    if (e.payer.id === a) aPaidForB += shareOf(e, b)
    if (e.payer.id === b) bPaidForA += shareOf(e, a)
  }
  return { aPaidForB, bPaidForA, net: aPaidForB - bPaidForA }
})
function resetFilter() { fFrom.value = ''; fTo.value = ''; fA.value = ''; fB.value = '' }

// ---------- نموذج الإضافة/التعديل ----------
const showForm = ref(false)
const saving = ref(false)
const formError = ref('')
const editingId = ref<string | null>(null)
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
  editingId.value = null
  form.title = ''
  form.amount = ''
  form.note = ''
  form.split_type = 'equal'
  form.expense_date = new Date().toISOString().slice(0, 10)
  form.participants = members.value.map((m) => m.id)
  form.customShares = {}
  form.percentages = {}
  formError.value = ''
}
function toggleForm() {
  showForm.value = !showForm.value
  if (showForm.value) resetForm()
}
function startEdit(e: Expense) {
  editingId.value = e.id
  form.title = e.title
  form.amount = e.amount
  form.note = e.note ?? ''
  form.expense_date = e.expenseDate.slice(0, 10)
  form.participants = e.shares.map((s) => s.user.id)
  form.customShares = {}
  form.percentages = {}
  if (e.splitType === 'equal') {
    form.split_type = 'equal'
  } else {
    // نعرض الحصص الفعلية للتعديل الدقيق
    form.split_type = 'custom'
    for (const s of e.shares) form.customShares[s.user.id] = String(s.shareAmount)
  }
  formError.value = ''
  showForm.value = true
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
}

function toggleParticipant(id: string) {
  const i = form.participants.indexOf(id)
  if (i >= 0) form.participants.splice(i, 1)
  else form.participants.push(id)
}

async function submit() {
  formError.value = ''
  const amount = Math.round(Number(form.amount))
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
      .map((m) => ({ user_id: m.id, share_amount: Math.round(Number(form.customShares[m.id])) }))
  } else {
    body.percentages = members.value
      .filter((m) => form.percentages[m.id])
      .map((m) => ({ user_id: m.id, percentage: Number(form.percentages[m.id]) }))
  }

  saving.value = true
  try {
    if (editingId.value) {
      await $fetch(`/api/expenses/${editingId.value}`, { method: 'PUT', body })
    } else {
      await $fetch('/api/expenses', { method: 'POST', body })
    }
    showForm.value = false
    resetForm()
    await reload()
  } catch (e: unknown) {
    formError.value = errMsg(e)
  } finally {
    saving.value = false
  }
}

const deleting = ref<string | null>(null)
async function remove(id: string) {
  if (!confirm('تأكيد حذف هذا المصروف؟ لا يمكن التراجع.')) return
  deleting.value = id
  try {
    await $fetch(`/api/expenses/${id}`, { method: 'DELETE' })
    await reload()
  } catch (e) {
    alert(errMsg(e))
  } finally {
    deleting.value = null
  }
}

// ---------- توسيع البطاقات ----------
const expanded = ref<Set<string>>(new Set())
function toggleExpand(id: string) {
  const s = new Set(expanded.value)
  s.has(id) ? s.delete(id) : s.add(id)
  expanded.value = s
}

// textarea متمدّد تلقائياً
function autoGrow(e: Event) {
  const el = e.target as HTMLTextAreaElement
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

function errMsg(e: unknown): string {
  if (e && typeof e === 'object' && 'statusMessage' in e) return String((e as any).statusMessage)
  return e instanceof Error ? e.message : 'حدث خطأ'
}
const splitLabel: Record<string, string> = { equal: 'بالتساوي', custom: 'مخصّص', percentage: 'نِسَب' }
</script>

<template>
  <div class="stack">
    <PageHeader title="المصاريف" icon="receipt" :refreshing="refreshing" @refresh="reload" />

    <div class="toolbar">
      <button class="btn btn-primary" @click="toggleForm">
        <AppIcon :name="showForm ? 'x' : 'plus'" :size="18" />
        {{ showForm ? 'إلغاء' : 'إضافة مصروف' }}
      </button>
      <button class="btn btn-ghost" @click="showFilter = !showFilter">
        <AppIcon name="filter" :size="18" /> فلترة
      </button>
    </div>

    <!-- الفلترة -->
    <div v-if="showFilter" class="card filter-card">
      <div class="grid-2">
        <div class="field"><label>من تاريخ</label><input v-model="fFrom" type="date" /></div>
        <div class="field"><label>إلى تاريخ</label><input v-model="fTo" type="date" /></div>
      </div>
      <div class="grid-2">
        <div class="field">
          <label>الشخص الأول</label>
          <select v-model="fA"><option value="">الكل</option><option v-for="m in members" :key="m.id" :value="m.id">{{ m.name }}</option></select>
        </div>
        <div class="field">
          <label>الشخص الثاني</label>
          <select v-model="fB"><option value="">—</option><option v-for="m in members" :key="m.id" :value="m.id">{{ m.name }}</option></select>
        </div>
      </div>
      <button class="btn btn-ghost btn-sm" @click="resetFilter">مسح الفلترة</button>

      <div v-if="pairSummary" class="pair-summary">
        <div class="ps-row"><span>{{ nameOf(fA) }} دفع لـ {{ nameOf(fB) }}</span><span class="num">{{ money(pairSummary.aPaidForB) }}</span></div>
        <div class="ps-row"><span>{{ nameOf(fB) }} دفع لـ {{ nameOf(fA) }}</span><span class="num">{{ money(pairSummary.bPaidForA) }}</span></div>
        <div class="ps-row net">
          <span>الصافي</span>
          <span class="num" :class="pairSummary.net > 0 ? 'text-success' : pairSummary.net < 0 ? 'text-danger' : ''">
            <template v-if="pairSummary.net > 0">{{ nameOf(fB) }} يدين لـ {{ nameOf(fA) }} {{ money(pairSummary.net) }}</template>
            <template v-else-if="pairSummary.net < 0">{{ nameOf(fA) }} يدين لـ {{ nameOf(fB) }} {{ money(-pairSummary.net) }}</template>
            <template v-else>متعادل</template>
          </span>
        </div>
      </div>
    </div>

    <!-- نموذج الإضافة/التعديل -->
    <div v-if="showForm" class="card form-card">
      <div class="field">
        <label>العنوان</label>
        <textarea v-model="form.title" rows="1" class="grow" placeholder="مثال: طبخة الكبة" @input="autoGrow" />
      </div>
      <div class="grid-2">
        <div class="field">
          <label>المبلغ الكلي</label>
          <input v-model="form.amount" type="number" step="1" min="0" inputmode="numeric" placeholder="0" />
        </div>
        <div class="field"><label>التاريخ</label><input v-model="form.expense_date" type="date" /></div>
      </div>
      <div class="field">
        <label>ملاحظة (اختياري)</label>
        <textarea v-model="form.note" rows="1" class="grow" placeholder="..." @input="autoGrow" />
      </div>

      <div class="field">
        <label>طريقة التقسيم</label>
        <div class="seg">
          <button v-for="opt in (['equal','custom','percentage'] as const)" :key="opt" type="button" :class="['seg-btn',{active: form.split_type===opt}]" @click="form.split_type=opt">{{ splitLabel[opt] }}</button>
        </div>
      </div>

      <div class="field">
        <label>المشاركون</label>
        <div v-if="form.split_type==='equal'" class="members">
          <label v-for="m in members" :key="m.id" class="chk">
            <input type="checkbox" :checked="form.participants.includes(m.id)" @change="toggleParticipant(m.id)" />
            <span>{{ m.name }}</span>
          </label>
        </div>
        <div v-else-if="form.split_type==='custom'" class="member-inputs">
          <div v-for="m in members" :key="m.id" class="member-input">
            <span class="member-name">{{ m.name }}</span>
            <input v-model="form.customShares[m.id]" type="number" step="1" min="0" inputmode="numeric" placeholder="0" />
          </div>
          <p class="text-muted hint">اترك الحقل فارغاً لمن لا يشارك. مجموع الحصص = المبلغ الكلي.</p>
        </div>
        <div v-else class="member-inputs">
          <div v-for="m in members" :key="m.id" class="member-input">
            <span class="member-name">{{ m.name }}</span>
            <input v-model="form.percentages[m.id]" type="number" step="1" min="0" max="100" inputmode="numeric" placeholder="%" />
          </div>
          <p class="text-muted hint">مجموع النِسَب = 100٪.</p>
        </div>
      </div>

      <p v-if="formError" class="text-danger msg">{{ formError }}</p>
      <button class="btn btn-primary full" :disabled="saving" @click="submit">
        <span v-if="saving" class="spinner sm" />
        <template v-else>{{ editingId ? 'حفظ التعديلات' : 'حفظ المصروف' }}</template>
      </button>
    </div>

    <!-- القائمة -->
    <div v-if="filtered.length" class="stack-sm">
      <div v-for="e in filtered" :key="e.id" class="card exp">
        <button class="exp-head" @click="toggleExpand(e.id)">
          <div class="exp-head-main">
            <div class="exp-title">{{ e.title }}</div>
            <div class="text-muted exp-meta">دفع {{ e.payer.name }} · {{ date(e.expenseDate) }}</div>
          </div>
          <div class="exp-head-side">
            <div class="num amount">{{ money(e.amount) }}</div>
            <div v-if="myShare(e) > 0" class="num my-share">عليك: {{ money(myShare(e)) }}</div>
          </div>
          <span class="chevron" :class="{ open: expanded.has(e.id) }"><AppIcon name="chevron" :size="18" /></span>
        </button>

        <div class="details-wrap" :class="{ open: expanded.has(e.id) }">
          <div class="details-inner">
            <div class="exp-details">
              <div v-if="e.note" class="exp-note text-muted"><AppIcon name="note" :size="15" /> {{ e.note }}</div>
              <div class="split-tag text-muted">التقسيم: {{ splitLabel[e.splitType] }}</div>
              <div class="shares-list">
                <div v-for="s in e.shares" :key="s.user.id" class="share-line" :class="{ me: s.user.id === profile?.id }">
                  <span>{{ s.user.name }}<span v-if="s.user.id === profile?.id"> (أنت)</span></span>
                  <span class="num">{{ money(s.shareAmount) }}</span>
                </div>
              </div>
              <div v-if="e.payer.id === profile?.id" class="exp-actions">
                <button class="btn btn-ghost btn-sm" @click="startEdit(e)"><AppIcon name="edit" :size="16" /> تعديل</button>
                <button class="btn btn-ghost btn-sm danger" :disabled="deleting === e.id" @click="remove(e.id)">
                  <span v-if="deleting === e.id" class="spinner dark" /><AppIcon v-else name="trash" :size="16" /> حذف
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="card empty">لا مصاريف مطابقة.</div>
  </div>
</template>

<style scoped>
.stack { display: flex; flex-direction: column; gap: 16px; }
.stack-sm { display: flex; flex-direction: column; gap: 12px; }
.toolbar { display: flex; gap: 10px; }
.toolbar .btn { flex: 1; }
.grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.filter-card, .form-card { display: flex; flex-direction: column; gap: 6px; }

textarea.grow { resize: none; overflow: hidden; min-height: 44px; line-height: 1.5; }

.pair-summary { margin-top: 10px; border-top: 1px solid var(--color-border); padding-top: 10px; display: flex; flex-direction: column; gap: 6px; }
.ps-row { display: flex; justify-content: space-between; font-size: 14px; }
.ps-row.net { font-weight: 700; border-top: 1px dashed var(--color-border); padding-top: 6px; }

.seg { display: flex; gap: 6px; }
.seg-btn { flex: 1; padding: 9px; border: 1px solid var(--color-border); background: var(--color-surface); border-radius: var(--radius-sm); font-family: inherit; font-size: 14px; font-weight: 600; color: var(--color-text-muted); cursor: pointer; transition: background var(--t), border-color var(--t), color var(--t); }
.seg-btn.active { background: var(--color-primary-soft); border-color: var(--color-primary); color: var(--color-primary); }
.members { display: flex; flex-wrap: wrap; gap: 10px; }
.chk { display: flex; align-items: center; gap: 6px; font-weight: 500; margin: 0; padding: 8px 12px; border: 1px solid var(--color-border); border-radius: 999px; cursor: pointer; }
.chk input { width: auto; }
.member-inputs { display: flex; flex-direction: column; gap: 8px; }
.member-input { display: flex; align-items: center; gap: 10px; }
.member-name { flex: 1; font-weight: 500; }
.member-input input { width: 130px; }
.hint { font-size: 12px; margin: 4px 0 0; }
.full { width: 100%; margin-top: 8px; }
.btn-sm { padding: 8px 12px; font-size: 13px; }
.msg { font-size: 14px; }

.exp { padding: 0; overflow: hidden; }
.exp-head { width: 100%; display: flex; align-items: center; gap: 10px; background: none; border: none; font-family: inherit; text-align: start; cursor: pointer; padding: 14px 16px; color: inherit; }
.exp-head-main { flex: 1; min-width: 0; }
.exp-title { font-weight: 600; font-size: 16px; white-space: pre-wrap; }
.exp-meta { font-size: 12px; margin-top: 2px; }
.exp-head-side { text-align: end; }
.amount { font-weight: 700; font-size: 16px; }
.my-share { font-size: 12px; color: var(--color-danger); font-weight: 600; margin-top: 2px; }
.chevron { color: var(--color-text-muted); display: inline-flex; transition: transform 0.25s var(--ease); }
.chevron.open { transform: rotate(180deg); }

/* توسيع سلس */
.details-wrap { display: grid; grid-template-rows: 0fr; transition: grid-template-rows 0.3s var(--ease); }
.details-wrap.open { grid-template-rows: 1fr; }
.details-inner { overflow: hidden; }
.exp-details { padding: 0 16px 14px; border-top: 1px solid var(--color-border); padding-top: 12px; }
.exp-note { font-size: 13px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
.split-tag { font-size: 12px; margin-bottom: 8px; }
.shares-list { display: flex; flex-direction: column; gap: 6px; }
.share-line { display: flex; justify-content: space-between; font-size: 14px; padding: 6px 10px; background: var(--color-bg); border-radius: var(--radius-sm); }
.share-line.me { background: var(--color-primary-soft); color: var(--color-primary); font-weight: 600; }
.exp-actions { display: flex; gap: 8px; margin-top: 12px; }
.exp-actions .danger { color: var(--color-danger); border-color: #fecdca; }
.empty { text-align: center; color: var(--color-text-muted); padding: 24px; }
</style>
