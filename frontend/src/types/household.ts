import type { HouseholdProfile } from "./Artha/HouseholdProfile"
import type { UserHealthCondition } from "./Artha/UserHealthCondition"

// Form data interface for creating/updating household profiles
export interface HouseholdProfileFormData {
	address: string
	district: string
	family_member_count: number
	annual_income: number
	vulnerability_status?: boolean
	ration_card_holder?: boolean
	che_10?: boolean
	che_25?: boolean
	health_conditions?: string[] // Array of health condition names
}

// UI-friendly household profile interface with computed fields
export interface HouseholdProfileUI
	extends Omit<
		HouseholdProfile,
		"vulnerability_status" | "ration_card_holder" | "che_10" | "che_25"
	> {
	vulnerability_status?: boolean
	ration_card_holder?: boolean
	che_10?: boolean
	che_25?: boolean
	// Computed display fields
	annual_income_formatted?: string
	health_condition_names?: string[]
	status_badges?: {
		vulnerable: boolean
		ration_card: boolean
		che_10: boolean
		che_25: boolean
	}
}

// Profile creation/update request payload
export interface HouseholdProfilePayload {
	address?: string
	district?: string
	family_member_count?: number
	annual_income?: number
	vulnerability_status?: 0 | 1
	ration_card_holder?: 0 | 1
	che_10?: 0 | 1
	che_25?: 0 | 1
	health_conditions?: Array<{
		condition: string
		severity?: string
		diagnosed_date?: string
	}>
}

// Profile validation interface
export interface HouseholdProfileValidation {
	isValid: boolean
	errors: {
		address?: string
		district?: string
		family_member_count?: string
		annual_income?: string
		general?: string
	}
}

// Profile status summary
export interface HouseholdProfileStatus {
	hasProfile: boolean
	isComplete: boolean
	vulnerabilityIndicators: {
		isVulnerable: boolean
		hasRationCard: boolean
		che10Exceeded: boolean
		che25Exceeded: boolean
	}
	healthConditionsCount: number
	lastUpdated?: string
}

// Helper function types
export interface HouseholdProfileHelpers {
	formatCurrency: (amount: number) => string
	convertToPayload: (
		formData: HouseholdProfileFormData,
	) => HouseholdProfilePayload
	convertFromBackend: (backendData: HouseholdProfile) => HouseholdProfileUI
	validateForm: (
		formData: HouseholdProfileFormData,
	) => HouseholdProfileValidation
	getStatusSummary: (profile: HouseholdProfile | null) => HouseholdProfileStatus
}

// Constants for household profile management
export const HOUSEHOLD_PROFILE_CONSTANTS = {
	MIN_FAMILY_MEMBERS: 1,
	MAX_FAMILY_MEMBERS: 20,
	MIN_ANNUAL_INCOME: 0,
	MAX_ANNUAL_INCOME: 10000000, // 1 crore
	REQUIRED_FIELDS: [
		"address",
		"district",
		"family_member_count",
		"annual_income",
	] as const,
	CHE_THRESHOLDS: {
		CHE_10: 0.1, // 10% of annual income
		CHE_25: 0.25, // 25% of annual income
	},
} as const

// Type for required fields
export type RequiredHouseholdFields =
	(typeof HOUSEHOLD_PROFILE_CONSTANTS.REQUIRED_FIELDS)[number]
