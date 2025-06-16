/**
 * Expense Store
 * Manages expense state and provides reactive data for components
 * Uses consistent types from types/expense.ts
 */

import { defineStore } from "pinia"
import { expenseService } from "../services/expense-service"
import type {
	ActiveFilter,
	ExpenseAnalytics,
	ExpenseFilters,
	ExpenseFormData,
	ExpenseServiceOptions,
	ExpenseStoreState,
	ExpenseSummary,
	ExpenseValidationResult,
	GroupedExpenses,
	ProcessedExpenseItem,
	QuickDateFilter,
} from "../types/expense"

// Default filters
const defaultFilters: ExpenseFilters = {
	searchTerm: "",
	type: "",
	category: "",
	dateFrom: "",
	dateTo: "",
	amountMin: "",
	amountMax: "",
	sortBy: "date",
	sortOrder: "desc",
	period: "all",
}

export const useExpenseStore = defineStore("expense", {
	state: (): ExpenseStoreState => ({
		rawExpenseData: [],
		processedExpenses: [],
		filteredExpenses: [],
		loading: false,
		error: "",
		selectedExpenses: [],
		filters: { ...defaultFilters },
		processingErrors: [],
		lastProcessedCount: 0,
		lastFetchTime: null,
	}),

	getters: {
		/**
		 * Get expenses by type
		 */
		medicalExpenses: (state): ProcessedExpenseItem[] =>
			state.processedExpenses.filter((expense) => expense.type === "medical"),

		otherExpenses: (state): ProcessedExpenseItem[] =>
			state.processedExpenses.filter((expense) => expense.type === "other"),

		/**
		 * Get recent expenses (last 30 days)
		 */
		recentExpenses: (state): ProcessedExpenseItem[] => {
			const thirtyDaysAgo = new Date()
			thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

			return state.processedExpenses
				.filter((expense) => new Date(expense.date) >= thirtyDaysAgo)
				.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
		},

		/**
		 * Get top categories by spending
		 */
		topCategories: (
			state,
		): Array<{ category: string; amount: number; count: number }> => {
			const categoryMap = new Map<string, { amount: number; count: number }>()

			state.filteredExpenses.forEach((expense) => {
				const existing = categoryMap.get(expense.category) || {
					amount: 0,
					count: 0,
				}
				categoryMap.set(expense.category, {
					amount: existing.amount + expense.amount,
					count: existing.count + 1,
				})
			})

			return Array.from(categoryMap.entries())
				.map(([category, data]) => ({ category, ...data }))
				.sort((a, b) => b.amount - a.amount)
				.slice(0, 10)
		},

		/**
		 * Get expense summary
		 */
		expenseSummary: (state): ExpenseSummary => {
			const filtered = state.filteredExpenses
			const medical = filtered.filter((exp) => exp.type === "medical")
			const other = filtered.filter((exp) => exp.type === "other")

			return {
				totalAmount: filtered.reduce((sum, exp) => sum + exp.amount, 0),
				medicalAmount: medical.reduce((sum, exp) => sum + exp.amount, 0),
				otherAmount: other.reduce((sum, exp) => sum + exp.amount, 0),
				expenseCount: filtered.length,
				medicalCount: medical.length,
				otherCount: other.length,
				averageExpense:
					filtered.length > 0
						? filtered.reduce((sum, exp) => sum + exp.amount, 0) /
							filtered.length
						: 0,
				period: state.filters.period || "all",
			}
		},

		/**
		 * Get expenses grouped by date
		 */
		expensesByDate: (state): Record<string, ProcessedExpenseItem[]> => {
			const grouped: Record<string, ProcessedExpenseItem[]> = {}

			state.filteredExpenses.forEach((expense) => {
				const date = new Date(expense.date).toISOString().split("T")[0]
				if (!grouped[date]) {
					grouped[date] = []
				}
				grouped[date].push(expense)
			})

			// Sort expenses within each date group
			Object.keys(grouped).forEach((date) => {
				grouped[date].sort(
					(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
				)
			})

			return grouped
		},

		/**
		 * Get expenses grouped by category
		 */
		expensesByCategory: (state): Record<string, ProcessedExpenseItem[]> => {
			const grouped: Record<string, ProcessedExpenseItem[]> = {}

			state.filteredExpenses.forEach((expense) => {
				if (!grouped[expense.category]) {
					grouped[expense.category] = []
				}
				grouped[expense.category].push(expense)
			})

			// Sort expenses within each category by date (newest first)
			Object.keys(grouped).forEach((category) => {
				grouped[category].sort(
					(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
				)
			})

			return grouped
		},

		/**
		 * Check if filters are active
		 */
		hasActiveFilters: (state): boolean => {
			return Object.values(state.filters).some(
				(value) =>
					value !== "" &&
					value !== "all" &&
					value !== "date" &&
					value !== "desc",
			)
		},

		/**
		 * Get filter summary text
		 */
		filterSummary: (state): string => {
			const activeFilters: string[] = []

			if (state.filters.searchTerm) {
				activeFilters.push(`containing "${state.filters.searchTerm}"`)
			}
			if (state.filters.type) {
				activeFilters.push(`${state.filters.type} expenses`)
			}
			if (state.filters.category) {
				activeFilters.push(`in ${state.filters.category}`)
			}
			if (state.filters.dateFrom || state.filters.dateTo) {
				const from = state.filters.dateFrom || "start"
				const to = state.filters.dateTo || "end"
				activeFilters.push(`from ${from} to ${to}`)
			}

			return activeFilters.length > 0
				? activeFilters.join(", ")
				: "All expenses"
		},

		/**
		 * Check if data is stale (older than 5 minutes)
		 */
		isDataStale: (state): boolean => {
			if (!state.lastFetchTime) return true
			const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
			return state.lastFetchTime < fiveMinutesAgo
		},

		/**
		 * Check if we have data
		 */
		hasData: (state): boolean => {
			return state.processedExpenses.length > 0
		},

		/**
		 * Check if cache is valid
		 */
		isCacheValid: (state): boolean => {
			if (!state.lastFetchTime) {
				return false
			}
			const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
			return state.lastFetchTime > fiveMinutesAgo
		},
	},

	actions: {
		/**
		 * Load expenses from service
		 */
		async loadExpenses(options: ExpenseServiceOptions = {}): Promise<void> {
			const { forceReload = false } = options

			try {
				// Check cache validity first
				if (!forceReload && this.hasData && !this.isDataStale) {
					console.log("ExpenseStore: Using cached data")
					return
				}

				this.loading = true
				this.error = ""

				console.log("ExpenseStore: Loading expenses from service")
				const expenses = await expenseService.getExpenses({
					...options,
					useCache: !forceReload,
					forceReload: forceReload,
				})
				this.processedExpenses = expenses
				this.lastFetchTime = Date.now()

				// Apply current filters
				this.applyFilters()
			} catch (error) {
				console.error("ExpenseStore: Failed to load expenses:", error)
				this.error =
					error instanceof Error ? error.message : "Failed to load expenses"
				this.processedExpenses = []
			} finally {
				this.loading = false
			}
		},

		/**
		 * Refresh expenses (force reload)
		 */
		async refreshExpenses(): Promise<void> {
			await this.loadExpenses({ forceReload: true, useCache: false })
		},

		/**
		 * Create new expense
		 */
		async createExpense(
			expenseData: ExpenseFormData,
		): Promise<ProcessedExpenseItem | null> {
			this.loading = true
			this.error = ""

			try {
				const newExpense = await expenseService.createExpense(expenseData)

				// Add to local state
				this.processedExpenses.unshift(newExpense)
				this.lastFetchTime = Date.now()

				// Reapply filters
				this.applyFilters()

				return newExpense
			} catch (error) {
				console.error("ExpenseStore: Failed to create expense:", error)
				this.error =
					error instanceof Error ? error.message : "Failed to create expense"
				return null
			} finally {
				this.loading = false
			}
		},

		/**
		 * Update existing expense
		 */
		async updateExpense(
			originalExpense: ProcessedExpenseItem,
			updatedData: ExpenseFormData,
		): Promise<ProcessedExpenseItem | null> {
			this.loading = true
			this.error = ""

			try {
				const updatedExpense = await expenseService.updateExpense(
					originalExpense,
					updatedData,
				)

				// Update in local state
				const index = this.processedExpenses.findIndex(
					(exp) => exp.id === originalExpense.id,
				)
				if (index !== -1) {
					this.processedExpenses[index] = updatedExpense
					this.lastFetchTime = Date.now()

					// Reapply filters
					this.applyFilters()
				}

				return updatedExpense
			} catch (error) {
				console.error("ExpenseStore: Failed to update expense:", error)
				this.error =
					error instanceof Error ? error.message : "Failed to update expense"
				return null
			} finally {
				this.loading = false
			}
		},

		/**
		 * Delete expense
		 */
		async deleteExpense(expense: ProcessedExpenseItem): Promise<boolean> {
			this.loading = true
			this.error = ""

			try {
				await expenseService.deleteExpense(expense)

				// Remove from local state
				const index = this.processedExpenses.findIndex(
					(exp) => exp.id === expense.id,
				)
				if (index !== -1) {
					this.processedExpenses.splice(index, 1)
					this.lastFetchTime = Date.now()

					// Reapply filters
					this.applyFilters()
				}

				return true
			} catch (error) {
				console.error("ExpenseStore: Failed to delete expense:", error)
				this.error =
					error instanceof Error ? error.message : "Failed to delete expense"
				return false
			} finally {
				this.loading = false
			}
		},

		/**
		 * Set filters and apply them
		 */
		setFilters(newFilters: Partial<ExpenseFilters>): void {
			this.filters = { ...this.filters, ...newFilters }
			this.applyFilters()
		},

		/**
		 * Apply current filters to expenses
		 */
		applyFilters(): void {
			// Apply quick date filter first
			let filtered = this.processedExpenses

			if (this.filters.period && this.filters.period !== "all") {
				const dateRange = this.getDateRangeForQuickFilter(this.filters.period)
				if (dateRange) {
					this.filters.dateFrom = dateRange.from
					this.filters.dateTo = dateRange.to
				}
			}

			// Apply service-level filtering
			filtered = expenseService.filterExpenses(
				this.processedExpenses,
				this.filters,
			)

			this.filteredExpenses = filtered
		},

		/**
		 * Clear all filters
		 */
		clearFilters(): void {
			this.filters = { ...defaultFilters }
			this.applyFilters()
		},

		/**
		 * Clear specific filter
		 */
		clearFilter(filterType: keyof ExpenseFilters): void {
			switch (filterType) {
				case "searchTerm":
					this.filters.searchTerm = ""
					break
				case "type":
					this.filters.type = ""
					break
				case "category":
					this.filters.category = ""
					break
				case "dateFrom":
				case "dateTo":
					this.filters.dateFrom = ""
					this.filters.dateTo = ""
					this.filters.period = "all"
					break
				case "amountMin":
				case "amountMax":
					this.filters.amountMin = ""
					this.filters.amountMax = ""
					break
				case "period":
					this.filters.period = "all"
					this.filters.dateFrom = ""
					this.filters.dateTo = ""
					break
			}
			this.applyFilters()
		},

		/**
		 * Load expense analytics
		 */
		async loadAnalytics(period = "last_3_months"): Promise<void> {
			try {
				this.analytics = await expenseService.getExpenseAnalytics(
					period,
					this.filters,
				)
			} catch (error) {
				console.error("ExpenseStore: Failed to load analytics:", error)
				this.analytics = null
			}
		},

		/**
		 * Validate expense data
		 */
		validateExpenseData(formData: ExpenseFormData): ExpenseValidationResult {
			return expenseService.validateExpenseData(formData)
		},

		/**
		 * Reset store state
		 */
		reset(): void {
			this.processedExpenses = []
			this.filteredExpenses = []
			this.filters = { ...defaultFilters }
			this.loading = false
			this.error = ""
			this.lastFetchTime = null
			this.processingErrors = []
			this.lastProcessedCount = 0
		},

		/**
		 * Get date range for quick filter
		 */
		getDateRangeForQuickFilter(
			filter: string,
		): { from: string; to: string } | null {
			const now = new Date()
			const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

			switch (filter) {
				case "today":
					return {
						from: today.toISOString().split("T")[0],
						to: today.toISOString().split("T")[0],
					}

				case "yesterday": {
					const yesterday = new Date(today)
					yesterday.setDate(yesterday.getDate() - 1)
					return {
						from: yesterday.toISOString().split("T")[0],
						to: yesterday.toISOString().split("T")[0],
					}
				}

				case "this_week": {
					const startOfWeek = new Date(today)
					startOfWeek.setDate(today.getDate() - today.getDay())
					return {
						from: startOfWeek.toISOString().split("T")[0],
						to: today.toISOString().split("T")[0],
					}
				}

				case "last_week": {
					const startOfLastWeek = new Date(today)
					startOfLastWeek.setDate(today.getDate() - today.getDay() - 7)
					const endOfLastWeek = new Date(startOfLastWeek)
					endOfLastWeek.setDate(startOfLastWeek.getDate() + 6)
					return {
						from: startOfLastWeek.toISOString().split("T")[0],
						to: endOfLastWeek.toISOString().split("T")[0],
					}
				}

				case "this_month": {
					const startOfMonth = new Date(
						today.getFullYear(),
						today.getMonth(),
						1,
					)
					return {
						from: startOfMonth.toISOString().split("T")[0],
						to: today.toISOString().split("T")[0],
					}
				}

				case "last_month": {
					const startOfLastMonth = new Date(
						today.getFullYear(),
						today.getMonth() - 1,
						1,
					)
					const endOfLastMonth = new Date(
						today.getFullYear(),
						today.getMonth(),
						0,
					)
					return {
						from: startOfLastMonth.toISOString().split("T")[0],
						to: endOfLastMonth.toISOString().split("T")[0],
					}
				}

				case "last_3_months": {
					const threeMonthsAgo = new Date(today)
					threeMonthsAgo.setMonth(today.getMonth() - 3)
					return {
						from: threeMonthsAgo.toISOString().split("T")[0],
						to: today.toISOString().split("T")[0],
					}
				}

				case "last_6_months": {
					const sixMonthsAgo = new Date(today)
					sixMonthsAgo.setMonth(today.getMonth() - 6)
					return {
						from: sixMonthsAgo.toISOString().split("T")[0],
						to: today.toISOString().split("T")[0],
					}
				}

				case "this_year": {
					const startOfYear = new Date(today.getFullYear(), 0, 1)
					return {
						from: startOfYear.toISOString().split("T")[0],
						to: today.toISOString().split("T")[0],
					}
				}

				case "last_year": {
					const startOfLastYear = new Date(today.getFullYear() - 1, 0, 1)
					const endOfLastYear = new Date(today.getFullYear() - 1, 11, 31)
					return {
						from: startOfLastYear.toISOString().split("T")[0],
						to: endOfLastYear.toISOString().split("T")[0],
					}
				}

				default:
					return null
			}
		},

		/**
		 * Update active filters list for display
		 */
		updateActiveFilters(): void {
			// This method is no longer needed since we removed activeFilters from state
			// Filters are now computed directly in the getters
		},

		/**
		 * Get display label for quick date filter
		 */
		getQuickDateFilterLabel(filter: string): string {
			const labels: Record<string, string> = {
				all: "All Time",
				today: "Today",
				yesterday: "Yesterday",
				this_week: "This Week",
				last_week: "Last Week",
				this_month: "This Month",
				last_month: "Last Month",
				last_3_months: "Last 3 Months",
				last_6_months: "Last 6 Months",
				this_year: "This Year",
				last_year: "Last Year",
			}
			return labels[filter] || filter
		},
	},
})
