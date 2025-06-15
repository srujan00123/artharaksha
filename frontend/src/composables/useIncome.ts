/**
 * Unified Income Composable
 * Combines basic income operations with advanced analysis features
 * Supports both simple CRUD operations and complex filtering/grouping
 */

import { ref, computed, watch, onUnmounted, reactive } from 'vue'
import type {
    ProcessedIncomeItem,
    IncomeFilters,
    IncomeFormData,
    IncomeAnalyzerState,
    GroupedIncome,
    IncomeServiceOptions
} from '../types/income'
import { useIncomeStore } from '../stores/income.ts'
import { session } from '../data/session.js'
import { incomeService } from '../services/income-service.ts'
import { getClientTime, getClientDateString, getClientTimezone } from '../utils/date'

// Options interface for the composable
interface UseIncomeOptions {
    enableAdvancedAnalysis?: boolean
}

// Default filters using client timezone - match expense pattern
const getDefaultFilters = (): IncomeFilters => {
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
        incomeType: '',
        isRecurring: null,
        sortBy: 'date',
        sortOrder: 'desc',
        period: 'this-month'
    }
}

export function useIncome(options: UseIncomeOptions = {}) {
    const { enableAdvancedAnalysis = false } = options

    // Use the enhanced store
    const incomeStore = useIncomeStore()

    // Advanced analysis state (only when needed)
    const analysisState: IncomeAnalyzerState | null = enableAdvancedAnalysis ? reactive({
        rawIncomes: [],
        filteredIncomes: [],
        loading: false,
        error: '',
        filters: getDefaultFilters(),
        showIncomeForm: false,
        editingIncome: null,
        groupedIncome: {
            recurring: { items: [], count: 0, total: 0 },
            oneTime: { items: [], count: 0, total: 0 },
            summary: {
                totalMonthlyIncome: 0,
                totalSources: 0,
                recurringIncome: 0,
                oneTimeIncome: 0,
                averageSourceAmount: 0,
                topIncomeType: ''
            }
        },
        summary: {
            totalMonthlyIncome: 0,
            totalSources: 0,
            recurringIncome: 0,
            oneTimeIncome: 0,
            averageSourceAmount: 0,
            topIncomeType: ''
        },
        isEmpty: false,
        hasFilters: false
    }) : null

    // Basic computed properties (always available)
    const filteredIncomes = computed(() =>
        enableAdvancedAnalysis ? analysisState!.filteredIncomes : incomeStore.filteredIncomes
    )
    const allIncomes = computed(() =>
        enableAdvancedAnalysis && analysisState ? analysisState.rawIncomes : incomeStore.incomes
    )

    const groupedIncome = computed(() => {
        if (enableAdvancedAnalysis && analysisState) {
            return analysisState.groupedIncome
        }
        return incomeStore.groupedIncome
    })

    // Advanced filtering function (only when analysis mode is enabled)
    const applyFilters = (incomes: ProcessedIncomeItem[], filters: IncomeFilters): ProcessedIncomeItem[] => {
        if (!enableAdvancedAnalysis) return incomes

        let filtered = [...incomes]

        // Search term filter
        if (filters.searchTerm?.trim()) {
            const searchTerm = filters.searchTerm.toLowerCase().trim()
            filtered = filtered.filter(income => {
                // Search in income sources by type
                return income.sources.some(source =>
                    source.type.toLowerCase().includes(searchTerm)
                )
            })
        }

        // Date range filter - Filter based on income source dateTime
        if (filters.dateFrom || filters.dateTo) {
            filtered = filtered.filter(income => {
                return income.sources.some(source => {
                    const sourceDateStr = source.dateTime.split('T')[0] || source.dateTime.split(' ')[0]

                    if (filters.dateFrom && sourceDateStr < filters.dateFrom) return false
                    if (filters.dateTo && sourceDateStr > filters.dateTo) return false

                    return true
                })
            })
        }

        // Amount range filter
        if (filters.amountMin && !isNaN(parseFloat(filters.amountMin))) {
            filtered = filtered.filter(income => {
                return income.sources.some(source => source.amount >= parseFloat(filters.amountMin))
            })
        }

        if (filters.amountMax && !isNaN(parseFloat(filters.amountMax))) {
            filtered = filtered.filter(income => {
                return income.sources.some(source => source.amount <= parseFloat(filters.amountMax))
            })
        }

        // Income type filter
        if (filters.incomeType) {
            filtered = filtered.filter(income => {
                return income.sources.some(source => source.type === filters.incomeType)
            })
        }

        // Recurring filter
        if (filters.isRecurring !== null) {
            filtered = filtered.filter(income => {
                return income.sources.some(source => source.isRecurring === filters.isRecurring)
            })
        }

        // Sort incomes
        filtered.sort((a, b) => {
            let aVal: any, bVal: any

            switch (filters.sortBy) {
                case 'amount':
                    aVal = a.monthlyIncome
                    bVal = b.monthlyIncome
                    break
                case 'type':
                    aVal = a.sources[0]?.type || ''
                    bVal = b.sources[0]?.type || ''
                    break
                case 'date':
                default:
                    aVal = new Date(a.createdAt)
                    bVal = new Date(b.createdAt)
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

        // Flatten income sources for analysis
        const allSources: any[] = []
        analysisState.filteredIncomes.forEach(income => {
            income.sources.forEach(source => {
                allSources.push({
                    ...source,
                    sourceId: `${income.id}-${source.id}`,
                    incomeId: income.id,
                    createdAt: income.createdAt,
                    updatedAt: income.updatedAt
                })
            })
        })

        // Apply date filtering to sources (since income filtering might include incomes with mixed date sources)
        let filteredSources = allSources
        if (analysisState.filters.dateFrom || analysisState.filters.dateTo) {
            filteredSources = allSources.filter(source => {
                const sourceDateStr = source.dateTime.split('T')[0] || source.dateTime.split(' ')[0]

                if (analysisState.filters.dateFrom && sourceDateStr < analysisState.filters.dateFrom) return false
                if (analysisState.filters.dateTo && sourceDateStr > analysisState.filters.dateTo) return false

                return true
            })
        }

        // Group by recurring/one-time
        const recurring = filteredSources.filter(source => source.isRecurring)
        const oneTime = filteredSources.filter(source => !source.isRecurring)

        const recurringTotal = recurring.reduce((sum, source) => sum + source.amount, 0)
        const oneTimeTotal = oneTime.reduce((sum, source) => sum + source.amount, 0)
        const totalAmount = recurringTotal + oneTimeTotal

        analysisState.groupedIncome = {
            recurring: {
                items: recurring,
                count: recurring.length,
                total: recurringTotal
            },
            oneTime: {
                items: oneTime,
                count: oneTime.length,
                total: oneTimeTotal
            },
            summary: {
                totalMonthlyIncome: totalAmount,
                totalSources: filteredSources.length,
                recurringIncome: recurringTotal,
                oneTimeIncome: oneTimeTotal,
                averageSourceAmount: filteredSources.length > 0 ? totalAmount / filteredSources.length : 0,
                topIncomeType: filteredSources.length > 0 ? filteredSources[0].type : ''
            }
        }

        analysisState.summary = analysisState.groupedIncome.summary
        analysisState.isEmpty = filteredSources.length === 0
        analysisState.hasFilters = Object.values(analysisState.filters).some(value =>
            value !== '' && value !== null && value !== 'date' && value !== 'desc' && value !== 'this-month'
        )
    }

    // Core actions (always available)
    const loadIncomes = async (options: IncomeServiceOptions = {}) => {
        if (enableAdvancedAnalysis && analysisState) {
            // Check if we already have data and cache is valid (unless force refresh)
            if (!options.forceRefresh) {
                // Check analysis state first
                if (analysisState.rawIncomes.length > 0 && incomeStore.isCacheValid) {
                    return analysisState.rawIncomes
                }
                // If analysis state is empty but store has valid cached data, sync it
                if (incomeStore.incomes.length > 0 && incomeStore.isCacheValid) {
                    analysisState.rawIncomes = incomeStore.incomes
                    analysisState.filteredIncomes = applyFilters(incomeStore.incomes, analysisState.filters)
                    updateComputedState()
                    return analysisState.rawIncomes
                }
            }

            try {
                analysisState.loading = true
                analysisState.error = ''

                const incomes = await incomeService.getUserIncome({
                    includeDetails: true,
                    forceReload: options.forceRefresh,
                    useCache: !options.forceRefresh
                })
                analysisState.rawIncomes = incomes
                analysisState.filteredIncomes = applyFilters(incomes, analysisState.filters)
                updateComputedState()
                return incomes
            } catch (error) {
                analysisState.error = error instanceof Error ? error.message : 'Failed to load incomes'
                throw error
            } finally {
                analysisState.loading = false
            }
        } else {
            return await incomeStore.loadIncomes(options)
        }
    }

    const refreshIncomes = async () => {
        return await loadIncomes({ forceRefresh: true })
    }

    const createIncome = async (incomeData: IncomeFormData) => {
        const result = await incomeStore.addIncome(incomeData)
        if (enableAdvancedAnalysis) {
            await refreshIncomes()
        }
        return result
    }

    const updateIncome = async (originalIncome: ProcessedIncomeItem, updatedData: IncomeFormData) => {
        const result = await incomeStore.updateIncome(originalIncome, updatedData)
        if (enableAdvancedAnalysis) {
            await refreshIncomes()
        }
        return result
    }

    const deleteIncome = async (income: ProcessedIncomeItem) => {
        const result = await incomeStore.removeIncome(income)
        if (enableAdvancedAnalysis) {
            await refreshIncomes()
        }
        return result
    }

    // Advanced analysis actions (only when enabled)
    const updateFilters = async (newFilters: Partial<IncomeFilters>) => {
        if (enableAdvancedAnalysis && analysisState) {
            analysisState.filters = { ...analysisState.filters, ...newFilters }
            analysisState.filteredIncomes = applyFilters(analysisState.rawIncomes, analysisState.filters)
            updateComputedState()
        } else {
            incomeStore.updateFilters(newFilters)
        }
    }

    const resetFilters = async () => {
        if (enableAdvancedAnalysis && analysisState) {
            analysisState.filters = getDefaultFilters()
            analysisState.filteredIncomes = applyFilters(analysisState.rawIncomes, analysisState.filters)
            updateComputedState()
        } else {
            incomeStore.resetFilters()
        }
    }

    // Form management (for analysis mode)
    const openIncomeForm = () => {
        if (analysisState) {
            analysisState.showIncomeForm = true
            analysisState.editingIncome = null
        }
    }

    const editIncome = (income: ProcessedIncomeItem) => {
        if (analysisState) {
            analysisState.editingIncome = income
            analysisState.showIncomeForm = true
        }
    }

    const closeIncomeForm = () => {
        if (analysisState) {
            analysisState.showIncomeForm = false
            analysisState.editingIncome = null
        }
    }

    // Additional utility functions
    const loadIncomeTypes = async (options: IncomeServiceOptions = {}) => {
        return await incomeStore.loadIncomeTypes(options)
    }

    const getMonthlySummary = async (options: IncomeServiceOptions = {}) => {
        return await incomeStore.getMonthlySummary(options)
    }

    const loadFilterPreferences = () => {
        return incomeStore.loadFilterPreferences()
    }

    const clearCache = () => {
        incomeStore.clearCache()
        incomeService.clearCache()
    }

    // Simple cache invalidation and refresh - this is what components should call
    const invalidateAndRefresh = async (): Promise<void> => {
        clearCache()
        await refreshIncomes()
    }

    const clearIncomeCache = () => {
        incomeStore.clearCache()
        incomeService.clearIncomeCache()
    }

    // Lazy loading - only load if needed
    const ensureDataLoaded = async (options: IncomeServiceOptions = {}) => {
        // Check if we have data and cache is valid
        if (!options.forceRefresh) {
            if (enableAdvancedAnalysis && analysisState) {
                // Check analysis state first
                if (analysisState.rawIncomes.length > 0 && incomeStore.isCacheValid) {
                    return analysisState.rawIncomes
                }
                // If analysis state is empty but store has valid cached data, sync it
                if (incomeStore.incomes.length > 0 && incomeStore.isCacheValid) {
                    analysisState.rawIncomes = incomeStore.incomes
                    analysisState.filteredIncomes = applyFilters(incomeStore.incomes, analysisState.filters)
                    updateComputedState()
                    return analysisState.rawIncomes
                }
            } else {
                if (incomeStore.incomes.length > 0 && incomeStore.isCacheValid) {
                    return incomeStore.incomes
                }
            }
        }

        // Load data if not cached or force refresh
        return await loadIncomes(options)
    }

    // Watch for user changes
    let userWatcher: (() => void) | null = null
    const setupUserWatcher = () => {
        userWatcher = watch(() => session.user, (newUser, oldUser) => {
            if (newUser !== oldUser) {
                incomeStore.reset()
                if (analysisState) {
                    analysisState.rawIncomes = []
                    analysisState.filteredIncomes = []
                    analysisState.error = ''
                }
                if (newUser) {
                    loadFilterPreferences()
                }
            }
        })
    }

    // Initialize (manual - no auto-loading)
    const initialize = async (options: { loadData?: boolean } = {}) => {
        setupUserWatcher()
        if (session.user) {
            loadFilterPreferences()
            // Only load data if explicitly requested
            if (options.loadData) {
                await loadIncomes()
            }
        }
    }

    // Cleanup
    onUnmounted(() => {
        if (userWatcher) {
            userWatcher()
        }
    })

    // Setup user watcher immediately but don't auto-load data
    setupUserWatcher()

    // Return different APIs based on mode
    const baseApi = {
        // Data
        incomes: filteredIncomes,
        allIncomes,
        loading: computed(() =>
            enableAdvancedAnalysis ? analysisState?.loading : incomeStore.loading
        ),
        error: computed(() =>
            enableAdvancedAnalysis ? analysisState?.error : incomeStore.error
        ),
        groupedIncome,

        // Store getters (for simple mode) - but in analysis mode, use analysis state
        recurringIncomes: computed(() =>
            enableAdvancedAnalysis && analysisState ?
                analysisState.groupedIncome.recurring.items :
                incomeStore.recurringIncomes
        ),
        oneTimeIncomes: computed(() =>
            enableAdvancedAnalysis && analysisState ?
                analysisState.groupedIncome.oneTime.items :
                incomeStore.oneTimeIncomes
        ),
        totalMonthlyIncome: computed(() =>
            enableAdvancedAnalysis && analysisState ?
                analysisState.summary.totalMonthlyIncome :
                incomeStore.totalMonthlyIncome
        ),
        totalRecurringIncome: computed(() =>
            enableAdvancedAnalysis && analysisState ?
                analysisState.summary.recurringIncome :
                incomeStore.totalRecurringIncome
        ),
        totalOneTimeIncome: computed(() =>
            enableAdvancedAnalysis && analysisState ?
                analysisState.summary.oneTimeIncome :
                incomeStore.totalOneTimeIncome
        ),
        incomeCount: computed(() =>
            enableAdvancedAnalysis && analysisState ?
                analysisState.summary.totalSources :
                incomeStore.incomeCount
        ),
        totalIncomeCount: computed(() => incomeStore.totalIncomeCount),
        incomeTypes: computed(() => incomeStore.incomeTypes),

        // Core actions
        loadIncomes,
        refreshIncomes,
        createIncome,
        updateIncome,
        deleteIncome,
        updateFilters,
        resetFilters,
        loadIncomeTypes,
        getMonthlySummary,
        loadFilterPreferences,
        clearCache,
        invalidateAndRefresh,
        ensureDataLoaded,
        initialize
    }

    if (enableAdvancedAnalysis && analysisState) {
        return {
            ...baseApi,
            // Analysis-specific state
            state: analysisState,
            filters: computed(() => analysisState.filters),

            // Analysis-specific actions grouped for compatibility with IncomeAnalyzer
            actions: {
                initialize,
                loadIncomes,
                refreshIncomes,
                updateFilters,
                resetFilters,
                openIncomeForm,
                editIncome,
                closeIncomeForm,
                cancelIncomeForm: closeIncomeForm,
                deleteIncome,
                saveIncome: createIncome,
                loadIncomeTypes,
                getMonthlySummary,
                ensureDataLoaded
            }
        }
    }

    return baseApi
} 