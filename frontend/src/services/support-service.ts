/**
 * Support Service
 * Handles all support-related business logic and API operations including
 * welfare schemes, insurance schemes, health conditions, and support pathways
 * Enhanced to follow the expense management architecture pattern
 */

import { call } from "frappe-ui"
import { session } from "../data/session.js"
import type {
	ApplicationFormData,
	ClaimFormData,
	EligibilityResult,
	ProcessedHealthCondition,
	ProcessedHouseholdProfile,
	ProcessedInsuranceScheme,
	ProcessedSupportPathway,
	ProcessedWelfareScheme,
	ProfileCompleteness,
	RiskLevel,
	SchemeApplication,
	SchemeClaim,
	SupportFilters,
	SupportRecommendations,
	SupportServiceData,
	SupportServiceOptions,
} from "../types/support"
import {
	calculateProfileCompleteness,
	calculateRiskLevel,
} from "../types/support"
import { API_ENDPOINTS } from "./api-service.js"
import { cacheService } from "./cache-service.js"

// Cache keys for support data
const SUPPORT_CACHE_KEYS = {
	HEALTH_CONDITIONS: "support-health-conditions",
	WELFARE_SCHEMES: "support-welfare-schemes",
	INSURANCE_SCHEMES: "support-insurance-schemes",
	ALL_SCHEMES: "support-all-schemes",
	SUPPORT_PATHWAYS: "support-pathways",
	HOUSEHOLD_PROFILE: "support-household-profile",
	ELIGIBLE_SCHEMES: "support-eligible-schemes",
	RECOMMENDATIONS: "support-recommendations",
	APPLICATIONS: "support-applications",
	CLAIMS: "support-claims",
}

export class SupportService {
	private currentData: SupportServiceData

	constructor() {
		this.currentData = {
			healthConditions: [],
			welfareSchemes: [],
			insuranceSchemes: [],
			allSchemes: [],
			supportPathways: [],
			householdProfile: null,
			eligibleSchemes: [],
			recommendations: null,
			applications: [],
			claims: [],
		}
	}

	/**
	 * Get all health conditions with caching
	 */
	async getHealthConditions(
		useCache = true,
		forceRefresh = false,
	): Promise<ProcessedHealthCondition[]> {
		try {
			// Check cache first
			if (useCache && !forceRefresh) {
				const cached = cacheService.get(SUPPORT_CACHE_KEYS.HEALTH_CONDITIONS)
				if (cached) {
					this.currentData.healthConditions = cached
					return cached
				}
			}

			const conditions =
				(await call(API_ENDPOINTS.SUPPORT.HEALTH_CONDITIONS)) || []

			const processedConditions: ProcessedHealthCondition[] = conditions.map(
				(condition) => ({
					...condition,
					isSelected: false,
					userSeverity: condition.default_severity || "mild",
				}),
			)

			// Cache the result
			if (useCache) {
				cacheService.set(
					SUPPORT_CACHE_KEYS.HEALTH_CONDITIONS,
					processedConditions,
				)
			}

			this.currentData.healthConditions = processedConditions
			return processedConditions
		} catch (error) {
			console.error("SupportService: Failed to fetch health conditions:", error)
			throw new Error(`Failed to load health conditions: ${error.message}`)
		}
	}

	/**
	 * Get welfare schemes with filtering and caching
	 */
	async getWelfareSchemes(
		filters: SupportFilters | null = null,
		options: SupportServiceOptions = {},
	): Promise<ProcessedWelfareScheme[]> {
		const { useCache = true, forceReload = false } = options
		const cacheKey = filters
			? `${SUPPORT_CACHE_KEYS.WELFARE_SCHEMES}-${JSON.stringify(filters)}`
			: SUPPORT_CACHE_KEYS.WELFARE_SCHEMES

		try {
			// Check cache first
			if (useCache && !forceReload) {
				const cached = cacheService.get(cacheKey)
				if (cached) {
					this.currentData.welfareSchemes = cached
					return cached
				}
			}

			const response = await call(API_ENDPOINTS.SUPPORT.WELFARE_SCHEMES, {
				filters,
			})
			const schemes = response || []

			// Transform and validate data
			const processedSchemes: ProcessedWelfareScheme[] = schemes.map(
				(scheme) => ({
					...scheme,
					isBookmarked: false,
					applicationStatus: "not_applied",
					is_eligible: undefined,
					eligibility_status: [],
					eligibility_score: 0,
					scheme_source: "welfare",
				}),
			)

			// Cache the result
			if (useCache) {
				cacheService.set(cacheKey, processedSchemes)
			}

			this.currentData.welfareSchemes = processedSchemes
			return processedSchemes
		} catch (error) {
			console.error("SupportService: Failed to fetch welfare schemes:", error)
			throw new Error(`Failed to load welfare schemes: ${error.message}`)
		}
	}

