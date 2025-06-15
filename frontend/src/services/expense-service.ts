/**
 * Expense Service
 * Handles all expense-related business logic and API operations
 * Uses consistent types from types/expense.ts
 */

import { apiService, API_ENDPOINTS } from './api-service.js'
import { cacheService, CACHE_KEYS } from './cache-service.js'
import { householdService } from './household-service.js'
import { session } from '../data/session.js'
import type {
    ProcessedExpenseItem,
    ExpenseFormData,
    ExpenseFilters,
    ExpenseServiceOptions,
    ExpenseValidationErrors,
    BackendExpense,
    BackendMedicalExpenseType,
    BackendExpenseType
} from '../types/expense'
import {
    isMedicalExpenseType,
    isExpenseType,
    MEDICAL_EXPENSE_CATEGORIES,
    OTHER_EXPENSE_CATEGORIES
} from '../types/expense'

// Cache configuration
const CACHE_EXPIRY = {
    EXPENSES: 5 * 60 * 1000,      // 5 minutes
    ANALYTICS: 10 * 60 * 1000,    // 10 minutes
    BREAKDOWN: 10 * 60 * 1000     // 10 minutes
}

// Define analytics and validation result types locally
interface ExpenseAnalytics {
    totalAmount: number
    medicalAmount: number
    otherAmount: number
    expenseCount: number
    categoryBreakdown: Record<string, number>
    period: string
    averageExpense: number
}

interface ExpenseValidationResult {
    isValid: boolean
    errors: ExpenseValidationErrors
}

/**
 * Transform backend expense document to frontend format
 */
const transformExpenseDocument = (doc: BackendExpense): ProcessedExpenseItem[] => {
    const expenses: ProcessedExpenseItem[] = []

    // Process medical expenses from child table
    if (doc.medical_expenses && Array.isArray(doc.medical_expenses)) {
        doc.medical_expenses.forEach((medExpense, index) => {
            if (isMedicalExpenseType(medExpense)) {
                expenses.push({
                    id: `${doc.name}-medical-${index}`,
                    type: 'medical',
                    category: medExpense.medical_expense_type || 'Other',
                    description: medExpense.description || medExpense.medical_expense_type || '',
                    amount: parseFloat(String(medExpense.amount || 0)),
                    date: medExpense.date_time || doc.creation,
                    hasReceipt: Boolean(medExpense.proof_of_payment),
                    receiptUrl: medExpense.proof_of_payment || null,
                    isDirect: Boolean(medExpense.is_direct),
                    creation: doc.creation,
                    parent: doc.name,
                    household_profile: doc.household_profile,
                    rawData: medExpense,
                    docIndex: expenses.length,
                    expenseIndex: index
                })
            }
        })
    }

    // Process other expenses from child table
    if (doc.other_expenses && Array.isArray(doc.other_expenses)) {
        doc.other_expenses.forEach((otherExpense, index) => {
            if (isExpenseType(otherExpense)) {
                expenses.push({
                    id: `${doc.name}-other-${index}`,
                    type: 'other',
                    category: otherExpense.expense_type || 'Other',
                    description: otherExpense.description || otherExpense.expense_type || '',
                    amount: parseFloat(String(otherExpense.amount || 0)),
                    date: otherExpense.date_time || doc.creation,
                    hasReceipt: false,
                    receiptUrl: null,
                    isDirect: false,
                    creation: doc.creation,
                    parent: doc.name,
                    household_profile: doc.household_profile,
                    rawData: otherExpense,
                    docIndex: expenses.length,
                    expenseIndex: index
                })
            }
        })
    }

    return expenses
}

/**
 * Transform form data to backend format
 */
const transformFormDataToBackend = (formData: ExpenseFormData): Partial<BackendMedicalExpenseType | BackendExpenseType> => {
    if (formData.type === 'medical') {
        return {
            medical_expense_type: formData.category as any, // Allow any string for category
            amount: parseFloat(formData.amount),
            date_time: formData.dateTime,
            description: formData.description || '',
            proof_of_payment: formData.receipt ? formData.receipt.name : undefined,
            is_direct: formData.isDirect ? 1 : 0
        }
    } else {
        return {
            expense_type: formData.category as any, // Allow any string for category
            amount: parseFloat(formData.amount),
            date_time: formData.dateTime,
            description: formData.description || ''
        }
    }
}

