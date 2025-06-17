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
import { useAdvancedTheme } from "@/composables/useAdvancedTheme"
import { usePageTitle } from "@/composables/usePageTitle"
import AppLayout from "@/layouts/AppLayout.vue"

// Initialize page title management
const { setTitle } = usePageTitle()

// Initialize advanced theme management (happens automatically)
useAdvancedTheme()
</script>

<style>
@import '@/styles/themes.css';
@import '@/styles/advanced-themes.css';
</style>
