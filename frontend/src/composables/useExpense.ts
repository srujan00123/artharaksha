/**
 * Expense Composable
 * Reactive wrapper around expense service and store
 * Follows the income management pattern with clean separation of concerns
 */

import { computed, onUnmounted, watch } from "vue"
import { session } from "../data/session.js"
import { useExpenseStore } from "../stores/expense.js"
import type {
	ExpenseFilters,
	ExpenseFormData,
	ExpenseServiceOptions,
	FlattenedExpenseEntry,
} from "../types/expense"

// Options interface for the composable
interface UseExpenseOptions {
	autoInitialize?: boolean
	cacheTimeout?: number
}

// Cache invalidation options
interface CacheInvalidationOptions {
	expenseData?: boolean
	analytics?: boolean
	all?: boolean
}

export function useExpense(options: UseExpenseOptions = {}) {
	const { autoInitialize = true, cacheTimeout = 300000 } = options

	// Use the store
	const expenseStore = useExpenseStore()

	// Reactive state from store
	const expenses = computed(() => expenseStore.filteredExpenses)
	const allExpenses = computed(() => expenseStore.expenses)
	const expenseTypes = computed(() => expenseStore.expenseTypes)
	const analytics = computed(() => expenseStore.analytics)
	const dashboardMetrics = computed(() => expenseStore.dashboardMetrics)
	const loading = computed(() => expenseStore.loading)
	const error = computed(() => expenseStore.error)
	const filters = computed(() => expenseStore.filters)

	// Computed values from store
	const medicalExpenses = computed(() => expenseStore.medicalExpenses)
	const otherExpenses = computed(() => expenseStore.otherExpenses)
	const directMedicalExpenses = computed(
		() => expenseStore.directMedicalExpenses,
	)
	const indirectMedicalExpenses = computed(
		() => expenseStore.indirectMedicalExpenses,
	)
	const totalAmount = computed(() => expenseStore.totalAmount)
	const medicalAmount = computed(() => expenseStore.medicalAmount)
	const otherAmount = computed(() => expenseStore.otherAmount)
	const directMedicalAmount = computed(() => expenseStore.directMedicalAmount)
	const indirectMedicalAmount = computed(
		() => expenseStore.indirectMedicalAmount,
	)
	const expenseCount = computed(() => expenseStore.expenseCount)
	const averageExpense = computed(() => expenseStore.averageExpense)
	const expensesByDate = computed(() => expenseStore.expensesByDate)
	const expensesByCategory = computed(() => expenseStore.expensesByCategory)
	const topCategories = computed(() => expenseStore.topCategories)
	const recentExpenses = computed(() => expenseStore.recentExpenses)
	const hasActiveFilters = computed(() => expenseStore.hasActiveFilters)

	// Helper methods for common operations
	const hasData = computed(() => expenseStore.hasData)
	const isCacheValid = computed(() => expenseStore.isCacheValid)

	// Add error handling wrapper
	const handleError = (error: unknown, message: string) => {
		console.error(message, error)
		throw error instanceof Error ? error : new Error(message)
	}

	// Actions with proper error handling and cache integration
	const fetchExpenses = async (options: ExpenseServiceOptions = {}) => {
		try {
			return await expenseStore.fetchExpenses(options)
		} catch (error) {
			handleError(error, "Failed to fetch expenses")
		}
	}

	const fetchExpensesWithAnalytics = async (
		options: ExpenseServiceOptions = {},
	) => {
		try {
			return await expenseStore.fetchExpensesWithAnalytics(options)
		} catch (error) {
			handleError(error, "Failed to fetch expenses with analytics")
		}
	}

	const fetchExpenseTypes = async (options: ExpenseServiceOptions = {}) => {
		try {
			return await expenseStore.fetchExpenseTypes(options)
		} catch (error) {
			handleError(error, "Failed to fetch expense types")
		}
	}

	const fetchDashboardMetrics = async (
		period = "this_month",
		options: ExpenseServiceOptions = {},
	) => {
		try {
			return await expenseStore.fetchDashboardMetrics(period, options)
		} catch (error) {
			handleError(error, "Failed to fetch dashboard metrics")
		}
	}

	const refreshExpenses = async () => {
		try {
			return await expenseStore.refreshExpenses()
		} catch (error) {
			handleError(error, "Failed to refresh expenses")
		}
	}

	const createExpense = async (expenseData: ExpenseFormData) => {
		try {
			return await expenseStore.createExpense(expenseData)
		} catch (error) {
			handleError(error, "Failed to create expense")
		}
	}

	const updateExpense = async (
		expenseName: string,
		expenseData: ExpenseFormData,
	) => {
		try {
			return await expenseStore.updateExpense(expenseName, expenseData)
		} catch (error) {
			handleError(error, "Failed to update expense")
		}
	}

	const deleteExpense = async (expenseName: string, expenseId: string) => {
		try {
			return await expenseStore.deleteExpense(expenseName, expenseId)
		} catch (error) {
			handleError(error, "Failed to delete expense")
		}
	}

	const updateFilters = (newFilters: Partial<ExpenseFilters>) => {
		expenseStore.updateFilters(newFilters)
	}

	const clearFilters = () => {
		expenseStore.clearFilters()
	}

	const clearError = () => {
		expenseStore.clearError()
	}

	// Cache management methods
	const clearCache = () => {
		expenseStore.clearCache()
	}

	const invalidateCache = async (options: CacheInvalidationOptions = {}) => {
		const { expenseData = false, analytics = false, all = false } = options

		try {
			if (all) {
				expenseStore.clearCache()
				await initialize({ forceRefresh: true })
				return
			}

			// Selective cache invalidation with better error handling
			if (expenseData || analytics) {
				// Clear cache and refetch
				expenseStore.clearCache()
				await fetchExpenses({ forceRefresh: true })
			}
		} catch (error) {
			handleError(error, "Failed to invalidate cache")
		}
	}

	const refreshData = async (
		options: {
			withAnalytics?: boolean
			withDashboard?: boolean
			useCache?: boolean
		} = {},
	) => {
		const {
			withAnalytics = true,
			withDashboard = true,
			useCache = false,
		} = options

		try {
			const forceRefresh = !useCache

			// Always refresh expense types first (but respect cache if useCache is true)
			await fetchExpenseTypes({ forceRefresh, useCache })

			// Fetch expense data with proper error handling
			if (withAnalytics) {
				await fetchExpensesWithAnalytics({ forceRefresh, useCache })
			} else {
				await fetchExpenses({ forceRefresh, useCache })
			}

			// Optionally fetch dashboard metrics
			if (withDashboard) {
				await fetchDashboardMetrics("this_month", { forceRefresh, useCache })
			}
		} catch (error) {
			handleError(error, "Failed to refresh expense data")
		}
	}

	// Initialization helper with better error handling and options
	const initialize = async (
		options: {
			withAnalytics?: boolean
			forceRefresh?: boolean
			period?:
				| "this_month"
				| "last_month"
				| "last_3_months"
				| "last_6_months"
				| "this_year"
		} = {},
	) => {
		const { withAnalytics = false, forceRefresh = false, period } = options
		try {
			// Set default period to this_month if no period is provided
			const defaultPeriod = period || "this_month"
			expenseStore.updateFilters({ period: defaultPeriod })

			// Always fetch expense types first
			await expenseStore.fetchExpenseTypes({ forceRefresh })

			// Fetch expense data with analytics by default for better UX
			if (withAnalytics) {
				await expenseStore.fetchExpensesWithAnalytics({ forceRefresh })
			} else {
				await expenseStore.fetchExpenses({ forceRefresh })
			}
		} catch (error) {
			handleError(error, "Failed to initialize expense data")
		}
	}

	// Simple cache invalidation and refresh - this is what components should call
	const invalidateAndRefresh = async (): Promise<void> => {
		clearCache()
		await refreshExpenses()
	}

	// Watch for user changes and reinitialize
	let userWatcher: (() => void) | null = null
	const setupUserWatcher = () => {
		userWatcher = watch(
			() => session.user,
			(newUser, oldUser) => {
				if (newUser !== oldUser) {
					expenseStore.$reset()
					if (newUser) {
						initialize()
					}
				}
			},
		)
	}

	// Auto-initialize if enabled
	if (autoInitialize) {
		setupUserWatcher()
		if (session.user) {
			initialize()
		}
	}

	// Cleanup
	onUnmounted(() => {
		if (userWatcher) {
			userWatcher()
		}
	})

	return {
		// State
		expenses,
		allExpenses,
		expenseTypes,
		analytics,
		dashboardMetrics,
		loading,
		error,
		filters,

		// Computed values
		medicalExpenses,
		otherExpenses,
		directMedicalExpenses,
		indirectMedicalExpenses,
		totalAmount,
		medicalAmount,
		otherAmount,
		directMedicalAmount,
		indirectMedicalAmount,
		expenseCount,
		averageExpense,
		expensesByDate,
		expensesByCategory,
		topCategories,
		recentExpenses,
		hasActiveFilters,
		hasData,
		isCacheValid,

		// Actions
		fetchExpenses,
		fetchExpensesWithAnalytics,
		fetchExpenseTypes,
		fetchDashboardMetrics,
		refreshExpenses,
		createExpense,
		updateExpense,
		deleteExpense,
		updateFilters,
		clearFilters,
		clearError,

		// Cache management
		clearCache,
		invalidateCache,
		refreshData,

		// Utilities
		initialize,
		invalidateAndRefresh,
	}
}
