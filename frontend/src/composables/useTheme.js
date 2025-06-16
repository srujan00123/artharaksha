import { onMounted, ref, watch } from "vue"

export function useTheme() {
	const theme = ref("light")
	const isDark = ref(false)

	// Available themes
	const themes = [
		{ name: "light", label: "Light Mode", icon: "☀️" },
		{ name: "dark", label: "Dark Mode", icon: "🌙" },
	]

	// Initialize theme from localStorage or system preference
	const initializeTheme = () => {
		const stored = localStorage.getItem("theme")
		if (stored && ["light", "dark"].includes(stored)) {
			setTheme(stored)
		} else {
			// Use system preference
			const prefersDark = window.matchMedia(
				"(prefers-color-scheme: dark)",
			).matches
			setTheme(prefersDark ? "dark" : "light")
		}
	}

	// Set theme
	const setTheme = (newTheme) => {
		theme.value = newTheme
		isDark.value = newTheme === "dark"

		// Update DOM
		if (newTheme === "dark") {
			document.documentElement.setAttribute("data-theme", "dark")
			document.documentElement.classList.add("dark")
		} else {
			document.documentElement.setAttribute("data-theme", "light")
			document.documentElement.classList.remove("dark")
		}

		// Store preference
		localStorage.setItem("theme", newTheme)
	}

	// Toggle between light and dark
	const toggleTheme = () => {
		setTheme(theme.value === "light" ? "dark" : "light")
	}

	// Watch for system theme changes
	const watchSystemTheme = () => {
		const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
		mediaQuery.addEventListener("change", (e) => {
			// Only follow system if user hasn't set a preference
			if (!localStorage.getItem("theme")) {
				setTheme(e.matches ? "dark" : "light")
			}
		})
	}

	onMounted(() => {
		initializeTheme()
		watchSystemTheme()
	})

	return {
		theme,
		isDark,
		themes,
		setTheme,
		toggleTheme,
		initializeTheme,
	}
}
