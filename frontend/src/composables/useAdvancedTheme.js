import { ref, computed, onMounted } from 'vue'

export function useAdvancedTheme() {
    const currentTheme = ref('light')

    const isDark = computed(() => currentTheme.value === 'dark')

    // Simple theme application - no batching, no complex logic
    const setTheme = (themeName) => {
        if (themeName !== 'light' && themeName !== 'dark') return
        if (currentTheme.value === themeName) return

        currentTheme.value = themeName

        // Direct DOM updates
        if (themeName === 'dark') {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }

        // Store preference
        localStorage.setItem('theme', themeName)
    }

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

    onMounted(() => {
        initializeTheme()
    })

    return {
        currentTheme,
        isDark,
        setTheme,
        toggleLightDark
    }
} 