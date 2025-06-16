<template>
  <div class="theme-selector">
    <div class="relative">
      <button
        @click="isOpen = !isOpen"
        class="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors touch-manipulation"
      >
        <div class="w-4 h-4 rounded-full theme-preview" :class="getThemePreviewClass()"></div>
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 hidden sm:inline">
          {{ getCurrentThemeLabel() }}
        </span>
        <ChevronDown class="w-4 h-4 text-gray-400 dark:text-gray-500" />
      </button>

      <!-- Theme Selector Dropdown -->
      <div
        v-show="isOpen"
        class="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50"
      >
        <div class="p-4">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Choose Theme</h3>
          
          <!-- Light Themes -->
          <div class="mb-4">
            <h4 class="text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
              Light Themes
            </h4>
            <div class="grid grid-cols-3 gap-2">
              <div
                v-for="theme in themesByCategory.light"
                :key="theme.name"
                @click="selectTheme(theme.name)"
                class="relative cursor-pointer rounded-lg border-2 transition-all"
                :class="currentTheme === theme.name 
                  ? 'border-blue-500 dark:border-blue-400' 
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'"
              >
                <div class="p-3 rounded-md" :class="getThemeBackgroundClass(theme)">
                  <div class="h-8 mb-2 rounded-sm" :class="getThemeSurfaceClass(theme)"></div>
                  <div class="space-y-1">
                    <div class="h-2 w-3/4 rounded-sm" :class="getThemePrimaryClass(theme)"></div>
                    <div class="h-1 w-1/2 bg-gray-300 dark:bg-gray-600 rounded-sm"></div>
                  </div>
                </div>
                <div class="absolute -top-1 -right-1">
                  <div
                    v-if="currentTheme === theme.name"
                    class="w-5 h-5 bg-blue-500 dark:bg-blue-400 rounded-full flex items-center justify-center"
                  >
                    <Check class="w-3 h-3 text-white dark:text-black" />
                  </div>
                </div>
                <div class="text-xs text-center text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-1 pb-2">
                  {{ theme.label }}
                </div>
              </div>
            </div>
          </div>

          <!-- Dark Themes -->
          <div>
            <h4 class="text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
              Dark Themes
            </h4>
            <div class="grid grid-cols-3 gap-2">
              <div
                v-for="theme in themesByCategory.dark"
                :key="theme.name"
                @click="selectTheme(theme.name)"
                class="relative cursor-pointer rounded-lg border-2 transition-all"
                :class="currentTheme === theme.name 
                  ? 'border-blue-500 dark:border-blue-400' 
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'"
              >
                <div class="p-3 rounded-md" :class="getThemeBackgroundClass(theme)">
                  <div class="h-8 mb-2 rounded-sm" :class="getThemeSurfaceClass(theme)"></div>
                  <div class="space-y-1">
                    <div class="h-2 w-3/4 rounded-sm" :class="getThemePrimaryClass(theme)"></div>
                    <div class="h-1 w-1/2 bg-gray-600 rounded-sm"></div>
                  </div>
                </div>
                <div class="absolute -top-1 -right-1">
                  <div
                    v-if="currentTheme === theme.name"
                    class="w-5 h-5 bg-blue-500 dark:bg-blue-400 rounded-full flex items-center justify-center"
                  >
                    <Check class="w-3 h-3 text-white dark:text-black" />
                  </div>
                </div>
                <div class="text-xs text-center text-gray-300 dark:text-gray-600 mt-1 pb-2">
                  {{ theme.label }}
                </div>
              </div>
            </div>
          </div>

          <!-- System Preference Toggle -->
          <div class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <label class="flex items-center">
              <input
                type="checkbox"
                v-model="followSystem"
                @change="handleSystemToggle"
                class="rounded border-gray-300  dark:text-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400" :class="getFinancialStatusClass('medical', '600')"
              >
              <span class="ml-2 text-sm text-gray-700 dark:text-gray-300 dark:text-gray-600">
                Follow system preference
              </span>
            </label>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAdvancedTheme } from "@/composables/useAdvancedTheme"
import { Check, ChevronDown } from "lucide-vue-next"
import { computed, ref } from "vue"

const { currentTheme, themes, themesByCategory, setTheme } = useAdvancedTheme()
const isOpen = ref(false)
const followSystem = ref(false)

const getCurrentThemeLabel = () => {
	return themes[currentTheme.value]?.label || "Light"
}

const getThemePreviewClass = () => {
	const theme = themes[currentTheme.value]
	if (!theme) return "bg-blue-500"

	const colorMap = {
		blue: "bg-blue-500",
		orange: "bg-orange-500",
		cyan: "bg-cyan-500",
		purple: "bg-purple-500",
		green: "bg-green-500",
	}

	return colorMap[theme.colors.primary] || "bg-blue-500"
}

const getThemeBackgroundClass = (theme) => {
	if (theme.category === "dark") {
		const bgMap = {
			dark: "bg-gray-900",
			"dark-purple": "bg-purple-950",
			"dark-green": "bg-green-950",
		}
		return bgMap[theme.name] || "bg-gray-900"
	} else {
		const bgMap = {
			light: "bg-gray-50",
			"light-warm": "bg-orange-50",
			"light-cool": "bg-cyan-50",
		}
		return bgMap[theme.name] || "bg-gray-50"
	}
}

const getThemeSurfaceClass = (theme) => {
	if (theme.category === "dark") {
		const surfaceMap = {
			dark: "bg-gray-800",
			"dark-purple": "bg-purple-900",
			"dark-green": "bg-green-900",
		}
		return surfaceMap[theme.name] || "bg-gray-800"
	} else {
		return "bg-white"
	}
}

const getThemePrimaryClass = (theme) => {
	const colorMap = {
		blue: theme.category === "dark" ? "bg-blue-400" : "bg-blue-500",
		orange: theme.category === "dark" ? "bg-orange-400" : "bg-orange-500",
		cyan: theme.category === "dark" ? "bg-cyan-400" : "bg-cyan-500",
		purple: theme.category === "dark" ? "bg-purple-400" : "bg-purple-500",
		green: theme.category === "dark" ? "bg-green-400" : "bg-green-500",
	}

	return (
		colorMap[theme.colors.primary] ||
		(theme.category === "dark" ? "bg-blue-400" : "bg-blue-500")
	)
}

const selectTheme = (themeName) => {
	setTheme(themeName)
	followSystem.value = false
	localStorage.removeItem("follow-system-theme")
	isOpen.value = false
}

const handleSystemToggle = () => {
	if (followSystem.value) {
		localStorage.setItem("follow-system-theme", "true")
		const prefersDark = window.matchMedia(
			"(prefers-color-scheme: dark)",
		).matches
		setTheme(prefersDark ? "dark" : "light")
	} else {
		localStorage.removeItem("follow-system-theme")
	}
}

// Close dropdown when clicking outside
const handleClickOutside = (event) => {
	if (!event.target.closest(".theme-selector")) {
		isOpen.value = false
	}
}

if (typeof window !== "undefined") {
	document.addEventListener("click", handleClickOutside)
}
</script>

<style scoped>
.touch-manipulation {
  touch-action: manipulation;
}
</style> 