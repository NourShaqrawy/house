<script setup lang="ts">
const supabase = useSupabaseClient()
const { profile, household, loaded, refresh } = useMe()
const route = useRoute()

if (!loaded.value) {
  await refresh()
}

const nav = [
  { to: '/', label: 'الرئيسية', icon: 'home' },
  { to: '/expenses', label: 'المصاريف', icon: 'receipt' },
  { to: '/recipes', label: 'الطبخات', icon: 'pot' },
  { to: '/settle', label: 'التسوية', icon: 'handshake' },
  { to: '/stats', label: 'إحصائيات', icon: 'chart' },
]

const open = ref(false)
const isActive = (to: string) =>
  to === '/' ? route.path === '/' : route.path.startsWith(to)

// أغلق الدرج عند تغيّر المسار (على الجوال)
watch(() => route.path, () => (open.value = false))

const initials = computed(() => (profile.value?.name || '؟').trim().charAt(0))

async function logout() {
  await supabase.auth.signOut()
  await navigateTo('/auth/login')
}
</script>

<template>
  <div class="layout">
    <!-- شريط علوي (الجوال فقط) -->
    <header class="topbar">
      <button class="icon-btn" aria-label="القائمة" @click="open = true">
        <AppIcon name="menu" :size="22" />
      </button>
      <div class="topbar-brand">
        <span class="dot" />
        مصاريف البيت
      </div>
      <div class="avatar sm">{{ initials }}</div>
    </header>

    <!-- خلفية معتمة للدرج -->
    <transition name="fade">
      <div v-if="open" class="backdrop" @click="open = false" />
    </transition>

    <!-- الناف بار الجانبي -->
    <aside class="sidebar" :class="{ open }">
      <div class="brand">
        <span class="dot" />
        <div>
          <div class="brand-name">مصاريف البيت</div>
          <div v-if="household" class="brand-sub text-muted">{{ household.name }}</div>
        </div>
        <button class="icon-btn close-btn" aria-label="إغلاق" @click="open = false">
          <AppIcon name="x" :size="20" />
        </button>
      </div>

      <nav class="nav">
        <NuxtLink
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          class="nav-item"
          :class="{ active: isActive(item.to) }"
        >
          <AppIcon :name="item.icon" :size="20" />
          <span>{{ item.label }}</span>
        </NuxtLink>
      </nav>

      <div class="side-footer">
        <div class="user">
          <div class="avatar">{{ initials }}</div>
          <div class="user-name">{{ profile?.name }}</div>
        </div>
        <button class="icon-btn logout" aria-label="خروج" @click="logout">
          <AppIcon name="logout" :size="20" />
        </button>
      </div>
    </aside>

    <!-- المحتوى -->
    <main class="content">
      <div class="container">
        <slot />
      </div>
    </main>
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

/* العلامة الذهبية */
.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--color-gold);
  box-shadow: 0 0 0 3px var(--color-gold-soft);
  flex-shrink: 0;
}

/* ---------- الخلفية المعتمة ---------- */
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(16, 36, 29, 0.45);
  z-index: 40;
}

/* ---------- الناف بار الجانبي ---------- */
.sidebar {
  position: fixed;
  inset-block: 0;
  inset-inline-start: 0;
  width: var(--sidebar-w);
  background: var(--color-surface);
  border-inline-end: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  z-index: 50;
  transform: translateX(100%); /* مخفي على الجوال (RTL: خارج الحافة اليمنى) */
  transition: transform 0.3s var(--ease);
}
.sidebar.open {
  transform: translateX(0);
  box-shadow: var(--shadow);
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
.close-btn {
  margin-inline-start: auto;
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
  padding-block: 20px;
}

/* ---------- الشاشات الكبيرة: ناف بار ثابت ---------- */
@media (min-width: 900px) {
  .topbar {
    display: none;
  }
  .sidebar {
    transform: translateX(0);
  }
  .close-btn {
    display: none;
  }
  .backdrop {
    display: none;
  }
  .content {
    margin-inline-start: var(--sidebar-w);
    padding-block: 32px;
  }
}

/* انتقال الخلفية */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s var(--ease);
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
