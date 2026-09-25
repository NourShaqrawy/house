<script setup lang="ts">
const supabase = useSupabaseClient()
const { profile, household, loaded, refresh } = useMe()
const route = useRoute()

if (!loaded.value) {
  await refresh()
}

const nav = [
  { to: '/', label: 'الرئيسية', icon: '🏠' },
  { to: '/expenses', label: 'المصاريف', icon: '🧾' },
  { to: '/recipes', label: 'الطبخات', icon: '🍲' },
  { to: '/settle', label: 'التسوية', icon: '🤝' },
  { to: '/stats', label: 'إحصائيات', icon: '📊' },
]

const isActive = (to: string) =>
  to === '/' ? route.path === '/' : route.path.startsWith(to)

async function logout() {
  await supabase.auth.signOut()
  await navigateTo('/auth/login')
}
</script>

<template>
  <div class="app-shell">
    <header class="app-header">
      <div class="container header-inner">
        <div>
          <div class="brand">مصاريف البيت</div>
          <div v-if="household" class="text-muted household-name">{{ household.name }}</div>
        </div>
        <div class="header-actions">
          <span v-if="profile" class="text-muted">{{ profile.name }}</span>
          <button class="btn btn-ghost btn-sm" @click="logout">خروج</button>
        </div>
      </div>
    </header>

    <main class="app-main container">
      <slot />
    </main>

    <nav class="bottom-nav">
      <NuxtLink
        v-for="item in nav"
        :key="item.to"
        :to="item.to"
        class="nav-item"
        :class="{ active: isActive(item.to) }"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span class="nav-label">{{ item.label }}</span>
      </NuxtLink>
    </nav>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  padding-bottom: 76px; /* مساحة للشريط السفلي */
}
.app-header {
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  position: sticky;
  top: 0;
  z-index: 10;
}
.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-block: 12px;
}
.brand {
  font-weight: 700;
  font-size: 18px;
}
.household-name {
  font-size: 13px;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}
.btn-sm {
  padding: 6px 12px;
  font-size: 13px;
}
.app-main {
  padding-block: 20px;
}
.bottom-nav {
  position: fixed;
  bottom: 0;
  inset-inline: 0;
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  display: flex;
  justify-content: space-around;
  padding: 8px 4px calc(8px + env(safe-area-inset-bottom));
  z-index: 10;
}
.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  color: var(--color-text-muted);
  font-size: 11px;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  min-width: 56px;
}
.nav-item.active {
  color: var(--color-primary);
  font-weight: 600;
}
.nav-icon {
  font-size: 20px;
  line-height: 1;
}
@media (min-width: 640px) {
  .nav-label {
    font-size: 13px;
  }
}
</style>
