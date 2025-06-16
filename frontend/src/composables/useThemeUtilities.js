import { useAdvancedTheme } from "@/composables/useAdvancedTheme"
// Advanced Theme Utilities
import { computed } from "vue"

export function useThemeUtilities() {
	const { currentTheme, isDark, themes } = useAdvancedTheme()

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

	const getThemeVariantClasses = computed(() => {
		const theme = themes[currentTheme.value]
		if (!theme) return {}

		return {
			primary: `text-${theme.colors.primary}-600 dark:text-${theme.colors.primary}-400`,
			surface: `bg-${theme.colors.surface}`,
			background: `bg-${theme.colors.background}`,
		}
	})

	return {
		getFinancialStatusClass,
		getThemeSurfaceClass,
		getThemeTextClass,
		getThemeVariantClasses,
	}
}
