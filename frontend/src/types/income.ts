/**
 * Income Type Definitions
 * Comprehensive types for income management functionality
 * Updated to match actual Artha backend structure
 */

import type { Income } from './Artha/Income'
import type { IncomeType as BackendIncomeType } from './Artha/IncomeType'

// Base income source type from backend (matches IncomeSourceType)
export interface IncomeSourceType {
    name: string
    type?: string // Link to Income Type
    income?: number // Currency field
    recur?: 0 | 1 // Check field
    date_time?: string // Datetime field
    recur_frequency?: 'every day' | 'every week' | 'every month' | 'every year' // Select field
}

// Backend income source type (matches actual backend structure)
export interface BackendIncomeSourceType {
    name?: string
    idx?: number
    type: string
    income: number
    recur: 0 | 1
    date_time: string
    recur_frequency?: 'every day' | 'every week' | 'every month' | 'every year'
}

// Base income record from backend (matches Income doctype)
export interface BackendIncome {
    name: string
    household_profile: string
    monthly_income?: number // Changed from string to number for consistency
    income_source?: BackendIncomeSourceType[] // Table field
    creation: string
    modified: string
    owner: string
}

// Processed income item for frontend use
export interface ProcessedIncomeItem {
    id: string
    householdProfile: string
    monthlyIncome: number
    sources: ProcessedIncomeSource[]
    createdAt: string
    updatedAt: string
    owner: string
}

// Processed income source for frontend use
export interface ProcessedIncomeSource {
    id: string
    type: string
    amount: number
    isRecurring: boolean
    dateTime: string
    frequency?: 'every day' | 'every week' | 'every month' | 'every year'
}

// Income type definition (matches IncomeType doctype)
export interface IncomeType {
    name: string
    type: string
}

// Form data structures
export interface IncomeSourceFormData {
    type: string
    amount: number
    isRecurring: boolean
    dateTime: string
    frequency?: 'every day' | 'every week' | 'every month' | 'every year'
}

export interface IncomeFormData {
    monthlyIncome: number
    sources: IncomeSourceFormData[]
}

// Filter interface
export interface IncomeFilters {
    searchTerm: string
    dateFrom: string
    dateTo: string
    amountMin: string
    amountMax: string
    incomeType: string
    isRecurring: boolean | null
    sortBy: 'date' | 'amount' | 'type'
    sortOrder: 'asc' | 'desc'
    period: string
}

// Summary statistics
export interface IncomeSummary {
    totalMonthlyIncome: number
    totalSources: number
    recurringIncome: number
    oneTimeIncome: number
    averageSourceAmount: number
    topIncomeType: string
}

// Grouped income data
export interface GroupedIncome {
    recurring: {
        items: ProcessedIncomeSource[]
        count: number
        total: number
    }
    oneTime: {
        items: ProcessedIncomeSource[]
        count: number
        total: number
    }
    summary: IncomeSummary
}

// Store state interface
export interface IncomeStoreState {
    incomes: ProcessedIncomeItem[]
    incomeTypes: IncomeType[]
    loading: boolean
    error: string
    filters: IncomeFilters
    lastFetch: number | null
    cacheExpiry: number
}

// API service options
export interface IncomeServiceOptions {
    includeDetails?: boolean
    forceRefresh?: boolean
    forceReload?: boolean
    useCache?: boolean
    householdProfile?: string
}

// API payload interfaces for creating/updating income
export interface IncomeAPIPayload {
    household_profile?: string
    monthly_income: number
    income_source: Array<{
        type: string
        income: number
        recur: 0 | 1
        date_time: string
        recur_frequency?: 'every day' | 'every week' | 'every month' | 'every year'
    }>
}

// Analyzer state (for advanced analysis)
export interface IncomeAnalyzerState {
    rawIncomes: ProcessedIncomeItem[]
    filteredIncomes: ProcessedIncomeItem[]
    loading: boolean
    error: string
    filters: IncomeFilters
    showIncomeForm: boolean
    editingIncome: ProcessedIncomeItem | null
    groupedIncome: GroupedIncome
    summary: IncomeSummary
    isEmpty: boolean
    hasFilters: boolean
}

// Validation interfaces
export interface IncomeValidationResult {
    isValid: boolean
    errors: Record<string, string>
}

// Type guards
export function isBackendIncome(obj: any): obj is BackendIncome {
    return obj &&
        typeof obj.name === 'string' &&
        typeof obj.household_profile === 'string' &&
        Array.isArray(obj.income_source)
}

export function isBackendIncomeSourceType(obj: any): obj is BackendIncomeSourceType {
    return obj &&
        typeof obj.type === 'string' &&
        typeof obj.income === 'number'
}

export function isProcessedIncomeItem(obj: any): obj is ProcessedIncomeItem {
    return obj &&
        typeof obj.id === 'string' &&
        typeof obj.householdProfile === 'string' &&
        typeof obj.monthlyIncome === 'number' &&
        Array.isArray(obj.sources)
}

// Constants for frequency options
export const RECUR_FREQUENCY_OPTIONS = [
    { value: 'every day', label: 'Daily' },
    { value: 'every week', label: 'Weekly' },
    { value: 'every month', label: 'Monthly' },
    { value: 'every year', label: 'Yearly' }
] as const

export type RecurFrequency = typeof RECUR_FREQUENCY_OPTIONS[number]['value']

// Re-export backend types for convenience
export type { Income as BackendIncomeRecord, BackendIncomeType } 