/**
* Income Management Page - Enhanced with Comprehensive Filter System
* Uses new architecture with proper error handling, cache management, and advanced analytics
*/

<template>
	<div class="income-management space-y-3 sm:space-y-4 lg:space-y-6 p-3 sm:p-4 lg:p-0">

		<!-- Top Controls -->
		<div class="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/20 border p-3 sm:p-4 lg:p-6">
			<div
				class="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 gap-0 sm:gap-4">
				<!-- Add Income Buttons -->
				<div class="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
					<button v-if="currentView === 'sources'" @click="openIncomeSourceForm" :disabled="loading"
						class="inline-flex items-center justify-center px-3 sm:px-4 py-2.5 bg-blue-600 text-white rounded-lg shadow-sm text-xs sm:text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors w-full sm:w-auto min-h-[44px] touch-manipulation">
						<Plus class="w-4 h-4 mr-2" />
						Add Income Source
					</button>
					<button v-if="currentView === 'ledger'" @click="openDirectIncomeForm" :disabled="loading"
						class="inline-flex items-center justify-center px-3 sm:px-4 py-2.5 bg-blue-600 text-white rounded-lg shadow-sm text-xs sm:text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors w-full sm:w-auto min-h-[44px] touch-manipulation">
						<Plus class="w-4 h-4 mr-2" />
						Add Income
					</button>
					<button @click="handleRefresh" :disabled="loading"
						class="inline-flex items-center justify-center px-3 sm:px-4 py-2.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs sm:text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full sm:w-auto min-h-[44px] touch-manipulation">
						<RefreshCw class="w-4 h-4 mr-2" />
						Refresh
					</button>
					<!-- 🚀 NEW: Enhanced actions -->
					<button v-if="analytics?.filter_applied" @click="clearFilters"
						class="inline-flex items-center px-4 py-2 border border-orange-300 dark:border-orange-600 shadow-sm text-sm font-medium rounded-lg text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors w-full sm:w-auto">
						<X class="w-4 h-4 mr-2" />
						Clear Filters
					</button>
				</div>

				<!-- View Toggle -->
				<div
					class="flex rounded-lg border border-gray-200 dark:border-gray-600 p-1 bg-gray-50 dark:bg-gray-700 w-full sm:w-auto">
					<button @click="currentView = 'sources'" :class="[
						'flex-1 sm:flex-none px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors min-h-[40px] touch-manipulation',
						currentView === 'sources'
							? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
							: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
					]">
						<span class="hidden sm:inline">Sources ({{ totalSources || 0 }})</span>
						<span class="sm:hidden">Sources</span>
					</button>
					<button @click="switchToLedgerView" :class="[
						'flex-1 sm:flex-none px-3 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors min-h-[40px] touch-manipulation',
						currentView === 'ledger'
							? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm'
							: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
					]">
						<span class="hidden sm:inline">Ledger ({{ filteredLedgerEntries?.length || 0 }})</span>
						<span class="sm:hidden">Ledger</span>
					</button>
				</div>
			</div>
		</div>

		<!-- 🚀 ENHANCED: Summary Cards with reliable data sources (matching Reports.vue pattern) -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
			<div class="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/20 border p-3 sm:p-4">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<div
							class="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
							<DollarSign class="w-4 h-4 text-green-600 dark:text-green-400" />
						</div>
					</div>
					<div class="ml-3">
						<p class="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Total Income</p>
						<p class="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">₹{{
							formatCurrency(totalIncome || 0) }}</p>
						<p class="text-xs text-gray-500 dark:text-gray-400">
							{{ totalSources || 0 }} sources
						</p>
					</div>
				</div>
			</div>

			<div class="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/20 border p-3 sm:p-4">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<div
							class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
							<Repeat class="w-4 h-4 text-blue-600 dark:text-blue-400" />
						</div>
					</div>
					<div class="ml-3">
						<p class="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Recurring Income</p>
						<p class="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">₹{{
							formatCurrency(recurringIncome || 0) }}</p>
						<p class="text-xs text-gray-500 dark:text-gray-400">
							{{ recurringPercentage }}% of total
						</p>
					</div>
				</div>
			</div>

			<div class="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/20 border p-3 sm:p-4">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<div
							class="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
							<Calendar class="w-4 h-4 text-purple-600 dark:text-purple-400" />
						</div>
					</div>
					<div class="ml-3">
						<p class="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">One-time Income</p>
						<p class="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">₹{{
							formatCurrency(oneTimeIncome || 0) }}</p>
						<p class="text-xs text-gray-500 dark:text-gray-400">
							{{ formatPeriod(currentPeriod) }}
						</p>
					</div>
				</div>
			</div>

			<div class="bg-white dark:bg-gray-800 rounded-lg shadow dark:shadow-gray-900/20 border p-3 sm:p-4">
				<div class="flex items-center">
					<div class="flex-shrink-0">
						<div
							class="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
							<Hash class="w-4 h-4 text-orange-600 dark:text-orange-400" />
						</div>
					</div>
					<div class="ml-3">
						<p class="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400">Income Sources</p>
						<p class="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">{{ totalSources
							|| 0 }}
						</p>
						<p class="text-xs text-gray-500 dark:text-gray-400">
							Active sources
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- 🚀 NEW: Enhanced Filter Section -->
		<IncomeFilter v-if="currentView === 'ledger'" :total-count="getTotalCount()"
			:filtered-count="getFilteredCount()" :income-types="incomeTypes" :current-view="currentView"
			:filter-options="filterOptions" :current-filters="currentFilters" @filter-change="handleFilterChange"
			@clear-filters="clearFilters" />

		<!-- 🚀 NEW: Period Information Display -->
		<div v-if="periodInfo && analytics?.filter_applied"
			class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
			<div class="flex items-center">
				<Info class="w-5 h-5 text-blue-500 mr-3" />
				<div>
					<h4 class="text-sm font-medium text-blue-900 dark:text-blue-100">
						{{ periodInfo.period_name }}
					</h4>
					<p class="text-sm text-blue-700 dark:text-blue-300">
						{{ formatDate(periodInfo.start_date) }} - {{ formatDate(periodInfo.end_date) }}
						({{ periodInfo.days_count }} days)
					</p>
				</div>
			</div>
		</div>

		<!-- Loading State -->
		<div v-if="loading" class="flex items-center justify-center py-12">
			<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
			<p class="text-gray-600 dark:text-gray-400 ml-3">Loading income data...</p>
		</div>

		<!-- Error State -->
		<div v-else-if="error"
			class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<AlertCircle class="h-5 w-5 text-red-400" />
				</div>
				<div class="ml-3">
					<h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error Loading Income Data</h3>
					<p class="text-sm text-red-700 dark:text-red-300 mt-1">{{ error }}</p>
				</div>
			</div>
			<div class="mt-4">
				<button @click="handleRefresh"
					class="bg-red-100 dark:bg-red-900/30 hover:bg-red-200 text-red-800 dark:text-red-200 px-3 py-1 rounded text-sm transition-colors">
					Try Again
				</button>
			</div>
		</div>

		<!-- Content Section -->
		<div v-else class="income-content">
			<!-- Sources View -->
			<IncomeSources v-if="currentView === 'sources'" :sources="filteredSources"
				:total-count="filteredSources?.length || 0" :monthly-total="analytics?.monthly_recurring_income || 0"
				:selected-items="selectedItems" :loading="loading" :analytics="analytics"
				@add-source="openIncomeSourceForm" @edit-source="editIncomeSource"
				@delete-source="deleteIncomeSourceHandler" @source-selection="handleSourceSelection"
				@toggle-select-all="toggleSelectAll" @clear-filters="clearFilters" @export-data="handleExportData" />

			<!-- Ledger View -->
			<IncomeLedger v-if="currentView === 'ledger'" :entries="filteredLedgerEntries"
				:total-count="filteredLedgerEntries?.length || 0" :total-amount="getLedgerTotalAmount()"
				:selected-items="selectedLedgerItems" :loading="loading" :analytics="analytics"
				:period-info="periodInfo" @add-source="openDirectIncomeForm" @edit-entry="editLedgerEntry"
				@delete-entry="deleteLedgerEntryHandler" @ledger-selection="handleLedgerSelection"
				@toggle-select-all="toggleSelectAllLedger" @export-data="handleExportData" />
		</div>

		<!-- Modals -->
		<IncomeForm v-if="showIncomeForm" :is-open="showIncomeForm" :editing-source="editingSource"
			:mode="incomeFormMode" :income-types="incomeTypes" :form-state="incomeFormState" @close="closeIncomeForm"
			@submit="handleIncomeSubmit" @validation-change="handleValidationChange" />

		<!-- Ledger Entry Edit Modal -->
		<LedgerEntryModal :is-open="showLedgerModal" :entry="editingLedgerEntry" :loading="loading"
			:income-types="incomeTypes" @close="closeLedgerModal" @submit="handleLedgerSubmit" />

		<!-- Household Profile Creator -->
		<HouseholdProfileCreator v-if="showHouseholdProfileCreator" :is-open="showHouseholdProfileCreator"
			@close="closeHouseholdProfileCreator" @success="handleProfileCreated" />
	</div>
