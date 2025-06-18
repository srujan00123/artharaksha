/**
 * Income Store - Robust & Redundancy-Free
 * Centralized state management for income data with clean separation of concerns
 * Follows the new backend API structure exactly
 */

import { defineStore } from "pinia"
import { computed, ref } from "vue"
import { incomeService } from "../services/income-service"
import type {
	AddIncomeSourcePayload,
	CreateDirectLedgerEntryPayload,
	CreateLedgerEntryPayload,
	DeleteIncomeSourcePayload,
	DeleteLedgerEntryPayload,
	FlattenedLedgerEntry,
	GetIncomeInsightsResponse,
	GetMonthlyIncomeSummaryResponse,
	IncomeAnalytics,
	IncomeDashboardMetrics,
	IncomeFilters,
	IncomeRecord,
	IncomeServiceOptions,
	IncomeSourceRecord,
	IncomeTypeRecord,
	LedgerFilters,
	UpdateIncomeSourcePayload,
	UpdateLedgerEntryPayload,
} from "../types/income"
import { safeArray } from "../types/income"

// Default filters
const defaultFilters: IncomeFilters = {
	dateFrom: "",
	dateTo: "",
	period: "this_month",
	type: "",
	isRecurring: undefined,
	amountMin: undefined,
	amountMax: undefined,
	searchTerm: "",
	sortBy: "date",
	sortOrder: "desc",
}

