import type { Expense } from "./Artha/Expense"
import type { ExpenseType as BackendExpenseType } from "./Artha/ExpenseType"
import type { MedicalExpenseType as BackendMedicalExpenseType } from "./Artha/MedicalExpenseType"

/**
 * Frontend processed expense item
 * This is the normalized format used throughout the frontend
 * Maps to the actual Artha backend structure
 */
export interface ProcessedExpenseItem {
	/** Unique identifier for the expense item (generated from parent-type-index) */
	id: string
	/** Type of expense: medical or other */
	type: "medical" | "other"
	/** Category/type of the expense (from medical_expense_type or expense_type) */
	category: string
	/** Amount in currency */
	amount: number
	/** Date of the expense (from date_time field) */
	date: string
	/** Human-readable description (from description field or category) */
	description: string
	/** Whether expense has a receipt attached (medical only) */
	hasReceipt: boolean
	/** URL to the receipt file (from proof_of_payment) */
	receiptUrl: string | null
	/** Creation timestamp from parent document */
	creation: string
	/** Parent expense document name */
	parent: string
	/** Household profile reference */
	household_profile: string
	/** Original raw data from the server (BackendMedicalExpenseType or BackendExpenseType) */
	rawData: BackendMedicalExpenseType | BackendExpenseType
	/** Document index for debugging */
	docIndex?: number
	/** Expense index within document for debugging */
	expenseIndex?: number
	/** Whether this is a direct medical expense (from backend is_direct field, medical only) */
	isDirect?: boolean
	/** Provider/facility name (optional) */
	provider?: string
}

/**
 * Filter configuration for expenses
 * Used across all components for consistent filtering
 */
export interface ExpenseFilters {
	/** Search term for text-based filtering */
	searchTerm: string
	/** Start date for date range filter (YYYY-MM-DD) */
	dateFrom: string
	/** End date for date range filter (YYYY-MM-DD) */
	dateTo: string
	/** Minimum amount filter */
	amountMin: string
	/** Maximum amount filter */
	amountMax: string
	/** Category filter (exact match) */
	category: string
	/** Expense type filter */
	type: "" | "medical" | "other"
	/** Sort field */
	sortBy: "date" | "amount" | "category"
	/** Sort order */
	sortOrder: "asc" | "desc"
	/** Quick filter period */
	period: string
}

/**
 * Grouped expenses structure for UI display
 */
export interface GroupedExpenses {
	medical: {
		items: ProcessedExpenseItem[]
		count: number
		total: number
	}
	other: {
		items: ProcessedExpenseItem[]
		count: number
		total: number
	}
	summary: {
		totalItems: number
		totalAmount: number
		medicalPercentage: number
	}
}

/**
 * ListView row format for table display
 */
export interface ExpenseListViewRow {
	id: string
	category: string
	description: string
	amount: string
	date: string
	type: "medical" | "other"
	hasReceipt: "yes" | "no"
	parent: string
	_originalExpense: ProcessedExpenseItem
}

/**
 * Expense form data for creating/updating expenses
 * Maps to the form fields in ExpenseForm component
 */
export interface ExpenseFormData {
	/** Expense type selection */
	type: "medical" | "other"
	/** Category selection (medical_expense_type or expense_type) */
	category: string
	/** Optional description */
	description: string
	/** Amount as string (for form input) */
	amount: string
	/** Date and time as ISO string */
	dateTime: string
	/** Receipt file (medical expenses only) */
	receipt: File | null
	/** Whether this is a direct medical expense (medical only) */
	isDirect?: boolean
}

/**
 * Validation errors for expense form
 */
export interface ExpenseValidationErrors {
	category?: string
	amount?: string
	dateTime?: string
	type?: string
	description?: string
}

/**
 * Quick date filter options for UI
 */
export interface QuickDateFilter {
	label: string
	value: string
	dateFrom: string
	dateTo: string
}

/**
 * Active filter display item
 */
export interface ActiveFilter {
	key: string
	label: string
	value: string
}

/**
 * Category information for UI display
 */
export interface CategoryInfo {
	label: string
	icon: string
	color: string
	type: "medical" | "other"
}

