<script setup lang="ts">
const supabase = useSupabaseClient()
const { profile, household, loaded, refresh } = useMe()
const route = useRoute()

if (!loaded.value) {
  await refresh()
}

// عناصر أساسية (تظهر في الناف السفلي على الموبايل + الجانبي على الكبير)
const mainNav = [
  { to: '/', label: 'الرئيسية', icon: 'home' },
  { to: '/expenses', label: 'المصاريف', icon: 'receipt' },
  { to: '/recipes', label: 'الطبخات', icon: 'pot' },
  { to: '/settle', label: 'التسوية', icon: 'handshake' },
]
// عناصر إضافية (تظهر في "المزيد" على الموبايل + الجانبي على الكبير)
const moreNav = [
  { to: '/stats', label: 'الإحصائيات', icon: 'chart' },
  { to: '/history', label: 'سجل التسويات', icon: 'clock' },
]

const moreOpen = ref(false)
const isActive = (to: string) =>
  to === '/' ? route.path === '/' : route.path.startsWith(to)
const moreActive = computed(() => moreNav.some((i) => isActive(i.to)))

watch(() => route.path, () => (moreOpen.value = false))

const initials = computed(() => (profile.value?.name || '؟').trim().charAt(0))

// دعوة عضو
const showInvite = ref(false)
const copied = ref(false)
async function copyInvite() {
  if (!household.value?.inviteCode) return
  try {
    await navigator.clipboard.writeText(household.value.inviteCode)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch {
    /* منع النسخ */
  }
}

const loggingOut = ref(false)
async function logout() {
  if (!confirm('تسجيل الخروج من التطبيق؟')) return
  loggingOut.value = true
  moreOpen.value = false
  try {
    await supabase.auth.signOut()
    await navigateTo('/auth/login')
  } finally {
    loggingOut.value = false
  }
}
</script>

<template>
  <div class="layout">
    <!-- شريط علوي (الجوال فقط) -->
    <header class="topbar">
      <div class="topbar-brand">
        <span class="dot" />
        مصاريف البيت
      </div>
      <div class="avatar sm">{{ initials }}</div>
    </header>

    <!-- الناف بار الجانبي (شاشات كبيرة) -->
    <aside class="sidebar">
      <div class="brand">
        <span class="dot" />
        <div>
          <div class="brand-name">مصاريف البيت</div>
          <div v-if="household" class="brand-sub text-muted">{{ household.name }}</div>
        </div>
      </div>

      <nav class="nav">
        <NuxtLink
          v-for="item in [...mainNav, ...moreNav]"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          :class="{ active: isActive(item.to) }"
        >
          <AppIcon :name="item.icon" :size="20" />
          <span>{{ item.label }}</span>
        </NuxtLink>
        <button class="nav-item invite-btn" @click="showInvite = true">
          <AppIcon name="users" :size="20" />
          <span>دعوة عضو</span>
        </button>
      </nav>

      <div class="side-footer">
        <div class="user">
          <div class="avatar">{{ initials }}</div>
          <div class="user-name">{{ profile?.name }}</div>
        </div>
        <button class="icon-btn logout" aria-label="خروج" :disabled="loggingOut" @click="logout">
          <span v-if="loggingOut" class="spinner dark" />
          <AppIcon v-else name="logout" :size="20" />
        </button>
      </div>
    </aside>

    <!-- المحتوى -->
    <main class="content">
      <div class="container">
        <slot />
      </div>
    </main>

    <!-- الناف بار السفلي (الجوال) -->
    <nav class="bottom-bar">
      <NuxtLink
        v-for="item in mainNav"
        :key="item.to"
        :to="item.to"
        class="bb-item"
        :class="{ active: isActive(item.to) }"
      >
        <AppIcon :name="item.icon" :size="22" />
        <span>{{ item.label }}</span>
      </NuxtLink>
      <button class="bb-item" :class="{ active: moreActive || moreOpen }" @click="moreOpen = true">
        <AppIcon name="more" :size="22" />
        <span>المزيد</span>
      </button>
    </nav>

    <!-- لوحة "المزيد" السفلية -->
    <transition name="fade">
      <div v-if="moreOpen" class="sheet-backdrop" @click.self="moreOpen = false">
        <div class="sheet">
          <div class="sheet-handle" />
          <NuxtLink
            v-for="item in moreNav"
            :key="item.to"
            :to="item.to"
            class="sheet-item"
            :class="{ active: isActive(item.to) }"
          >
            <AppIcon :name="item.icon" :size="20" />
            <span>{{ item.label }}</span>
          </NuxtLink>
          <button class="sheet-item" @click="showInvite = true; moreOpen = false">
            <AppIcon name="users" :size="20" />
            <span>دعوة عضو</span>
          </button>
          <button class="sheet-item danger" :disabled="loggingOut" @click="logout">
            <span v-if="loggingOut" class="spinner dark" />
            <AppIcon v-else name="logout" :size="20" />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>
    </transition>

    <!-- نافذة كود الدعوة -->
    <transition name="fade">
      <div v-if="showInvite" class="modal-backdrop" @click.self="showInvite = false">
        <div class="invite-modal card">
          <div class="im-head">
            <h3><AppIcon name="users" :size="18" /> دعوة عضو للبيت</h3>
            <button class="icon-btn" aria-label="إغلاق" @click="showInvite = false">
              <AppIcon name="x" :size="20" />
            </button>
          </div>
          <p class="text-muted im-desc">شارك هذا الكود مع من تريد إضافته — يدخله عند "الانضمام بكود".</p>
          <div class="code-box num">{{ household?.inviteCode }}</div>
          <button class="btn btn-gold full" @click="copyInvite">
            <AppIcon :name="copied ? 'check' : 'copy'" :size="17" />
            {{ copied ? 'تم النسخ' : 'نسخ الكود' }}
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.layout {
  min-height: 100vh;
}

/* ---------- الشريط العلوي (الجوال) ---------- */
.topbar {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 10px 14px;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}
.topbar-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 16px;
}
.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  border: none;
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
  transition: background var(--t), color var(--t);
}
.icon-btn:hover {
  background: var(--color-surface-2);
}
.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-gold);
  box-shadow: 0 0 0 3px var(--color-gold-soft);
  flex-shrink: 0;
}