</template>

<script setup lang="ts">
import {
	AlertCircle,
	Calendar,
	DollarSign,
	Hash,
	Info,
	Plus,
	RefreshCw,
	Repeat,
	X,
} from "lucide-vue-next"
import { type Ref, computed, inject, onMounted, ref, watch } from "vue"

// Components
import {
	IncomeFilter,
	IncomeForm,
	IncomeLedger,
	IncomeSources,
	LedgerEntryModal,
} from "../../components/income"
import HouseholdProfileCreator from "../../components/profile/HouseholdProfileCreator.vue"

// Types
import type {
	AddIncomeSourcePayload,
	CreateDirectLedgerEntryPayload,
	DeleteIncomeSourcePayload,
	FlattenedLedgerEntry,
	IncomeAnalytics,
	IncomeDashboardMetrics,
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

// Import the useIncome composable directly for reliable data access
import { useIncome } from "../../composables/useIncome"

// Use income composable directly for data access
const income = useIncome({ autoInitialize: false })
const {
	incomes,
	incomeTypes,
	analytics,
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
} = income

// 🚀 NEW: Inject enhanced state and actions from IncomeLayout for UI state
const incomeState = inject<any>("incomeState")
const incomeActions = inject<any>("incomeActions")

// Destructure UI state and actions only
const {
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
} = incomeState || {}

// Destructure actions
const {
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
	openIncomeSourceForm,
	openDirectIncomeForm,
	closeIncomeForm,
	editIncomeSource,
	editLedgerEntry,
	closeLedgerModal,
} = incomeActions || {}

// 🚀 NEW: Enhanced local state
const currentView = ref<"sources" | "ledger">("sources")
const selectedItems = ref<string[]>([])
const selectedLedgerItems = ref<string[]>([])
const showHouseholdProfileCreator = ref(false)
const currentFilters = ref<IncomeFilters>({ period: "this_month" })

// 🚀 NEW: Default period matching Reports.vue
const currentPeriod = ref<
	"this_month" | "last_month" | "last_3_months" | "last_6_months" | "this_year"
>("this_month")

// 🚀 NEW: Enhanced computed properties
const enhancedFilterOptions = computed<IncomeFilterOptions | null>(() => {
	return filterOptions?.value || null
})

const enhancedPeriodInfo = computed<PeriodInfo | null>(() => {
	return periodInfo?.value || null
})

// 🚀 NEW: Enhanced computed properties matching Reports.vue pattern
const recurringPercentage = computed(() => {
	if (!totalIncome.value || totalIncome.value === 0) return 0
	if (!recurringIncome.value) return 0
	return ((recurringIncome.value / totalIncome.value) * 100).toFixed(1)
})

// 🚀 NEW: Enhanced helper functions
const getTotalCount = () => {
	return currentView.value === "sources"
		? filteredSources?.value?.length || 0
		: filteredLedgerEntries?.value?.length || 0
}

const getFilteredCount = () => {
	return currentView.value === "sources"
		? filteredSources?.value?.length || 0
		: filteredLedgerEntries?.value?.length || 0
}

const getLedgerTotalAmount = () => {
	return (
		filteredLedgerEntries?.value?.reduce(
			(sum, entry) => sum + Number(entry.amount || 0),
			0,
		) || 0
	)
}

// 🚀 NEW: Utility functions matching Reports.vue
const formatCurrency = (amount: number) => {
	return new Intl.NumberFormat("en-IN").format(amount)
}

const formatDate = (dateString: string) => {
	if (!dateString) return "N/A"
	try {
		return new Date(dateString).toLocaleDateString("en-IN", {
			year: "numeric",
			month: "short",
			day: "numeric",
		})
	} catch {
		return "N/A"
	}
}

const formatPeriod = (period: string) => {
	const map = {
		this_month: "This Month",
		last_month: "Last Month",
		last_3_months: "Last 3 Months",
		last_6_months: "Last 6 Months",
		this_year: "This Year",
	}
	return map[period] || period
}

const getHealthScoreClass = (score: number) => {
	if (score >= 0.8) return "bg-green-100 text-green-800"
	if (score >= 0.6) return "bg-yellow-100 text-yellow-800"
	return "bg-red-100 text-red-800"
}

// View switching
const switchToLedgerView = () => {
	currentView.value = "ledger"
	// Ledger entries are automatically available from the main API call
}

// Selection handlers
const handleSourceSelection = (
	source: IncomeSourceRecord,
	selected: boolean,
) => {
	const sourceId = source.name || source.type
	if (selected) {
		if (!selectedItems.value.includes(sourceId)) {
			selectedItems.value.push(sourceId)
		}
	} else {
		const index = selectedItems.value.indexOf(sourceId)
		if (index > -1) {
			selectedItems.value.splice(index, 1)
		}
	}
}

const handleLedgerSelection = (
	entry: FlattenedLedgerEntry,
	selected: boolean,
) => {
	if (selected) {
		if (!selectedLedgerItems.value.includes(entry.name)) {
			selectedLedgerItems.value.push(entry.name)
		}
	} else {
		const index = selectedLedgerItems.value.indexOf(entry.name)
		if (index > -1) {
			selectedLedgerItems.value.splice(index, 1)
		}
	}
}

// Toggle select all functionality
const toggleSelectAll = (selected: boolean) => {
	if (selected) {
		selectedItems.value =
			filteredSources?.value?.map((source) => source.name || source.type) || []
	} else {
		selectedItems.value = []
	}
}

const toggleSelectAllLedger = (selected: boolean) => {
	if (selected) {
		selectedLedgerItems.value =
			filteredLedgerEntries?.value?.map((entry) => entry.name) || []
	} else {
		selectedLedgerItems.value = []
	}
}

// Ledger management
const deleteLedgerEntryHandler = async (entry: FlattenedLedgerEntry) => {
	if (
		confirm(
			`Are you sure you want to delete this ${entry.source_type} entry (₹${entry.amount?.toLocaleString("en-IN")})?`,
		)
	) {
		try {
			const result = await deleteLedgerEntry({ ledger_entry_name: entry.name })

			// Show success message
			if (result.message?.includes("already deleted")) {
				// Entry was already deleted, refresh data to show current state
				await refreshData({ withAnalytics: true, useCache: false })
			}
		} catch (error) {
			console.error("Failed to delete ledger entry:", error)
			alert("Failed to delete ledger entry. Please try again.")
		}
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

// 🚀 NEW: Enhanced event handlers
const handleRefresh = async () => {
	// Only force refresh when user explicitly clicks refresh button
	await refreshData({
		withAnalytics: true,
		withDashboard: true,
		useCache: false,
	})
}

const handleFilterChange = async (filters: IncomeFilters) => {
	try {
		currentFilters.value = filters
		// Apply filters and refresh analytics
		await fetchIncomeAnalytics(filters, { useCache: true })
	} catch (error: any) {
		console.error("Failed to apply filters:", error)
	}
}

const handleValidationChange = (
	isValid: boolean,
	errors: Record<string, string>,
) => {
	if (incomeFormState?.value) {
		incomeFormState.value.validation.isValid = isValid
		incomeFormState.value.validation.errors = errors
	}
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

const handleIncomeSubmit = async (formData: IncomeFormUIData) => {
	try {
		// First check if we have a household profile
		if (!incomes?.value || incomes.value.length === 0) {
			// Try to initialize and fetch income data first
			await initialize({ withAnalytics: true, forceRefresh: true })

			// If still no income data, check if it's because there's no household profile
			if (!incomes?.value || incomes.value.length === 0) {
				// For direct ledger entries, we can proceed without an income record
				// For source operations, we need to check if household profile exists
				if (incomeFormMode?.value === "source") {
					// Check if household profile exists by trying to create a source
					// The backend will create the Income record automatically if household profile exists
					// If no household profile, the backend will throw an error
				}
				// For direct mode, we can proceed - the backend will handle household profile check
			}
		}

		// Validate form data
		if (!formData.type || !formData.amount || formData.amount <= 0) {
			throw new Error("Please fill in all required fields with valid values")
		}

		if (incomeFormMode?.value === "source") {
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

			if (editingSource?.value) {
				// For updates, we need the income record name
				const mainIncomeRecord = incomes?.value?.[0]
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
				// We don't need to pass income_name - the backend will handle it
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
				// Show household profile creator for this specific error
				showHouseholdProfileCreator.value = true
				return
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

const deleteIncomeSourceHandler = async (source: IncomeSourceRecord) => {
	if (
		confirm(
			`Are you sure you want to delete the ${source.type} income source (₹${source.income.toLocaleString("en-IN")})?`,
		)
	) {
		try {
			const mainIncomeRecord = incomes?.value?.[0]
			if (!mainIncomeRecord) {
				throw new Error("No income record found for household")
			}

			const payload: DeleteIncomeSourcePayload = {
				income_source: [],
				income_name: mainIncomeRecord.name,
				action: "delete",
				source_name: source.name || "",
			}
			await deleteIncomeSource(payload)
		} catch (error) {
			console.error("Failed to delete income source:", error)
			alert("Failed to delete income source. Please try again.")
		}
	}
}

// Watch for view changes to clear selections
watch(currentView, () => {
	selectedItems.value = []
	selectedLedgerItems.value = []
})

// 🚀 NEW: Enhanced lifecycle management matching Reports.vue
onMounted(async () => {
	try {
		// Set default period and filters
		currentPeriod.value = "this_month"
		currentFilters.value = { period: "this_month" }

		// Initialize with analytics and set default period like Reports.vue
		await initialize({
			withAnalytics: true,
			forceRefresh: false,
			period: "this_month",
		})
	} catch (error) {
		console.error("Income: Failed to initialize:", error)
	}
})

// Household Profile Creator handlers
const closeHouseholdProfileCreator = () => {
	showHouseholdProfileCreator.value = false
}

const handleProfileCreated = async (profileData: any) => {
	showHouseholdProfileCreator.value = false
	// Refresh data now that we have a profile
	try {
		await initialize({
			withAnalytics: true,
			forceRefresh: true,
			period: "this_month",
		})
		await fetchDashboardMetrics("this_month", { useCache: false })
	} catch (error) {
		console.error("Failed to initialize after profile creation:", error)
	}
}
</script>

<style scoped>
/* Styles are now handled by IncomeLayout.vue */
</style>