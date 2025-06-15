/**
 * Unified Expense Composable
 * Combines basic expense operations with advanced analysis features
 * Supports both simple CRUD operations and complex filtering/grouping
 */

import { ref, computed, watch, onUnmounted, reactive } from 'vue'
import type {
    ProcessedExpenseItem,
    ExpenseFilters,
    ExpenseFormData,
    ExpenseAnalyzerState,
    GroupedExpenses,
    ExpenseServiceOptions
} from '../types/expense'
import { useExpenseStore } from '../stores/expense.js'
import { session } from '../data/session.js'
import { expenseService } from '../services/expense-service.js'
import { getClientTime, getClientDateString, getClientTimezone } from '../utils/date'

// Options interface for the composable
interface UseExpenseOptions {
    enableAdvancedAnalysis?: boolean
}

// Default filters using client timezone
const getDefaultFilters = (): ExpenseFilters => {
    const now = getClientTime()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const timezone = getClientTimezone()
    const clientFirstDay = new Date(firstDayOfMonth.toLocaleString("en-US", { timeZone: timezone }))

    return {
        searchTerm: '',
        dateFrom: clientFirstDay.getFullYear() + '-' +
            String(clientFirstDay.getMonth() + 1).padStart(2, '0') + '-' +
            String(clientFirstDay.getDate()).padStart(2, '0'),
        dateTo: getClientDateString(),
        amountMin: '',
        amountMax: '',
        category: '',
        type: '',
        sortBy: 'date',
        sortOrder: 'desc',
        period: 'current-month'
    }
}