	/**
	 * Get insurance schemes with filtering and caching
	 */
	async getInsuranceSchemes(
		filters: SupportFilters | null = null,
		options: SupportServiceOptions = {},
	): Promise<ProcessedInsuranceScheme[]> {
		const { useCache = true, forceReload = false } = options
		const cacheKey = filters
			? `${SUPPORT_CACHE_KEYS.INSURANCE_SCHEMES}-${JSON.stringify(filters)}`
			: SUPPORT_CACHE_KEYS.INSURANCE_SCHEMES

		try {
			// Check cache first
			if (useCache && !forceReload) {
				const cached = cacheService.get(cacheKey)
				if (cached) {
					this.currentData.insuranceSchemes = cached
					return cached
				}
			}

			const response = await call(API_ENDPOINTS.SUPPORT.INSURANCE_SCHEMES, {
				filters,
			})
			const schemes = response || []

			// Transform and validate data
			const processedSchemes: ProcessedInsuranceScheme[] = schemes.map(
				(scheme) => ({
					...scheme,
					isBookmarked: false,
					applicationStatus: "not_applied",
					is_eligible: undefined,
					eligibility_status: [],
					eligibility_score: 0,
					scheme_source: "insurance",
				}),
			)

			// Cache the result
			if (useCache) {
				cacheService.set(cacheKey, processedSchemes)
			}

			this.currentData.insuranceSchemes = processedSchemes
			return processedSchemes
		} catch (error) {
			console.error("SupportService: Failed to fetch insurance schemes:", error)
			throw new Error(`Failed to load insurance schemes: ${error.message}`)
		}
	}

	/**
	 * Get all schemes (welfare + insurance) with filtering and caching
	 */
	async getAllSchemes(
		filters: SupportFilters | null = null,
		options: SupportServiceOptions = {},
	): Promise<(ProcessedWelfareScheme | ProcessedInsuranceScheme)[]> {
		const { useCache = true, forceReload = false } = options
		const cacheKey = filters
			? `${SUPPORT_CACHE_KEYS.ALL_SCHEMES}-${JSON.stringify(filters)}`
			: SUPPORT_CACHE_KEYS.ALL_SCHEMES

		try {
			// Check cache first
			if (useCache && !forceReload) {
				const cached = cacheService.get(cacheKey)
				if (cached) {
					this.currentData.allSchemes = cached
					return cached
				}
			}

			// Get both welfare and insurance schemes in parallel
			const [welfareSchemes, insuranceSchemes] = await Promise.all([
				this.getWelfareSchemes(filters, { useCache, forceReload }),
				this.getInsuranceSchemes(filters, { useCache, forceReload }),
			])

			const allSchemes = [...welfareSchemes, ...insuranceSchemes]

			// Cache the combined result
			if (useCache) {
				cacheService.set(cacheKey, allSchemes)
			}

			this.currentData.allSchemes = allSchemes
			return allSchemes
		} catch (error) {
			console.error("SupportService: Failed to fetch all schemes:", error)
			throw new Error(`Failed to load schemes: ${error.message}`)
		}
	}

	/**
	 * Get support pathways with filtering and caching
	 */
	async getSupportPathways(
		filters: SupportFilters | null = null,
		options: SupportServiceOptions = {},
	): Promise<ProcessedSupportPathway[]> {
		const { useCache = true, forceReload = false } = options
		const cacheKey = filters
			? `${SUPPORT_CACHE_KEYS.SUPPORT_PATHWAYS}-${JSON.stringify(filters)}`
			: SUPPORT_CACHE_KEYS.SUPPORT_PATHWAYS

		try {
			// Check cache first
			if (useCache && !forceReload) {
				const cached = cacheService.get(cacheKey)
				if (cached) {
					this.currentData.supportPathways = cached
					return cached
				}
			}

			const response = await call(API_ENDPOINTS.SUPPORT.PATHWAYS, { filters })
			const pathways = response || []

			// Transform and validate data
			const processedPathways: ProcessedSupportPathway[] = pathways.map(
				(pathway) => ({
					...pathway,
					isBookmarked: false,
					completionStatus: "not_started",
					progress: 0,
				}),
			)

			// Cache the result
			if (useCache) {
				cacheService.set(cacheKey, processedPathways)
			}

			this.currentData.supportPathways = processedPathways
			return processedPathways
		} catch (error) {
			console.error("SupportService: Failed to fetch support pathways:", error)
			throw new Error(`Failed to load support pathways: ${error.message}`)
		}
	}

