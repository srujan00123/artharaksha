/**
 * Income Service
 * Handles all income-related API operations and data transformations
 * Uses consistent types from types/income.ts
 */

import { apiService, API_ENDPOINTS } from './api-service.js'
import { cacheService, CACHE_KEYS } from './cache-service.js'
import { householdService } from './household-service.js'
import { session } from '../data/session.js'
import type {
    ProcessedIncomeItem,
    ProcessedIncomeSource,
    IncomeSourceType,
    IncomeFormData,
    IncomeSourceFormData,
    IncomeFilters,
    IncomeServiceOptions,
    IncomeValidationResult,
    GroupedIncome,
    IncomeSummary,
    IncomeType,
    BackendIncome,
    BackendIncomeSourceType,
    IncomeAPIPayload
} from '../types/income'

// Cache configuration uses centralized CACHE_KEYS
const CACHE_EXPIRY = {
    INCOME_TYPES: 30 * 60 * 1000, // 30 minutes
    USER_INCOME: 5 * 60 * 1000,   // 5 minutes
    MONTHLY_SUMMARY: 10 * 60 * 1000 // 10 minutes
}

/**
 * Transform backend income record to frontend format
 */
const transformIncomeRecord = (record: BackendIncome): ProcessedIncomeItem | null => {
    if (!record) return null

    return {
        id: record.name,
        householdProfile: record.household_profile,
        monthlyIncome: Number(record.monthly_income) || 0,
        sources: (record.income_source || []).map(transformIncomeSource).filter(Boolean) as ProcessedIncomeSource[],
        createdAt: record.creation,
        updatedAt: record.modified,
        owner: record.owner
    }
}

/**
 * Transform backend income source to frontend format
 */
