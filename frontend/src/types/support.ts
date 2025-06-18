import type { HealthCondition as BackendHealthCondition } from "./Artha/HealthCondition"
import type { HouseholdProfile as BackendHouseholdProfile } from "./Artha/HouseholdProfile"
import type { SupportPathway as BackendSupportPathway } from "./Artha/SupportPathway"
import type { UserHealthCondition as BackendUserHealthCondition } from "./Artha/UserHealthCondition"
import type { WelfareScheme as BackendWelfareScheme } from "./Artha/WelfareScheme"

// Core support types
export interface ProcessedHealthCondition extends BackendHealthCondition {
	isSelected?: boolean
	userSeverity?: "Mild" | "Moderate" | "Severe"
	userDuration?: "Temporary" | "Permanent"
	userNotes?: string
}

export interface ProcessedWelfareScheme extends BackendWelfareScheme {
	is_eligible?: boolean
	eligibility_status?: EligibilityStatus[]
	eligibility_score?: number
	isBookmarked?: boolean
	applicationStatus?: "not_applied" | "applied" | "approved" | "rejected"
}

export interface ProcessedSupportPathway extends BackendSupportPathway {
	isRelevant?: boolean
	relevanceScore?: number
	isBookmarked?: boolean
}

export interface ProcessedHouseholdProfile extends BackendHouseholdProfile {
	completionPercentage?: number
	missingFields?: string[]
	riskLevel?: "low" | "medium" | "high"
}

// Application and Claims types
export interface SchemeApplication {
	name?: string
	scheme_reference?: string
	scheme_type?: "Welfare Scheme" | "Insurance Scheme"
	custom_scheme?: boolean
	custom_scheme_name?: string
	custom_scheme_type?: "Welfare Scheme" | "Insurance Scheme"
	custom_coverage_amount?: number
	description?: string
	documents_submitted?: DocumentSubmission[]
	status?: ApplicationStatus
	application_date?: string
	approval_date?: string
	rejection_reason?: string
}

export interface SchemeClaim {
	name?: string
	scheme_reference?: string
	scheme_type?: "Welfare Scheme" | "Insurance Scheme"
	custom_scheme?: boolean
	custom_scheme_name?: string
	custom_scheme_type?: "Welfare Scheme" | "Insurance Scheme"
	claim_amount?: number
	approved_amount?: number
	description?: string
	documents_submitted?: DocumentSubmission[]
	status?: ClaimStatus
	claim_date?: string
	processing_date?: string
	approval_date?: string
	payment_date?: string
	rejection_reason?: string
}

export interface DocumentSubmission {
	description: string
	file_url?: string
	submitted_date?: string
}

// Status types
export type ApplicationStatus = "pending" | "approved" | "rejected"
export type ClaimStatus =
	| "submitted"
	| "processing"
	| "approved"
	| "rejected"
	| "paid"

// Eligibility types
export interface EligibilityStatus {
	criteria: string
	required: string
	current: string
	met: boolean
}

export interface SupportRecommendations {
	health_based_support: ProcessedSupportPathway[]
	income_based_support: ProcessedWelfareScheme[]
	insurance_recommendations: ProcessedInsuranceScheme[]
	general_support: ProcessedSupportPathway[]
}

// Form data types
export interface HealthConditionFormData {
	condition: string
	severity?: "Mild" | "Moderate" | "Severe"
	duration_override?: "Temporary" | "Permanent"
	notes?: string
}

export interface ApplicationFormData {
	isCustom: boolean
	schemeReference: string
	schemeType: "Welfare Scheme" | "Insurance Scheme"
	customSchemeName: string
	customSchemeType: "Welfare Scheme" | "Insurance Scheme"
	customCoverageAmount: number | null
	description: string
	documents: DocumentSubmission[]
}

export interface ClaimFormData {
	isCustom: boolean
	schemeReference: string
	schemeType: "Welfare Scheme" | "Insurance Scheme"
	customSchemeName: string
	customSchemeType: "Welfare Scheme" | "Insurance Scheme"
	claimAmount: number | null
	approvedAmount?: number | null
	description: string
	documents: DocumentSubmission[]
	status?: ClaimStatus
}