	/**
	 * Get household profile with caching
	 */
	async getHouseholdProfile(
		options: SupportServiceOptions = {},
	): Promise<ProcessedHouseholdProfile | null> {
		const { useCache = true, forceReload = false } = options

		try {
			// Check cache first
			if (useCache && !forceReload) {
				const cached = cacheService.get(SUPPORT_CACHE_KEYS.HOUSEHOLD_PROFILE)
				if (cached) {
					this.currentData.householdProfile = cached
					return cached
				}
			}

			const response = await call(API_ENDPOINTS.SUPPORT.HOUSEHOLD_PROFILE)

			if (!response) {
				this.currentData.householdProfile = null
				return null
			}

			// Transform and validate data
			const processedProfile: ProcessedHouseholdProfile = {
				...response,
				completeness: calculateProfileCompleteness(response),
				riskLevel: calculateRiskLevel(response),
				missingFields: this.getMissingFields(response),
			}

			// Cache the result
			if (useCache) {
				cacheService.set(SUPPORT_CACHE_KEYS.HOUSEHOLD_PROFILE, processedProfile)
			}

			this.currentData.householdProfile = processedProfile
			return processedProfile
		} catch (error) {
			console.error("SupportService: Failed to fetch household profile:", error)
			throw new Error(`Failed to load household profile: ${error.message}`)
		}
	}

	/**
	 * Get eligible schemes based on household profile
	 */
	async getEligibleSchemes(
		options: SupportServiceOptions = {},
	): Promise<EligibilityResult[]> {
		const { useCache = true, forceReload = false } = options

		try {
			// Check cache first
			if (useCache && !forceReload) {
				const cached = cacheService.get(SUPPORT_CACHE_KEYS.ELIGIBLE_SCHEMES)
				if (cached) {
					this.currentData.eligibleSchemes = cached
					return cached
				}
			}

			const response = await call(API_ENDPOINTS.SUPPORT.ELIGIBLE_SCHEMES)
			const eligibleSchemes: EligibilityResult[] = response || []

			// Cache the result
			if (useCache) {
				cacheService.set(SUPPORT_CACHE_KEYS.ELIGIBLE_SCHEMES, eligibleSchemes)
			}

			this.currentData.eligibleSchemes = eligibleSchemes
			return eligibleSchemes
		} catch (error) {
			console.error("SupportService: Failed to fetch eligible schemes:", error)
			throw new Error(`Failed to load eligible schemes: ${error.message}`)
		}
	}

	/**
	 * Get support recommendations based on profile and health conditions
	 */
	async getSupportRecommendations(
		options: SupportServiceOptions = {},
	): Promise<SupportRecommendations | null> {
		const { useCache = true, forceReload = false } = options

		try {
			// Check cache first
			if (useCache && !forceReload) {
				const cached = cacheService.get(SUPPORT_CACHE_KEYS.RECOMMENDATIONS)
				if (cached) {
					this.currentData.recommendations = cached
					return cached
				}
			}

			const response = await call(API_ENDPOINTS.SUPPORT.RECOMMENDATIONS)
			const recommendations: SupportRecommendations | null = response || null

			// Cache the result
			if (useCache && recommendations) {
				cacheService.set(SUPPORT_CACHE_KEYS.RECOMMENDATIONS, recommendations)
			}

			this.currentData.recommendations = recommendations
			return recommendations
		} catch (error) {
			console.error(
				"SupportService: Failed to fetch support recommendations:",
				error,
			)
			throw new Error(
				`Failed to load support recommendations: ${error.message}`,
			)
		}
	}

