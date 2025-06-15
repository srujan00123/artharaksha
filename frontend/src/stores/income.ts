/**
 * Income Store
 * Pinia store for income management
 * Uses consistent types from types/income.ts
 */

import { defineStore } from 'pinia'
import { incomeService } from '../services/income-service.ts'
import { getClientTime, getClientDateString, getClientTimezone } from '../utils/date'
import type {
    ProcessedIncomeItem,
    IncomeType,
    IncomeFilters,
    IncomeFormData,
    IncomeSourceFormData,
    IncomeSummary,
    GroupedIncome,
    IncomeServiceOptions,
    IncomeStoreState
} from '../types/income'

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

export const useIncomeStore = defineStore('income', {
    state: (): IncomeStoreState => ({
        // Core data
        incomes: [],
        incomeTypes: [],

        // UI state
        loading: false,
        error: '',

        // Filters
        filters: getDefaultFilters(),

        // Cache management
        lastFetch: null,
        cacheExpiry: 5 * 60 * 1000 // 5 minutes
    }),

    getters: {
        // Filtered incomes based on current filters
        filteredIncomes: (state): ProcessedIncomeItem[] => {
            return incomeService.filterIncomes(state.incomes, state.filters)
        },

        // Grouped income data
        groupedIncome: (state): GroupedIncome => {
            const filtered = incomeService.filterIncomes(state.incomes, state.filters)
            return incomeService.groupIncomeByType(filtered)
        },

        // Summary statistics
        incomeSummary: (state): IncomeSummary => {
            const filtered = incomeService.filterIncomes(state.incomes, state.filters)
            return incomeService.calculateIncomeStats(filtered)
        },

        // Recurring income sources
        recurringIncomes: (state): ProcessedIncomeItem[] => {
            const filtered = incomeService.filterIncomes(state.incomes, state.filters)
            return filtered.filter(income =>
                income.sources.some(source => source.isRecurring)
            )
        },

        // One-time income sources
        oneTimeIncomes: (state): ProcessedIncomeItem[] => {
            const filtered = incomeService.filterIncomes(state.incomes, state.filters)
            return filtered.filter(income =>
                income.sources.some(source => !source.isRecurring)
            )
        },

        // Total monthly income (recurring + one-time for current month) - uses filtered data
        totalMonthlyIncome: (state): number => {
            const filtered = incomeService.filterIncomes(state.incomes, state.filters)
            return incomeService.calculateTotalMonthlyIncome(filtered)
        },

        // Total recurring income - uses filtered data
        totalRecurringIncome: (state): number => {
            let total = 0
            const filtered = incomeService.filterIncomes(state.incomes, state.filters)
            filtered.forEach(income => {
                income.sources.forEach(source => {
                    if (source.isRecurring) {
                        total += source.amount
                    }
                })
            })
            return total
        },

        // Total one-time income (for current month only) - uses filtered data
        totalOneTimeIncome: (state): number => {
            const now = new Date()
            const currentYear = now.getFullYear()
            const currentMonth = now.getMonth()

            let total = 0
            const filtered = incomeService.filterIncomes(state.incomes, state.filters)
            filtered.forEach(income => {
                income.sources.forEach(source => {
                    if (!source.isRecurring) {
                        const sourceDate = new Date(source.dateTime)
                        if (sourceDate.getFullYear() === currentYear && sourceDate.getMonth() === currentMonth) {
                            total += source.amount
                        }
                    }
                })
            })
            return total
        },

        // Income count (total number of income sources)
        incomeCount: (state): number => {
            let totalSources = 0
            const filteredIncomes = incomeService.filterIncomes(state.incomes, state.filters)
            filteredIncomes.forEach(income => {
                if (income.sources && Array.isArray(income.sources)) {
                    totalSources += income.sources.length
                }
            })
            return totalSources
        },

        // Income record count (number of income documents)
        incomeRecordCount: (state): number => {
            return incomeService.filterIncomes(state.incomes, state.filters).length
        },

        // Total income count (unfiltered)
        totalIncomeCount: (state): number => {
            return state.incomes.length
        },

        // Total income sources count (unfiltered)
        totalIncomeSourcesCount: (state): number => {
            let totalSources = 0
            state.incomes.forEach(income => {
                if (income.sources && Array.isArray(income.sources)) {
                    totalSources += income.sources.length
                }
            })
            return totalSources
        },

        // Check if cache is valid
        isCacheValid: (state): boolean => {
            if (!state.lastFetch) {
                return false
            }

            const isValid = Date.now() - state.lastFetch < state.cacheExpiry
            return isValid
        },

        // Check if filters are applied
        hasActiveFilters: (state): boolean => {
            const defaultFilters = getDefaultFilters()
            return Object.keys(state.filters).some(key => {
                const currentValue = state.filters[key as keyof IncomeFilters]
                const defaultValue = defaultFilters[key as keyof IncomeFilters]
                return currentValue !== defaultValue && currentValue !== '' && currentValue !== null
            })
        },

        // Available income types for filtering
        availableIncomeTypes: (state): string[] => {
            const types = new Set<string>()
            state.incomes.forEach(income => {
                income.sources.forEach(source => {
                    types.add(source.type)
                })
            })
            return Array.from(types).sort()
        }
    },

    actions: {
        /**
         * Load income records
         */
        async loadIncomes(options: IncomeServiceOptions = {}): Promise<ProcessedIncomeItem[]> {
            const { forceRefresh = false } = options

            try {
                // Check cache validity
                if (!forceRefresh && this.isCacheValid && this.incomes.length > 0) {
                    return this.incomes
                }

                this.loading = true
                this.error = ''

                const incomes = await incomeService.getUserIncome({
                    useCache: !forceRefresh,
                    forceReload: forceRefresh,
                    includeDetails: true
                })

                this.incomes = incomes
                this.lastFetch = Date.now()

                return incomes
            } catch (error: any) {
                this.error = error.message || 'Failed to load income records'
                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Load income types
         */
        async loadIncomeTypes(options: IncomeServiceOptions = {}): Promise<IncomeType[]> {
            try {
                const incomeTypes = await incomeService.getIncomeTypes(options)
                this.incomeTypes = incomeTypes
                return incomeTypes
            } catch (error: any) {
                this.error = error.message || 'Failed to load income types'
                throw error
            }
        },

        /**
         * Get monthly summary
         */
        async getMonthlySummary(options: IncomeServiceOptions = {}): Promise<IncomeSummary> {
            try {
                return await incomeService.getMonthlySummary(options)
            } catch (error: any) {
                this.error = error.message || 'Failed to get monthly summary'
                throw error
            }
        },

        /**
         * Refresh incomes (force reload)
         */
        async refreshIncomes(): Promise<ProcessedIncomeItem[]> {
            return await this.loadIncomes({ forceRefresh: true })
        },

        /**
         * Add new income
         */
        async addIncome(formData: IncomeFormData): Promise<ProcessedIncomeItem> {
            try {
                this.loading = true
                this.error = ''

                const newIncome = await incomeService.createOrUpdateIncome(formData)

                // Add to local state
                this.incomes.unshift(newIncome)
                this.lastFetch = Date.now()

                return newIncome
            } catch (error: any) {
                this.error = error.message || 'Failed to add income'
                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Update existing income
         */
        async updateIncome(originalIncome: ProcessedIncomeItem, updatedData: IncomeFormData): Promise<ProcessedIncomeItem> {
            try {
                this.loading = true
                this.error = ''

                const updatedIncome = await incomeService.createOrUpdateIncome(updatedData, originalIncome)

                // Update in local state
                const index = this.incomes.findIndex(income => income.id === originalIncome.id)
                if (index !== -1) {
                    this.incomes[index] = updatedIncome
                }

                this.lastFetch = Date.now()
                return updatedIncome
            } catch (error: any) {
                this.error = error.message || 'Failed to update income'
                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Remove income
         */
        async removeIncome(income: ProcessedIncomeItem): Promise<void> {
            try {
                this.loading = true
                this.error = ''

                await incomeService.deleteIncome(income.id)

                // Remove from local state
                const index = this.incomes.findIndex(i => i.id === income.id)
                if (index !== -1) {
                    this.incomes.splice(index, 1)
                }

                this.lastFetch = Date.now()
            } catch (error: any) {
                this.error = error.message || 'Failed to remove income'
                throw error
            } finally {
                this.loading = false
            }
        },

        /**
         * Update filters
         */
        updateFilters(newFilters: Partial<IncomeFilters>): void {
            this.filters = { ...this.filters, ...newFilters }
            this.saveFilterPreferences()
        },

        /**
         * Reset filters to default
         */
        resetFilters(): void {
            this.filters = getDefaultFilters()
            this.saveFilterPreferences()
        },

        /**
         * Save filter preferences to localStorage
         */
        saveFilterPreferences(): void {
            try {
                localStorage.setItem('artha_income_filters', JSON.stringify(this.filters))
            } catch (error) {
                console.warn('Failed to save filter preferences:', error)
            }
        },

        /**
         * Load filter preferences from localStorage
         */
        loadFilterPreferences(): void {
            try {
                const saved = localStorage.getItem('artha_income_filters')
                if (saved) {
                    const parsedFilters = JSON.parse(saved)
                    this.filters = { ...getDefaultFilters(), ...parsedFilters }
                }
            } catch (error) {
                console.warn('Failed to load filter preferences:', error)
                this.filters = getDefaultFilters()
            }
        },

        /**
         * Clear cache
         */
        clearCache(): void {
            this.incomes = []
            this.incomeTypes = []
            this.lastFetch = null
            this.error = ''
            incomeService.clearCache()
        },

        /**
         * Reset store to initial state
         */
        reset(): void {
            this.incomes = []
            this.incomeTypes = []
            this.loading = false
            this.error = ''
            this.filters = getDefaultFilters()
            this.lastFetch = null
            incomeService.reset()
        },

        /**
         * Get date range for quick filter
         */
        getDateRangeForQuickFilter(filter: string): { from: string; to: string } | null {
            const now = new Date()
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

            switch (filter) {
                case 'today':
                    return {
                        from: today.toISOString().split('T')[0],
                        to: today.toISOString().split('T')[0]
                    }

                case 'this-week': {
                    const startOfWeek = new Date(today)
                    startOfWeek.setDate(today.getDate() - today.getDay())
                    return {
                        from: startOfWeek.toISOString().split('T')[0],
                        to: today.toISOString().split('T')[0]
                    }
                }

                case 'this-month': {
                    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
                    return {
                        from: startOfMonth.toISOString().split('T')[0],
                        to: today.toISOString().split('T')[0]
                    }
                }

                case 'last-month': {
                    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
                    const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
                    return {
                        from: startOfLastMonth.toISOString().split('T')[0],
                        to: endOfLastMonth.toISOString().split('T')[0]
                    }
                }

                case 'last-3-months': {
                    const threeMonthsAgo = new Date(today)
                    threeMonthsAgo.setMonth(today.getMonth() - 3)
                    return {
                        from: threeMonthsAgo.toISOString().split('T')[0],
                        to: today.toISOString().split('T')[0]
                    }
                }

                case 'this-year': {
                    const startOfYear = new Date(today.getFullYear(), 0, 1)
                    return {
                        from: startOfYear.toISOString().split('T')[0],
                        to: today.toISOString().split('T')[0]
                    }
                }

                default:
                    return null
            }
        },

        /**
         * Get cache statistics
         */
        getCacheStats(): Record<string, any> {
            return {
                incomesCount: this.incomes.length,
                incomeTypesCount: this.incomeTypes.length,
                lastFetch: this.lastFetch,
                cacheValid: this.isCacheValid,
                serviceStats: incomeService.getCacheStats()
            }
        }
    }
}) 