// Filter types
export interface WelfareSchemeFilters {
	type?: "Government" | "Private" | null
	eligibility?: "eligible" | "partially_eligible" | "not_eligible" | null
	coverage_amount_min?: number
	coverage_amount_max?: number
	search?: string
}

// Additional filter types for support store
export interface SupportFilters {
	type?: string
	scheme_source?: string
	search?: string
}

// Insurance scheme type (extending welfare scheme)
export interface ProcessedInsuranceScheme extends ProcessedWelfareScheme {
	scheme_source?: "insurance" | "welfare"
	premium_amount?: number
	coverage_period?: string
}

// Eligibility result type
export interface EligibilityResult extends ProcessedWelfareScheme {
	is_eligible: boolean
	eligibility_score: number
	eligibility_reasons?: string[]
	missing_criteria?: string[]
}

// Support store state interface
export interface SupportStoreState {
	// Health Conditions
	healthConditions: ProcessedHealthCondition[]
	healthConditionsLoading: boolean
	healthConditionsError: string

	// Welfare Schemes
	welfareSchemes: ProcessedWelfareScheme[]
	welfareSchemesLoading: boolean
	welfareSchemesError: string

	// Insurance Schemes
	insuranceSchemes: ProcessedInsuranceScheme[]
	insuranceSchemesLoading: boolean
	insuranceSchemesError: string

	// All Schemes (unified)
	allSchemes: (ProcessedWelfareScheme | ProcessedInsuranceScheme)[]
	allSchemesLoading: boolean
	allSchemesError: string

	// Support Pathways
	supportPathways: ProcessedSupportPathway[]
	supportPathwaysLoading: boolean
	supportPathwaysError: string

	// Household Profile
	householdProfile: ProcessedHouseholdProfile | null
	householdProfileLoading: boolean
	householdProfileError: string

	// Eligible Schemes
	eligibleSchemes: EligibilityResult[]
	eligibleSchemesLoading: boolean
	eligibleSchemesError: string

	// Support Recommendations
	supportRecommendations: SupportRecommendations
	supportRecommendationsLoading: boolean
	supportRecommendationsError: string

	// Scheme Applications
	applications: SchemeApplication[]
	applicationsLoading: boolean
	applicationsError: string

	// Scheme Claims
	claims: SchemeClaim[]
	claimsLoading: boolean
	claimsError: string

	// Filters
	welfareSchemeFilters: SupportFilters
	insuranceSchemeFilters: SupportFilters
	allSchemeFilters: SupportFilters

	// Cache timestamps
	lastFetched: {
		healthConditions: number | null
		welfareSchemes: number | null
		insuranceSchemes: number | null
		allSchemes: number | null
		supportPathways: number | null
		householdProfile: number | null
		eligibleSchemes: number | null
		supportRecommendations: number | null
		applications: number | null
		claims: number | null
	}
}

// Service options interface
export interface SupportServiceOptions {
	useCache?: boolean
	forceReload?: boolean
	includeDetails?: boolean
}

// Service response interface for enhanced error handling
export interface SupportServiceResponse {
	success: boolean
	message?: string
	error_type?: string
	data?: any
}

// Validation result interface
export interface SupportValidationResult {
	isValid: boolean
	errors: string[]
	warnings?: string[]
}

// Profile completeness type
export type ProfileCompleteness = number

// Risk level type
export type RiskLevel = "low" | "medium" | "high"

// Support service data interface
export interface SupportServiceData {
	healthConditions: ProcessedHealthCondition[]
	welfareSchemes: ProcessedWelfareScheme[]
	insuranceSchemes: ProcessedInsuranceScheme[]
	allSchemes: (ProcessedWelfareScheme | ProcessedInsuranceScheme)[]
	supportPathways: ProcessedSupportPathway[]
	householdProfile: ProcessedHouseholdProfile | null
	eligibleSchemes: EligibilityResult[]
	recommendations: SupportRecommendations | null
	applications: SchemeApplication[]
	claims: SchemeClaim[]
}