	/**
	 * Update health conditions for the user
	 * Enhanced with graceful error handling
	 */
	async updateHealthConditions(
		healthConditions: ProcessedHealthCondition[],
	): Promise<void> {
		try {
			const result = await call(
				API_ENDPOINTS.SUPPORT.UPDATE_HEALTH_CONDITIONS,
				{
					health_conditions: healthConditions,
				},
			)

			// Handle backend error responses gracefully
			if (result && !result.success) {
				if (result.error_type === "profile_not_found") {
					throw new Error(
						"Profile not found. Please create your profile first.",
					)
				}
				throw new Error(result.message || "Failed to update health conditions")
			}

			// Update local cache
			this.currentData.healthConditions = healthConditions
			cacheService.set(SUPPORT_CACHE_KEYS.HEALTH_CONDITIONS, healthConditions)

			// Clear dependent caches
			this.invalidateRelatedCaches()
		} catch (error) {
			console.error(
				"SupportService: Failed to update health conditions:",
				error,
			)

			// Handle "not found" errors gracefully
			if (error.message && error.message.includes("not found")) {
				// Clear stale cache and refresh data
				this.invalidateRelatedCaches()
				throw new Error(
					"Data sync issue detected. Please refresh and try again.",
				)
			}

			throw new Error(`Failed to update health conditions: ${error.message}`)
		}
	}

	/**
	 * Get scheme applications
	 */
	async getSchemeApplications(
		options: SupportServiceOptions = {},
	): Promise<SchemeApplication[]> {
		const { useCache = true, forceReload = false } = options

		try {
			// Check cache first
			if (useCache && !forceReload) {
				const cached = cacheService.get(SUPPORT_CACHE_KEYS.APPLICATIONS)
				if (cached) {
					this.currentData.applications = cached
					return cached
				}
			}

			const response = await call(API_ENDPOINTS.SUPPORT.GET_APPLICATIONS)
			const applications: SchemeApplication[] = response || []

			// Cache the result
			if (useCache) {
				cacheService.set(SUPPORT_CACHE_KEYS.APPLICATIONS, applications)
			}

			this.currentData.applications = applications
			return applications
		} catch (error) {
			console.error(
				"SupportService: Failed to fetch scheme applications:",
				error,
			)
			throw new Error(`Failed to load scheme applications: ${error.message}`)
		}
	}

	/**
	 * Create new scheme application
	 */
	async createSchemeApplication(
		applicationData: ApplicationFormData,
	): Promise<SchemeApplication> {
		try {
			const response = await call(API_ENDPOINTS.SUPPORT.CREATE_APPLICATION, {
				application_data: applicationData,
			})
			const newApplication: SchemeApplication = response

			// Update local cache
			this.currentData.applications.unshift(newApplication)
			this.invalidateCache("applications")

			return newApplication
		} catch (error) {
			console.error(
				"SupportService: Failed to create scheme application:",
				error,
			)
			throw new Error(`Failed to create scheme application: ${error.message}`)
		}
	}

	/**
	 * Update existing scheme application
	 */
	async updateSchemeApplication(
		applicationName: string,
		applicationData: Partial<ApplicationFormData>,
	): Promise<SchemeApplication> {
		try {
			const response = await call(API_ENDPOINTS.SUPPORT.UPDATE_APPLICATION, {
				application_name: applicationName,
				application_data: applicationData,
			})
			const updatedApplication: SchemeApplication = response

			// Update local cache
			const index = this.currentData.applications.findIndex(
				(app) => app.name === applicationName,
			)
			if (index !== -1) {
				this.currentData.applications[index] = updatedApplication
			}
			this.invalidateCache("applications")

			return updatedApplication
		} catch (error) {
			console.error(
				"SupportService: Failed to update scheme application:",
				error,
			)
			throw new Error(`Failed to update scheme application: ${error.message}`)
		}
	}

	/**
	 * Get scheme claims
	 */
	async getSchemeClaims(
		options: SupportServiceOptions = {},
	): Promise<SchemeClaim[]> {
		const { useCache = true, forceReload = false } = options

		try {
			// Check cache first
			if (useCache && !forceReload) {
				const cached = cacheService.get(SUPPORT_CACHE_KEYS.CLAIMS)
				if (cached) {
					this.currentData.claims = cached
					return cached
				}
			}

			const response = await call(API_ENDPOINTS.SUPPORT.GET_CLAIMS)
			const claims: SchemeClaim[] = response || []

			// Cache the result
			if (useCache) {
				cacheService.set(SUPPORT_CACHE_KEYS.CLAIMS, claims)
			}

			this.currentData.claims = claims
			return claims
		} catch (error) {
			console.error("SupportService: Failed to fetch scheme claims:", error)
			throw new Error(`Failed to load scheme claims: ${error.message}`)
		}
	}

	/**
	 * Create new scheme claim
	 */
	async createSchemeClaim(claimData: ClaimFormData): Promise<SchemeClaim> {
		try {
			const response = await call(API_ENDPOINTS.SUPPORT.CREATE_CLAIM, {
				claim_data: claimData,
			})
			const newClaim: SchemeClaim = response

			// Update local cache
			this.currentData.claims.unshift(newClaim)
			this.invalidateCache("claims")

			return newClaim
		} catch (error) {
			console.error("SupportService: Failed to create scheme claim:", error)
			throw new Error(`Failed to create scheme claim: ${error.message}`)
		}
	}

