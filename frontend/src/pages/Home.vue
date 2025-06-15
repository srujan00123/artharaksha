<template>
  <div class="max-w-3xl py-12 mx-auto">
    <h2 class="font-bold text-lg text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-4">
      Welcome {{ session.user }}!
    </h2>

    <Button theme="gray" variant="solid" icon-left="code" @click="ping.fetch" :loading="ping.loading">
      Click to send 'ping' request
    </Button>
    <div>
      {{ ping.data }}
    </div>
    <pre>{{ ping }}</pre>

    <div class="flex flex-row space-x-2 mt-4">
      <Button @click="showDialog = true">Open Dialog</Button>
      <Button @click="session.logout.submit()">Logout</Button>
    </div>

    <!-- Dialog -->
    <Dialog title="Title" v-model="showDialog"> Dialog content </Dialog>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Dialog } from 'frappe-ui'
import { createResource } from 'frappe-ui'
import { session } from '../data/session'
import { useAdvancedTheme } from '@/composables/useAdvancedTheme'


const ping = createResource({
  url: 'ping',
  auto: true,
})

const showDialog = ref(false)

// Advanced theme management
const { currentTheme, isDark, setTheme, themes } = useAdvancedTheme()

// Theme utility methods
const getFinancialStatusClass = (type, intensity = '600') => {
  const baseClasses = {
    income: `text-green-${intensity} dark:text-green-400`,
    expense: `text-red-${intensity} dark:text-red-400`,
    medical: `text-blue-${intensity} dark:text-blue-400`,
    warning: `text-yellow-${intensity} dark:text-yellow-400`,
    alert: `text-orange-${intensity} dark:text-orange-400`,
    neutral: `text-gray-${intensity} dark:text-gray-400`
  }
  return baseClasses[type] || baseClasses.neutral
}

const getThemeSurfaceClass = (variant = 'primary') => {
  const variants = {
    primary: 'bg-white dark:bg-gray-800',
    secondary: 'bg-gray-50 dark:bg-gray-900',
    tertiary: 'bg-gray-100 dark:bg-gray-800'
  }
  return variants[variant] || variants.primary
}

const getThemeTextClass = (intensity = '600') => {
  const intensityMap = {
    '900': 'text-gray-900 dark:text-gray-100',
    '800': 'text-gray-800 dark:text-gray-200',
    '700': 'text-gray-700 dark:text-gray-300',
    '600': 'text-gray-600 dark:text-gray-400',
    '500': 'text-gray-500 dark:text-gray-400',
    '400': 'text-gray-400 dark:text-gray-500'
  }
  return intensityMap[intensity] || intensityMap['600']
}
</script>