/**
 * Expense summary for dashboard and overview displays
 */
export interface ExpenseSummary {
	totalAmount: number
	medicalAmount: number
	otherAmount: number
	expenseCount: number
	medicalCount: number
	otherCount: number
	averageExpense: number
	period: string
}

/**
 * Expense validation result
 */
export interface ExpenseValidationResult {
	isValid: boolean
	errors: ExpenseValidationErrors
}

/**
 * Expense analytics data
 */
export interface ExpenseAnalytics {
	totalAmount: number
	medicalAmount: number
	otherAmount: number
	expenseCount: number
	categoryBreakdown: Record<string, number>
	period: string
	averageExpense: number
}

/**
 * Expense store state interface
 */
export interface ExpenseStoreState {
	/** Raw expense documents from server */
	rawExpenseData: Expense[]
	/** Processed expenses for UI */
	processedExpenses: ProcessedExpenseItem[]
	/** Filtered expenses based on current filters */
	filteredExpenses: ProcessedExpenseItem[]
	/** Loading state */
	loading: boolean
	/** Error message */
	error: string
	/** Selected expenses in UI */
	selectedExpenses: ExpenseListViewRow[]
	/** Current filter configuration */
	filters: ExpenseFilters
	/** Processing error messages */
	processingErrors: string[]
	/** Last processed count for debugging */
	lastProcessedCount: number
	/** Cache timestamp */
	lastFetchTime: number | null
}

/**
 * Expense creation payload for API
 * Maps to the Artha Expense doctype structure
 */
export interface ExpenseCreatePayload {
	doctype: "Expense"
	household_profile: string
	medical_expenses?: Array<{
		medical_expense_type:
			| "Consultation"
			| "Diagnostics Tests"
			| "Surgery"
			| "Medicine"
			| "Therapy"
			| "Dental"
			| "Optical"
			| "Emergency"
			| "Hospitalization"
			| "Other"
		amount: number
		date_time: string
		description?: string
		proof_of_payment?: string | null
		is_direct?: 0 | 1
	}>
	other_expenses?: Array<{
		expense_type:
			| "Travel"
			| "Wage loss"
			| "Accommodation"
			| "Rent"
			| "Miscellaneous"
			| "Grocery"
			| "Food"
			| "School Fees"
			| "Tuition Fees"
			| "Entertainment"
			| "Clothes"
			| "Other"
		amount: number
		date_time: string
		description?: string
	}>
}

/**
 * Expense update payload for API
 * Used when updating existing child table rows
 */
export interface ExpenseUpdatePayload {
	/** Child table row name */
	name: string
	/** Updated fields */
	medical_expense_type?:
		| "Consultation"
		| "Diagnostics Tests"
		| "Surgery"
		| "Medicine"
		| "Therapy"
		| "Dental"
		| "Optical"
		| "Emergency"
		| "Hospitalization"
		| "Other"
	expense_type?:
		| "Travel"
		| "Wage loss"
		| "Accommodation"
		| "Rent"
		| "Miscellaneous"
		| "Grocery"
		| "Food"
		| "School Fees"
		| "Tuition Fees"
		| "Entertainment"
		| "Clothes"
		| "Other"
	amount?: number
	date_time?: string
	description?: string
	proof_of_payment?: string | null
	is_direct?: 0 | 1
}

/**
 * Response from expense API operations
 */
export interface ExpenseApiResponse {
	name: string
	message?: string
	exc?: string
	docs?: Expense[]
}

/**
 * Service method options
 */
export interface ExpenseServiceOptions {
	/** Use cached data if available */
	useCache?: boolean
	/** Force reload from server */
	forceReload?: boolean
	/** Include detailed child table data */
	includeDetails?: boolean
	/** Maximum cache age in milliseconds */
	maxCacheAge?: number
}

/**
 * Expense analyzer state interface
 * Used by useExpenseAnalyzer composable
 */