	/**
	 * Update existing scheme claim
	 */
	async updateSchemeClaim(
		claimName: string,
		claimData: Partial<ClaimFormData>,
	): Promise<SchemeClaim> {
		try {
			const response = await call(API_ENDPOINTS.SUPPORT.UPDATE_CLAIM, {
				claim_name: claimName,
				claim_data: claimData,
			})
			const updatedClaim: SchemeClaim = response

			// Update local cache
			const index = this.currentData.claims.findIndex(
				(claim) => claim.name === claimName,
			)
			if (index !== -1) {
				this.currentData.claims[index] = updatedClaim
			}
			this.invalidateCache("claims")

			return updatedClaim
		} catch (error) {
			console.error("SupportService: Failed to update scheme claim:", error)
			throw new Error(`Failed to update scheme claim: ${error.message}`)
		}
	}

	/**
	 * Delete scheme application
	 * Enhanced with graceful "not found" handling
	 */
	async deleteSchemeApplication(applicationName: string): Promise<boolean> {
		try {
			const result = await call(API_ENDPOINTS.SUPPORT.DELETE_APPLICATION, {
				application_name: applicationName,
			})

			// Handle graceful "not found" responses
			if (result && result.success) {
				// Update local cache
				const index = this.currentData.applications.findIndex(
					(app) => app.name === applicationName,
				)
				if (index !== -1) {
					this.currentData.applications.splice(index, 1)
				}
				this.invalidateCache("applications")
				return true
			}

			return false
		} catch (error: any) {
			console.error(
				"SupportService: Failed to delete scheme application:",
				error,
			)

			// Handle "not found" errors gracefully
			if (error.message && error.message.includes("not found")) {
				// Automatically refresh data and remove from cache
				this.invalidateCache("applications")
				return true // Consider it successful since it's already deleted
			}

			throw new Error(
				`Failed to delete scheme application: ${error.message || "Unknown error"}`,
			)
		}
	}

	/**
	 * Delete scheme claim
	 * Enhanced with graceful "not found" handling
	 */
	async deleteSchemeClaim(claimName: string): Promise<boolean> {
		try {
			const result = await call(API_ENDPOINTS.SUPPORT.DELETE_CLAIM, {
				claim_name: claimName,
			})

			// Handle graceful "not found" responses
			if (result && result.success) {
				// Update local cache
				const index = this.currentData.claims.findIndex(
					(claim) => claim.name === claimName,
				)
				if (index !== -1) {
					this.currentData.claims.splice(index, 1)
				}
				this.invalidateCache("claims")
				return true
			}

			return false
		} catch (error: any) {
			console.error("SupportService: Failed to delete scheme claim:", error)

			// Handle "not found" errors gracefully
			if (error.message && error.message.includes("not found")) {
				// Automatically refresh data and remove from cache
				this.invalidateCache("claims")
				return true // Consider it successful since it's already deleted
			}

			throw new Error(
				`Failed to delete scheme claim: ${error.message || "Unknown error"}`,
			)
		}
	}

	/**
	 * Get application status
	 */
	getApplicationStatus(application: SchemeApplication): string {
		return application.status || "pending"
	}

	/**
	 * Get application status label
	 */
	getApplicationStatusLabel(application: SchemeApplication): string {
		const status = this.getApplicationStatus(application)
		const labels: Record<string, string> = {
			pending: "Pending Review",
			approved: "Approved",
			rejected: "Rejected",
			under_review: "Under Review",
			requires_documents: "Documents Required",
		}
		return labels[status] || status
	}

	/**
	 * Check if application can be edited
	 */
	canEditApplication(application: SchemeApplication): boolean {
		const status = this.getApplicationStatus(application)
		return ["pending", "requires_documents"].includes(status)
	}

	/**
	 * Check if application can be cancelled
	 */
	canCancelApplication(application: SchemeApplication): boolean {
		const status = this.getApplicationStatus(application)
		return !["approved", "rejected"].includes(status)
	}

	/**
	 * Get claim status label
	 */
	getClaimStatusLabel(status: string): string {
		const labels: Record<string, string> = {
			pending: "Pending Review",
			approved: "Approved",
			rejected: "Rejected",
			paid: "Paid",
			under_review: "Under Review",
		}
		return labels[status] || status
	}

