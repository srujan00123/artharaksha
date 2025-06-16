/**
 * Income Composable - Exact Backend API Alignment
 * No backward compatibility - provides clean interface to exact backend data
 */

import { computed } from "vue"
import { useIncomeStore } from "../stores/income"
import type {
	IncomeAnalytics,
	IncomeFilters,
	IncomeFormData,
	IncomeRecord,
	IncomeTypeRecord,
} from "../types/income"

export function useIncome() {
	const store = useIncomeStore()

	// Reactive state from store (exact backend types)
	const incomes = computed(() => store.incomes)
	const incomeTypes = computed(() => store.incomeTypes)
	const analytics = computed(() => store.analytics)
	const loading = computed(() => store.loading)
	const error = computed(() => store.error)
	const filters = computed(() => store.filters)

	// Computed totals (exact backend calculations)
	const totalMonthlyIncome = computed(() => store.totalMonthlyIncome)
	const totalRecurringIncome = computed(() => store.totalRecurringIncome)
	const totalOneTimeIncome = computed(() => store.totalOneTimeIncome)
	const totalSources = computed(() => store.totalSources)
	const filteredIncomes = computed(() => store.filteredIncomes)

	// Actions (exact backend API calls)
	const fetchIncomes = async (forceRefresh = false) => {
		await store.fetchIncomes(forceRefresh)
	}

	const fetchIncomesWithAnalytics = async (forceRefresh = false) => {
		await store.fetchIncomesWithAnalytics(forceRefresh)
	}

	const fetchIncomeTypes = async (forceRefresh = false) => {
		await store.fetchIncomeTypes(forceRefresh)
	}

	const createIncome = async (incomeData: IncomeFormData) => {
		await store.createIncome(incomeData)
	}

	const updateIncome = async (incomeData: IncomeFormData) => {
		await store.updateIncome(incomeData)
	}

	const deleteIncome = async (incomeId: string) => {
		await store.deleteIncome(incomeId)
	}

	const updateFilters = (newFilters: Partial<IncomeFilters>) => {
		store.updateFilters(newFilters)
	}

	const resetFilters = () => {
		store.resetFilters()
	}

	const clearCache = () => {
		store.clearCache()
	}

	// Initialization helper
	const initialize = async (
		options: { withAnalytics?: boolean; forceRefresh?: boolean } = {},
	) => {
		const { withAnalytics = false, forceRefresh = false } = options

		try {
			// Load income types first (they're needed for forms)
			await fetchIncomeTypes(forceRefresh)

			// Load incomes with or without analytics
			if (withAnalytics) {
				await fetchIncomesWithAnalytics(forceRefresh)
			} else {
				await fetchIncomes(forceRefresh)
			}
		} catch (error) {
			console.error("Income Composable: Initialization failed:", error)
			throw error
		}
	}

	return {
		// State (exact backend types)
		incomes,
		incomeTypes,
		analytics,
		loading,
		error,
		filters,

		// Computed (exact backend calculations)
		totalMonthlyIncome,
		totalRecurringIncome,
		totalOneTimeIncome,
		totalSources,
		filteredIncomes,

		// Actions (exact backend API)
		fetchIncomes,
		fetchIncomesWithAnalytics,
		fetchIncomeTypes,
		createIncome,
		updateIncome,
		deleteIncome,
		updateFilters,
		resetFilters,
		clearCache,
		initialize,
	}
}
