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
<<<<<<< HEAD
import { useAdvancedTheme } from '@/composables/useAdvancedTheme'
import { Sun, Moon } from 'lucide-vue-next'

const { isDark, toggleLightDark } = useAdvancedTheme()
=======
import { useAdvancedTheme } from "@/composables/useAdvancedTheme"
import { Check, ChevronDown, Monitor, Moon, Sun } from "lucide-vue-next"
import { ref } from "vue"

defineProps({
	showDropdown: {
		type: Boolean,
		default: false,
	},
})

const {
	currentTheme,
	isDark,
	themes,
	themesByCategory,
	setTheme,
	toggleLightDark,
} = useAdvancedTheme()
const dropdownOpen = ref(false)

const selectTheme = (newTheme) => {
	setTheme(newTheme)
	dropdownOpen.value = false
}

const followSystem = () => {
	localStorage.removeItem("theme")
	const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
	setTheme(prefersDark ? "dark" : "light")
	dropdownOpen.value = false
}

const getThemeIcon = (theme) => {
	const iconMap = {
		light: "☀️",
		"light-warm": "🔆",
		"light-cool": "❄️",
		dark: "🌙",
		"dark-purple": "🟣",
		"dark-green": "🟢",
	}
	return iconMap[theme.name] || "🎨"
}

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
	if (!event.target.closest(".theme-toggle")) {
		dropdownOpen.value = false
	}
}

// Add event listener for clicking outside
if (typeof window !== "undefined") {
	document.addEventListener("click", handleClickOutside)
}

// Theme utility methods
const getFinancialStatusClass = (type, intensity = "600") => {
	const baseClasses = {
		income: `text-green-${intensity} dark:text-green-400`,
		expense: `text-red-${intensity} dark:text-red-400`,
		medical: `text-blue-${intensity} dark:text-blue-400`,
		warning: `text-yellow-${intensity} dark:text-yellow-400`,
		alert: `text-orange-${intensity} dark:text-orange-400`,
		neutral: `text-gray-${intensity} dark:text-gray-400`,
	}
	return baseClasses[type] || baseClasses.neutral
}

const getThemeSurfaceClass = (variant = "primary") => {
	const variants = {
		primary: "bg-white dark:bg-gray-800",
		secondary: "bg-gray-50 dark:bg-gray-900",
		tertiary: "bg-gray-100 dark:bg-gray-800",
	}
	return variants[variant] || variants.primary
}

const getThemeTextClass = (intensity = "600") => {
	const intensityMap = {
		900: "text-gray-900 dark:text-gray-100",
		800: "text-gray-800 dark:text-gray-200",
		700: "text-gray-700 dark:text-gray-300",
		600: "text-gray-600 dark:text-gray-400",
		500: "text-gray-500 dark:text-gray-400",
		400: "text-gray-400 dark:text-gray-500",
	}
	return intensityMap[intensity] || intensityMap["600"]
}
>>>>>>> cache
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