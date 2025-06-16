<template>
    <div class="p-4 lg:p-6">
        <!-- Header -->
        <div class="mb-6">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Welfare & Insurance Schemes</h1>
            <p class="text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-2">Discover government welfare programs and insurance schemes that you may be eligible for</p>
        </div>

        <!-- Filters and Search -->
        <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                <!-- Search -->
                <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">Search Schemes</label>
                    <div class="relative">
                        <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                        <input
                            v-model="searchQuery"
                            type="text"
                            placeholder="Search by name or description..."
                            class="pl-10 w-full rounded-md border-gray-300 dark:border-gray-600 shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400"
                        />
                    </div>
                </div>

                <!-- Scheme Source Filter -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">Source</label>
                    <select
                        v-model="selectedSource"
                        class="w-full rounded-md border-gray-300 dark:border-gray-600 shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400"
                    >
                        <option value="">All Sources</option>
                        <option value="welfare">Welfare Schemes</option>
                        <option value="insurance">Insurance Schemes</option>
                    </select>
                </div>

                <!-- Type Filter -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">Type</label>
                    <select
                        v-model="selectedType"
                        class="w-full rounded-md border-gray-300 dark:border-gray-600 shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400"
                    >
                        <option value="">All Types</option>
                        <option value="Government">Government</option>
                        <option value="Private">Private</option>
                    </select>
                </div>
            </div>

            <!-- Quick Stats -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <div class="text-center">
                    <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ totalSchemes }}</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Total Schemes</p>
                </div>
                <div class="text-center">
                    <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ welfareCount }}</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Welfare Programs</p>
                </div>
                <div class="text-center">
                    <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">{{ insuranceCount }}</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Insurance Schemes</p>
                </div>
                <div class="text-center">
                    <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ eligibleCount }}</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Eligible for You</p>
                </div>
            </div>
        </div>

        <!-- Loading State -->
        <div v-if="support.loading.value.allSchemes" class="flex justify-center items-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span class="ml-3 text-gray-600 dark:text-gray-400 dark:text-gray-500">Loading schemes...</span>
        </div>

        <!-- Error State -->
        <div v-else-if="support.errors.value.allSchemes" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
            <div class="flex items-center">
                <AlertCircle class="h-5 w-5 text-red-600 dark:text-red-400 mr-3" />
                <div>
                    <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error Loading Schemes</h3>
                    <p class="text-sm text-red-700 dark:text-red-300 mt-1">{{ support.errors.value.allSchemes }}</p>
                </div>
            </div>
            <button
                @click="loadSchemes"
                class="mt-4 inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 dark:text-gray-600 bg-white dark:bg-gray-800 dark:bg-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 dark:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400"
            >
                Try Again
            </button>
        </div>

        <!-- Schemes Grid -->
        <div v-else-if="filteredSchemes.length > 0" class="space-y-6">
            <!-- Eligible Schemes Section -->
            <div v-if="eligibleSchemes.length > 0">
                <div class="flex items-center mb-4">
                    <CheckCircle class="h-6 w-6 text-green-600 dark:text-green-400 mr-3" />
                    <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Schemes You're Eligible For</h2>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    <div
                        v-for="scheme in eligibleSchemes"
                        :key="scheme.name"
                        class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 hover:shadow dark:shadow-gray-900/20-md transition-shadow dark:shadow-gray-900/20"
                    >
                        <div class="flex items-start justify-between mb-4">
                            <div class="flex-1">
                                <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">{{ scheme.scheme_name }}</h3>
                                <div class="flex items-center space-x-2 mb-2">
                                    <span
                                        :class="getSchemeTypeBadgeClass(scheme.type)"
                                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                    >
                                        {{ scheme.type }}
                                    </span>
                                    <span
                                        :class="getSchemeSourceBadgeClass(scheme.scheme_source)"
                                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                    >
                                        {{ scheme.scheme_source === 'welfare' ? 'Welfare' : 'Insurance' }}
                                    </span>
                                    <span
                                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                                    >
                                        Eligible
                                    </span>
                                </div>
                            </div>
                            <component 
                                :is="scheme.scheme_source === 'insurance' ? Shield : Building" 
                                class="w-6 h-6 text-green-600 dark:text-green-400" 
                            />
                        </div>

                        <p class="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-4">{{ scheme.description }}</p>

                        <!-- Coverage Amount -->
                        <div v-if="scheme.coverage_amount" class="mb-4">
                            <div class="flex items-center space-x-2">
                                <DollarSign class="h-4 w-4 text-green-600 dark:text-green-400" />
                                <span class="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">Coverage:</span>
                                <span class="text-lg font-bold text-green-600 dark:text-green-400">
                                    ₹{{ formatCurrency(scheme.coverage_amount) }}
                                </span>
                            </div>
                        </div>

                        <!-- Eligibility Status -->
                        <div v-if="scheme.eligibility_status && scheme.eligibility_status.length > 0" class="mb-4">
                            <p class="text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">Eligibility Status:</p>
                            <div class="space-y-1">
                                <div
                                    v-for="status in scheme.eligibility_status.slice(0, 3)"
                                    :key="status.criteria"
                                    class="flex items-center justify-between text-xs"
                                >
                                    <span class="text-gray-600 dark:text-gray-400 dark:text-gray-500">{{ status.criteria }}:</span>
                                    <span
                                        :class="status.met ? 'text-green-600' : status.met === false ? 'text-red-600' : 'text-yellow-600'"
                                        class="font-medium"
                                    >
                                        {{ status.met ? '✓ Met' : status.met === false ? '✗ Not Met' : '? Check' }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="flex justify-between items-center">
                            <button
                                @click="openSchemeDetails(scheme)"
                                class="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 dark:text-gray-600 bg-white dark:bg-gray-800 dark:bg-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 dark:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400"
                            >
                                View Details
                            </button>
                            <button
                                v-if="scheme.apply_url || scheme.apply_link"
                                @click="applyToScheme(scheme)"
                                class="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white dark:text-black bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 dark:ring-green-400"
                            >
                                Apply Now
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- All Schemes Section -->
            <div>
                <div class="flex items-center justify-between mb-4">
                    <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">All Available Schemes</h2>
                    <div class="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">
                        <span>{{ filteredSchemes.length }} schemes found</span>
                    </div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div
                        v-for="scheme in paginatedSchemes"
                        :key="scheme.name"
                        class="bg-white dark:bg-gray-800 dark:bg-gray-200 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow dark:shadow-gray-900/20-md transition-shadow dark:shadow-gray-900/20"
                    >
                        <div class="flex items-start justify-between mb-4">
                            <div class="flex-1">
                                <h3 class="font-semibold text-gray-900 dark:text-gray-100 mb-2">{{ scheme.scheme_name }}</h3>
                                <div class="flex items-center space-x-2 mb-2">
                                    <span
                                        :class="getSchemeTypeBadgeClass(scheme.type)"
                                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                    >
                                        {{ scheme.type }}
                                    </span>
                                    <span
                                        :class="getSchemeSourceBadgeClass(scheme.scheme_source)"
                                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                    >
                                        {{ scheme.scheme_source === 'welfare' ? 'Welfare' : 'Insurance' }}
                                    </span>
                                    <span
                                        v-if="scheme.is_eligible !== undefined"
                                        :class="getEligibilityBadgeClass(scheme)"
                                        class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                    >
                                        {{ getEligibilityLabel(scheme) }}
                                    </span>
                                </div>
                            </div>
                            <component 
                                :is="scheme.scheme_source === 'insurance' ? Shield : Building" 
                                class="w-6 h-6 text-gray-400 dark:text-gray-500" 
                            />
                        </div>

                        <p class="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 mb-4 line-clamp-3">{{ scheme.description }}</p>

                        <!-- Coverage Amount -->
                        <div v-if="scheme.coverage_amount || scheme.amount_range" class="mb-4">
                            <div class="flex items-center space-x-2">
                                <DollarSign class="h-4 w-4 text-green-600 dark:text-green-400" />
                                <span class="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">Coverage:</span>
                                <span class="text-lg font-bold text-green-600 dark:text-green-400">
                                    <template v-if="scheme.amount_range && scheme.amount_min && scheme.amount_max">
                                        ₹{{ formatCurrency(scheme.amount_min) }} - ₹{{ formatCurrency(scheme.amount_max) }}
                                    </template>
                                    <template v-else-if="scheme.coverage_amount">
                                        ₹{{ formatCurrency(scheme.coverage_amount) }}
                                    </template>
                                </span>
                            </div>
                        </div>

                        <!-- Benefits Preview -->
                        <div v-if="getBenefits(scheme) && getBenefits(scheme).length > 0" class="mb-4">
                            <p class="text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">Key Benefits:</p>
                            <ul class="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500 space-y-1">
                                <li v-for="benefit in getBenefits(scheme).slice(0, 2)" :key="benefit.description">
                                    • {{ benefit.description }}
                                </li>
                                <li v-if="getBenefits(scheme).length > 2" class="text-gray-500 dark:text-gray-400 dark:text-gray-500">
                                    + {{ getBenefits(scheme).length - 2 }} more benefits
                                </li>
                            </ul>
                        </div>

                        <div class="flex justify-between items-center">
                            <button
                                @click="openSchemeDetails(scheme)"
                                class="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 dark:text-gray-600 bg-white dark:bg-gray-800 dark:bg-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 dark:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400"
                            >
                                View Details
                            </button>
                            <button
                                v-if="scheme.apply_url || scheme.apply_link"
                                @click="applyToScheme(scheme)"
                                class="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white dark:text-black bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400"
                            >
                                Apply Now
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Pagination -->
                <div v-if="totalPages > 1" class="flex justify-center items-center space-x-4 mt-8">
                    <button
                        @click="currentPage--"
                        :disabled="currentPage === 1"
                        class="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 dark:text-gray-600 bg-white dark:bg-gray-800 dark:bg-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 dark:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <span class="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">
                        Page {{ currentPage }} of {{ totalPages }}
                    </span>
                    <button
                        @click="currentPage++"
                        :disabled="currentPage === totalPages"
                        class="inline-flex items-center px-3 py-1 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 dark:text-gray-600 bg-white dark:bg-gray-800 dark:bg-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 dark:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>

        <!-- Empty State -->
        <div v-else class="text-center py-12">
            <Building class="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No schemes found</h3>
            <p class="text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-6">Try adjusting your search criteria or filters</p>
            <button
                @click="clearFilters"
                class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 dark:text-gray-600 bg-white dark:bg-gray-800 dark:bg-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 dark:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400"
            >
                Clear Filters
            </button>
        </div>

        <!-- Scheme Details Modal -->
        <SchemeDetailsModal
            v-if="selectedScheme"
            :scheme="selectedScheme"
            @close="selectedScheme = null"
        />
    </div>
</template>

<script setup>
import { useAdvancedTheme } from "@/composables/useAdvancedTheme"
import { Button } from "frappe-ui"
import {
	AlertCircle,
	Building,
	CheckCircle,
	DollarSign,
	Search,
	Shield,
} from "lucide-vue-next"
import { computed, onMounted, ref, watch } from "vue"
import SchemeDetailsModal from "../../components/support/SchemeDetailsModal.vue"
import { useSupport } from "../../composables/useSupport"
import { formatCurrency } from "../../utils"

// Support composable
const support = useSupport({ autoInitialize: true })

// Reactive data
const searchQuery = ref("")
const selectedSource = ref("")
const selectedType = ref("")
const selectedScheme = ref(null)
const currentPage = ref(1)
const itemsPerPage = 12

// Computed properties
const totalSchemes = computed(() => support.allSchemes.value.length)
const welfareCount = computed(
	() =>
		support.allSchemes.value.filter((s) => s.scheme_source === "welfare")
			.length,
)
const insuranceCount = computed(
	() =>
		support.allSchemes.value.filter((s) => s.scheme_source === "insurance")
			.length,
)
const eligibleCount = computed(
	() =>
		support.eligibleSchemes.value.filter((scheme) => scheme.is_eligible).length,
)

const filteredSchemes = computed(() => {
	let schemes = support.allSchemes.value

	// Apply search filter
	if (searchQuery.value) {
		const query = searchQuery.value.toLowerCase()
		schemes = schemes.filter(
			(scheme) =>
				scheme.scheme_name?.toLowerCase().includes(query) ||
				scheme.description?.toLowerCase().includes(query),
		)
	}

	// Apply source filter
	if (selectedSource.value) {
		schemes = schemes.filter(
			(scheme) => scheme.scheme_source === selectedSource.value,
		)
	}

	// Apply type filter
	if (selectedType.value) {
		schemes = schemes.filter((scheme) => scheme.type === selectedType.value)
	}

	return schemes
})

const eligibleSchemes = computed(() => {
	return support.eligibleSchemes.value.filter((scheme) => scheme.is_eligible)
})

const totalPages = computed(() =>
	Math.ceil(filteredSchemes.value.length / itemsPerPage),
)

const paginatedSchemes = computed(() => {
	const start = (currentPage.value - 1) * itemsPerPage
	const end = start + itemsPerPage
	return filteredSchemes.value.slice(start, end)
})

// Methods
function getSchemeTypeBadgeClass(type) {
	return type === "Government"
		? "bg-blue-100 text-blue-800"
		: "bg-purple-100 text-purple-800"
}

function getSchemeSourceBadgeClass(source) {
	return source === "welfare"
		? "bg-green-100 text-green-800"
		: "bg-orange-100 text-orange-800"
}

function getEligibilityBadgeClass(scheme) {
	if (scheme.is_eligible) {
		return "bg-green-100 text-green-800"
	} else if (scheme.eligibility_score > 0) {
		return "bg-yellow-100 text-yellow-800"
	} else {
		return "bg-red-100 text-red-800"
	}
}

function getEligibilityLabel(scheme) {
	if (scheme.is_eligible) {
		return "Eligible"
	} else if (scheme.eligibility_score > 0) {
		return "Partially Eligible"
	} else {
		return "Not Eligible"
	}
}

function openSchemeDetails(scheme) {
	selectedScheme.value = scheme
}

function applyToScheme(scheme) {
	const url = scheme.apply_url || scheme.apply_link
	if (url) {
		window.open(url, "_blank")
	}
}

// Helper methods to handle different field names between welfare and insurance schemes
function getBenefits(scheme) {
	return (
		scheme.scheme_benefits || scheme.scheme_benefit || scheme.benefits || []
	)
}

function clearFilters() {
	searchQuery.value = ""
	selectedSource.value = ""
	selectedType.value = ""
	currentPage.value = 1
}

async function loadSchemes() {
	try {
		await Promise.all([
			support.loadAllSchemes(null, true),
			support.loadEligibleSchemes(true),
		])
	} catch (error) {
		console.error("Error loading schemes:", error)
	}
}

// Watch for filter changes to reset pagination
watch([searchQuery, selectedSource, selectedType], () => {
	currentPage.value = 1
})

// Lifecycle
onMounted(async () => {
	try {
		// Initialize support system if not already done
		if (!support.state.value.isInitialized) {
			await support.initialize()
		}

		// Load schemes and eligibility data
		await Promise.all([support.loadAllSchemes(), support.loadEligibleSchemes()])
	} catch (error) {
		console.error("Error initializing programs data:", error)
	}
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