export class ExpenseService {
    private currentExpenses: ProcessedExpenseItem[] = []

    /**
     * Get all expenses for current user
     */
    async getExpenses(options: ExpenseServiceOptions = {}): Promise<ProcessedExpenseItem[]> {
        const { useCache = true, forceReload = false } = options

        try {
            // Get current user's household profile
            const profile = await householdService.getCurrentProfile()
            if (!profile) {
                throw new Error('No household profile found')
            }

            // Check cache first
            if (useCache && !forceReload) {
                const cached = cacheService.get(CACHE_KEYS.EXPENSES, {
                    userId: session.user,
                    profileId: profile.name
                })
                if (cached) {
                    this.currentExpenses = cached
                    return cached
                }
            }

            // Get expense documents from API
            const listResource = apiService.createListResource({
                doctype: 'Expense',
                fields: ['name', 'household_profile', 'creation', 'modified'],
                filters: { household_profile: profile.name },
                orderBy: 'creation desc'
            })

            await apiService.execute(listResource.reload)
            const expenseDocuments = listResource.data || []

            // Load complete documents with child tables
            const processedExpenses: ProcessedExpenseItem[] = []

            for (const doc of expenseDocuments) {
                try {
                    // Get complete document with child tables
                    const documentResource = apiService.createDocumentResource({
                        doctype: 'Expense',
                        name: doc.name
                    })

                    await apiService.execute(documentResource.reload)
                    const completeDoc = documentResource.doc

                    // Transform and add to processed expenses
                    const transformedExpenses = transformExpenseDocument(completeDoc)
                    processedExpenses.push(...transformedExpenses)

                } catch (docError) {
                    console.warn(`Failed to load complete document ${doc.name}:`, docError)
                    // Continue with other documents
                }
            }

            // Cache the result
            if (useCache) {
                cacheService.set(CACHE_KEYS.EXPENSES, processedExpenses, {
                    userId: session.user,
                    profileId: profile.name
                })
            }

            this.currentExpenses = processedExpenses
            return processedExpenses

        } catch (error) {
            console.error('ExpenseService: Failed to load expenses:', error)
            throw new Error(`Failed to load expenses: ${error.message}`)
        }
    }

    /**
     * Create new expense
     */
    async createExpense(expenseData: ExpenseFormData): Promise<ProcessedExpenseItem> {
        try {
            // Get current user's household profile
            const profile = await householdService.getCurrentProfile()
            if (!profile) {
                throw new Error('No household profile found')
            }

            // Validate expense data
            const validation = this.validateExpenseData(expenseData)
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${Object.values(validation.errors).join(', ')}`)
            }

            // Check if expense document exists for this profile
            const listResource = apiService.createListResource({
                doctype: 'Expense',
                fields: ['name'],
                filters: { household_profile: profile.name }
            })

            await apiService.execute(listResource.reload)
            const existingDocs = listResource.data || []

            let expenseDoc: BackendExpense
            if (existingDocs.length > 0) {
                // Add to existing document
                const docName = existingDocs[0].name
                const documentResource = apiService.createDocumentResource({
                    doctype: 'Expense',
                    name: docName
                })

                await apiService.execute(documentResource.reload)
                expenseDoc = documentResource.doc

                // Add to appropriate child table
                const backendData = transformFormDataToBackend(expenseData)

                if (expenseData.type === 'medical') {
                    if (!expenseDoc.medical_expenses) {
                        expenseDoc.medical_expenses = []
                    }
                    expenseDoc.medical_expenses.push(backendData as BackendMedicalExpenseType)
                } else {
                    if (!expenseDoc.other_expenses) {
                        expenseDoc.other_expenses = []
                    }
                    expenseDoc.other_expenses.push(backendData as BackendExpenseType)
                }

                await apiService.execute(documentResource.save)
            } else {
                // Create new document
                const documentResource = apiService.createDocumentResource({
                    doctype: 'Expense'
                })

                const backendData = transformFormDataToBackend(expenseData)

                documentResource.doc.household_profile = profile.name

                if (expenseData.type === 'medical') {
                    documentResource.doc.medical_expenses = [backendData as BackendMedicalExpenseType]
                } else {
                    documentResource.doc.other_expenses = [backendData as BackendExpenseType]
                }

                await apiService.execute(documentResource.save)
                expenseDoc = documentResource.doc
            }

            // Transform the new expense and return it
            const transformedExpenses = transformExpenseDocument(expenseDoc)
            const newExpense = transformedExpenses[transformedExpenses.length - 1]

            // Clear cache to force refresh
            this.clearCache()

            return newExpense

        } catch (error) {
            console.error('ExpenseService: Failed to create expense:', error)
            throw new Error(`Failed to create expense: ${error.message}`)
        }
    }

    /**
     * Update existing expense
     */
    async updateExpense(originalExpense: ProcessedExpenseItem, updatedData: ExpenseFormData): Promise<ProcessedExpenseItem> {
        try {
            // Validate updated data
            const validation = this.validateExpenseData(updatedData)
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${Object.values(validation.errors).join(', ')}`)
            }

