<template>
  <div id="app" class="h-screen bg-gray-50 dark:bg-slate-900">
    <!-- App Layout for authenticated pages -->
    <AppLayout v-if="$route.meta?.layout === 'app'" />

    <!-- Auth Layout for login/register pages -->
    <div v-else class="min-h-screen bg-gray-50 dark:bg-slate-900">
      <router-view />
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import AppLayout from '@/layouts/AppLayout.vue'
import { usePageTitle } from '@/composables/usePageTitle'
import { useAdvancedTheme } from '@/composables/useAdvancedTheme'

// Initialize page title management
const { setTitle } = usePageTitle()

// Initialize advanced theme management (happens automatically)
useAdvancedTheme()

// Set initial title on app mount
onMounted(() => {
  // The usePageTitle composable will handle route-based title updates automatically
  // This ensures the title is set correctly on initial load
})
</script>

<style>
/* Import basic theme CSS only */
@import '@/styles/themes.css';
@import '@/styles/advanced-themes.css';
</style>