	/**
	 * Check if claim can be edited
	 */
	canEditClaim(claim: SchemeClaim): boolean {
		const status = claim.status || "pending"
		return ["pending", "under_review"].includes(status)
	}

	/**
	 * Check if claim can be cancelled
	 */
	canCancelClaim(claim: SchemeClaim): boolean {
		const status = claim.status || "pending"
		return !["approved", "rejected", "paid"].includes(status)
	}

	/**
	 * Calculate profile completeness
	 */
	calculateProfileCompleteness(
		profile: ProcessedHouseholdProfile,
	): ProfileCompleteness {
		return calculateProfileCompleteness(profile)
	}

	/**
	 * Calculate risk level
	 */
	calculateRiskLevel(profile: ProcessedHouseholdProfile): RiskLevel {
		return calculateRiskLevel(profile)
	}

	/**
	 * Get missing fields from profile
	 */
	getMissingFields(profile: ProcessedHouseholdProfile): string[] {
		const requiredFields = [
			"household_size",
			"monthly_income",
			"primary_occupation",
			"education_level",
			"housing_type",
			"location",
		]

		return requiredFields.filter((field) => !profile[field])
	}

	/**
	 * Invalidate specific cache
	 */
	private invalidateCache(dataType: string): void {
		const cacheKey = SUPPORT_CACHE_KEYS[dataType.toUpperCase()]
		if (cacheKey) {
			cacheService.delete(cacheKey)
		}
	}

	/**
	 * Invalidate related caches when health conditions change
	 */
	private invalidateRelatedCaches(): void {
		cacheService.delete(SUPPORT_CACHE_KEYS.HOUSEHOLD_PROFILE)
		cacheService.delete(SUPPORT_CACHE_KEYS.ELIGIBLE_SCHEMES)
		cacheService.delete(SUPPORT_CACHE_KEYS.RECOMMENDATIONS)
		cacheService.delete(SUPPORT_CACHE_KEYS.ALL_SCHEMES)
		cacheService.delete(SUPPORT_CACHE_KEYS.WELFARE_SCHEMES)
	}

	/**
	 * Clear cache for specific data types
	 */
	clearCache(dataTypes: string[] | null = null): void {
		if (!dataTypes) {
			// Clear all support-related caches
			Object.values(SUPPORT_CACHE_KEYS).forEach((key) => {
				cacheService.delete(key)
			})
		} else {
			// Clear specific caches
			dataTypes.forEach((dataType) => {
				const cacheKey = SUPPORT_CACHE_KEYS[dataType.toUpperCase()]
				if (cacheKey) {
					cacheService.delete(cacheKey)
				}
			})
		}
	}

	/**
	 * Reset service state
	 */
	reset(): void {
		this.currentData = {
			healthConditions: [],
			welfareSchemes: [],
			insuranceSchemes: [],
			allSchemes: [],
			supportPathways: [],
			householdProfile: null,
			eligibleSchemes: [],
			recommendations: null,
			applications: [],
			claims: [],
		}
		this.clearCache()
	}

	/**
	 * Get cache statistics
	 */
	getCacheStats(): Record<string, any> {
		return {
			currentDataCounts: {
				healthConditions: this.currentData.healthConditions.length,
				welfareSchemes: this.currentData.welfareSchemes.length,
				insuranceSchemes: this.currentData.insuranceSchemes.length,
				allSchemes: this.currentData.allSchemes.length,
				supportPathways: this.currentData.supportPathways.length,
				eligibleSchemes: this.currentData.eligibleSchemes.length,
				applications: this.currentData.applications.length,
				claims: this.currentData.claims.length,
				hasProfile: !!this.currentData.householdProfile,
				hasRecommendations: !!this.currentData.recommendations,
			},
			cacheKeys: Object.keys(SUPPORT_CACHE_KEYS),
		}
	}

	/**
	 * Initialize service with basic data
	 */
	async initialize(): Promise<void> {
		try {
			// Load essential data in parallel
			await Promise.allSettled([
				this.getHealthConditions(),
				this.getHouseholdProfile(),
				this.getSchemeApplications(),
				this.getSchemeClaims(),
			])
		} catch (error) {
			console.error("SupportService: Failed to initialize:", error)
			// Don't throw error to allow partial initialization
		}
	}

	/**
	 * Get current service data
	 */
	getCurrentData(): SupportServiceData {
		return { ...this.currentData }
	}
}

// Export singleton instance
export const supportService = new SupportService()
