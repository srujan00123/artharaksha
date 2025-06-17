/**
 * Income Composable - Updated for new backend API and types
 * Only add/update/delete IncomeSourceType, ledger is backend-only
 */

import { computed } from "vue"
import { useIncomeStore } from "../stores/income-store"
import type {
	AddIncomeSourcePayload,
	DeleteIncomeSourcePayload,
	FlattenedLedgerEntry,
	Income,
	IncomeAnalytics,
	IncomeFilters,
	IncomeLedger,
	IncomeServiceOptions,
	IncomeSourceType,
	LedgerFilters,
	UpdateIncomeSourcePayload,
} from "../types/income"

// Add initialization options type
interface InitializeOptions {
	withAnalytics?: boolean
	forceRefresh?: boolean
	period?:
		| "this_month"
		| "last_month"
		| "last_3_months"
		| "last_6_months"
		| "this_year"
}

// Cache invalidation options
interface CacheInvalidationOptions {
	incomeData?: boolean
	analytics?: boolean
	ledgerData?: boolean
	incomeTypes?: boolean
	all?: boolean
}

export function useIncome() {
	const store = useIncomeStore()

	// Reactive state from store
	const incomes = computed(() => store.incomes)
	const incomeTypes = computed(() => store.incomeTypes)
	const ledgerEntries = computed(() => store.ledgerEntries)
	const analytics = computed(() => store.analytics)
	const monthlyIncomeSummary = computed(() => store.monthlyIncomeSummary)
	const incomeInsights = computed(() => store.incomeInsights)
	const loading = computed(() => store.loading)
	const error = computed(() => store.error)
	const filters = computed(() => store.filters)
	const ledgerFilters = computed(() => store.ledgerFilters)

	// Computed totals from store
	const totalIncome = computed(() => store.totalIncome)
	const recurringIncome = computed(() => store.recurringIncome)
	const oneTimeIncome = computed(() => store.oneTimeIncome)
	const totalSources = computed(() => store.totalSources)
	const allSources = computed(() => store.allSources)
	const filteredSources = computed(() => store.filteredSources)
	const filteredLedgerEntries = computed(() => store.filteredLedgerEntries)
	const recentSources = computed(() => store.recentSources)
	const topIncomeTypes = computed(() => store.topIncomeTypes)
	const incomeByType = computed(() => store.incomeByType)

	// Add error handling wrapper
	const handleError = (error: unknown, message: string) => {
		console.error(message, error)
		throw error instanceof Error ? error : new Error(message)
	}

	// Actions with modern IncomeServiceOptions only
	const fetchIncome = async (options: IncomeServiceOptions = {}) => {
		await store.fetchIncome(options)
	}

	const fetchIncomeWithAnalytics = async (
		options: IncomeServiceOptions = {},
	) => {
		await store.fetchIncomeWithAnalytics(options)
	}

	const fetchIncomeLedger = async (
		filters?: LedgerFilters,
		options: IncomeServiceOptions = {},
	) => {
		await store.fetchIncomeLedger(filters, options)
	}

	const fetchIncomeTypes = async (options: IncomeServiceOptions = {}) => {
		await store.fetchIncomeTypes(options)
	}

	const fetchMonthlyIncomeSummary = async (
		options: IncomeServiceOptions = {},
	) => {
		await store.fetchMonthlyIncomeSummary(options)
	}

	const fetchIncomeInsights = async (options: IncomeServiceOptions = {}) => {
		await store.fetchIncomeInsights(options)
	}

	const addIncomeSource = async (payload: AddIncomeSourcePayload) => {
		await store.addIncomeSource(payload)
	}

	const updateIncomeSource = async (payload: UpdateIncomeSourcePayload) => {
		await store.updateIncomeSource(payload)
	}

	const deleteIncome = async (incomeId: string) => {
		await store.deleteIncome(incomeId)
	}

	const deleteIncomeSource = async (payload: DeleteIncomeSourcePayload) => {
		await store.deleteIncomeSource(payload)
	}

	const updateRecurringLedgerEntries = async () => {
		return await store.updateRecurringLedgerEntries()
	}

	const updateFilters = (newFilters: Partial<IncomeFilters>) => {
		store.updateFilters(newFilters)
	}

	const updateLedgerFilters = (newFilters: Partial<LedgerFilters>) => {
		store.updateLedgerFilters(newFilters)
	}

	const clearFilters = () => {
		store.clearFilters()
	}

	const clearLedgerFilters = () => {
		store.clearLedgerFilters()
	}

	const clearError = () => {
		store.clearError()
	}

	// Cache management methods
	const clearCache = () => {
		store.clearCache()
	}

	const invalidateCache = async (options: CacheInvalidationOptions = {}) => {
		const {
			incomeData = false,
			analytics = false,
			ledgerData = false,
			incomeTypes = false,
			all = false,
		} = options

		try {
			if (all) {
				store.clearCache()
				await initialize({ withAnalytics: true, forceRefresh: true })
				return
			}

			// Selective cache invalidation with better error handling
			if (incomeData || analytics) {
				// Clear income and analytics cache, then refetch
				store.clearCache()
				await fetchIncomeWithAnalytics({ forceRefresh: true })
			}

			if (ledgerData) {
				// Refetch ledger data
				await fetchIncomeLedger(ledgerFilters.value, { forceRefresh: true })
			}

			if (incomeTypes) {
				// Refetch income types
				await fetchIncomeTypes({ forceRefresh: true })
			}
		} catch (error) {
			handleError(error, "Failed to invalidate cache")
		}
	}

	const refreshData = async (
		options: {
			withAnalytics?: boolean
			withLedger?: boolean
			withSummary?: boolean
			withInsights?: boolean
		} = {},
	) => {
		const {
			withAnalytics = true,
			withLedger = false,
			withSummary = false,
			withInsights = false,
		} = options

		try {
			// Always refresh income types first
			await fetchIncomeTypes({ forceRefresh: true })

			// Fetch income data with proper error handling
			if (withAnalytics) {
				await fetchIncomeWithAnalytics({ forceRefresh: true })
			} else {
				await fetchIncome({ forceRefresh: true })
			}

			// Optionally fetch additional data in parallel when possible
			const additionalFetches = []

			if (withLedger) {
				additionalFetches.push(
					fetchIncomeLedger(ledgerFilters.value, { forceRefresh: true }),
				)
			}

			if (withSummary) {
				additionalFetches.push(
					fetchMonthlyIncomeSummary({ forceRefresh: true }),
				)
			}

			if (withInsights) {
				additionalFetches.push(fetchIncomeInsights({ forceRefresh: true }))
			}

			// Execute additional fetches in parallel
			if (additionalFetches.length > 0) {
				await Promise.all(additionalFetches)
			}
		} catch (error) {
			handleError(error, "Failed to refresh income data")
		}
	}

	// Update initialization helper with better error handling and options
	const initialize = async (options: InitializeOptions = {}) => {
		const { withAnalytics = false, forceRefresh = false, period } = options
		try {
			if (period) {
				store.updateFilters({ period })
			}
			await store.fetchIncomeTypes({ forceRefresh })
			if (withAnalytics) {
				await store.fetchIncomeWithAnalytics({ forceRefresh })
			} else {
				await store.fetchIncome({ forceRefresh })
			}
		} catch (error) {
			handleError(error, "Failed to initialize income data")
		}
	}

	// Add analytics helper
	const getAnalytics = computed(() => {
		if (!analytics.value) return null
		return {
			totalIncome: analytics.value.total_income || 0,
			recurringIncome: analytics.value.recurring_income || 0,
			oneTimeIncome: analytics.value.one_time_income || 0,
			monthlyTrends: analytics.value.monthly_trends || [],
			incomeByType: analytics.value.income_by_type || {},
			summary: analytics.value.summary || {
				total_sources: 0,
				average_source_amount: 0,
				top_income_type: "",
			},
		}
	})

	// Add period helper
	const setPeriod = async (period: InitializeOptions["period"]) => {
		try {
			store.updateFilters({ period })
			await store.fetchIncomeWithAnalytics({ forceRefresh: true })
		} catch (error) {
			handleError(error, "Failed to update period")
		}
	}

	// Helper methods for common operations
	const hasData = computed(() => store.hasData)
	const isCacheValid = computed(() => store.isCacheValid)

	return {
		// State
		incomes,
		incomeTypes,
		ledgerEntries,
		analytics,
		monthlyIncomeSummary,
		incomeInsights,
		loading,
		error,
		filters,
		ledgerFilters,

		// Computed values
		totalIncome,
		recurringIncome,
		oneTimeIncome,
		totalSources,
		allSources,
		filteredSources,
		filteredLedgerEntries,
		recentSources,
		topIncomeTypes,
		incomeByType,
		hasData,
		isCacheValid,

		// Actions
		fetchIncome,
		fetchIncomeWithAnalytics,
		fetchIncomeLedger,
		fetchIncomeTypes,
		fetchMonthlyIncomeSummary,
		fetchIncomeInsights,
		addIncomeSource,
		updateIncomeSource,
		deleteIncome,
		deleteIncomeSource,
		updateRecurringLedgerEntries,
		updateFilters,
		updateLedgerFilters,
		clearFilters,
		clearLedgerFilters,
		clearError,

		// Cache management
		clearCache,
		invalidateCache,
		refreshData,

		// Utilities
		initialize,
		getAnalytics,
		setPeriod,
	}
}
