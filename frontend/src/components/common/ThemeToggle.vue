<template>
    <button
      @click="toggleLightDark"
    class="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
      :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
    >
      <Sun v-if="isDark" class="w-4 h-4 text-gray-600 dark:text-gray-300" />
      <Moon v-else class="w-4 h-4 text-gray-600 dark:text-gray-300" />
    </button>
</template>

<script setup>
import { useAdvancedTheme } from '@/composables/useAdvancedTheme'
import { Sun, Moon } from 'lucide-vue-next'

const { isDark, toggleLightDark } = useAdvancedTheme()
</script>

<style scoped>
.touch-manipulation {
  touch-action: manipulation;
}

/* Optimize transitions for better performance */
.transition {
  will-change: transform, opacity;
}
</style> 