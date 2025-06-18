/**
 * Income Type Definitions - Enhanced with Comprehensive Filter System
 * These types align with the enhanced backend API with comprehensive filter support
 */

import type { Income as ArthaIncome } from "./Artha/Income"
import type { IncomeSourceType as ArthaIncomeSourceType } from "./Artha/IncomeSourceType"
import type { IncomeType as ArthaIncomeType } from "./Artha/IncomeType"

// Re-export Artha types for direct use
export type { ArthaIncome, ArthaIncomeSourceType, ArthaIncomeType }

// Backend API Response Types (exact structure from income.py)

/**
 * Income record as returned by get_user_income API
 *
 * NOTE: Only one IncomeRecord exists per household_profile.
 * All income sources are managed as children in the income_source array.
 */
export interface IncomeRecord {
	name: string
	household_profile: string // Links to Household Profile (which has user field)
	monthly_income: number
	creation: string
	modified: string
	owner: string // System field, not used for user linking
	income_source: IncomeSourceRecord[]
}

/**
 * Income source as returned by backend API
 *
 * NOTE: Only for RECURRING income sources. One-time income goes directly to ledger.
 * All CRUD operations on sources are performed via the parent Income record.
 */
export interface IncomeSourceRecord {
	name?: string // Child table ID
	type: string
	income: number
	recur: true // Always true - only recurring sources are stored here
	date_time: string
	recur_frequency:
		| "daily"
		| "weekly"
		| "bi-weekly"
		| "monthly"
		| "quarterly"
		| "semi-annually"
		| "annually"
		| "yearly"
	stop_date?: string
	ledger_entries: LedgerEntry[]
}

// Income type as returned by get_income_types API
export interface IncomeTypeRecord {
	name: string
	type: string
}

// Core ledger entry structure
export interface LedgerEntry {
	date_time: string
	amount: number
	income_type: "recurring" | "one-time"
	source_type?: string // For direct entries without income source
	description?: string // For direct entries
}

// Flattened ledger entry as returned by get_income_ledger
export interface FlattenedLedgerEntry {
	name: string // Ledger entry name
	income_source?: string // Source child name (null for direct entries)
	income_type: "recurring" | "one-time"
	date_time: string
	amount: number
	source_type: string // Income type name
	description?: string // For direct entries
	// Source details (only for entries with income_source)
	source_recur?: boolean
	source_income?: number
	source_date_time?: string
	source_recur_frequency?:
		| "daily"
		| "weekly"
		| "bi-weekly"
		| "monthly"
		| "quarterly"
		| "semi-annually"
		| "annually"
		| "yearly"
	source_stop_date?: string
}

// 🚀 ENHANCED: Analytics data structure with comprehensive filter support
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
	recurring_percentage: number
	growth_rate: number
	actual_monthly_income: number
	// Enhanced fields for better metrics display
	monthly_recurring_income: number // Actual monthly income from current month's ledger entries
	expected_monthly_income: number // Expected monthly income from recurring sources
	period_recurring_income: number // Actual recurring income for the filtered period
	period_one_time_income: number // Actual one-time income for the filtered period
	period_total_income: number // Total income for the filtered period
	// 🚀 NEW: Filter-aware analytics
	filter_applied?: boolean // Whether any filters were applied
	filter_summary?: string // Human-readable filter description
	comparison_period?: {
		period_name: string
		total_income: number
		growth_percentage: number
	}
}

export interface MonthlyTrend {
	month: string
	total: number
	recurring: number
	one_time: number
	// 🚀 NEW: Enhanced trend data
	growth_rate?: number
	source_count?: number
}

export interface AnalyticsSummary {
	total_sources: number
	average_source_amount: number
	top_income_type: string
	// 🚀 NEW: Enhanced summary data
	top_income_amount?: number
	diversity_score?: number // How diversified income sources are
	stability_score?: number // How stable recurring income is
}

