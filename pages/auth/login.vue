<script setup lang="ts">
definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const mode = ref<'login' | 'register'>('login')
const email = ref('')
const password = ref('')
const name = ref('')
const loading = ref(false)
const error = ref('')
const info = ref('')

// لو المستخدم مسجّل أصلاً، حوّله للرئيسية
watchEffect(() => {
  if (user.value) navigateTo('/')
})

async function submit() {
  error.value = ''
  info.value = ''
  loading.value = true
  try {
    if (mode.value === 'register') {
      if (!name.value.trim()) throw new Error('الاسم مطلوب')
      const { data, error: e } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
        options: { data: { name: name.value.trim() } },
      })
      if (e) throw e
      if (data.session) {
        await navigateTo('/')
      } else {
        info.value = 'تم التسجيل! تحقّق من بريدك لتأكيد الحساب ثم سجّل الدخول.'
        mode.value = 'login'
      }
    } else {
      const { error: e } = await supabase.auth.signInWithPassword({
        email: email.value,
        password: password.value,
      })
      if (e) throw e
      await navigateTo('/')
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'حدث خطأ'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-wrap">
    <div class="auth-card card">
      <h1 class="auth-title">مصاريف البيت</h1>
      <p class="text-muted auth-sub">
        {{ mode === 'login' ? 'سجّل الدخول للمتابعة' : 'أنشئ حساباً جديداً' }}
      </p>

      <form @submit.prevent="submit">
        <div v-if="mode === 'register'" class="field">
          <label>الاسم</label>
          <input v-model="name" type="text" placeholder="اسمك" autocomplete="name" />
        </div>
        <div class="field">
          <label>البريد الإلكتروني</label>
          <input
            v-model="email"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
            required
            style="direction: ltr; text-align: left"
          />
        </div>
        <div class="field">
          <label>كلمة السر</label>
          <input
            v-model="password"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
            required
            style="direction: ltr; text-align: left"
          />
        </div>

        <p v-if="error" class="text-danger msg">{{ error }}</p>
        <p v-if="info" class="text-success msg">{{ info }}</p>

        <button class="btn btn-primary full" type="submit" :disabled="loading">
          {{ loading ? '...' : mode === 'login' ? 'دخول' : 'تسجيل' }}
        </button>
      </form>

      <p class="switch text-muted">
        {{ mode === 'login' ? 'ليس لديك حساب؟' : 'لديك حساب؟' }}
        <a href="#" @click.prevent="mode = mode === 'login' ? 'register' : 'login'">
          {{ mode === 'login' ? 'أنشئ واحداً' : 'سجّل الدخول' }}
        </a>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-wrap {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 20px;
}
.auth-card {
  width: 100%;
  max-width: 400px;
  padding: 28px;
}
.auth-title {
  margin: 0 0 4px;
  font-size: 24px;
}
.auth-sub {
  margin: 0 0 20px;
}
.full {
  width: 100%;
}
.msg {
  font-size: 14px;
  margin: 8px 0;
}
.switch {
  text-align: center;
  margin-top: 16px;
  font-size: 14px;
}
</style>