export interface ExpenseAnalyzerState {
	/** Raw expenses from service */
	rawExpenses: ProcessedExpenseItem[]
	/** Filtered expenses for display */
	filteredExpenses: ProcessedExpenseItem[]
	/** UI loading state */
	loading: boolean
	/** Error message */
	error: string
	/** Current filters */
	filters: ExpenseFilters
	/** Form modal state */
	showExpenseForm: boolean
	/** Expense being edited */
	editingExpense: ProcessedExpenseItem | null
	/** Grouped expenses for display */
	groupedExpenses: GroupedExpenses
	/** Summary statistics */
	summary: {
		totalItems: number
		totalAmount: number
		medicalPercentage: number
	}
	/** Whether list is empty */
	isEmpty: boolean
	/** Whether filters are active */
	hasFilters: boolean
}

/**
 * Type guards for runtime type checking
 */
export function isProcessedExpenseItem(obj: any): obj is ProcessedExpenseItem {
	return (
		obj &&
		typeof obj.id === "string" &&
		(obj.type === "medical" || obj.type === "other") &&
		typeof obj.category === "string" &&
		typeof obj.amount === "number" &&
		typeof obj.date === "string"
	)
}

export function isMedicalExpenseType(
	obj: any,
): obj is BackendMedicalExpenseType {
	return (
		obj &&
		typeof obj.medical_expense_type !== "undefined" &&
		typeof obj.amount === "number"
	)
}

export function isExpenseType(obj: any): obj is BackendExpenseType {
	return (
		obj &&
		typeof obj.expense_type !== "undefined" &&
		typeof obj.amount === "number"
	)
}

/**
 * Constants for expense categories - matching backend Select options
 */
export const MEDICAL_EXPENSE_CATEGORIES = [
	{ value: "Consultation", label: "Consultation" },
	{ value: "Diagnostics Tests", label: "Diagnostics Tests" },
	{ value: "Surgery", label: "Surgery" },
	{ value: "Medicine", label: "Medicine" },
	{ value: "Therapy", label: "Therapy" },
	{ value: "Dental", label: "Dental" },
	{ value: "Optical", label: "Optical" },
	{ value: "Emergency", label: "Emergency" },
	{ value: "Hospitalization", label: "Hospitalization" },
	{ value: "Other", label: "Other" },
] as const

export const OTHER_EXPENSE_CATEGORIES = [
	{ value: "Travel", label: "Travel" },
	{ value: "Wage loss", label: "Wage Loss" },
	{ value: "Accommodation", label: "Accommodation" },
	{ value: "Rent", label: "Rent" },
	{ value: "Miscellaneous", label: "Miscellaneous" },
	{ value: "Grocery", label: "Grocery" },
	{ value: "Food", label: "Food" },
	{ value: "School Fees", label: "School Fees" },
	{ value: "Tuition Fees", label: "Tuition Fees" },
	{ value: "Entertainment", label: "Entertainment" },
	{ value: "Clothes", label: "Clothes" },
	{ value: "Other", label: "Other" },
] as const

export type MedicalExpenseCategory =
	(typeof MEDICAL_EXPENSE_CATEGORIES)[number]["value"]
export type OtherExpenseCategory =
	(typeof OTHER_EXPENSE_CATEGORIES)[number]["value"]

/**
 * Enhanced expense type definitions following IncomeType pattern
 */
export interface ExpenseTypeDefinition {
	name: string
	creation: string
	modified: string
	owner: string
	modified_by: string
	docstatus: 0 | 1 | 2
	parent?: string
	parentfield?: string
	parenttype?: string
	idx?: number
	/** Expense type name */
	type: string
	/** Category: medical or other */
	category: "medical" | "other"
	/** For medical expenses: direct or indirect */
	is_direct?: boolean
	/** WHO CHE category classification */
	che_category?: "direct_medical" | "indirect_medical" | "non_medical"
	/** Display icon for UI */
	icon?: string
	/** Color code for charts */
	color?: string
	/** Description for user guidance */
	description?: string
}

/**
 * Medical expense category with WHO CHE compliance
 */
export interface MedicalExpenseCategoryEnhanced {
	name: string
	expense_type: string
	category: "Direct" | "Indirect"
	is_direct: boolean
	che_category: "direct_medical" | "indirect_medical"
	icon: string
	color: string
	description: string
}

/**
 * Other expense category definition
 */