// API Response interfaces (exact backend structure)
export interface GetUserIncomeResponse {
	recurring_sources: IncomeSourceRecord[]
	ledger_entries: FlattenedLedgerEntry[]
	analytics: IncomeAnalytics
	// 🚀 NEW: Enhanced response data
	filter_info?: {
		applied_filters: Record<string, any>
		total_unfiltered_count: number
		filtered_count: number
	}
}

export interface GetIncomeTypesResponse {
	income_types: IncomeTypeRecord[]
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

export interface GetMonthlyIncomeSummaryResponse {
	monthly_income: number
	recurring_income: number
	one_time_income: number
	total_sources: number
	// 🚀 NEW: Enhanced summary with filter support
	filter_applied?: boolean
	period_info?: {
		start_date: string
		end_date: string
		period_name: string
	}
}

export interface GetIncomeInsightsResponse {
	insights: Array<{
		type: "positive" | "neutral" | "warning"
		title: string
		description: string
	}>
	recommendations: Array<{
		priority: "high" | "medium" | "low"
		title: string
		description: string
		action: string
	}>
	scores: {
		stability: number
		diversification: number
		growth: number
	}
}

export interface UpdateRecurringLedgerEntriesResponse {
	status: "success"
	message: string
	updated_count: number
}

export interface UpdateAllRecurringLedgersResponse {
	status: "success" | "error"
	message: string
	updated_count?: number
}

// 🚀 ENHANCED: Comprehensive filter interfaces with all new filter types
export interface IncomeFilters {
	// Period filters (predefined periods)
	period?:
		| "this_month"
		| "last_month"
		| "last_3_months"
		| "last_6_months"
		| "this_year"
		| "all"
		| "custom"

	// Date range filters (custom ranges)
	dateFrom?: string
	dateTo?: string

	// Type filters
	type?: string // Specific income type name
	isRecurring?: boolean // Filter by recurring vs one-time

	// Amount filters
	amountMin?: number
	amountMax?: number

	// Search and sort
	searchTerm?: string
	sortBy?: "date" | "amount" | "type" | "frequency"
	sortOrder?: "asc" | "desc"

	// 🚀 NEW: Advanced filters
	frequency?:
		| "daily"
		| "weekly"
		| "bi-weekly"
		| "monthly"
		| "quarterly"
		| "semi-annually"
		| "annually"
		| "yearly"
	hasStopDate?: boolean // Filter sources with/without stop dates
	sourceStatus?: "active" | "stopped" | "all" // Filter by source status

