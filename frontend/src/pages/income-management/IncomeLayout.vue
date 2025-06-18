<template>
  <div class="income-layout">
    <!-- Header Section Banner -->
    <div class="header-section mb-6">
      <div class="bg-gradient-to-r from-green-600 to-green-500 rounded-xl p-4 sm:p-6 lg:p-8 text-white">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">
              Income Management
            </h1>
            <p class="text-green-100 text-sm sm:text-base lg:text-lg mb-4 max-w-3xl leading-relaxed">
              Manage your household income sources and track monthly earnings with advanced analytics
            </p>
            <!-- 🚀 NEW: Enhanced header with filter summary -->
            <div v-if="analytics?.filter_applied" class="mt-2">
              <div class="inline-flex items-center px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                <Filter class="w-4 h-4 mr-2" />
                {{ analytics.filter_summary || 'Filters applied' }}
              </div>
            </div>
          </div>
          <div class="hidden sm:block">
            <div class="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <TrendingUp class="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Child Route Content -->
    <div class="income-content">
      <router-view 
        :loading="loading"
        :error="error"
        :analytics="analytics"
        :dashboard-metrics="dashboardMetrics"
        :filter-options="filterOptions"
        :period-info="periodInfo"
        @add-income="handleAddIncome"
        @refresh="handleRefresh"
        @filter-change="handleFilterChange"
        @export-data="handleExportData"
      />
    </div>

    <!-- Income Form Modal -->
    <IncomeForm 
      v-if="showIncomeForm"
      :is-open="showIncomeForm"
      :editing-source="editingSource"
      :mode="incomeFormMode"
      :income-types="incomeTypes"
      :form-state="incomeFormState"
      @close="closeIncomeForm"
      @submit="handleIncomeSubmit"
      @validation-change="handleValidationChange"
    />

    <!-- Ledger Entry Edit Modal -->
    <LedgerEntryModal
      :is-open="showLedgerModal"
      :entry="editingLedgerEntry"
      :loading="loading"
      :income-types="incomeTypes"
      @close="closeLedgerModal"
      @submit="handleLedgerSubmit"
    />

    <!-- 🚀 NEW: Enhanced error handling with retry options -->
    <div v-if="criticalError" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
        <div class="flex items-center mb-4">
          <AlertCircle class="w-6 h-6 text-red-500 mr-3" />
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Critical Error</h3>
        </div>
        <p class="text-gray-600 dark:text-gray-400 mb-4">{{ criticalError }}</p>
        <div class="flex space-x-3">
          <button 
            @click="handleRetry"
            class="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
          <button 
            @click="handleResetFilters"
            class="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AlertCircle, Filter, TrendingUp } from "lucide-vue-next"
import { computed, onMounted, provide, ref, watch } from "vue"

// Components
import { IncomeForm, LedgerEntryModal } from "../../components/income"

// Composables
import { useIncome } from "../../composables/useIncome"
import type {
	AddIncomeSourcePayload,
	CreateDirectLedgerEntryPayload,
	DeleteIncomeSourcePayload,
	FlattenedLedgerEntry,
	IncomeFilterOptions,
	IncomeFilters,
	IncomeFormState,
	IncomeFormUIData,
	IncomeSourceFormData,
	IncomeSourceRecord,
	LedgerEntryFormData,
	PeriodInfo,
	UpdateIncomeSourcePayload,
	UpdateLedgerEntryPayload,
} from "../../types/income"

// Initialize the income composable with enhanced methods
const {
	// State
	incomes,
	incomeTypes,
	analytics,
	dashboardMetrics,
	loading,
	error,

	// Computed values
	totalSources,
	totalIncome,
	recurringIncome,
	oneTimeIncome,
	filteredSources,
	filteredLedgerEntries,
	hasData,

	// Actions
	addIncomeSource,
	addDirectLedgerEntry,
	updateIncomeSource,
	deleteIncomeSource,
	updateLedgerEntry,
	deleteLedgerEntry,
	fetchDashboardMetrics,
	// 🚀 NEW: Enhanced analytics methods
	fetchIncomeAnalytics,
	fetchIncomeFilterOptions,
	fetchPeriodInfo,
	cleanupIncomeData,
	clearFilters,
	refreshData,
	initialize,
} = useIncome()

// 🚀 NEW: Enhanced local state
const showIncomeForm = ref(false)
const incomeFormMode = ref<"source" | "direct">("source")
const editingSource = ref<IncomeSourceRecord | null>(null)
const showLedgerModal = ref(false)
const editingLedgerEntry = ref<FlattenedLedgerEntry | null>(null)
const criticalError = ref<string | null>(null)

// 🚀 NEW: Enhanced form state management
const incomeFormState = ref<IncomeFormState>({
	mode: "source",
	data: {
		type: "",
		amount: 0,
		isRecurring: true,
		dateTime: new Date().toISOString().split("T")[0],
	},
	validation: {
		isValid: false,
		errors: {},
		warnings: {},
	},
	loading: false,
	error: null,
})