export interface OtherExpenseCategoryEnhanced {
	name: string
	expense_type: string
	category: "Living" | "Education" | "Transportation" | "Other"
	icon: string
	color: string
	description: string
}

/**
 * Detailed breakdown analysis data
 */
export interface DetailedBreakdownData {
	/** Period information */
	period: {
		label: string
		start_date: string
		end_date: string
		days: number
	}

	/** Overall summary */
	summary: {
		total_expenses: number
		medical_expenses: number
		other_expenses: number
		direct_medical: number
		indirect_medical: number
		expense_count: number
		average_per_day: number
		average_per_expense: number
	}

	/** CHE Analysis */
	che_analysis: {
		che_10: boolean
		che_25: boolean
		che_40: boolean
		che_ratio: number
		risk_level:
			| "minimal"
			| "low"
			| "moderate"
			| "high"
			| "critical"
			| "unknown"
			| "error"
		risk_score: number
		recommendation: string
		annual_income: number
		annualized_medical: number
		per_capita_income: number
		medical_burden_category:
			| "minimal_burden"
			| "low_burden"
			| "moderate_burden"
			| "high_burden"
			| "extreme_burden"
			| "unknown"
		financial_protection_status:
			| "protected"
			| "partially_protected"
			| "unprotected"
			| "unknown"
		who_che_thresholds: {
			che_10_threshold: number
			che_25_threshold: number
			che_40_threshold: number
		}
		comparative_analysis: {
			national_average: number
			income_group_average: number
			comparison_status:
				| "below_average"
				| "slightly_above_average"
				| "above_average"
				| "unknown"
		}
		recommendations: string[]
	}

	/** Category breakdown */
	category_breakdown: {
		medical: CategoryBreakdownItem[]
		other: CategoryBreakdownItem[]
	}

	/** Monthly trends */
	monthly_trends: MonthlyTrendItem[]

	/** Top expenses */
	top_expenses: TopExpenseItem[]

	/** Insights and recommendations */
	insights: ExpenseInsight[]
}

/**
 * Category breakdown item
 */
export interface CategoryBreakdownItem {
	category: string
	amount: number
	count: number
	percentage: number
	is_direct?: boolean
	che_category?: string
	trend: "up" | "down" | "stable"
	trend_percentage: number
}

/**
 * Monthly trend item
 */
export interface MonthlyTrendItem {
	month: string
	year: number
	total: number
	medical: number
	other: number
	direct: number
	indirect: number
	che_ratio: number
	expense_count: number
}

/**
 * Top expense item
 */
export interface TopExpenseItem {
	id: string
	category: string
	amount: number
	date: string
	description: string
	type: "medical" | "other"
	is_direct?: boolean
	percentage_of_total: number
}

/**
 * Expense insight
 */
export interface ExpenseInsight {
	type: "warning" | "info" | "success" | "error"
	title: string
	message: string
	action?: {
		label: string
		route?: string
		handler?: string
	}
}

/**
 * Detailed breakdown filters
 */
export interface DetailedBreakdownFilters {
	period:
		| "this_month"
		| "last_month"
		| "last_3_months"
		| "last_6_months"
		| "this_year"
		| "custom"
	start_date?: string
	end_date?: string
	include_medical: boolean
	include_other: boolean
	include_direct: boolean
	include_indirect: boolean
	min_amount?: number
	max_amount?: number
	categories?: string[]
	category_type?: string
}

/**
 * Breakdown view configuration
 */
export interface BreakdownViewConfig {
	show_charts: boolean
	show_trends: boolean
	show_insights: boolean
	show_top_expenses: boolean
	chart_type: "pie" | "bar" | "line" | "doughnut"
	group_by: "category" | "month" | "type"
	sort_by: "amount" | "count" | "date"
	sort_order: "asc" | "desc"
}

/**
 * Constants for enhanced expense categories
 */