// Constants - matching backend Select options
export const CONDITION_TYPES = [
	{ value: "Disease", label: "Disease", icon: "🦠" },
	{ value: "Disability", label: "Disability", icon: "♿" },
	{ value: "Allergy", label: "Allergy", icon: "🤧" },
	{ value: "Other", label: "Other", icon: "📋" },
] as const

export const SEVERITY_LEVELS = [
	{
		value: "Mild",
		label: "Mild",
		color: "green",
		description: "Minor impact on daily activities",
	},
	{
		value: "Moderate",
		label: "Moderate",
		color: "yellow",
		description: "Some impact on daily activities",
	},
	{
		value: "Severe",
		label: "Severe",
		color: "red",
		description: "Significant impact on daily activities",
	},
] as const

export const DURATION_TYPES = [
	{
		value: "Temporary",
		label: "Temporary",
		description: "Expected to resolve over time",
	},
	{
		value: "Permanent",
		label: "Permanent",
		description: "Long-term or chronic condition",
	},
] as const

export const SCHEME_TYPES = [
	{
		value: "Government",
		label: "Government",
		icon: "🏛️",
		description: "Government-sponsored schemes",
	},
	{
		value: "Private",
		label: "Private",
		icon: "🏢",
		description: "Private organization schemes",
	},
] as const

export const APPLICATION_STATUS_OPTIONS = [
	{
		value: "pending",
		label: "Pending",
		color: "yellow",
		description: "Application is under review",
	},
	{
		value: "approved",
		label: "Approved",
		color: "green",
		description: "Application has been approved",
	},
	{
		value: "rejected",
		label: "Rejected",
		color: "red",
		description: "Application has been rejected",
	},
] as const

export const CLAIM_STATUS_OPTIONS = [
	{
		value: "submitted",
		label: "Submitted",
		color: "blue",
		description: "Claim has been submitted",
	},
	{
		value: "processing",
		label: "Processing",
		color: "yellow",
		description: "Claim is being processed",
	},
	{
		value: "approved",
		label: "Approved",
		color: "green",
		description: "Claim has been approved",
	},
	{
		value: "rejected",
		label: "Rejected",
		color: "red",
		description: "Claim has been rejected",
	},
	{
		value: "paid",
		label: "Paid",
		color: "green",
		description: "Claim amount has been paid",
	},
] as const

export const DOCUMENT_TYPES = [
	"Aadhaar Card",
	"Ration Card",
	"Income Certificate",
	"Disability Certificate",
	"Medical Certificate",
	"Bank Passbook",
	"Passport Photo",
	"Address Proof",
	"Age Proof",
	"Caste Certificate",
] as const

// Risk assessment constants
export const RISK_THRESHOLDS = {
	LOW: {
		maxHealthConditions: 1,
		minAnnualIncome: 300000,
		maxCHEIndicators: 0,
	},
	MEDIUM: {
		maxHealthConditions: 3,
		minAnnualIncome: 150000,
		maxCHEIndicators: 1,
	},
	HIGH: {
		maxHealthConditions: Number.POSITIVE_INFINITY,
		minAnnualIncome: 0,
		maxCHEIndicators: Number.POSITIVE_INFINITY,
	},
} as const

// Utility functions
export function calculateRiskLevel(
	profile: BackendHouseholdProfile,
): "low" | "medium" | "high" {
	if (!profile) return "medium"

	const healthConditionsCount = profile.health_conditions?.length || 0
	const annualIncome = profile.annual_income || 0
	const cheIndicators = (profile.che_10 ? 1 : 0) + (profile.che_25 ? 1 : 0)

	if (
		healthConditionsCount <= RISK_THRESHOLDS.LOW.maxHealthConditions &&
		annualIncome >= RISK_THRESHOLDS.LOW.minAnnualIncome &&
		cheIndicators <= RISK_THRESHOLDS.LOW.maxCHEIndicators
	) {
		return "low"
	}

	if (
		healthConditionsCount <= RISK_THRESHOLDS.MEDIUM.maxHealthConditions &&
		annualIncome >= RISK_THRESHOLDS.MEDIUM.minAnnualIncome &&
		cheIndicators <= RISK_THRESHOLDS.MEDIUM.maxCHEIndicators
	) {
		return "medium"
	}

	return "high"
}