// 🚀 NEW: Enhanced data for child components
const filterOptions = ref<IncomeFilterOptions | null>(null)
const periodInfo = ref<PeriodInfo | null>(null)

// 🚀 NEW: Watch for critical errors
watch(error, (newError) => {
	if (
		newError &&
		(newError.includes("household profile") ||
			newError.includes("permission") ||
			newError.includes("session"))
	) {
		criticalError.value = newError
	}
})

// 🚀 NEW: Enhanced computed properties
const enhancedAnalytics = computed(() => {
	if (!analytics.value) return null
	return {
		...analytics.value,
		hasComparison: !!analytics.value.comparison_period,
		isFiltered: !!analytics.value.filter_applied,
	}
})

// Provide state and actions to child components
provide("incomeState", {
	incomes,
	incomeTypes,
	analytics: enhancedAnalytics,
	dashboardMetrics,
	loading,
	error,
	totalSources,
	totalIncome,
	recurringIncome,
	oneTimeIncome,
	filteredSources,
	filteredLedgerEntries,
	hasData,
	showIncomeForm,
	incomeFormMode,
	editingSource,
	showLedgerModal,
	editingLedgerEntry,
	incomeFormState,
	// 🚀 NEW: Enhanced state
	filterOptions,
	periodInfo,
	criticalError,
})

provide("incomeActions", {
	addIncomeSource,
	addDirectLedgerEntry,
	updateIncomeSource,
	deleteIncomeSource,
	updateLedgerEntry,
	deleteLedgerEntry,
	fetchDashboardMetrics,
	// 🚀 NEW: Enhanced analytics actions
	fetchIncomeAnalytics,
	fetchIncomeFilterOptions,
	fetchPeriodInfo,
	cleanupIncomeData,
	clearFilters,
	refreshData,
	initialize,
	openIncomeSourceForm: () => {
		editingSource.value = null
		incomeFormMode.value = "source"
		incomeFormState.value.mode = "source"
		showIncomeForm.value = true
	},
	openDirectIncomeForm: () => {
		editingSource.value = null
		incomeFormMode.value = "direct"
		incomeFormState.value.mode = "direct"
		showIncomeForm.value = true
	},
	closeIncomeForm: () => {
		showIncomeForm.value = false
		editingSource.value = null
		resetFormState()
	},
	editIncomeSource: (source: IncomeSourceRecord) => {
		editingSource.value = source
		incomeFormMode.value = "source"
		incomeFormState.value.mode = "edit"
		populateFormWithSource(source)
		showIncomeForm.value = true
	},
	editLedgerEntry: (entry: FlattenedLedgerEntry) => {
		editingLedgerEntry.value = entry
		showLedgerModal.value = true
	},
	closeLedgerModal: () => {
		showLedgerModal.value = false
		editingLedgerEntry.value = null
	},
})

// 🚀 NEW: Enhanced initialization
onMounted(async () => {
	try {
		// Initialize with analytics and enhanced data
		await initialize({
			withAnalytics: true,
			period: "this_month",
		})

		// Load filter options and period info in parallel
		await Promise.allSettled([loadFilterOptions(), loadPeriodInfo()])
	} catch (error: any) {
		console.error("Failed to initialize income layout:", error)
		criticalError.value = error.message || "Failed to initialize income data"
	}
})

// 🚀 NEW: Enhanced helper functions
const loadFilterOptions = async () => {
	try {
		filterOptions.value = await fetchIncomeFilterOptions({ useCache: true })
	} catch (error) {
		console.warn("Failed to load filter options:", error)
	}
}

const loadPeriodInfo = async () => {
	try {
		const currentFilters: IncomeFilters = { period: "this_month" }
		periodInfo.value = await fetchPeriodInfo(currentFilters, { useCache: true })
	} catch (error) {
		console.warn("Failed to load period info:", error)
	}
}

const resetFormState = () => {
	incomeFormState.value = {
		mode: "source",
		data: {
			type: "",
			amount: 0,
			isRecurring: true,
			dateTime: new Date().toISOString().split("T")[0],
		},
		validation: {
			isValid: false,
			errors: {},
			warnings: {},
		},
		loading: false,
		error: null,
	}
}

const populateFormWithSource = (source: IncomeSourceRecord) => {
	incomeFormState.value.data = {
		type: source.type,
		amount: source.income,
		isRecurring: true,
		dateTime: source.date_time,
		frequency: source.recur_frequency,
		stop_date: source.stop_date,
	}
}

// Event Handlers
const handleRefresh = async () => {
	try {
		criticalError.value = null
		// Force refresh bypassing cache with enhanced data
		await refreshData({
			withAnalytics: true,
			withDashboard: true,
			useCache: false,
		})

		// Reload enhanced data
		await Promise.allSettled([loadFilterOptions(), loadPeriodInfo()])
	} catch (error: any) {
		console.error("Failed to refresh income data:", error)
		criticalError.value = error.message || "Failed to refresh data"
	}
}

