<template>
  <div id="app">
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
import { onMounted } from "vue"

// Initialize page title management
const { setTitle } = usePageTitle()

// Initialize advanced theme management
const { initializeTheme } = useAdvancedTheme()

// Set initial title and theme on app mount
onMounted(() => {
	// Initialize theme system
	initializeTheme()

	// The usePageTitle composable will handle route-based title updates automatically
	// This ensures the title is set correctly on initial load
})
</script>

<style>
/* Import theme CSS */
@import '@/styles/themes.css';
@import '@/styles/advanced-themes.css';
</style>
