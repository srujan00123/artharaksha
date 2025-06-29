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
import { onMounted } from "vue"
import socketClient from "./services/socket-service.js"
import { useNotifications } from "./composables/useNotifications.ts"

// Initialize page title management
const { setTitle } = usePageTitle()

// Initialize advanced theme management (happens automatically)
useAdvancedTheme()

// Initialize the global notification system once
const notifications = useNotifications()

onMounted(() => {
	// 1. First, initialize the notification system to register listeners.
	console.log("🚀 App mounted, initializing notification listeners...")
	notifications.initialize()

	// 2. Now that listeners are ready, it's safe to connect the socket.
	console.log("🔌 Initializing socket connection...")
	socketClient.init()
})
</script>

<style>
@import '@/styles/themes.css';
@import '@/styles/advanced-themes.css';
</style>