export function useExpense(options: UseExpenseOptions = {}) {
    const { enableAdvancedAnalysis = false } = options

    // Use the enhanced store
    const expenseStore = useExpenseStore()

    // Advanced analysis state (only when needed)
    const analysisState: ExpenseAnalyzerState | null = enableAdvancedAnalysis ? reactive({
        rawExpenses: [],
        filteredExpenses: [],
        loading: false,
        error: '',
        filters: getDefaultFilters(),
        showExpenseForm: false,
        editingExpense: null,
        groupedExpenses: {
            medical: { items: [], count: 0, total: 0 },
            other: { items: [], count: 0, total: 0 },
            summary: { totalItems: 0, totalAmount: 0, medicalPercentage: 0 }
        },
        summary: {
            totalItems: 0,
            totalAmount: 0,
            medicalPercentage: 0
        },
        isEmpty: false,
        hasFilters: false
    }) : null

    // Basic computed properties (always available)
    const filteredExpenses = computed(() =>
        enableAdvancedAnalysis ? analysisState!.filteredExpenses : expenseStore.filteredExpenses
    )
    const allExpenses = computed(() => expenseStore.processedExpenses)

    const groupedExpenses = computed(() => {
        if (enableAdvancedAnalysis && analysisState) {
            return analysisState.groupedExpenses
        }

        // Basic grouping for simple mode - group from filtered expenses
        const filtered = expenseStore.filteredExpenses
        const medical = filtered.filter(expense => expense.type === 'medical')
        const other = filtered.filter(expense => expense.type === 'other')
        const summary = expenseStore.expenseSummary

        return {
            medical: {
                items: medical,
                count: medical.length,
                total: summary.medicalAmount
            },
            other: {
                items: other,
                count: other.length,
                total: summary.otherAmount
            },
            summary: {
                totalItems: summary.expenseCount,
                totalAmount: summary.totalAmount,
                medicalAmount: summary.medicalAmount,
                otherAmount: summary.otherAmount,
                allExpensesCount: expenseStore.processedExpenses.length
            }
        }
    })

    // Advanced filtering function (only when analysis mode is enabled)
    const applyFilters = (expenses: ProcessedExpenseItem[], filters: ExpenseFilters): ProcessedExpenseItem[] => {
        if (!enableAdvancedAnalysis) return expenses

        let filtered = [...expenses]

        // Search term filter
        if (filters.searchTerm?.trim()) {
            const searchTerm = filters.searchTerm.toLowerCase().trim()
            filtered = filtered.filter(expense =>
                expense.category.toLowerCase().includes(searchTerm) ||
                expense.description.toLowerCase().includes(searchTerm)
            )
        }

        // Date range filter - Fixed to handle timezone and same-day comparisons consistently
        if (filters.dateFrom) {
            filtered = filtered.filter(expense => {
                // Extract date part only for comparison (YYYY-MM-DD)
                const expenseDateStr = expense.date.split('T')[0] || expense.date.split(' ')[0]
                return expenseDateStr >= filters.dateFrom
            })
        }

        if (filters.dateTo) {
            filtered = filtered.filter(expense => {
                // Extract date part only for comparison (YYYY-MM-DD)
                const expenseDateStr = expense.date.split('T')[0] || expense.date.split(' ')[0]
                return expenseDateStr <= filters.dateTo
            })
        }

        // Amount range filter
        if (filters.amountMin && !isNaN(parseFloat(filters.amountMin))) {
            filtered = filtered.filter(expense => expense.amount >= parseFloat(filters.amountMin))
        }

        if (filters.amountMax && !isNaN(parseFloat(filters.amountMax))) {
            filtered = filtered.filter(expense => expense.amount <= parseFloat(filters.amountMax))
        }

        // Category filter
        if (filters.category) {
            filtered = filtered.filter(expense => expense.category === filters.category)
        }

        // Type filter
        if (filters.type) {
            filtered = filtered.filter(expense => expense.type === filters.type)
        }

        // Sort expenses
        filtered.sort((a, b) => {
            let aVal: any, bVal: any

            switch (filters.sortBy) {
                case 'amount':
                    aVal = a.amount
                    bVal = b.amount
                    break
                case 'category':
                    aVal = a.category
                    bVal = b.category
                    break
                case 'date':
                default:
                    aVal = new Date(a.date)
                    bVal = new Date(b.date)
            }

            if (filters.sortOrder === 'asc') {
                return aVal < bVal ? -1 : aVal > bVal ? 1 : 0
            } else {
                return aVal > bVal ? -1 : aVal < bVal ? 1 : 0
            }
        })

        return filtered
    }

    const updateComputedState = () => {
        if (!enableAdvancedAnalysis || !analysisState) return

        // Group expenses
        const medical = analysisState.filteredExpenses.filter(expense => expense.type === 'medical')
        const other = analysisState.filteredExpenses.filter(expense => expense.type === 'other')

        const medicalTotal = medical.reduce((sum, expense) => sum + expense.amount, 0)
        const otherTotal = other.reduce((sum, expense) => sum + expense.amount, 0)
        const totalAmount = medicalTotal + otherTotal

        analysisState.groupedExpenses = {
            medical: {
                items: medical,
                count: medical.length,
                total: medicalTotal
            },
            other: {
                items: other,
                count: other.length,
                total: otherTotal
            },
            summary: {
                totalItems: analysisState.filteredExpenses.length,
                totalAmount,
                medicalPercentage: totalAmount > 0 ? (medicalTotal / totalAmount) * 100 : 0
            }
        }

        analysisState.summary = {
            totalItems: analysisState.filteredExpenses.length,
            totalAmount,
            medicalPercentage: totalAmount > 0 ? (medicalTotal / totalAmount) * 100 : 0
        }

        analysisState.isEmpty = analysisState.filteredExpenses.length === 0

        const defaultFilters = getDefaultFilters()
        analysisState.hasFilters = Object.keys(analysisState.filters).some(key => {
            const filterKey = key as keyof ExpenseFilters
            const currentValue = analysisState.filters[filterKey]
            const defaultValue = defaultFilters[filterKey]
            return currentValue !== defaultValue && currentValue !== '' && currentValue !== null
        })
    }

    // Core actions (always available)
    const loadExpenses = async (options: ExpenseServiceOptions = {}) => {
        if (enableAdvancedAnalysis && analysisState) {
            // Check if we already have data and cache is valid (unless force refresh)
            if (!options.forceReload) {
                // Check analysis state first
                if (analysisState.rawExpenses.length > 0 && expenseStore.isCacheValid) {
                    console.log('useExpense: Using existing cached data in analysis mode')
                    return analysisState.rawExpenses
                }
                // If analysis state is empty but store has valid cached data, sync it
                if (expenseStore.processedExpenses.length > 0 && expenseStore.isCacheValid) {
                    console.log('useExpense: Syncing store cache to analysis state')
                    analysisState.rawExpenses = expenseStore.processedExpenses
                    analysisState.filteredExpenses = applyFilters(expenseStore.processedExpenses, analysisState.filters)
                    updateComputedState()
                    return analysisState.rawExpenses
                }
            }

            try {
                analysisState.loading = true
                analysisState.error = ''

                console.log('useExpense: Loading expenses in analysis mode with caching')
                const expenses = await expenseService.getExpenses({
                    includeDetails: true,
                    useCache: true,
                    forceReload: options.forceReload
                })
                analysisState.rawExpenses = expenses
                analysisState.filteredExpenses = applyFilters(expenses, analysisState.filters)
                updateComputedState()
                return expenses
            } catch (error) {
                analysisState.error = error instanceof Error ? error.message : 'Failed to load expenses'
                throw error
            } finally {
                analysisState.loading = false
            }
        } else {
            return await expenseStore.loadExpenses(options)
        }
    }

    const refreshExpenses = async () => {
        if (enableAdvancedAnalysis) {
            return await loadExpenses({ forceReload: true })
        }
        return await expenseStore.refreshExpenses()
    }

    const createExpense = async (expenseData: ExpenseFormData) => {
        const result = await expenseStore.createExpense(expenseData)
        if (enableAdvancedAnalysis) {
            await refreshExpenses()
        }
        return result
    }

    const updateExpense = async (originalExpense: ProcessedExpenseItem, updatedData: ExpenseFormData) => {
        const result = await expenseStore.updateExpense(originalExpense, updatedData)
        if (enableAdvancedAnalysis) {
            await refreshExpenses()
        }
        return result
    }

    const deleteExpense = async (expense: ProcessedExpenseItem) => {
        const result = await expenseStore.deleteExpense(expense)
        if (enableAdvancedAnalysis) {
            await refreshExpenses()
        }
        return result
    }

    // Advanced analysis actions (only when enabled)
    const updateFilters = async (newFilters: Partial<ExpenseFilters>) => {
        if (enableAdvancedAnalysis && analysisState) {
            analysisState.filters = { ...analysisState.filters, ...newFilters }
            analysisState.filteredExpenses = applyFilters(analysisState.rawExpenses, analysisState.filters)
            updateComputedState()
        } else {
            expenseStore.setFilters(newFilters)
        }
    }

    const resetFilters = async () => {
        if (enableAdvancedAnalysis && analysisState) {
            analysisState.filters = getDefaultFilters()
            analysisState.filteredExpenses = applyFilters(analysisState.rawExpenses, analysisState.filters)
            updateComputedState()
        } else {
            expenseStore.clearFilters()
        }
    }

    // Form management (for analysis mode)
    const openExpenseForm = () => {
        if (analysisState) {
            analysisState.showExpenseForm = true
            analysisState.editingExpense = null
        }
    }

    const editExpense = (expense: ProcessedExpenseItem) => {
        if (analysisState) {
            analysisState.editingExpense = expense
            analysisState.showExpenseForm = true
        }
    }

    const closeExpenseForm = () => {
        if (analysisState) {
            analysisState.showExpenseForm = false
            analysisState.editingExpense = null
        }
    }

    // Additional utility functions
    const loadFilterPreferences = () => {
        // For simple mode, we don't have filter preferences in the store
        // This is a no-op for compatibility
        return Promise.resolve()
    }

    // Lazy loading - only load if needed
    const ensureDataLoaded = async (options: ExpenseServiceOptions = {}) => {
        console.log('useExpense: ensureDataLoaded called', {
            enableAdvancedAnalysis,
            forceRefresh: options.forceReload,
            hasAnalysisData: enableAdvancedAnalysis && analysisState ? analysisState.rawExpenses.length : 'N/A',
            hasStoreData: expenseStore.processedExpenses.length,
            isCacheValid: expenseStore.isCacheValid
        })

        // Check if we have data and cache is valid
        if (!options.forceReload) {
            if (enableAdvancedAnalysis && analysisState) {
                // Check analysis state first
                if (analysisState.rawExpenses.length > 0 && expenseStore.isCacheValid) {
                    console.log('useExpense: Using cached analysis data')
                    return analysisState.rawExpenses
                }
                // If analysis state is empty but store has valid cached data, sync it
                if (expenseStore.processedExpenses.length > 0 && expenseStore.isCacheValid) {
                    console.log('useExpense: Syncing store cache to analysis state')
                    analysisState.rawExpenses = expenseStore.processedExpenses
                    analysisState.filteredExpenses = applyFilters(expenseStore.processedExpenses, analysisState.filters)
                    updateComputedState()
                    return analysisState.rawExpenses
                }
            } else {
                if (expenseStore.processedExpenses.length > 0 && expenseStore.isCacheValid) {
                    console.log('useExpense: Using cached store data')
                    return expenseStore.processedExpenses
                }
            }
        }

        // Load data if not cached or force refresh
        console.log('useExpense: Cache miss or force refresh - loading data')
        return await loadExpenses(options)
    }

    const clearCache = () => {
        // Clear service cache directly
        expenseService.clearCache()
        // Clear store cache
        expenseStore.reset()
        // Clear analysis state if available
        if (enableAdvancedAnalysis && analysisState) {
            analysisState.rawExpenses = []
            analysisState.filteredExpenses = []
            analysisState.error = ''
        }
    }

    // Simple cache invalidation and refresh - this is what components should call
    const invalidateAndRefresh = async (): Promise<void> => {
        clearCache()
        await refreshExpenses()
    }

    // Watch for user changes
    let userWatcher: (() => void) | null = null
    const setupUserWatcher = () => {
        userWatcher = watch(() => session.user, (newUser, oldUser) => {
            if (newUser !== oldUser) {
                expenseStore.reset()
                if (analysisState) {
                    analysisState.rawExpenses = []
                    analysisState.filteredExpenses = []
                    analysisState.error = ''
                }
                if (newUser) {
                    loadFilterPreferences()
                    loadExpenses()
                }
            }
        })
    }

    // Initialize
    const initialize = async () => {
        setupUserWatcher()
        if (session.user) {
            loadFilterPreferences()
            if (enableAdvancedAnalysis) {
                await loadExpenses()
            }
        }
    }

    // Cleanup
    onUnmounted(() => {
        if (userWatcher) {
            userWatcher()
        }
    })

    // Auto-initialize
    initialize()

    // Return different APIs based on mode
    const baseApi = {
        // Data
        expenses: filteredExpenses,
        allExpenses,
        loading: computed(() =>
            enableAdvancedAnalysis ? analysisState?.loading : expenseStore.loading
        ),
        error: computed(() =>
            enableAdvancedAnalysis ? analysisState?.error : expenseStore.error
        ),
        groupedExpenses,

        // Store getters (for simple mode)
        medicalExpenses: computed(() => expenseStore.medicalExpenses),
        otherExpenses: computed(() => expenseStore.otherExpenses),
        totalExpenseAmount: computed(() => expenseStore.expenseSummary.totalAmount),
        medicalExpenseAmount: computed(() => expenseStore.expenseSummary.medicalAmount),
        otherExpenseAmount: computed(() => expenseStore.expenseSummary.otherAmount),
        expenseCount: computed(() => expenseStore.expenseSummary.expenseCount),
        totalExpenseCount: computed(() => expenseStore.processedExpenses.length),

        // Direct/Indirect medical expense helpers
        directMedicalExpenses: computed(() =>
            expenseStore.medicalExpenses.filter(expense => expense.isDirect === true)
        ),
        indirectMedicalExpenses: computed(() =>
            expenseStore.medicalExpenses.filter(expense => expense.isDirect === false)
        ),
        directMedicalAmount: computed(() =>
            expenseStore.medicalExpenses
                .filter(expense => expense.isDirect === true)
                .reduce((sum, expense) => sum + expense.amount, 0)
        ),
        indirectMedicalAmount: computed(() =>
            expenseStore.medicalExpenses
                .filter(expense => expense.isDirect === false)
                .reduce((sum, expense) => sum + expense.amount, 0)
        ),

        // Core actions
        loadExpenses,
        refreshExpenses,
        createExpense,
        updateExpense,
        deleteExpense,
        updateFilters,
        resetFilters,
        loadFilterPreferences,
        ensureDataLoaded,
        clearCache,
        invalidateAndRefresh
    }

    if (enableAdvancedAnalysis && analysisState) {
        return {
            ...baseApi,
            // Analysis-specific state
            state: analysisState,
            filters: computed(() => analysisState.filters),

            // Analysis-specific actions grouped for compatibility with ExpenseAnalyzer
            actions: {
                initialize: loadExpenses,
                loadExpenses,
                refreshExpenses,
                updateFilters,
                resetFilters,
                openExpenseForm,
                editExpense,
                closeExpenseForm,
                cancelExpenseForm: closeExpenseForm,
                deleteExpense,
                saveExpense: createExpense
            }
        }
    }

    return baseApi
} 