export const useIncomeStore = defineStore("income", () => {
	// State
	const incomes = ref<IncomeRecord[]>([])
	const incomeTypes = ref<IncomeTypeRecord[]>([])
	const recurringSources = ref<IncomeSourceRecord[]>([])
	const ledgerEntries = ref<FlattenedLedgerEntry[]>([])
	const analytics = ref<IncomeAnalytics | null>(null)
	const dashboardMetrics = ref<IncomeDashboardMetrics | null>(null)
	const monthlyIncomeSummary = ref<GetMonthlyIncomeSummaryResponse | null>(null)
	const incomeInsights = ref<GetIncomeInsightsResponse | null>(null)
	const loading = ref(false)
	const error = ref<string | null>(null)
	const filters = ref<IncomeFilters>({ ...defaultFilters })
	const ledgerFilters = ref<LedgerFilters>({})
	const lastFetch = ref<number | null>(null)
	const cacheExpiry = ref(5 * 60 * 1000) // 5 minutes

	// Computed properties
	const hasData = computed(
		() => recurringSources.value.length > 0 || ledgerEntries.value.length > 0,
	)

	const isCacheValid = computed(() => {
		if (!lastFetch.value) return false
		return Date.now() - lastFetch.value < cacheExpiry.value
	})

	const totalIncome = computed(() => analytics.value?.total_income || 0)

	const totalSources = computed(() => recurringSources.value.length)

	const allSources = computed(() => recurringSources.value)

	const recurringIncome = computed(() => analytics.value?.recurring_income || 0)

	const oneTimeIncome = computed(() => analytics.value?.one_time_income || 0)

	const recentSources = computed(() =>
		recurringSources.value
			.slice()
			.sort(
				(a, b) =>
					new Date(b.date_time).getTime() - new Date(a.date_time).getTime(),
			)
			.slice(0, 5),
	)

	const topIncomeTypes = computed(() => {
		if (!analytics.value?.income_by_type) return []

		return Object.entries(analytics.value.income_by_type)
			.map(([type, amount]) => ({ type, amount: Number(amount) }))
			.sort((a, b) => b.amount - a.amount)
			.slice(0, 5)
	})

	const incomeByType = computed(() => analytics.value?.income_by_type || {})

	// Actions
	async function fetchIncome(options: IncomeServiceOptions = {}) {
		if (loading.value) return

		try {
			loading.value = true
			error.value = null

			const { forceRefresh = false, useCache = true } = options

			// Let the service handle caching - don't duplicate cache logic here
			const data = await incomeService.getUserIncome({
				...options,
				filters: filters.value,
				useCache: useCache && !forceRefresh,
				forceRefresh,
			})

			incomes.value = data
			lastFetch.value = Date.now()
		} catch (err: any) {
			error.value = err.message || "Failed to fetch income data"
			console.error("Error fetching income:", err)
		} finally {
			loading.value = false
		}
	}

	async function fetchIncomeWithAnalytics(options: IncomeServiceOptions = {}) {
		if (loading.value) return

		try {
			loading.value = true
			error.value = null

			const { forceRefresh = false, useCache = true } = options

			// Let the service handle caching - don't duplicate cache logic here
			const data = await incomeService.getUserIncomeWithAnalytics({
				...options,
				filters: filters.value,
				useCache: useCache && !forceRefresh,
				forceRefresh,
			})

			incomes.value = data.incomes
			recurringSources.value = data.recurringSources
			ledgerEntries.value = data.ledgerEntries
			analytics.value = data.analytics

			lastFetch.value = Date.now()
		} catch (err: any) {
			error.value = err.message || "Failed to fetch income analytics"
			console.error("Error fetching income analytics:", err)
		} finally {
			loading.value = false
		}
	}

	async function fetchIncomeLedger(
		filters?: LedgerFilters,
		options: IncomeServiceOptions = {},
	) {
		if (loading.value) return

		try {
			loading.value = true
			error.value = null

			const data = await incomeService.getIncomeLedger(filters, options)
			ledgerEntries.value = data
		} catch (err: any) {
			error.value = err.message || "Failed to fetch income ledger"
			console.error("Error fetching income ledger:", err)
		} finally {
			loading.value = false
		}
	}

	async function fetchIncomeTypes(options: IncomeServiceOptions = {}) {
		try {
			const data = await incomeService.getIncomeTypes(options)
			incomeTypes.value = data
		} catch (err: any) {
			error.value = err.message || "Failed to fetch income types"
			console.error("Error fetching income types:", err)
		}
	}

	async function fetchMonthlyIncomeSummary(options: IncomeServiceOptions = {}) {
		try {
			const data = await incomeService.getMonthlyIncomeSummary(options)
			monthlyIncomeSummary.value = data
		} catch (err: any) {
			error.value = err.message || "Failed to fetch monthly income summary"
			console.error("Error fetching monthly income summary:", err)
		}
	}

	async function fetchIncomeInsights(options: IncomeServiceOptions = {}) {
		try {
			const data = await incomeService.getIncomeInsights(options)
			incomeInsights.value = data
		} catch (err: any) {
			error.value = err.message || "Failed to fetch income insights"
			console.error("Error fetching income insights:", err)
		}
	}

	async function fetchDashboardMetrics(
		period = "this_month",
		options: IncomeServiceOptions = {},
	) {
		try {
			const data = await incomeService.getDashboardMetrics(period, options)
			dashboardMetrics.value = data
		} catch (err: any) {
			error.value = err.message || "Failed to fetch dashboard metrics"
			console.error("Error fetching dashboard metrics:", err)
		}
	}

	// 🚀 NEW: Enhanced analytics and filter methods
	async function fetchIncomeAnalytics(
		filters?: IncomeFilters,
		options: IncomeServiceOptions = {},
	) {
		try {
			const data = await incomeService.getIncomeAnalytics(filters, options)
			analytics.value = data
		} catch (err: any) {
			error.value = err.message || "Failed to fetch income analytics"
			console.error("Error fetching income analytics:", err)
		}
	}

	async function fetchIncomeFilterOptions(options: IncomeServiceOptions = {}) {
		try {
			return await incomeService.getIncomeFilterOptions(options)
		} catch (err: any) {
			error.value = err.message || "Failed to fetch filter options"
			console.error("Error fetching filter options:", err)
			return null
		}
	}

	async function fetchPeriodInfo(
		filters?: IncomeFilters,
		options: IncomeServiceOptions = {},
	) {
		try {
			return await incomeService.getPeriodInfo(filters, options)
		} catch (err: any) {
			error.value = err.message || "Failed to fetch period info"
			console.error("Error fetching period info:", err)
			return null
		}
	}

	async function cleanupIncomeData() {
		try {
			loading.value = true
			error.value = null

			const result = await incomeService.cleanupIncomeData()

			// Refresh data after cleanup
			await fetchIncomeWithAnalytics({ forceRefresh: true })

			return result
		} catch (err: any) {
			error.value = err.message || "Failed to cleanup income data"
			console.error("Error cleaning up income data:", err)
			throw err
		} finally {
			loading.value = false
		}
	}

	async function addIncomeSource(payload: AddIncomeSourcePayload) {
		try {
			loading.value = true
			error.value = null

			await incomeService.createOrUpdateIncome(payload)
			await fetchIncomeWithAnalytics({ forceRefresh: true })
		} catch (err: any) {
			error.value = err.message || "Failed to add income source"
			console.error("Error adding income source:", err)
			throw err
		} finally {
			loading.value = false
		}
	}

	async function addDirectLedgerEntry(payload: CreateDirectLedgerEntryPayload) {
		try {
			loading.value = true
			error.value = null

			await incomeService.createDirectLedgerEntry(payload)
			await fetchIncomeWithAnalytics({ forceRefresh: true })
		} catch (err: any) {
			error.value = err.message || "Failed to add direct ledger entry"
			console.error("Error adding direct ledger entry:", err)
			throw err
		} finally {
			loading.value = false
		}
	}

	async function updateIncomeSource(payload: UpdateIncomeSourcePayload) {
		try {
			loading.value = true
			error.value = null

			await incomeService.createOrUpdateIncome(payload)
			await fetchIncomeWithAnalytics({ forceRefresh: true })
		} catch (err: any) {
			error.value = err.message || "Failed to update income source"
			console.error("Error updating income source:", err)
			throw err
		} finally {
			loading.value = false
		}
	}

	async function deleteIncome(incomeId: string) {
		try {
			loading.value = true
			error.value = null

			await incomeService.deleteIncome(incomeId)
			await fetchIncomeWithAnalytics({ forceRefresh: true })
		} catch (err: any) {
			error.value = err.message || "Failed to delete income"
			console.error("Error deleting income:", err)
			throw err
		} finally {
			loading.value = false
		}
	}

	async function deleteIncomeSource(payload: DeleteIncomeSourcePayload) {
		try {
			loading.value = true
			error.value = null

			await incomeService.createOrUpdateIncome(payload)
			await fetchIncomeWithAnalytics({ forceRefresh: true })
		} catch (err: any) {
			error.value = err.message || "Failed to delete income source"
			console.error("Error deleting income source:", err)
			throw err
		} finally {
			loading.value = false
		}
	}

	async function updateRecurringLedgerEntries() {
		try {
			const result = await incomeService.updateRecurringLedgerEntries()
			await fetchIncomeWithAnalytics({ forceRefresh: true })
			return result
		} catch (err: any) {
			error.value = err.message || "Failed to update recurring ledger entries"
			console.error("Error updating recurring ledger entries:", err)
			throw err
		}
	}

	async function updateLedgerEntry(payload: UpdateLedgerEntryPayload) {
		try {
			const result = await incomeService.updateLedgerEntry(payload)
			await fetchIncomeWithAnalytics({ forceRefresh: true })
			return result
		} catch (err: any) {
			error.value = err.message || "Failed to update ledger entry"
			console.error("Error updating ledger entry:", err)
			throw err
		}
	}

	async function deleteLedgerEntry(payload: DeleteLedgerEntryPayload) {
		try {
			const result = await incomeService.deleteLedgerEntry(payload)
			await fetchIncomeWithAnalytics({ forceRefresh: true })
			return result
		} catch (err: any) {
			error.value = err.message || "Failed to delete ledger entry"
			console.error("Error deleting ledger entry:", err)
			throw err
		}
	}

	async function createLedgerEntry(payload: CreateLedgerEntryPayload) {
		try {
			const result = await incomeService.createLedgerEntry(payload)
			await fetchIncomeWithAnalytics({ forceRefresh: true })
			return result
		} catch (err: any) {
			error.value = err.message || "Failed to create ledger entry"
			console.error("Error creating ledger entry:", err)
			throw err
		}
	}

	function updateFilters(newFilters: Partial<IncomeFilters>) {
		filters.value = { ...filters.value, ...newFilters }
	}

	function updateLedgerFilters(newFilters: Partial<LedgerFilters>) {
		ledgerFilters.value = { ...ledgerFilters.value, ...newFilters }
	}

	function clearFilters() {
		filters.value = { ...defaultFilters }
	}

	function clearLedgerFilters() {
		ledgerFilters.value = {}
	}

	function clearError() {
		error.value = null
	}

	function clearCache() {
		incomes.value = []
		recurringSources.value = []
		ledgerEntries.value = []
		analytics.value = null
		dashboardMetrics.value = null
		monthlyIncomeSummary.value = null
		incomeInsights.value = null
		lastFetch.value = null
		incomeService.clearCache()
	}

	function $reset() {
		incomes.value = []
		incomeTypes.value = []
		recurringSources.value = []
		ledgerEntries.value = []
		analytics.value = null
		dashboardMetrics.value = null
		monthlyIncomeSummary.value = null
		incomeInsights.value = null
		loading.value = false
		error.value = null
		filters.value = { ...defaultFilters }
		ledgerFilters.value = {}
		lastFetch.value = null
	}

	return {
		// State
		incomes,
		incomeTypes,
		recurringSources,
		ledgerEntries,
		analytics,
		dashboardMetrics,
		monthlyIncomeSummary,
		incomeInsights,
		loading,
		error,
		filters,
		ledgerFilters,
		lastFetch,
		cacheExpiry,

		// Computed
		hasData,
		isCacheValid,
		totalIncome,
		totalSources,
		allSources,
		recurringIncome,
		oneTimeIncome,
		recentSources,
		topIncomeTypes,
		incomeByType,

		// Actions
		fetchIncome,
		fetchIncomeWithAnalytics,
		fetchIncomeLedger,
		fetchIncomeTypes,
		fetchMonthlyIncomeSummary,
		fetchIncomeInsights,
		fetchDashboardMetrics,
		fetchIncomeAnalytics,
		fetchIncomeFilterOptions,
		fetchPeriodInfo,
		cleanupIncomeData,
		addIncomeSource,
		addDirectLedgerEntry,
		updateIncomeSource,
		deleteIncome,
		deleteIncomeSource,
		updateRecurringLedgerEntries,
		updateLedgerEntry,
		deleteLedgerEntry,
		createLedgerEntry,
		updateFilters,
		updateLedgerFilters,
		clearFilters,
		clearLedgerFilters,
		clearError,
		clearCache,
		$reset,
	}
})
