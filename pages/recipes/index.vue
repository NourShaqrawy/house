<script setup lang="ts">
const { money } = useFormat()
const { profile } = useMe()

interface Member {
  id: string
  name: string
}
interface Ingredient {
  id?: string
  name: string
  quantity: string | null
  estimatedPrice: number | null
}
interface Recipe {
  id: string
  name: string
  description: string | null
  servings: number | null
  ingredients: Ingredient[]
  estimatedTotal: number
  createdBy: { id: string; name: string }
}

const { data: memData } = await useFetch<{ members: Member[] }>('/api/households/members')
const { data: recData, refresh } = await useFetch<{ recipes: Recipe[] }>('/api/recipes')
const members = computed(() => memData.value?.members ?? [])

// ---- نموذج إنشاء/تعديل طبخة ----
const showForm = ref(false)
const saving = ref(false)
const formError = ref('')
const editingId = ref<string | null>(null)
const form = reactive({
  name: '',
  description: '',
  servings: '' as string | number,
  ingredients: [{ name: '', quantity: '', estimated_price: '' }] as {
    name: string
    quantity: string
    estimated_price: string | number
  }[],
})

function resetForm() {
  editingId.value = null
  form.name = ''
  form.description = ''
  form.servings = ''
  form.ingredients = [{ name: '', quantity: '', estimated_price: '' }]
}
function toggleForm() {
  showForm.value = !showForm.value
  if (showForm.value) resetForm()
}
function startEdit(r: Recipe) {
  editingId.value = r.id
  form.name = r.name
  form.description = r.description ?? ''
  form.servings = r.servings ?? ''
  form.ingredients = r.ingredients.length
    ? r.ingredients.map((i) => ({
        name: i.name,
        quantity: i.quantity ?? '',
        estimated_price: i.estimatedPrice ?? '',
      }))
    : [{ name: '', quantity: '', estimated_price: '' }]
  showForm.value = true
  formError.value = ''
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
}
function addIngredient() {
  form.ingredients.push({ name: '', quantity: '', estimated_price: '' })
}
function removeIngredient(i: number) {
  form.ingredients.splice(i, 1)
}

async function saveRecipe() {
  formError.value = ''
  if (!form.name.trim()) return (formError.value = 'اسم الطبخة مطلوب')
  saving.value = true
  const body = {
    name: form.name.trim(),
    description: form.description.trim() || undefined,
    servings: form.servings ? Number(form.servings) : undefined,
    ingredients: form.ingredients
      .filter((i) => i.name.trim())
      .map((i) => ({
        name: i.name.trim(),
        quantity: i.quantity.trim() || undefined,
        estimated_price: i.estimated_price ? Number(i.estimated_price) : undefined,
      })),
  }
  try {
    if (editingId.value) {
      await $fetch(`/api/recipes/${editingId.value}`, { method: 'PUT', body })
    } else {
      await $fetch('/api/recipes', { method: 'POST', body })
    }
    showForm.value = false
    resetForm()
    await refresh()
  } catch (e: unknown) {
    formError.value = errMsg(e)
  } finally {
    saving.value = false
  }
}

async function removeRecipe(id: string) {
  if (!confirm('حذف هذه الطبخة؟')) return
  await $fetch(`/api/recipes/${id}`, { method: 'DELETE' })
  await refresh()
}

// ---- الطبخ ----
const cookFor = ref<Recipe | null>(null)
const cookAmount = ref<string | number>('')
const cookParticipants = ref<string[]>([])
const cooking = ref(false)
const cookError = ref('')
const cookDone = ref('')

function openCook(r: Recipe) {
  cookFor.value = r
  cookAmount.value = r.estimatedTotal || ''
  cookParticipants.value = members.value.map((m) => m.id)
  cookError.value = ''
  cookDone.value = ''
}
function toggleCookParticipant(id: string) {
  const i = cookParticipants.value.indexOf(id)
  if (i >= 0) cookParticipants.value.splice(i, 1)
  else cookParticipants.value.push(id)
}
async function doCook() {
  if (!cookFor.value) return
  cookError.value = ''
  const amount = Number(cookAmount.value)
  if (!(amount > 0)) return (cookError.value = 'أدخل مبلغاً موجباً')
  if (cookParticipants.value.length === 0) return (cookError.value = 'اختر مشاركاً واحداً على الأقل')
  cooking.value = true
  try {
    await $fetch(`/api/recipes/${cookFor.value.id}/cook`, {
      method: 'POST',
      body: {
        amount,
        split_type: 'equal',
        participants: cookParticipants.value,
      },
    })
    cookDone.value = 'تم إنشاء المصروف بنجاح'
    setTimeout(() => (cookFor.value = null), 900)
  } catch (e: unknown) {
    cookError.value = errMsg(e)
  } finally {
    cooking.value = false
  }
}

