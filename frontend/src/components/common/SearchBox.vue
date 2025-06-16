<template>
    <div class="relative" ref="searchContainer">
        <!-- Search Input -->
        <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search :class="['h-5 w-5 transition-colors', searchTerm ? 'text-blue-500' : 'text-gray-400']" />
            </div>
            <Input v-model="searchTerm" :placeholder="placeholder" :disabled="disabled"
                class="pl-10 pr-10 transition-all duration-200 focus:ring-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                @input="handleInput" @keydown="handleKeydown" @focus="handleFocus" @blur="handleBlur" ref="searchInput"
                role="searchbox" :aria-label="placeholder" :aria-expanded="showSuggestions"
                :aria-describedby="searchTerm ? 'search-results' : undefined" autocomplete="off" />

            <!-- Clear Button -->
            <div v-if="searchTerm && !disabled" class="absolute inset-y-0 right-0 pr-3 flex items-center">
                <button @click="clearSearch" @mousedown.prevent
                    class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:text-gray-500 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-800 dark:bg-gray-200 transition-colors focus:outline-none focus:ring-1 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400"
                    type="button" aria-label="Clear search">
                    <X class="h-4 w-4" />
                </button>
            </div>

            <!-- Loading Indicator -->
            <div v-if="isSearching" class="absolute inset-y-0 right-0 pr-3 flex items-center">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            </div>
        </div>

        <!-- Search Suggestions (if enabled) -->
        <div v-if="showSuggestions && searchSuggestions.length > 0"
            class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 dark:bg-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg shadow dark:shadow-gray-900/20-lg max-h-60 overflow-y-auto"
            id="search-results" role="listbox">
            <div v-for="(suggestion, index) in searchSuggestions" :key="suggestion.id || index" :class="[
                'px-4 py-2 cursor-pointer transition-colors hover:bg-gray-50 border-b border-gray-100 last:border-b-0',
                index === selectedSuggestionIndex && 'bg-blue-50 text-blue-700'
            ]" @click="selectSuggestion(suggestion)" @mouseenter="selectedSuggestionIndex = index" role="option"
                :aria-selected="index === selectedSuggestionIndex">
                <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-gray-100 dark:bg-gray-800 dark:bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <Search class="w-4 h-4 text-gray-500 dark:text-gray-400 dark:text-gray-500" />
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {{ suggestion.label || suggestion.text }}
                        </div>
                        <div v-if="suggestion.description" class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 truncate">
                            {{ suggestion.description }}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- No Results -->
        <div v-if="showSuggestions && searchTerm && searchSuggestions.length === 0 && !isSearching"
            class="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 dark:bg-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg shadow dark:shadow-gray-900/20-lg p-4 text-center text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm">
            <Search class="w-6 h-6 mx-auto mb-2 text-gray-400 dark:text-gray-500" />
            No results found for "{{ searchTerm }}"
        </div>
    </div>
</template>

<script setup>
import { useAdvancedTheme } from "@/composables/useAdvancedTheme"
import { debounce } from "@/utils"
import { Input } from "frappe-ui"
import { Search, X } from "lucide-vue-next"
import {
	computed,
	defineEmits,
	nextTick,
	onMounted,
	onUnmounted,
	ref,
	watch,
} from "vue"

const props = defineProps({
	placeholder: {
		type: String,
		default: "Search...",
	},
	debounceMs: {
		type: Number,
		default: 300,
	},
	disabled: {
		type: Boolean,
		default: false,
	},
	suggestions: {
		type: Array,
		default: () => [],
	},
	enableSuggestions: {
		type: Boolean,
		default: false,
	},
	maxSuggestions: {
		type: Number,
		default: 5,
	},
	minSearchLength: {
		type: Number,
		default: 1,
	},
	autoFocus: {
		type: Boolean,
		default: false,
	},
})

const emit = defineEmits([
	"search",
	"clear",
	"suggestion-select",
	"focus",
	"blur",
])

// Reactive state
const searchTerm = ref("")
const isSearching = ref(false)
const isFocused = ref(false)
const selectedSuggestionIndex = ref(-1)
const searchContainer = ref(null)
const searchInput = ref(null)

// Computed properties
const showSuggestions = computed(() => {
	return (
		props.enableSuggestions &&
		isFocused.value &&
		searchTerm.value.length >= props.minSearchLength
	)
})