	// Legacy support (deprecated but maintained for compatibility)
	dateRange?:
		| "today"
		| "this-week"
		| "this-month"
		| "last-month"
		| "last-3-months"
		| "this-year"
}

// 🚀 NEW: Filter options response from backend
export interface IncomeFilterOptions {
	income_types: Array<{
		name: string
		count: number
	}>
	frequencies: Array<{
		value: string
		label: string
		count: number
	}>
	amount_ranges: Array<{
		min: number
		max: number
		label: string
		count: number
	}>
	date_ranges: Array<{
		value: string
		label: string
		start_date: string
		end_date: string
	}>
	sort_options: Array<{
		value: string
		label: string
	}>
}

// 🚀 NEW: Period information response
export interface PeriodInfo {
	period_name: string
	start_date: string
	end_date: string
	days_count: number
	is_current_period: boolean
	previous_period?: {
		name: string
		start_date: string
		end_date: string
	}
}

export interface LedgerFilters {
	income_type?: "recurring" | "one-time"
	dateFrom?: string
	dateTo?: string
	// 🚀 NEW: Enhanced ledger filters
	source_type?: string
	amountMin?: number
	amountMax?: number
	hasSource?: boolean // Filter entries with/without income source
}

// Form data interfaces for creating/updating income
export interface IncomeSourceFormData {
	type: string
	income: number
	recur: true // Always true for income sources
	date_time: string
	recur_frequency:
		| "daily"
		| "weekly"
		| "bi-weekly"
		| "monthly"
		| "quarterly"
		| "semi-annually"
		| "annually"
		| "yearly"
	stop_date?: string
}

// API Request payload types
export interface AddIncomeSourcePayload {
	income_source: IncomeSourceFormData[]
	income_name?: string // Optional - backend will find/create Income record by household profile
}

export interface UpdateIncomeSourcePayload {
	income_source: IncomeSourceFormData[]
	income_name: string
	source_name: string
}

export interface DeleteIncomeSourcePayload {
	income_source: []
	income_name: string
	action: "delete"
	source_name: string
}

export interface CreateOrUpdateIncomePayload {
	income_source: IncomeSourceFormData | IncomeSourceFormData[]
	income_name?: string
	source_name?: string
	action?: "delete"
}

export interface ValidateIncomeDataPayload {
	monthly_income: number
	income_source: IncomeSourceFormData[]
}

// Service options
// 🚀 ENHANCED: Service options with new method support
export interface IncomeServiceOptions {
	filters?: IncomeFilters
	include_analytics?: boolean
	forceRefresh?: boolean
	useCache?: boolean
	// 🚀 NEW: Options for enhanced methods
	withFilterOptions?: boolean // Include filter options in response
	withPeriodInfo?: boolean // Include period information
	withComparison?: boolean // Include comparison with previous period
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
	{ value: "bi-weekly", label: "Bi-weekly" },
	{ value: "monthly", label: "Monthly" },
	{ value: "quarterly", label: "Quarterly" },
	{ value: "semi-annually", label: "Semi-annually" },
	{ value: "annually", label: "Annually" },
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

// Utility: always return an array, never undefined
export function safeArray<T>(arr: T[] | undefined | null): T[] {
	return Array.isArray(arr) ? arr : []
}

// Type guards
export function isIncomeRecord(obj: any): obj is IncomeRecord {
	return (
		obj &&
		typeof obj.name === "string" &&
		typeof obj.household_profile === "string" &&
		typeof obj.monthly_income === "number" &&
		Array.isArray(obj.income_source)
	)
}

export function isIncomeSourceRecord(obj: any): obj is IncomeSourceRecord {
	return (
		obj &&
		typeof obj.type === "string" &&
		typeof obj.income === "number" &&
		typeof obj.date_time === "string" &&
		typeof obj.recur === "boolean" &&
		Array.isArray(obj.ledger_entries)
	)
}

// Legacy types for backward compatibility (marked as deprecated)
/** @deprecated Use IncomeRecord instead */
export type Income = IncomeRecord

/** @deprecated Use IncomeSourceRecord instead */
export type IncomeSourceType = IncomeSourceRecord

/** @deprecated Use IncomeLedger instead */
export type IncomeLedger = LedgerEntry

// Dashboard metrics response interface
// 🚀 ENHANCED: Dashboard metrics with comprehensive filter support
export interface IncomeDashboardMetrics {
	actual_monthly_income: number // Actual income from current month's ledger entries
	expected_monthly_income: number // Expected income from recurring sources
	recurring_income: number
	one_time_income: number
	total_sources: number
	recurring_percentage: number
	growth_rate: number
	top_income_type: string
	income_by_type: Record<string, number>
	monthly_trends: MonthlyTrend[]
	average_source_amount: number
	period: string
	start_date?: string
	end_date?: string
	// 🚀 NEW: Enhanced dashboard data
	filter_applied?: boolean
	filter_summary?: string
	comparison_data?: {
		previous_period: string
		growth_percentage: number
		growth_amount: number
	}
	health_score?: {
		stability: number
		diversification: number
		growth: number
		overall: number
	}
}

// Ledger Entry CRUD operations
export interface UpdateLedgerEntryPayload {
	ledger_entry_name: string
	new_amount: number
	new_date: string
	new_type?: "recurring" | "one-time"
}

export interface UpdateLedgerEntryResponse {
	status: "success"
	message: string
	updated_entry: {
		name: string
		amount: number
		date_time: string
		income_type: "recurring" | "one-time"
	}
	changes: {
		amount_changed: boolean
		type_changed: boolean
	}
}

export interface DeleteLedgerEntryPayload {
	ledger_entry_name: string
}

export interface DeleteLedgerEntryResponse {
	status: "success"
	message: string
	deleted_type: "recurring" | "one-time"
}

export interface CreateLedgerEntryPayload {
	income_source_name: string
	amount: number
	date_time: string
	income_type?: "recurring" | "one-time"
}

export interface CreateDirectLedgerEntryPayload {
	income_type: string
	amount: number
	date_time: string
	description?: string
}

export interface CreateLedgerEntryResponse {
	status: "success"
	message: string
	entry_name: string
}

// Frontend UI-specific types
export interface ProcessedIncomeItem {
	sourceId: string
	incomeId: string
	type: string
	amount: number
	isRecurring: true // Always true for income sources
	dateTime: string
	frequency: string
	stop_date?: string
	name: string
	createdAt: string
	updatedAt: string
}

export interface IncomeFormUIData {
	type: string
	amount: number
	isRecurring: boolean // Can be true or false for form input
	dateTime: string
	frequency?: string // Optional for one-time income
	stop_date?: string
}

// UI data for direct ledger entries (one-time income)
export interface DirectLedgerEntryFormData {
	income_type: string
	amount: number
	date_time: string
	description?: string
}

export interface LedgerEntryFormData {
	amount: number
	date: string
	income_type: "recurring" | "one-time"
	source_type: string
}

// Form validation result
export interface IncomeValidationResult {
	isValid: boolean
	errors: Record<string, string>
}

// 🚀 NEW: Enhanced API response interfaces for new methods

export interface GetIncomeAnalyticsResponse {
	analytics: IncomeAnalytics
	filter_info?: {
		applied_filters: Record<string, any>
		filter_summary: string
	}
	period_info?: PeriodInfo
	comparison_data?: {
		previous_period: IncomeAnalytics
		growth_metrics: {
			total_growth: number
			recurring_growth: number
			one_time_growth: number
		}
	}
}

export interface GetIncomeFilterOptionsResponse {
	filter_options: IncomeFilterOptions
	current_filters?: Record<string, any>
	suggestions?: Array<{
		filter_type: string
		suggested_value: any
		reason: string
	}>
}

export interface GetPeriodInfoResponse {
	period_info: PeriodInfo
	statistics: {
		total_days: number
		working_days?: number
		weekend_days?: number
		holidays?: number
	}
	recommendations?: Array<{
		type: "period_selection" | "date_range" | "comparison"
		message: string
		suggested_action: string
	}>
}

export interface CleanupIncomeDataResponse {
	status: "success" | "error"
	message: string
	cleanup_summary: {
		orphaned_entries_removed: number
		duplicate_entries_merged: number
		invalid_dates_fixed: number
		empty_sources_removed: number
	}
	warnings?: string[]
}

// 🚀 NEW: Enhanced form interfaces with validation
export interface IncomeFormState {
	mode: "source" | "direct" | "edit"
	data: IncomeFormUIData | DirectLedgerEntryFormData
	validation: {
		isValid: boolean
		errors: Record<string, string>
		warnings: Record<string, string>
	}
	loading: boolean
	error: string | null
}

export interface IncomeComponentProps {
	loading?: boolean
	error?: string | null
	readonly?: boolean
	showValidation?: boolean
	autoSave?: boolean
	onValidationChange?: (
		isValid: boolean,
		errors: Record<string, string>,
	) => void
}

// 🚀 NEW: Enhanced event interfaces for components
export interface IncomeEventHandlers {
	onAdd?: (data: IncomeFormUIData | DirectLedgerEntryFormData) => Promise<void>
	onEdit?: (
		id: string,
		data: IncomeFormUIData | DirectLedgerEntryFormData,
	) => Promise<void>
	onDelete?: (id: string) => Promise<void>
	onFilter?: (filters: IncomeFilters) => void
	onSort?: (sortBy: string, sortOrder: "asc" | "desc") => void
	onRefresh?: () => Promise<void>
	onExport?: (format: "csv" | "excel" | "pdf") => Promise<void>
}