export function calculateProfileCompleteness(
	profile: BackendHouseholdProfile,
): number {
	if (!profile) return 0

	const requiredFields = [
		"address",
		"district",
		"family_member_count",
		"annual_income",
	]

	const completedFields = requiredFields.filter(
		(field) =>
			profile[field as keyof BackendHouseholdProfile] !== null &&
			profile[field as keyof BackendHouseholdProfile] !== undefined &&
			profile[field as keyof BackendHouseholdProfile] !== "",
	)

	return Math.round((completedFields.length / requiredFields.length) * 100)
}

export function getSeverityColor(severity: string): string {
	const severityLevel = SEVERITY_LEVELS.find(
		(level) => level.value === severity,
	)
	return severityLevel?.color || "gray"
}

export function getConditionTypeIcon(type: string): string {
	const conditionType = CONDITION_TYPES.find((ct) => ct.value === type)
	return conditionType?.icon || "📋"
}

export function getSchemeTypeIcon(type: string): string {
	const schemeType = SCHEME_TYPES.find((st) => st.value === type)
	return schemeType?.icon || "📋"
}

export function getApplicationStatusColor(status: ApplicationStatus): string {
	const statusOption = APPLICATION_STATUS_OPTIONS.find(
		(option) => option.value === status,
	)
	return statusOption?.color || "gray"
}

export function getClaimStatusColor(status: ClaimStatus): string {
	const statusOption = CLAIM_STATUS_OPTIONS.find(
		(option) => option.value === status,
	)
	return statusOption?.color || "gray"
}

export function getStatusLabel(
	status: ApplicationStatus | ClaimStatus,
): string {
	// Check application status first
	const applicationStatus = APPLICATION_STATUS_OPTIONS.find(
		(option) => option.value === status,
	)
	if (applicationStatus) {
		return applicationStatus.label
	}

	// Check claim status
	const claimStatus = CLAIM_STATUS_OPTIONS.find(
		(option) => option.value === status,
	)
	if (claimStatus) {
		return claimStatus.label
	}

	// Fallback to capitalized status
	return status ? status.charAt(0).toUpperCase() + status.slice(1) : "Unknown"
}

export function getSchemeDisplayName(
	item: SchemeApplication | SchemeClaim,
): string {
	if (item.custom_scheme) {
		return item.custom_scheme_name || "Custom Scheme"
	}

	// This would need to be enhanced to look up the actual scheme name
	// For now, return the scheme reference
	return item.scheme_reference || "Unknown Scheme"
}

export function getCoverageAmount(
	application: SchemeApplication,
): number | null {
	if (application.custom_scheme) {
		return application.custom_coverage_amount || null
	}

	// This would need to be enhanced to look up the actual scheme coverage
	// For now, return null
	return null
}

export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat("en-IN", {
		style: "decimal",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount)
}

// Type guards
export function isProcessedHealthCondition(
	obj: any,
): obj is ProcessedHealthCondition {
	return obj && typeof obj === "object" && "condition_name" in obj
}

export function isProcessedWelfareScheme(
	obj: any,
): obj is ProcessedWelfareScheme {
	return obj && typeof obj === "object" && "scheme_name" in obj
}

export function isProcessedSupportPathway(
	obj: any,
): obj is ProcessedSupportPathway {
	return obj && typeof obj === "object" && "title" in obj
}

export function isProcessedHouseholdProfile(
	obj: any,
): obj is ProcessedHouseholdProfile {
	return obj && typeof obj === "object" && "user" in obj
}

export function isSchemeApplication(obj: any): obj is SchemeApplication {
	return (
		obj &&
		typeof obj === "object" &&
		("scheme_reference" in obj || "custom_scheme" in obj)
	)
}

export function isSchemeClaim(obj: any): obj is SchemeClaim {
	return (
		obj &&
		typeof obj === "object" &&
		("scheme_reference" in obj || "custom_scheme" in obj) &&
		"claim_amount" in obj
	)
}

// Re-export backend types for convenience
export type {
	BackendHealthCondition,
	BackendWelfareScheme,
	BackendSupportPathway,
	BackendHouseholdProfile,
	BackendUserHealthCondition,
}