/* ---------- الناف بار الجانبي (يظهر على الكبير فقط) ---------- */
.sidebar {
  display: none;
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 18px 16px;
  border-bottom: 1px solid var(--color-border);
}
.brand-name {
  font-weight: 700;
  font-size: 17px;
  line-height: 1.2;
}
.brand-sub {
  font-size: 12px;
}
.nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 10px;
  flex: 1;
  overflow-y: auto;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--radius-sm);
  color: var(--color-text-muted);
  font-weight: 600;
  font-size: 15px;
  border-inline-start: 3px solid transparent;
  transition: background var(--t), color var(--t), border-color var(--t);
}
.nav-item:hover {
  background: var(--color-surface-2);
  color: var(--color-text);
}
.nav-item.active {
  background: var(--color-primary-soft);
  color: var(--color-primary);
  border-inline-start-color: var(--color-gold);
}
.invite-btn {
  width: 100%;
  background: none;
  border: none;
  border-inline-start: 3px solid transparent;
  font-family: inherit;
  cursor: pointer;
  text-align: start;
  margin-top: 6px;
  color: var(--color-gold-hover);
}
.invite-btn:hover {
  background: var(--color-gold-soft);
  color: var(--color-gold-hover);
}
.side-footer {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-top: 1px solid var(--color-border);
}
.user {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}
.user-name {
  font-weight: 600;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  display: grid;
  place-items: center;
  font-weight: 700;
  flex-shrink: 0;
}
.avatar.sm {
  width: 34px;
  height: 34px;
  font-size: 14px;
}
.logout {
  color: var(--color-danger);
}
.logout:hover {
  background: var(--color-danger-soft);
}

/* ---------- المحتوى ---------- */
.content {
  padding-block: 18px;
  padding-bottom: calc(78px + env(safe-area-inset-bottom)); /* مساحة للناف السفلي */
}

/* ---------- الناف بار السفلي (الجوال) ---------- */
.bottom-bar {
  position: fixed;
  bottom: 0;
  inset-inline: 0;
  z-index: 30;
  display: flex;
  justify-content: space-around;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  padding: 8px 4px calc(8px + env(safe-area-inset-bottom));
}
.bb-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  flex: 1;
  background: none;
  border: none;
  font-family: inherit;
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 4px;
  transition: color var(--t);
}
.bb-item.active {
  color: var(--color-primary);
}

/* ---------- لوحة "المزيد" السفلية ---------- */
.sheet-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(16, 36, 29, 0.45);
  z-index: 45;
  display: flex;
  align-items: flex-end;
}
.sheet {
  width: 100%;
  background: var(--color-surface);
  border-radius: 20px 20px 0 0;
  padding: 10px 12px calc(18px + env(safe-area-inset-bottom));
  animation: slideUp 0.28s var(--ease);
}
@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
}
.sheet-handle {
  width: 42px;
  height: 5px;
  border-radius: 999px;
  background: var(--color-border);
  margin: 4px auto 12px;
}
.sheet-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px;
  border-radius: var(--radius-sm);
  background: none;
  border: none;
  font-family: inherit;
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  cursor: pointer;
  text-align: start;
}
.sheet-item:hover {
  background: var(--color-surface-2);
}
.sheet-item.active {
  color: var(--color-primary);
}
.sheet-item.danger {
  color: var(--color-danger);
}

/* ---------- نافذة الدعوة ---------- */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(16, 36, 29, 0.5);
  display: grid;
  place-items: center;
  padding: 16px;
  z-index: 60;
}
.invite-modal {
  width: 100%;
  max-width: 380px;
  animation: pop 0.25s var(--ease);
}
@keyframes pop {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
}
.im-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.im-head h3 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 17px;
}
.im-desc {
  font-size: 13px;
  margin: 8px 0 14px;
}
.code-box {
  text-align: center;
  font-size: 30px;
  font-weight: 800;
  letter-spacing: 6px;
  color: var(--color-gold-hover);
  background: var(--color-gold-soft);
  border-radius: var(--radius-sm);
  padding: 16px;
  margin-bottom: 14px;
}
.full {
  width: 100%;
}

/* ---------- شاشات كبيرة: sidebar ثابت، إخفاء الناف السفلي ---------- */
@media (min-width: 900px) {
  .topbar,
  .bottom-bar {
    display: none;
  }
  .sidebar {
    display: flex;
    flex-direction: column;
    position: fixed;
    inset-block: 0;
    inset-inline-start: 0;
    width: var(--sidebar-w);
    background: var(--color-surface);
    border-inline-end: 1px solid var(--color-border);
    z-index: 20;
  }
  .content {
    margin-inline-start: var(--sidebar-w);
    padding-block: 32px;
    padding-bottom: 32px;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s var(--ease);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
