<template>
  <div class="theme-toggle">
    <!-- Simple Toggle Button -->
    <button
      @click="toggleLightDark"
      class="flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors touch-manipulation"
      :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
    >
      <Sun v-if="isDark" class="w-4 h-4 text-gray-600 dark:text-gray-300" />
      <Moon v-else class="w-4 h-4 text-gray-600 dark:text-gray-300" />
    </button>

    <!-- Dropdown Toggle (Alternative) -->
    <div v-if="showDropdown" class="relative">
      <button
        @click="dropdownOpen = !dropdownOpen"
        class="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors touch-manipulation"
      >
        <Sun v-if="!isDark" class="w-4 h-4 text-gray-600 dark:text-gray-300" />
        <Moon v-else class="w-4 h-4 text-gray-600 dark:text-gray-300" />
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ themes[currentTheme]?.label }}
        </span>
        <ChevronDown class="w-4 h-4 text-gray-400 dark:text-gray-500 dark:text-gray-400" />
      </button>

      <!-- Dropdown Menu -->
      <div
        v-show="dropdownOpen"
        class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50"
      >
        <button
          v-for="themeOption in Object.values(themes)"
          :key="themeOption.name"
          @click="selectTheme(themeOption.name)"
          class="w-full flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 touch-manipulation"
          :class="{ 
            'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300': currentTheme === themeOption.name 
          }"
        >
          <span class="mr-3 text-base">{{ getThemeIcon(themeOption) }}</span>
          {{ themeOption.label }}
          <Check v-if="currentTheme === themeOption.name" class="w-4 h-4 ml-auto text-blue-600 dark:text-blue-400" />
        </button>
        
        <!-- System Preference Option -->
        <div class="border-t border-gray-200 dark:border-gray-700 mt-1 pt-1">
          <button
            @click="followSystem"
            class="w-full flex items-center px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 touch-manipulation"
          >
            <Monitor class="w-4 h-4 mr-3" />
            Follow System
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAdvancedTheme } from '@/composables/useAdvancedTheme'
import { Sun, Moon, ChevronDown, Check, Monitor } from 'lucide-vue-next'

defineProps({
  showDropdown: {
    type: Boolean,
    default: false
  }
})

const { currentTheme, isDark, themes, themesByCategory, setTheme, toggleLightDark } = useAdvancedTheme()
const dropdownOpen = ref(false)

const selectTheme = (newTheme) => {
  setTheme(newTheme)
  dropdownOpen.value = false
}

const followSystem = () => {
  localStorage.removeItem('theme')
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  setTheme(prefersDark ? 'dark' : 'light')
  dropdownOpen.value = false
}

const getThemeIcon = (theme) => {
  const iconMap = {
    'light': '☀️',
    'light-warm': '🔆',
    'light-cool': '❄️',
    'dark': '🌙',
    'dark-purple': '🟣',
    'dark-green': '🟢'
  }
  return iconMap[theme.name] || '🎨'
}

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
  if (!event.target.closest('.theme-toggle')) {
    dropdownOpen.value = false
  }
}

// Add event listener for clicking outside
if (typeof window !== 'undefined') {
  document.addEventListener('click', handleClickOutside)
}

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

<style scoped>
.touch-manipulation {
  touch-action: manipulation;
}
</style> 