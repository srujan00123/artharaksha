import { HOUSEHOLD_PROFILE_CONSTANTS } from "../types/household"

/**
 * Format currency amount to Indian Rupee format
 */
export const formatCurrency = (amount) => {
	return new Intl.NumberFormat("en-IN", {
		style: "currency",
		currency: "INR",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount)
}

/**
 * Convert form data to backend payload format
 */
export const convertToPayload = (formData) => {
	return {
		address: formData.address,
		district: formData.district,
		family_member_count: formData.family_member_count,
		annual_income: formData.annual_income,
		vulnerability_status: formData.vulnerability_status ? 1 : 0,
		ration_card_holder: formData.ration_card_holder ? 1 : 0,
		che_10: formData.che_10 ? 1 : 0,
		che_25: formData.che_25 ? 1 : 0,
		health_conditions:
			formData.health_conditions?.map((condition) => ({
				condition,
				severity: "",
				diagnosed_date: "",
			})) || [],
	}
}

/**
 * Convert backend data to UI-friendly format
 */
export const convertFromBackend = (backendData) => {
	return {
		...backendData,
		vulnerability_status: Boolean(backendData.vulnerability_status),
		ration_card_holder: Boolean(backendData.ration_card_holder),
		che_10: Boolean(backendData.che_10),
		che_25: Boolean(backendData.che_25),
		annual_income_formatted: backendData.annual_income
			? formatCurrency(backendData.annual_income)
			: "",
		health_condition_names:
			backendData.health_conditions
				?.map((hc) => hc.condition)
				.filter(Boolean) || [],
		status_badges: {
			vulnerable: Boolean(backendData.vulnerability_status),
			ration_card: Boolean(backendData.ration_card_holder),
			che_10: Boolean(backendData.che_10),
			che_25: Boolean(backendData.che_25),
		},
	}
}

/**
 * Validate household profile form data
 */
export const validateForm = (formData) => {
	const errors = {}
	let isValid = true

	// Address validation
	if (!formData.address?.trim()) {
		errors.address = "Address is required"
		isValid = false
	} else if (formData.address.trim().length < 10) {
		errors.address = "Address must be at least 10 characters long"
		isValid = false
	}

	// District validation
	if (!formData.district?.trim()) {
		errors.district = "District is required"
		isValid = false
	} else if (formData.district.trim().length < 2) {
		errors.district = "District name must be at least 2 characters long"
		isValid = false
	}

	// Family member count validation
	if (
		formData.family_member_count <
		HOUSEHOLD_PROFILE_CONSTANTS.MIN_FAMILY_MEMBERS
	) {
		errors.family_member_count = `Family member count must be at least ${HOUSEHOLD_PROFILE_CONSTANTS.MIN_FAMILY_MEMBERS}`
		isValid = false
	} else if (
		formData.family_member_count >
		HOUSEHOLD_PROFILE_CONSTANTS.MAX_FAMILY_MEMBERS
	) {
		errors.family_member_count = `Family member count cannot exceed ${HOUSEHOLD_PROFILE_CONSTANTS.MAX_FAMILY_MEMBERS}`
		isValid = false
	}

	// Annual income validation
	if (formData.annual_income < HOUSEHOLD_PROFILE_CONSTANTS.MIN_ANNUAL_INCOME) {
		errors.annual_income = "Annual income cannot be negative"
		isValid = false
	} else if (
		formData.annual_income > HOUSEHOLD_PROFILE_CONSTANTS.MAX_ANNUAL_INCOME
	) {
		errors.annual_income = `Annual income cannot exceed ${formatCurrency(HOUSEHOLD_PROFILE_CONSTANTS.MAX_ANNUAL_INCOME)}`
		isValid = false
	}

	return { isValid, errors }
}

/**
 * Get profile status summary
 */
export const getStatusSummary = (profile) => {
	if (!profile) {
		return {
			hasProfile: false,
			isComplete: false,
			vulnerabilityIndicators: {
				isVulnerable: false,
				hasRationCard: false,
				che10Exceeded: false,
				che25Exceeded: false,
			},
			healthConditionsCount: 0,
		}
	}

	const isComplete = Boolean(
		profile.address &&
			profile.district &&
			profile.family_member_count &&
			profile.annual_income !== undefined,
	)

	return {
		hasProfile: true,
		isComplete,
		vulnerabilityIndicators: {
			isVulnerable: Boolean(profile.vulnerability_status),
			hasRationCard: Boolean(profile.ration_card_holder),
			che10Exceeded: Boolean(profile.che_10),
			che25Exceeded: Boolean(profile.che_25),
		},
		healthConditionsCount: profile.health_conditions?.length || 0,
		lastUpdated: profile.modified,
	}
}

/**
 * Calculate CHE thresholds based on annual income
 */
export const calculateCHEThresholds = (annualIncome) => {
	return {
		che10Threshold:
			annualIncome * HOUSEHOLD_PROFILE_CONSTANTS.CHE_THRESHOLDS.CHE_10,
		che25Threshold:
			annualIncome * HOUSEHOLD_PROFILE_CONSTANTS.CHE_THRESHOLDS.CHE_25,
		che10ThresholdFormatted: formatCurrency(
			annualIncome * HOUSEHOLD_PROFILE_CONSTANTS.CHE_THRESHOLDS.CHE_10,
		),
		che25ThresholdFormatted: formatCurrency(
			annualIncome * HOUSEHOLD_PROFILE_CONSTANTS.CHE_THRESHOLDS.CHE_25,
		),
	}
}