            // Load the parent document
            const documentResource = apiService.createDocumentResource({
                doctype: 'Expense',
                name: originalExpense.parent
            })

            await apiService.execute(documentResource.reload)
            const doc = documentResource.doc

            // Update the specific child table entry
            const backendData = transformFormDataToBackend(updatedData)

            if (originalExpense.type === 'medical' && doc.medical_expenses) {
                const index = originalExpense.expenseIndex
                if (typeof index === 'number' && index < doc.medical_expenses.length) {
                    doc.medical_expenses[index] = { ...doc.medical_expenses[index], ...backendData }
                }
            } else if (originalExpense.type === 'other' && doc.other_expenses) {
                const index = originalExpense.expenseIndex
                if (typeof index === 'number' && index < doc.other_expenses.length) {
                    doc.other_expenses[index] = { ...doc.other_expenses[index], ...backendData }
                }
            }

            await apiService.execute(documentResource.save)

            // Transform and return updated expense
            const transformedExpenses = transformExpenseDocument(doc)
            const updatedExpense = transformedExpenses.find(exp => exp.id === originalExpense.id)

            // Clear cache to force refresh
            this.clearCache()

            return updatedExpense || originalExpense

        } catch (error) {
            console.error('ExpenseService: Failed to update expense:', error)
            throw new Error(`Failed to update expense: ${error.message}`)
        }
    }

    /**
     * Delete expense
     */
    async deleteExpense(expense: ProcessedExpenseItem): Promise<void> {
        try {
            // Load the parent document
            const documentResource = apiService.createDocumentResource({
                doctype: 'Expense',
                name: expense.parent
            })

            await apiService.execute(documentResource.reload)
            const doc = documentResource.doc

            // Remove from appropriate child table
            if (expense.type === 'medical' && doc.medical_expenses && typeof expense.expenseIndex === 'number') {
                doc.medical_expenses.splice(expense.expenseIndex, 1)
            } else if (expense.type === 'other' && doc.other_expenses && typeof expense.expenseIndex === 'number') {
                doc.other_expenses.splice(expense.expenseIndex, 1)
            }

            await apiService.execute(documentResource.save)

            // Clear cache to force refresh
            this.clearCache()

        } catch (error) {
            console.error('ExpenseService: Failed to delete expense:', error)
            throw new Error(`Failed to delete expense: ${error.message}`)
        }
    }

    /**
     * Validate expense form data
     */
    validateExpenseData(formData: ExpenseFormData): ExpenseValidationResult {
        const errors: ExpenseValidationErrors = {}

        if (!formData.type) {
            errors.type = 'Expense type is required'
        }

        if (!formData.category) {
            errors.category = 'Category is required'
        }

        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            errors.amount = 'Amount must be greater than 0'
        }

        if (!formData.dateTime) {
            errors.dateTime = 'Date and time is required'
        }

        return {
            isValid: Object.keys(errors).length === 0,
            errors
        }
    }

    /**
     * Filter expenses based on criteria
     */
    filterExpenses(expenses: ProcessedExpenseItem[], filters: ExpenseFilters): ProcessedExpenseItem[] {
        return expenses.filter(expense => {
            // Search term filter
            if (filters.searchTerm) {
                const searchLower = filters.searchTerm.toLowerCase()
                const matchesSearch =
                    expense.category.toLowerCase().includes(searchLower) ||
                    expense.description.toLowerCase().includes(searchLower)
                if (!matchesSearch) return false
            }

            // Type filter
            if (filters.type && expense.type !== filters.type) {
                return false
            }

            // Category filter
            if (filters.category) {
                const categoryLower = filters.category.toLowerCase()
                if (!expense.category.toLowerCase().includes(categoryLower)) {
                    return false
                }
            }

            // Date range filter
            if (filters.dateFrom || filters.dateTo) {
                const expenseDate = new Date(expense.date).toISOString().split('T')[0]

                if (filters.dateFrom && expenseDate < filters.dateFrom) return false
                if (filters.dateTo && expenseDate > filters.dateTo) return false
            }

            // Amount range filter
            if (filters.amountMin && expense.amount < parseFloat(filters.amountMin)) {
                return false
            }
            if (filters.amountMax && expense.amount > parseFloat(filters.amountMax)) {
                return false
            }

            return true
        }).sort((a, b) => {
            // Apply sorting
            const sortBy = filters.sortBy || 'date'
            const sortOrder = filters.sortOrder || 'desc'

            let comparison = 0

            switch (sortBy) {
                case 'amount':
                    comparison = a.amount - b.amount
                    break
                case 'category':
                    comparison = a.category.localeCompare(b.category)
                    break
                case 'date':
                default:
                    comparison = new Date(a.date).getTime() - new Date(b.date).getTime()
                    break
            }

            return sortOrder === 'desc' ? -comparison : comparison
        })
    }

    /**
     * Get expense analytics
     */
    async getExpenseAnalytics(period: string = 'last_3_months', filters: Partial<ExpenseFilters> = {}): Promise<ExpenseAnalytics> {
        try {
            const expenses = await this.getExpenses()

            // Create complete filters object with defaults
            const completeFilters: ExpenseFilters = {
                searchTerm: '',
                type: '',
                category: '',
                dateFrom: '',
                dateTo: '',
                amountMin: '',
                amountMax: '',
                sortBy: 'date',
                sortOrder: 'desc',
                period: 'all',
                ...filters
            }

            const filtered = this.filterExpenses(expenses, completeFilters)

            // Calculate analytics based on filtered expenses
            const totalAmount = filtered.reduce((sum, expense) => sum + expense.amount, 0)
            const medicalExpenses = filtered.filter(exp => exp.type === 'medical')
            const otherExpenses = filtered.filter(exp => exp.type === 'other')

            const categoryBreakdown: Record<string, number> = {}
            filtered.forEach(expense => {
                categoryBreakdown[expense.category] = (categoryBreakdown[expense.category] || 0) + expense.amount
            })

            return {
                totalAmount,
                medicalAmount: medicalExpenses.reduce((sum, exp) => sum + exp.amount, 0),
                otherAmount: otherExpenses.reduce((sum, exp) => sum + exp.amount, 0),
                expenseCount: filtered.length,
                categoryBreakdown,
                period,
                averageExpense: filtered.length > 0 ? totalAmount / filtered.length : 0
            }

        } catch (error) {
            console.error('ExpenseService: Failed to get analytics:', error)
            throw new Error(`Failed to get expense analytics: ${error.message}`)
        }
    }

    /**
     * Get medical analytics with CHE analysis
     */
    async getMedicalAnalytics(period: string = 'last_3_months', filters: any = {}): Promise<any> {
        try {
            const expenses = await this.getExpenses()
            const medicalExpenses = expenses.filter(exp => exp.type === 'medical')

            // Calculate basic medical analytics
            const directMedical = medicalExpenses.filter(exp => exp.isDirect)
            const indirectMedical = medicalExpenses.filter(exp => !exp.isDirect)

            const directTotal = directMedical.reduce((sum, exp) => sum + exp.amount, 0)
            const indirectTotal = indirectMedical.reduce((sum, exp) => sum + exp.amount, 0)
            const totalMedical = directTotal + indirectTotal

            // Category breakdown
            const categoryBreakdown = {
                direct_medical: this.getCategoryBreakdown(directMedical, totalMedical),
                indirect_medical: this.getCategoryBreakdown(indirectMedical, totalMedical),
                other: [],
                totals: {
                    direct_medical: directTotal,
                    indirect_medical: indirectTotal,
                    other: 0,
                    total: totalMedical
                }
            }

            // Monthly trends (simplified)
            const monthlyTrends = this.calculateMonthlyTrends(medicalExpenses)

            // Basic CHE analysis structure
            const cheAnalysis = {
                che_10: false,
                che_25: false,
                che_40: false,
                che_ratio: 0,
                risk_level: 'unknown' as const,
                risk_score: 0,
                recommendation: 'Add income data for CHE analysis',
                annual_income: 0,
                annualized_medical: totalMedical * 12,
                per_capita_income: 0,
                medical_burden_category: 'unknown' as const,
                financial_protection_status: 'unknown' as const,
                who_che_thresholds: {
                    che_10_threshold: 0,
                    che_25_threshold: 0,
                    che_40_threshold: 0
                },
                comparative_analysis: {
                    national_average: 0,
                    income_group_average: 0,
                    comparison_status: 'unknown' as const
                },
                recommendations: [] as string[],
                has_income_data: false
            }

            return {
                che_analysis: cheAnalysis,
                category_breakdown: categoryBreakdown,
                monthly_trends: monthlyTrends,
                period: {
                    label: period,
                    start_date: '',
                    end_date: '',
                    days: 0
                },
                summary: {
                    total_expenses: expenses.reduce((sum, exp) => sum + exp.amount, 0),
                    medical_expenses: totalMedical,
                    direct_medical: directTotal,
                    indirect_medical: indirectTotal,
                    other_expenses: expenses.filter(exp => exp.type !== 'medical').reduce((sum, exp) => sum + exp.amount, 0),
                    expense_count: expenses.length,
                    che_ratio: 0,
                    average_per_day: totalMedical / 30,
                    average_per_expense: medicalExpenses.length > 0 ? totalMedical / medicalExpenses.length : 0
                },
                insights: [] as any[],
                top_expenses: medicalExpenses.sort((a, b) => b.amount - a.amount).slice(0, 10)
            }

        } catch (error) {
            console.error('ExpenseService: Failed to get medical analytics:', error)
            throw new Error(`Failed to get medical analytics: ${error.message}`)
        }
    }

    /**
     * Get category breakdown for medical expenses
     */
    private getCategoryBreakdown(expenses: ProcessedExpenseItem[], totalAmount: number) {
        const categoryMap = new Map<string, { amount: number; count: number }>()

        expenses.forEach(expense => {
            const existing = categoryMap.get(expense.category) || { amount: 0, count: 0 }
            categoryMap.set(expense.category, {
                amount: existing.amount + expense.amount,
                count: existing.count + 1
            })
        })

        return Array.from(categoryMap.entries()).map(([name, data]) => ({
            name,
            totalAmount: data.amount,
            count: data.count,
            percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0
        }))
    }

    /**
     * Calculate monthly trends for medical expenses
     */
    private calculateMonthlyTrends(expenses: ProcessedExpenseItem[]) {
        const monthlyMap = new Map<string, number>()

        expenses.forEach(expense => {
            const month = new Date(expense.date).toISOString().slice(0, 7) // YYYY-MM
            const existing = monthlyMap.get(month) || 0
            monthlyMap.set(month, existing + expense.amount)
        })

        return Array.from(monthlyMap.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .slice(-6) // Last 6 months
            .map(([month, medical]) => ({
                month: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                medical,
                che_ratio: 0 // Will be calculated with income data
            }))
    }

    /**
     * Clear cache
     */
    clearCache(userId: string | null = null): void {
        const targetUserId = userId || session.user
        cacheService.delete(CACHE_KEYS.EXPENSES, { userId: targetUserId })
    }

    /**
     * Reset service state
     */
    reset(): void {
        this.currentExpenses = []
        this.clearCache()
    }

    /**
     * Get cached expenses
     */
    getCachedExpenses(): ProcessedExpenseItem[] {
        return this.currentExpenses
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): Record<string, any> {
        return {
            currentExpensesCount: this.currentExpenses.length,
            cacheKeys: Object.keys(CACHE_KEYS),
            cacheExpiry: CACHE_EXPIRY
        }
    }
}

// Export singleton instance
export const expenseService = new ExpenseService() 