const searchSuggestions = computed(() => {
	if (!props.enableSuggestions || !searchTerm.value) return []

	const filtered = props.suggestions.filter((suggestion) => {
		const searchText = suggestion.label || suggestion.text || suggestion
		return searchText.toLowerCase().includes(searchTerm.value.toLowerCase())
	})

	return filtered.slice(0, props.maxSuggestions)
})

// Debounced search function with loading state
const debouncedSearch = debounce(async (term) => {
	try {
		isSearching.value = true
		emit("search", term)
	} catch (error) {
		console.error("Search error:", error)
	} finally {
		// Small delay to show loading state
		setTimeout(() => {
			isSearching.value = false
		}, 150)
	}
}, props.debounceMs)

// Event handlers
function handleInput(event) {
	const value = event.target.value
	searchTerm.value = value
	selectedSuggestionIndex.value = -1

	if (value.length >= props.minSearchLength) {
		debouncedSearch(value)
	} else {
		isSearching.value = false
		emit("search", value)
	}
}

function handleKeydown(event) {
	if (!showSuggestions.value || searchSuggestions.value.length === 0) {
		return
	}

	switch (event.key) {
		case "ArrowDown":
			event.preventDefault()
			selectedSuggestionIndex.value = Math.min(
				selectedSuggestionIndex.value + 1,
				searchSuggestions.value.length - 1,
			)
			break

		case "ArrowUp":
			event.preventDefault()
			selectedSuggestionIndex.value = Math.max(
				selectedSuggestionIndex.value - 1,
				-1,
			)
			break

		case "Enter":
			event.preventDefault()
			if (selectedSuggestionIndex.value >= 0) {
				selectSuggestion(searchSuggestions.value[selectedSuggestionIndex.value])
			} else {
				// Submit search as-is
				emit("search", searchTerm.value)
				hideSuggestions()
			}
			break

		case "Escape":
			event.preventDefault()
			if (showSuggestions.value) {
				hideSuggestions()
			} else {
				clearSearch()
			}
			break

		case "Tab":
			// Allow tab to close suggestions
			hideSuggestions()
			break
	}
}

function handleFocus() {
	isFocused.value = true
	emit("focus")
}

function handleBlur() {
	// Delay hiding suggestions to allow for click events
	setTimeout(() => {
		isFocused.value = false
		selectedSuggestionIndex.value = -1
		emit("blur")
	}, 150)
}

function selectSuggestion(suggestion) {
	const suggestionText = suggestion.label || suggestion.text || suggestion
	searchTerm.value = suggestionText
	selectedSuggestionIndex.value = -1

	emit("suggestion-select", suggestion)
	emit("search", suggestionText)

	hideSuggestions()

	// Focus back to input
	nextTick(() => {
		if (searchInput.value) {
			searchInput.value.focus()
		}
	})
}

function clearSearch() {
	searchTerm.value = ""
	selectedSuggestionIndex.value = -1
	isSearching.value = false
	emit("search", "")
	emit("clear")

	// Focus back to input
	nextTick(() => {
		if (searchInput.value) {
			searchInput.value.focus()
		}
	})
}

function hideSuggestions() {
	isFocused.value = false
	selectedSuggestionIndex.value = -1
}

// Click outside handler
function handleClickOutside(event) {
	if (searchContainer.value && !searchContainer.value.contains(event.target)) {
		hideSuggestions()
	}
}

// Lifecycle
onMounted(() => {
	if (props.autoFocus && searchInput.value) {
		searchInput.value.focus()
	}

	document.addEventListener("click", handleClickOutside)
})

onUnmounted(() => {
	document.removeEventListener("click", handleClickOutside)
})

// Watch for external changes
watch(
	() => props.suggestions,
	() => {
		// Reset selection when suggestions change
		selectedSuggestionIndex.value = -1
	},
)

// Expose methods for parent components
defineExpose({
	focus: () => {
		if (searchInput.value) {
			searchInput.value.focus()
		}
	},
	clear: clearSearch,
	getValue: () => searchTerm.value,
	setValue: (value) => {
		searchTerm.value = value
	},
})

// Advanced theme management
const { currentTheme, isDark, setTheme, themes } = useAdvancedTheme()

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
</script>

<style scoped>
/* Custom scrollbar for suggestions */
#search-results::-webkit-scrollbar {
    width: 6px;
}

#search-results::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 3px;
}

#search-results::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 3px;
}

#search-results::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
}

/* Smooth transitions */
.transition-all {
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 200ms;
}
</style>