const transformIncomeSource = (source: BackendIncomeSourceType): ProcessedIncomeSource | null => {
    if (!source) return null

    return {
        id: source.name || source.idx?.toString() || `${source.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: source.type || '',
        amount: Number(source.income) || 0,
        isRecurring: Boolean(source.recur),
        dateTime: source.date_time || new Date().toISOString(),
        frequency: source.recur_frequency || undefined
    }
}

/**
 * Transform frontend form data to backend format
 */
const transformFormDataToBackend = (formData: IncomeFormData): IncomeAPIPayload => {
    return {
        monthly_income: formData.monthlyIncome,
        income_source: formData.sources.map(source => ({
            type: source.type,
            income: source.amount,
            recur: source.isRecurring ? 1 : 0,
            date_time: source.dateTime,
            recur_frequency: source.frequency || undefined
        }))
    }
}

/**
 * Transform single income source form data to backend format
 */
const transformSourceFormDataToBackend = (formData: IncomeSourceFormData): Partial<BackendIncomeSourceType> => {
    return {
        type: formData.type,
        income: formData.amount,
        recur: formData.isRecurring ? 1 : 0,
        date_time: formData.dateTime,
        recur_frequency: formData.frequency || undefined
    }
}

/**
 * Income Service Class
 */
export class IncomeService {
    private currentIncomes: ProcessedIncomeItem[] = []

    /**
     * Get all available income types
     */
    async getIncomeTypes(options: IncomeServiceOptions = {}): Promise<IncomeType[]> {
        const { useCache = true, forceRefresh = false } = options

        try {
            // Check cache first
            if (useCache && !forceRefresh) {
                const cached = cacheService.get(CACHE_KEYS.INCOME_TYPES)
                if (cached) {
                    return cached
                }
            }

            const listResource = apiService.createListResource({
                url: API_ENDPOINTS.INCOME.TYPES,
                doctype: 'Income Type',
                fields: ['name', 'type'],
                orderBy: 'type'
            })

            await apiService.execute(listResource.reload)
            const incomeTypes = listResource.data || []

            // Cache the result
            if (useCache) {
                cacheService.set(CACHE_KEYS.INCOME_TYPES, incomeTypes, CACHE_EXPIRY.INCOME_TYPES)
            }

            return incomeTypes
        } catch (error) {
            console.error('IncomeService: Failed to fetch income types:', error)
            throw new Error(`Failed to load income types: ${error.message}`)
        }
    }

    /**
     * Get user's income records with proper field mapping
     */
    async getUserIncome(options: IncomeServiceOptions = {}): Promise<ProcessedIncomeItem[]> {
        const { useCache = true, forceReload = false, includeDetails = false } = options

        try {
            // Get current household profile
            const profile = await householdService.getCurrentProfile()
            if (!profile) {
                throw new Error('No household profile found')
            }

            // Check cache first
            if (useCache && !forceReload) {
                const cached = cacheService.get(CACHE_KEYS.USER_INCOME, {
                    userId: session.user,
                    profileId: profile.name
                })
                if (cached) {
                    this.currentIncomes = cached
                    return cached
                }
            }

            // Create list resource with only existing fields
            const listResource = apiService.createListResource({
                url: API_ENDPOINTS.INCOME.LIST,
                doctype: 'Income',
                fields: [
                    'name', 'household_profile', 'monthly_income', 'creation', 'modified'
                ],
                filters: {
                    household_profile: profile.name
                },
                orderBy: 'creation desc'
            })

            await apiService.execute(listResource.reload)
            const incomes = listResource.data || []

            // Process and enhance income data
            const processedIncomes: ProcessedIncomeItem[] = []
            for (const doc of incomes) {
                try {
                    // Load complete document with child table data
                    const docResource = apiService.createDocumentResource({
                        doctype: 'Income',
                        name: doc.name
                    })
                    await apiService.execute(docResource.reload)
                    const completeIncome = transformIncomeRecord(docResource.doc)
                    if (completeIncome) {
                        processedIncomes.push(completeIncome)
                    }
                } catch (docError) {
                    // If we can't load the complete document, use the basic data
                    const basicIncome = transformIncomeRecord(doc)
                    if (basicIncome) {
                        processedIncomes.push(basicIncome)
                    }
                }
            }

            // Cache the result
            if (useCache) {
                cacheService.set(CACHE_KEYS.USER_INCOME, processedIncomes, {
                    userId: session.user,
                    profileId: profile.name
                })
            }

            this.currentIncomes = processedIncomes
            return processedIncomes
        } catch (error) {
            console.error('IncomeService: Failed to fetch user income:', error)
            throw new Error(`Failed to load income records: ${error.message}`)
        }
    }

    /**
     * Get monthly income summary for CHE analysis
     */
    async getMonthlySummary(options: IncomeServiceOptions = {}): Promise<IncomeSummary> {
        const { useCache = true, forceRefresh = false } = options

        try {
            // Get current household profile
            const profile = await householdService.getCurrentProfile()
            if (!profile) {
                throw new Error('No household profile found')
            }

            // Check cache first
            if (useCache && !forceRefresh) {
                const cached = cacheService.get(CACHE_KEYS.MONTHLY_SUMMARY, {
                    userId: session.user,
                    profileId: profile.name
                })
                if (cached) {
                    return cached
                }
            }

            // Get user income data
            const incomes = await this.getUserIncome({ useCache, forceReload: forceRefresh })

            // Calculate summary
            const summary = this.calculateIncomeStats(incomes)

            // Cache the result
            if (useCache) {
                cacheService.set(CACHE_KEYS.MONTHLY_SUMMARY, summary, {
                    userId: session.user,
                    profileId: profile.name
                })
            }

            return summary
        } catch (error) {
            console.error('IncomeService: Failed to get monthly summary:', error)
            throw new Error(`Failed to get monthly summary: ${error.message}`)
        }
    }

    /**
     * Create or update income record
     */
    async createOrUpdateIncome(formData: IncomeFormData, existingIncome: ProcessedIncomeItem | null = null): Promise<ProcessedIncomeItem> {
        try {
            // Get current household profile
            const profile = await householdService.getCurrentProfile()
            if (!profile) {
                throw new Error('No household profile found')
            }

            // Validate form data
            const validation = this.validateIncomeData(formData)
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${Object.values(validation.errors).join(', ')}`)
            }

            // Transform to backend format
            const backendData = transformFormDataToBackend(formData)

            // Use the custom backend API
            const callResource = apiService.createResource({
                url: API_ENDPOINTS.INCOME.CREATE_OR_UPDATE,
                params: {
                    monthly_income: backendData.monthly_income,
                    income_source: JSON.stringify(backendData.income_source),
                    income_name: existingIncome?.id || null
                }
            })

            await apiService.execute(callResource.fetch)
            const response = callResource.data

            if (!response || !response.name) {
                throw new Error('Invalid response from server')
            }

            // Fetch the complete updated record
            const docResource = apiService.createDocumentResource({
                doctype: 'Income',
                name: response.name
            })

            await apiService.execute(docResource.reload)
            const transformed = transformIncomeRecord(docResource.doc)
            if (!transformed) {
                throw new Error('Failed to transform income record')
            }

            // Clear cache to force refresh
            this.clearIncomeCache()

            return transformed
        } catch (error) {
            console.error('IncomeService: Failed to create/update income:', error)
            throw new Error(`Failed to save income: ${error.message}`)
        }
    }

    /**
     * Delete income record
     */
    async deleteIncome(incomeId: string): Promise<void> {
        try {
            const deleteResource = apiService.createResource({
                url: API_ENDPOINTS.INCOME.DELETE,
                params: {
                    doctype: 'Income',
                    name: incomeId
                }
            })

            await apiService.execute(deleteResource.fetch)

            // Clear cache to force refresh
            this.clearIncomeCache()
        } catch (error) {
            console.error('IncomeService: Failed to delete income:', error)
            throw new Error(`Failed to delete income: ${error.message}`)
        }
    }

    /**
     * Validate income form data
     */
    validateIncomeData(formData: IncomeFormData): IncomeValidationResult {
        const errors: Record<string, string> = {}

        if (!formData.monthlyIncome || formData.monthlyIncome <= 0) {
            errors.monthlyIncome = 'Monthly income must be greater than 0'
        }

        if (!formData.sources || formData.sources.length === 0) {
            errors.sources = 'At least one income source is required'
        } else {
            formData.sources.forEach((source, index) => {
                if (!source.type) {
                    errors[`sources.${index}.type`] = 'Income type is required'
                }
                if (!source.amount || source.amount <= 0) {
                    errors[`sources.${index}.amount`] = 'Amount must be greater than 0'
                }
                if (!source.dateTime) {
                    errors[`sources.${index}.dateTime`] = 'Date is required'
                }
                if (source.isRecurring && !source.frequency) {
                    errors[`sources.${index}.frequency`] = 'Frequency is required for recurring income'
                }
            })
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        }
    }

    /**
     * Calculate total monthly income including one-time sources for a specific month
     */
    calculateTotalMonthlyIncome(incomes: ProcessedIncomeItem[], targetMonth?: Date): number {
        const target = targetMonth || new Date()
        const targetYear = target.getFullYear()
        const targetMonthNum = target.getMonth()

        let totalMonthlyIncome = 0

        incomes.forEach(income => {
            // Add recurring monthly income (this is already calculated monthly)
            totalMonthlyIncome += income.monthlyIncome

            // Add one-time sources that were added in the target month
            income.sources.forEach(source => {
                if (!source.isRecurring) {
                    const sourceDate = new Date(source.dateTime)
                    if (sourceDate.getFullYear() === targetYear && sourceDate.getMonth() === targetMonthNum) {
                        totalMonthlyIncome += source.amount
                    }
                }
            })
        })

        return totalMonthlyIncome
    }

    /**
     * Calculate income statistics
     */
    calculateIncomeStats(incomes: ProcessedIncomeItem[], targetMonth?: Date): IncomeSummary {
        const target = targetMonth || new Date()
        const targetYear = target.getFullYear()
        const targetMonthNum = target.getMonth()

        let totalSources = 0
        let recurringIncome = 0
        let oneTimeIncome = 0
        let oneTimeIncomeThisMonth = 0
        const typeAmounts: Record<string, number> = {}

        incomes.forEach(income => {
            income.sources.forEach(source => {
                totalSources++

                // Track by type
                if (!typeAmounts[source.type]) {
                    typeAmounts[source.type] = 0
                }
                typeAmounts[source.type] += source.amount

                // Categorize by recurring status
                if (source.isRecurring) {
                    recurringIncome += source.amount
                } else {
                    oneTimeIncome += source.amount

                    // Check if one-time income is from target month
                    const sourceDate = new Date(source.dateTime)
                    if (sourceDate.getFullYear() === targetYear && sourceDate.getMonth() === targetMonthNum) {
                        oneTimeIncomeThisMonth += source.amount
                    }
                }
            })
        })

        // Calculate total monthly income (recurring + one-time for this month)
        const totalMonthlyIncome = incomes.reduce((sum, income) => sum + income.monthlyIncome, 0) + oneTimeIncomeThisMonth

        // Find top income type
        let topIncomeType = ''
        let maxAmount = 0
        Object.entries(typeAmounts).forEach(([type, amount]) => {
            if (amount > maxAmount) {
                maxAmount = amount
                topIncomeType = type
            }
        })

        return {
            totalMonthlyIncome,
            totalSources,
            recurringIncome,
            oneTimeIncome: oneTimeIncomeThisMonth, // Only count one-time income for this month
            averageSourceAmount: totalSources > 0 ? (recurringIncome + oneTimeIncome) / totalSources : 0,
            topIncomeType
        }
    }

    /**
     * Group income sources by type
     */
    groupIncomeByType(incomes: ProcessedIncomeItem[], targetMonth?: Date): GroupedIncome {
        const target = targetMonth || new Date()
        const targetYear = target.getFullYear()
        const targetMonthNum = target.getMonth()

        const recurring: ProcessedIncomeSource[] = []
        const oneTimeThisMonth: ProcessedIncomeSource[] = []

        incomes.forEach(income => {
            income.sources.forEach(source => {
                if (source.isRecurring) {
                    recurring.push(source)
                } else {
                    // Only include one-time sources from the target month
                    const sourceDate = new Date(source.dateTime)
                    if (sourceDate.getFullYear() === targetYear && sourceDate.getMonth() === targetMonthNum) {
                        oneTimeThisMonth.push(source)
                    }
                }
            })
        })

        const summary = this.calculateIncomeStats(incomes, targetMonth)

        return {
            recurring: {
                items: recurring,
                count: recurring.length,
                total: recurring.reduce((sum, source) => sum + source.amount, 0)
            },
            oneTime: {
                items: oneTimeThisMonth,
                count: oneTimeThisMonth.length,
                total: oneTimeThisMonth.reduce((sum, source) => sum + source.amount, 0)
            },
            summary
        }
    }

    /**
     * Filter incomes based on criteria
     */
    filterIncomes(incomes: ProcessedIncomeItem[], filters: IncomeFilters): ProcessedIncomeItem[] {
        return incomes.filter(income => {
            // Search term filter
            if (filters.searchTerm) {
                const searchLower = filters.searchTerm.toLowerCase()
                const matchesSearch = income.sources.some(source =>
                    source.type.toLowerCase().includes(searchLower)
                )
                if (!matchesSearch) return false
            }

            // Income type filter
            if (filters.incomeType) {
                const hasType = income.sources.some(source => source.type === filters.incomeType)
                if (!hasType) return false
            }

            // Recurring filter
            if (filters.isRecurring !== null) {
                const hasRecurringMatch = income.sources.some(source =>
                    source.isRecurring === filters.isRecurring
                )
                if (!hasRecurringMatch) return false
            }

            // Date range filter - Fixed to properly handle dateTime field
            if (filters.dateFrom || filters.dateTo) {
                const hasDateMatch = income.sources.some(source => {
                    // Extract date part from dateTime field (handles both ISO strings and date-only strings)
                    let sourceDateStr: string
                    if (source.dateTime) {
                        // Handle ISO datetime strings (e.g., "2024-01-15T10:30:00Z") or date strings (e.g., "2024-01-15")
                        sourceDateStr = source.dateTime.split('T')[0]
                    } else {
                        // Fallback to creation date if dateTime is not available
                        sourceDateStr = new Date(income.createdAt).toISOString().split('T')[0]
                    }

                    // Compare dates in YYYY-MM-DD format
                    if (filters.dateFrom && sourceDateStr < filters.dateFrom) return false
                    if (filters.dateTo && sourceDateStr > filters.dateTo) return false

                    return true
                })
                if (!hasDateMatch) return false
            }

            // Amount range filter
            if (filters.amountMin || filters.amountMax) {
                const hasAmountMatch = income.sources.some(source => {
                    if (filters.amountMin && source.amount < parseFloat(filters.amountMin)) return false
                    if (filters.amountMax && source.amount > parseFloat(filters.amountMax)) return false
                    return true
                })
                if (!hasAmountMatch) return false
            }

            return true
        }).sort((a, b) => {
            // Apply sorting
            const sortBy = filters.sortBy || 'date'
            const sortOrder = filters.sortOrder || 'desc'

            let comparison = 0

            switch (sortBy) {
                case 'amount':
                    comparison = a.monthlyIncome - b.monthlyIncome
                    break
                case 'type':
                    const aType = a.sources[0]?.type || ''
                    const bType = b.sources[0]?.type || ''
                    comparison = aType.localeCompare(bType)
                    break
                case 'date':
                default:
                    // Sort by the most recent dateTime from sources, fallback to createdAt
                    const aDate = a.sources.reduce((latest, source) => {
                        const sourceDate = source.dateTime ? new Date(source.dateTime) : new Date(a.createdAt)
                        return sourceDate > latest ? sourceDate : latest
                    }, new Date(a.createdAt))

                    const bDate = b.sources.reduce((latest, source) => {
                        const sourceDate = source.dateTime ? new Date(source.dateTime) : new Date(b.createdAt)
                        return sourceDate > latest ? sourceDate : latest
                    }, new Date(b.createdAt))

                    comparison = aDate.getTime() - bDate.getTime()
                    break
            }

            return sortOrder === 'desc' ? -comparison : comparison
        })
    }

    /**
     * Clear income-related cache with optional selective clearing
     */
    clearCache(userId: string | null = null, cacheTypes: string[] | null = null): void {
        const targetUserId = userId || session.user

        if (cacheTypes) {
            // Clear specific cache types
            cacheTypes.forEach(type => {
                switch (type) {
                    case 'income':
                        cacheService.delete(CACHE_KEYS.USER_INCOME, { userId: targetUserId })
                        break
                    case 'summary':
                        cacheService.delete(CACHE_KEYS.MONTHLY_SUMMARY, { userId: targetUserId })
                        break
                    case 'types':
                        cacheService.delete(CACHE_KEYS.INCOME_TYPES)
                        break
                }
            })
        } else {
            // Clear all income-related cache
            cacheService.delete(CACHE_KEYS.USER_INCOME, { userId: targetUserId })
            cacheService.delete(CACHE_KEYS.MONTHLY_SUMMARY, { userId: targetUserId })
            cacheService.delete(CACHE_KEYS.INCOME_TYPES)
        }
    }

    /**
     * Clear income cache specifically
     */
    clearIncomeCache(userId: string | null = null): void {
        const targetUserId = userId || session.user
        cacheService.delete(CACHE_KEYS.USER_INCOME, { userId: targetUserId })
        cacheService.delete(CACHE_KEYS.MONTHLY_SUMMARY, { userId: targetUserId })
    }

    /**
     * Reset service state
     */
    reset(): void {
        this.currentIncomes = []
        this.clearCache()
    }

    /**
     * Get cached incomes
     */
    getCachedIncomes(): ProcessedIncomeItem[] {
        return this.currentIncomes
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): Record<string, any> {
        return {
            currentIncomesCount: this.currentIncomes.length,
            cacheKeys: Object.keys(CACHE_KEYS),
            cacheExpiry: CACHE_EXPIRY
        }
    }
}

// Export singleton instance
export const incomeService = new IncomeService()
export default incomeService 