const handleAddIncome = () => {
	editingSource.value = null
	incomeFormMode.value = "source"
	incomeFormState.value.mode = "source"
	showIncomeForm.value = true
}

const closeIncomeForm = () => {
	showIncomeForm.value = false
	editingSource.value = null
	resetFormState()
}

// 🚀 NEW: Enhanced event handlers
const handleFilterChange = async (filters: IncomeFilters) => {
	try {
		// Apply filters and refresh analytics
		await fetchIncomeAnalytics(filters, { useCache: true })

		// Update period info if period changed
		if (filters.period) {
			await loadPeriodInfo()
		}
	} catch (error: any) {
		console.error("Failed to apply filters:", error)
	}
}

const handleValidationChange = (
	isValid: boolean,
	errors: Record<string, string>,
) => {
	incomeFormState.value.validation.isValid = isValid
	incomeFormState.value.validation.errors = errors
}

const handleExportData = async (format: "csv" | "excel" | "pdf") => {
	try {
		// This would implement data export functionality
		console.log(`Exporting data in ${format} format`)
		// TODO: Implement actual export functionality
	} catch (error: any) {
		console.error("Failed to export data:", error)
	}
}

const handleRetry = async () => {
	criticalError.value = null
	await handleRefresh()
}

const handleResetFilters = async () => {
	try {
		criticalError.value = null
		clearFilters()
		await refreshData({
			withAnalytics: true,
			useCache: false,
		})
	} catch (error: any) {
		console.error("Failed to reset filters:", error)
		criticalError.value = error.message || "Failed to reset filters"
	}
}

const closeLedgerModal = () => {
	showLedgerModal.value = false
	editingLedgerEntry.value = null
}

const handleIncomeSubmit = async (formData: IncomeFormUIData) => {
	try {
		// Validate form data first
		if (!formData.type || !formData.amount || formData.amount <= 0) {
			throw new Error("Please fill in all required fields with valid values")
		}

		if (incomeFormMode.value === "source") {
			// Source mode: Always create/update recurring income sources
			const sourceData: IncomeSourceFormData = {
				type: formData.type,
				income: formData.amount,
				recur: true, // Always true for income sources
				date_time: formData.dateTime,
				recur_frequency: formData.frequency as
					| "daily"
					| "weekly"
					| "bi-weekly"
					| "monthly"
					| "quarterly"
					| "semi-annually"
					| "annually"
					| "yearly",
				stop_date: formData.stop_date,
			}

			if (editingSource.value) {
				// For updates, we need the income record name
				const mainIncomeRecord = incomes.value[0]
				if (!mainIncomeRecord) {
					throw new Error(
						"Cannot update income source: No income record found. Please refresh the page and try again.",
					)
				}

				const payload: UpdateIncomeSourcePayload = {
					income_source: [sourceData],
					income_name: mainIncomeRecord.name,
					source_name: editingSource.value.name || "",
				}
				await updateIncomeSource(payload)
			} else {
				// For new sources, the backend will create the Income record automatically
				const payload: AddIncomeSourcePayload = {
					income_source: [sourceData],
					// income_name is optional - backend will find/create by household profile
				}
				await addIncomeSource(payload)
			}
		} else {
			// Direct mode: Always create one-time ledger entries
			// This doesn't require an existing Income record - backend handles it
			const directLedgerPayload: CreateDirectLedgerEntryPayload = {
				income_type: formData.type,
				amount: formData.amount,
				date_time: formData.dateTime,
				description: `One-time ${formData.type} income`,
			}
			await addDirectLedgerEntry(directLedgerPayload)
		}

		closeIncomeForm()

		// Refresh data after successful submission
		await refreshData({ withAnalytics: true, useCache: false })
	} catch (error: any) {
		console.error("Failed to save income:", error)

		// Provide more specific error messages
		let errorMessage = "Failed to save income. Please try again."

		if (error.message) {
			if (error.message.includes("household profile")) {
				errorMessage =
					"Please create a household profile first before adding income sources."
			} else if (error.message.includes("required")) {
				errorMessage = "Please fill in all required fields."
			} else if (error.message.includes("validation")) {
				errorMessage = "Please check your input values and try again."
			} else {
				errorMessage = `Failed to save income: ${error.message}`
			}
		}

		alert(errorMessage)
		throw error
	}
}

const handleLedgerSubmit = async (
	formData: LedgerEntryFormData,
	entryName: string,
) => {
	try {
		const payload: UpdateLedgerEntryPayload = {
			ledger_entry_name: entryName,
			new_amount: formData.amount,
			new_date: new Date(formData.date).toISOString(),
			new_type: formData.income_type,
		}

		await updateLedgerEntry(payload)
		closeLedgerModal()
	} catch (error) {
		console.error("Failed to update ledger entry:", error)
		alert("Failed to update ledger entry. Please try again.")
	}
}
</script>

<style scoped>
.income-layout {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8;
}
</style> 