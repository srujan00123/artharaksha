/**
 * Income Type Definitions - Exact Backend API Alignment
 * No backward compatibility - uses exact backend structure from income.py
 */

import type { Income as ArthaIncome } from "./Artha/Income"
import type { IncomeSourceType as ArthaIncomeSourceType } from "./Artha/IncomeSourceType"
import type { IncomeType as ArthaIncomeType } from "./Artha/IncomeType"

// Re-export Artha types for direct use
export type { ArthaIncome, ArthaIncomeSourceType, ArthaIncomeType }

// Backend API Response Types (exact structure from income.py)

// Income record as returned by get_user_income API
export interface IncomeRecord {
	name: string
	household_profile: string // Links to Household Profile (which has user field)
	monthly_income: string | number // Backend returns as string, we handle conversion
	creation: string
	modified: string
	owner: string // System field, not used for user linking
	income_source?: IncomeSourceRecord[]
}

// Income source as returned by backend API
export interface IncomeSourceRecord {
	name?: string
	creation?: string
	modified?: string
	owner?: string
	modified_by?: string
	docstatus?: 0 | 1 | 2
	parent?: string
	parentfield?: string
	parenttype?: string
	idx?: number
	type: string
	income: number
	recur: 0 | 1
	date_time: string
	recur_frequency?: "daily" | "weekly" | "monthly" | "yearly"
}

// Income type as returned by get_income_types API
export interface IncomeTypeRecord {
	name: string
	type: string
}

// Analytics data structure from backend API
export interface IncomeAnalytics {
	total_income: number
	recurring_income: number
	one_time_income: number
	income_by_type: Record<string, number>
	monthly_trends: MonthlyTrend[]
	summary: AnalyticsSummary
	period?: string
	start_date?: string
	end_date?: string
}

export interface MonthlyTrend {
	month: string
	total: number
	recurring: number
	one_time: number
}

export interface AnalyticsSummary {
	total_sources: number
	average_source_amount: number
	top_income_type: string
}

// API Response interfaces (exact backend structure)
export interface GetUserIncomeResponse {
	income_records: IncomeRecord[]
	analytics?: IncomeAnalytics
}

export interface CreateIncomeResponse {
	name: string
	household_profile: string
	monthly_income: number
}

export interface ValidationResponse {
	is_valid: boolean
	errors: Record<string, string>
}

// Filter interface (matches backend filter handling)
export interface IncomeFilters {
	searchTerm?: string
	dateFrom?: string
	dateTo?: string
	dateRange?: string // Legacy support
	amountMin?: string
	amountMax?: string
	type?: string
	incomeType?: string
	frequency?: string
	isRecurring?: boolean | null
	sortBy?: "date" | "amount" | "type"
	sortOrder?: "asc" | "desc"
	period?: string
}

// Form data for creating/updating income (matches backend API parameters)
export interface IncomeFormData {
	monthly_income: number
	income_source: IncomeSourceFormData[]
	income_name?: string // For updates
}

export interface IncomeSourceFormData {
	type: string
	income: number
	recur: 0 | 1
	date_time: string
	recur_frequency?: "daily" | "weekly" | "monthly" | "yearly"
}

// Frontend form interfaces (for UI components)
export interface IncomeFormUIData {
	type: string
	amount: number
	isRecurring: boolean
	dateTime: string
	frequency?: "daily" | "weekly" | "monthly" | "yearly"
}

export interface IncomeValidationResult {
	isValid: boolean
	errors: Record<string, string>
}

// Processed income item for display (flattened structure)
export interface ProcessedIncomeItem {
	sourceId: string
	incomeId: string
	type: string
	amount: number
	isRecurring: boolean
	dateTime: string
	frequency?: string
	createdAt: string
	updatedAt: string
	sources?: ProcessedIncomeSource[]
}

export interface ProcessedIncomeSource {
	type: string
	amount: number
	isRecurring: boolean
	dateTime: string
	frequency?: string
}

// Service options
export interface IncomeServiceOptions {
	filters?: IncomeFilters
	include_analytics?: boolean
	forceRefresh?: boolean
	useCache?: boolean
}

// Store state interface
export interface IncomeStoreState {
	incomes: IncomeRecord[]
	incomeTypes: IncomeTypeRecord[]
	loading: boolean
	error: string
	filters: IncomeFilters
	lastFetch: number | null
	cacheExpiry: number
}

// Constants for frequency options (matching backend)
export const RECUR_FREQUENCY_OPTIONS = [
	{ value: "daily", label: "Daily" },
	{ value: "weekly", label: "Weekly" },
	{ value: "monthly", label: "Monthly" },
	{ value: "yearly", label: "Yearly" },
] as const

export type RecurFrequency = (typeof RECUR_FREQUENCY_OPTIONS)[number]["value"]

// Utility functions for data conversion
export function convertIncomeAmount(amount: string | number): number {
	return typeof amount === "string"
		? Number.parseFloat(amount) || 0
		: amount || 0
}

export function convertRecurFlag(isRecurring: boolean): 0 | 1 {
	return isRecurring ? 1 : 0
}

export function convertRecurFlag_ToBoolean(recur: 0 | 1): boolean {
	return recur === 1
}

// Type guards
export function isIncomeRecord(obj: any): obj is IncomeRecord {
	return (
		obj &&
		typeof obj.name === "string" &&
		typeof obj.household_profile === "string" &&
		(typeof obj.monthly_income === "number" ||
			typeof obj.monthly_income === "string")
	)
}

export function isIncomeSourceRecord(obj: any): obj is IncomeSourceRecord {
	return (
		obj &&
		typeof obj.type === "string" &&
		typeof obj.income === "number" &&
		(obj.recur === 0 || obj.recur === 1) &&
		typeof obj.date_time === "string"
	)
}