function errMsg(e: unknown): string {
  if (e && typeof e === 'object' && 'statusMessage' in e) return String((e as any).statusMessage)
  return e instanceof Error ? e.message : 'حدث خطأ'
}
</script>

<template>
  <div class="stack">
    <div class="section-head">
      <h1 class="page-title">بنك الطبخات</h1>
      <button class="btn btn-primary" @click="toggleForm">
        <AppIcon :name="showForm ? 'x' : 'plus'" :size="18" />
        {{ showForm ? 'إلغاء' : 'طبخة جديدة' }}
      </button>
    </div>

    <!-- نموذج إنشاء -->
    <div v-if="showForm" class="card form-card">
      <div class="field">
        <label>اسم الطبخة</label>
        <input v-model="form.name" placeholder="مثال: كبة بالصينية" />
      </div>
      <div class="grid-2">
        <div class="field">
          <label>عدد الحصص (اختياري)</label>
          <input v-model="form.servings" type="number" min="1" placeholder="4" />
        </div>
      </div>
      <div class="field">
        <label>الوصف / الطريقة (اختياري)</label>
        <textarea v-model="form.description" rows="2" placeholder="..." />
      </div>

      <label>المكوّنات</label>
      <div v-for="(ing, i) in form.ingredients" :key="i" class="ing-row">
        <input v-model="ing.name" placeholder="اسم المكوّن" class="ing-name" />
        <input v-model="ing.quantity" placeholder="الكمية" class="ing-qty" />
        <input
          v-model="ing.estimated_price"
          type="number"
          step="1"
          min="0"
          placeholder="السعر"
          class="ing-price"
        />
        <button
          v-if="form.ingredients.length > 1"
          class="ing-del"
          type="button"
          aria-label="حذف المكوّن"
          @click="removeIngredient(i)"
        >
          <AppIcon name="x" :size="16" />
        </button>
      </div>
      <button class="btn btn-ghost btn-sm add-ing" type="button" @click="addIngredient">
        <AppIcon name="plus" :size="16" /> مكوّن
      </button>

      <p v-if="formError" class="text-danger msg">{{ formError }}</p>
      <button class="btn btn-primary full" :disabled="saving" @click="saveRecipe">
        <span v-if="saving" class="spinner sm" />
        <template v-else>{{ editingId ? 'حفظ التعديلات' : 'حفظ الطبخة' }}</template>
      </button>
    </div>

    <!-- القائمة -->
    <div v-if="recData?.recipes.length" class="recipes-grid">
      <div v-for="r in recData.recipes" :key="r.id" class="card recipe">
        <div class="recipe-top">
          <h3 class="recipe-name">{{ r.name }}</h3>
          <span class="num price-badge">{{ money(r.estimatedTotal) }}</span>
        </div>
        <p v-if="r.description" class="text-muted recipe-desc">{{ r.description }}</p>
        <div class="ingredients">
          <span v-for="(ing, i) in r.ingredients" :key="i" class="ing-chip">
            {{ ing.name }}<template v-if="ing.quantity"> ({{ ing.quantity }})</template>
          </span>
        </div>
        <div class="recipe-actions">
          <button class="btn btn-primary btn-sm" @click="openCook(r)">
            <AppIcon name="flame" :size="16" /> طبخ الآن
          </button>
          <div class="recipe-tools">
            <button class="tool-btn" aria-label="تعديل" @click="startEdit(r)">
              <AppIcon name="edit" :size="16" />
            </button>
            <button
              v-if="r.createdBy.id === profile?.id"
              class="tool-btn danger"
              aria-label="حذف"
              @click="removeRecipe(r.id)"
            >
              <AppIcon name="trash" :size="16" />
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="card empty">لا طبخات بعد — أضف أول وصفة.</div>

    <!-- نافذة الطبخ -->
    <div v-if="cookFor" class="modal-backdrop" @click.self="cookFor = null">
      <div class="card modal">
        <h3>طبخ: {{ cookFor.name }}</h3>
        <div class="field">
          <label>المبلغ الفعلي</label>
          <input v-model="cookAmount" type="number" step="1" min="0" />
          <p class="text-muted hint">الافتراضي = السعر التقريبي، عدّله حسب ما دفعت فعلاً.</p>
        </div>
        <div class="field">
          <label>المشاركون (تقسيم بالتساوي)</label>
          <div class="members">
            <label v-for="m in members" :key="m.id" class="chk">
              <input
                type="checkbox"
                :checked="cookParticipants.includes(m.id)"
                @change="toggleCookParticipant(m.id)"
              />
              <span>{{ m.name }}</span>
            </label>
          </div>
        </div>
        <p v-if="cookError" class="text-danger msg">{{ cookError }}</p>
        <p v-if="cookDone" class="text-success msg">{{ cookDone }}</p>
        <div class="modal-actions">
          <button class="btn btn-ghost" @click="cookFor = null">إلغاء</button>
          <button class="btn btn-primary" :disabled="cooking" @click="doCook">
            {{ cooking ? '...' : 'إنشاء المصروف' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.stack {
  display: flex;
  flex-direction: column;
  gap: 18px;
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
  gap: 6px;
}
.grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.ing-row {
  display: flex;
  gap: 6px;
  margin-bottom: 6px;
}
.ing-name {
  flex: 2;
}
.ing-qty {
  flex: 1;
}
.ing-price {
  width: 90px;
}
.ing-del {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  color: var(--color-danger);
  cursor: pointer;
  display: grid;
  place-items: center;
  width: 42px;
  flex-shrink: 0;
  transition: background var(--t), border-color var(--t);
}
.ing-del:hover {
  background: var(--color-danger-soft);
  border-color: var(--color-danger);
}
.add-ing {
  align-self: flex-start;
  padding: 6px 12px;
  font-size: 13px;
}
.full {
  width: 100%;
  margin-top: 8px;
}
.msg {
  font-size: 14px;
}
.hint {
  font-size: 12px;
  margin: 4px 0 0;
}
.recipes-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}
@media (min-width: 560px) {
  .recipes-grid {
    grid-template-columns: 1fr 1fr;
  }
}
.recipe-top {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}
.recipe-name {
  margin: 0;
  font-size: 16px;
}
.price-badge {
  background: var(--color-gold-soft);
  color: var(--color-gold-hover);
  font-weight: 700;
  font-size: 13px;
  padding: 4px 10px;
  border-radius: 999px;
  white-space: nowrap;
}
.recipe-desc {
  font-size: 13px;
  margin: 8px 0;
}
.ingredients {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 8px 0;
}
.ing-chip {
  font-size: 12px;
  background: var(--color-bg);
  padding: 4px 10px;
  border-radius: 999px;
}
.recipe-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
}
.btn-sm {
  padding: 8px 14px;
  font-size: 13px;
}
.recipe-tools {
  display: flex;
  gap: 6px;
}
.tool-btn {
  background: none;
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  cursor: pointer;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  padding: 8px;
  border-radius: 8px;
  transition: background var(--t), color var(--t), border-color var(--t);
}
.tool-btn:hover {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  border-color: var(--color-primary);
}
.tool-btn.danger:hover {
  background: var(--color-danger-soft);
  color: var(--color-danger);
  border-color: var(--color-danger);
}
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(16, 36, 29, 0.5);
  display: grid;
  place-items: center;
  padding: 16px;
  z-index: 60;
}
.modal {
  animation: pop 0.25s var(--ease);
}
@keyframes pop {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
}
.modal {
  width: 100%;
  max-width: 440px;
}
.modal h3 {
  margin-top: 0;
}
.members {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.chk {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 999px;
  cursor: pointer;
  font-weight: 500;
}
.chk input {
  width: auto;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}
.empty {
  text-align: center;
  color: var(--color-text-muted);
  padding: 24px;
}
</style>