export const MEDICAL_EXPENSE_CATEGORIES_ENHANCED: MedicalExpenseCategoryEnhanced[] =
	[
		// Direct Medical Expenses
		{
			name: "consultation",
			expense_type: "Consultation",
			category: "Direct",
			is_direct: true,
			che_category: "direct_medical",
			icon: "stethoscope",
			color: "#3B82F6",
			description: "Doctor consultations, specialist visits",
		},
		{
			name: "diagnostics",
			expense_type: "Diagnostics Tests",
			category: "Direct",
			is_direct: true,
			che_category: "direct_medical",
			icon: "activity",
			color: "#8B5CF6",
			description: "Lab tests, X-rays, scans, diagnostic procedures",
		},
		{
			name: "medicines",
			expense_type: "Medicine",
			category: "Direct",
			is_direct: true,
			che_category: "direct_medical",
			icon: "pill",
			color: "#10B981",
			description: "Prescription drugs, over-the-counter medications",
		},
		{
			name: "hospitalization",
			expense_type: "Hospitalization",
			category: "Direct",
			is_direct: true,
			che_category: "direct_medical",
			icon: "building",
			color: "#EF4444",
			description: "Hospital stays, surgery, emergency care",
		},
		{
			name: "therapy",
			expense_type: "Therapy",
			category: "Direct",
			is_direct: true,
			che_category: "direct_medical",
			icon: "heart",
			color: "#06B6D4",
			description: "Physical therapy, rehabilitation services",
		},
		{
			name: "surgery",
			expense_type: "Surgery",
			category: "Direct",
			is_direct: true,
			che_category: "direct_medical",
			icon: "scissors",
			color: "#DC2626",
			description: "Surgical procedures and operations",
		},
		{
			name: "dental",
			expense_type: "Dental",
			category: "Direct",
			is_direct: true,
			che_category: "direct_medical",
			icon: "smile",
			color: "#059669",
			description: "Dental care and treatments",
		},
		{
			name: "optical",
			expense_type: "Optical",
			category: "Direct",
			is_direct: true,
			che_category: "direct_medical",
			icon: "eye",
			color: "#7C3AED",
			description: "Eye care, glasses, vision treatments",
		},
		{
			name: "emergency",
			expense_type: "Emergency",
			category: "Direct",
			is_direct: true,
			che_category: "direct_medical",
			icon: "alert-triangle",
			color: "#F59E0B",
			description: "Emergency medical care",
		},

		// Indirect Medical Expenses
		{
			name: "travel",
			expense_type: "Travel",
			category: "Indirect",
			is_direct: false,
			che_category: "indirect_medical",
			icon: "car",
			color: "#F59E0B",
			description: "Transportation to healthcare facilities",
		},
		{
			name: "accommodation",
			expense_type: "Accommodation",
			category: "Indirect",
			is_direct: false,
			che_category: "indirect_medical",
			icon: "home",
			color: "#6366F1",
			description: "Lodging during medical treatment",
		},
		{
			name: "wage_loss",
			expense_type: "Wage loss",
			category: "Indirect",
			is_direct: false,
			che_category: "indirect_medical",
			icon: "trending-down",
			color: "#DC2626",
			description: "Income lost due to illness or treatment",
		},
	] as const

export const OTHER_EXPENSE_CATEGORIES_ENHANCED: OtherExpenseCategoryEnhanced[] =
	[
		// Living Expenses
		{
			name: "food",
			expense_type: "Food",
			category: "Living",
			icon: "utensils",
			color: "#059669",
			description: "Food and meals",
		},
		{
			name: "grocery",
			expense_type: "Grocery",
			category: "Living",
			icon: "shopping-cart",
			color: "#10B981",
			description: "Groceries and household supplies",
		},
		{
			name: "rent",
			expense_type: "Rent",
			category: "Living",
			icon: "home",
			color: "#7C3AED",
			description: "Rent and housing costs",
		},

		// Education
		{
			name: "school_fees",
			expense_type: "School Fees",
			category: "Education",
			icon: "book",
			color: "#3B82F6",
			description: "School fees and educational expenses",
		},
		{
			name: "tuition_fees",
			expense_type: "Tuition Fees",
			category: "Education",
			icon: "graduation-cap",
			color: "#1D4ED8",
			description: "Tuition and private education costs",
		},

		// Other
		{
			name: "clothing",
			expense_type: "Clothes",
			category: "Other",
			icon: "shirt",
			color: "#EC4899",
			description: "Clothes and accessories",
		},
		{
			name: "entertainment",
			expense_type: "Entertainment",
			category: "Other",
			icon: "music",
			color: "#8B5CF6",
			description: "Entertainment and recreational activities",
		},
		{
			name: "miscellaneous",
			expense_type: "Miscellaneous",
			category: "Other",
			icon: "more-horizontal",
			color: "#6B7280",
			description: "Miscellaneous expenses",
		},
	] as const

