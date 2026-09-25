<script setup lang="ts">
definePageMeta({ layout: false })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const mode = ref<'login' | 'register'>('login')
const email = ref('')
const password = ref('')
const name = ref('')
const showPassword = ref(false)
const loading = ref(false)
const error = ref('')
const info = ref('')

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
    <div class="auth-card">
      <div class="auth-head">
        <span class="logo-dot" />
        <h1 class="auth-title">مصاريف البيت</h1>
        <p class="text-muted auth-sub">
          {{ mode === 'login' ? 'سجّل الدخول للمتابعة' : 'أنشئ حساباً جديداً' }}
        </p>
      </div>

      <form @submit.prevent="submit">
        <transition name="expand">
          <div v-if="mode === 'register'" class="field">
            <label>الاسم</label>
            <input v-model="name" type="text" placeholder="اسمك" autocomplete="name" />
          </div>
        </transition>

        <div class="field">
          <label>البريد الإلكتروني</label>
          <input
            v-model="email"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
            required
            class="ltr-input num"
          />
        </div>

        <div class="field">
          <label>كلمة السر</label>
          <div class="pass-wrap">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              autocomplete="current-password"
              required
              class="ltr-input"
            />
            <button
              type="button"
              class="pass-toggle"
              :aria-label="showPassword ? 'إخفاء' : 'إظهار'"
              @click="showPassword = !showPassword"
            >
              <AppIcon :name="showPassword ? 'eye-off' : 'eye'" :size="20" />
            </button>
          </div>
        </div>

        <transition name="fade">
          <p v-if="error" class="text-danger msg">{{ error }}</p>
        </transition>
        <transition name="fade">
          <p v-if="info" class="text-success msg">{{ info }}</p>
        </transition>

        <button class="btn btn-primary full" type="submit" :disabled="loading">
          <AppIcon v-if="!loading" name="login" :size="18" />
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
  background: radial-gradient(
      1200px 500px at 100% -10%,
      var(--color-primary-soft),
      transparent 60%
    ),
    radial-gradient(900px 400px at 0% 110%, var(--color-gold-soft), transparent 55%),
    var(--color-bg);
}
.auth-card {
  width: 100%;
  max-width: 400px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 30px 26px;
}
.auth-head {
  text-align: center;
  margin-bottom: 22px;
}
.logo-dot {
  display: inline-block;
  width: 46px;
  height: 46px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--color-primary), var(--color-gold));
  margin-bottom: 12px;
}
.auth-title {
  margin: 0 0 4px;
  font-size: 24px;
}
.auth-sub {
  margin: 0;
}
.ltr-input {
  direction: ltr;
  text-align: left;
}
.pass-wrap {
  position: relative;
}
.pass-wrap input {
  padding-left: 46px;
}
.pass-toggle {
  position: absolute;
  left: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  border-radius: 8px;
  transition: color var(--t), background var(--t);
}
.pass-toggle:hover {
  color: var(--color-primary);
  background: var(--color-surface-2);
}
.full {
  width: 100%;
  margin-top: 4px;
}
.msg {
  font-size: 14px;
  margin: 8px 0;
}
.switch {
  text-align: center;
  margin-top: 18px;
  font-size: 14px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s var(--ease);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
.expand-enter-active,
.expand-leave-active {
  transition: opacity 0.25s var(--ease), max-height 0.3s var(--ease);
  overflow: hidden;
  max-height: 90px;
}
.expand-enter-from,
.expand-leave-to {
  opacity: 0;
  max-height: 0;
}
</style>
