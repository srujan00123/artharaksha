import { computed, onMounted, ref } from "vue"

export function useAdvancedTheme() {
	const currentTheme = ref("light")

<<<<<<< HEAD
    const isDark = computed(() => currentTheme.value === 'dark')

    // Simple theme application - no batching, no complex logic
    const setTheme = (themeName) => {
        if (themeName !== 'light' && themeName !== 'dark') return
        if (currentTheme.value === themeName) return
=======
	// Define multiple theme variants
	const themes = {
		// Light themes
		light: {
			name: "light",
			label: "Light",
			category: "light",
			colors: {
				primary: "blue",
				surface: "white",
				background: "gray-50",
			},
		},
		"light-warm": {
			name: "light-warm",
			label: "Light Warm",
			category: "light",
			colors: {
				primary: "orange",
				surface: "orange-50",
				background: "orange-25",
			},
		},
		"light-cool": {
			name: "light-cool",
			label: "Light Cool",
			category: "light",
			colors: {
				primary: "cyan",
				surface: "cyan-50",
				background: "cyan-25",
			},
		},

		// Dark themes
		dark: {
			name: "dark",
			label: "Dark",
			category: "dark",
			colors: {
				primary: "blue",
				surface: "gray-800",
				background: "gray-900",
			},
		},
		"dark-purple": {
			name: "dark-purple",
			label: "Dark Purple",
			category: "dark",
			colors: {
				primary: "purple",
				surface: "purple-900",
				background: "purple-950",
			},
		},
		"dark-green": {
			name: "dark-green",
			label: "Dark Green",
			category: "dark",
			colors: {
				primary: "green",
				surface: "green-900",
				background: "green-950",
			},
		},
	}

	const isDark = computed(() => {
		return themes[currentTheme.value]?.category === "dark"
	})

	const themesByCategory = computed(() => {
		const lightThemes = Object.values(themes).filter(
			(t) => t.category === "light",
		)
		const darkThemes = Object.values(themes).filter(
			(t) => t.category === "dark",
		)
		return { light: lightThemes, dark: darkThemes }
	})

	// Apply theme
	const setTheme = (themeName) => {
		const theme = themes[themeName]
		if (!theme) return
>>>>>>> cache

		currentTheme.value = themeName

<<<<<<< HEAD
        // Direct DOM updates
        if (themeName === 'dark') {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
=======
		// Set data attributes for CSS
		document.documentElement.setAttribute("data-theme", theme.category)
		document.documentElement.setAttribute("data-theme-variant", themeName)

		// Set class for Tailwind dark mode
		if (theme.category === "dark") {
			document.documentElement.classList.add("dark")
		} else {
			document.documentElement.classList.remove("dark")
		}
>>>>>>> cache

		// Store preference
		localStorage.setItem("theme", themeName)
	}

<<<<<<< HEAD
    // Simple initialization
    const initializeTheme = () => {
        const stored = localStorage.getItem('theme')
        if (stored === 'dark' || stored === 'light') {
            setTheme(stored)
        } else {
            // Default to light theme
            setTheme('light')
        }
    }

    // Simple toggle
    const toggleLightDark = () => {
        setTheme(currentTheme.value === 'dark' ? 'light' : 'dark')
    }
=======
	// Initialize theme
	const initializeTheme = () => {
		const stored = localStorage.getItem("theme")
		if (stored && themes[stored]) {
			setTheme(stored)
		} else {
			// Default to light theme
			setTheme("light")
		}
	}

	// Toggle between light and dark (keeps variant)
	const toggleLightDark = () => {
		const currentCategory = themes[currentTheme.value].category
		const newCategory = currentCategory === "light" ? "dark" : "light"

		// Find equivalent theme in opposite category
		const equivalentTheme = Object.values(themes).find(
			(t) =>
				t.category === newCategory &&
				t.colors.primary === themes[currentTheme.value].colors.primary,
		)

		setTheme(
			equivalentTheme?.name || (newCategory === "dark" ? "dark" : "light"),
		)
	}
>>>>>>> cache

	onMounted(() => {
		initializeTheme()
	})

<<<<<<< HEAD
    return {
        currentTheme,
        isDark,
        setTheme,
        toggleLightDark
    }
} 
=======
	return {
		currentTheme,
		themes,
		themesByCategory,
		isDark,
		setTheme,
		toggleLightDark,
		initializeTheme,
	}
}
>>>>>>> cache