/**
 * Enhanced category analytics with direct/indirect breakdown
 */
export interface CategoryAnalytics {
	name: string
	totalAmount: number
	count: number
	percentage: number
	averageAmount: number
	trend: string
	expenses: ProcessedExpenseItem[]
	icon: string
	iconClass: string
	iconBgClass: string
	progressClass: string
	// Medical-specific properties
	is_direct?: boolean
	che_category?: "direct_medical" | "indirect_medical" | "non_medical"
	medicalType?: "direct" | "indirect"
}

/**
 * Enhanced category breakdown for medical analytics
 */
export interface EnhancedCategoryBreakdown {
	direct_medical: CategoryAnalytics[]
	indirect_medical: CategoryAnalytics[]
	other: CategoryAnalytics[]
	totals: {
		direct_medical: number
		indirect_medical: number
		other: number
		total: number
	}
}

/**
 * Combined medical analytics data structure
 */
export interface MedicalAnalyticsData {
	// CHE Analysis data
	che_analysis: {
		che_10: boolean
		che_25: boolean
		che_40: boolean
		che_ratio: number
		risk_level:
			| "minimal"
			| "low"
			| "moderate"
			| "high"
			| "critical"
			| "unknown"
			| "error"
		risk_score: number
		recommendation: string
		annual_income: number
		annualized_medical: number
		per_capita_income: number
		medical_burden_category:
			| "minimal_burden"
			| "low_burden"
			| "moderate_burden"
			| "high_burden"
			| "extreme_burden"
			| "unknown"
		financial_protection_status:
			| "protected"
			| "partially_protected"
			| "unprotected"
			| "unknown"
		who_che_thresholds: {
			che_10_threshold: number
			che_25_threshold: number
			che_40_threshold: number
		}
		comparative_analysis: {
			national_average: number
			income_group_average: number
			comparison_status:
				| "below_average"
				| "slightly_above_average"
				| "above_average"
				| "unknown"
		}
		recommendations: string[]
		has_income_data: boolean
		income_based_analysis?: {
			monthly_income: number
			medical_to_income_ratio: number
			disposable_income: number
			financial_stress_level: "minimal" | "low" | "moderate" | "high"
		}
	}

	// Category breakdown with direct/indirect classification
	category_breakdown: EnhancedCategoryBreakdown

	// Monthly trends with CHE ratios
	monthly_trends: MonthlyTrendItem[]

	// Period information
	period: {
		label: string
		start_date: string
		end_date: string
		days: number
	}

	// Enhanced summary with direct/indirect breakdown
	summary: {
		total_expenses: number
		medical_expenses: number
		direct_medical: number
		indirect_medical: number
		other_expenses: number
		expense_count: number
		che_ratio: number
		average_per_day: number
		average_per_expense: number
	}

	// Insights and recommendations
	insights: ExpenseInsight[]

	// Top expenses with medical classification
	top_expenses: TopExpenseItem[]
}

/**
 * Analytics tab configuration
 */
export interface AnalyticsTabConfig {
	id: string
	label: string
	icon: string
	component: string
	enabled: boolean
	requires_income?: boolean
}

/**
 * Type guards for enhanced types
 */
export function isCategoryAnalytics(obj: any): obj is CategoryAnalytics {
	return (
		obj &&
		typeof obj.name === "string" &&
		typeof obj.totalAmount === "number" &&
		typeof obj.count === "number"
	)
}

export function isMedicalAnalyticsData(obj: any): obj is MedicalAnalyticsData {
	return (
		obj &&
		obj.che_analysis &&
		obj.category_breakdown &&
		obj.summary &&
		typeof obj.summary.total_expenses === "number"
	)
}

// Re-export backend types for convenience
export type {
	Expense as BackendExpense,
	BackendMedicalExpenseType,
	BackendExpenseType,
}
