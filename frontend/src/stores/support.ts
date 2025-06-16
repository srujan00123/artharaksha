/**
 * Support Store
 * Manages support-related state including health conditions, schemes, and applications
 * Uses consistent types from types/support.ts
 */

import { defineStore } from "pinia"
import { supportService } from "../services/support-service"
import type {
	ApplicationFormData,
	ClaimFormData,
	EligibilityResult,
	ProcessedHealthCondition,
	ProcessedHouseholdProfile,
	ProcessedInsuranceScheme,
	ProcessedSupportPathway,
	ProcessedWelfareScheme,
	SchemeApplication,
	SchemeClaim,
	SupportFilters,
	SupportRecommendations,
	SupportStoreState,
} from "../types/support"

export const useSupportStore = defineStore("support", {
	state: (): SupportStoreState => ({
		// Health Conditions
		healthConditions: [],
		healthConditionsLoading: false,
		healthConditionsError: "",

		// Welfare Schemes
		welfareSchemes: [],
		welfareSchemesLoading: false,
		welfareSchemesError: "",

		// Insurance Schemes
		insuranceSchemes: [],
		insuranceSchemesLoading: false,
		insuranceSchemesError: "",

		// All Schemes (unified)
		allSchemes: [],
		allSchemesLoading: false,
		allSchemesError: "",

		// Support Pathways
		supportPathways: [],
		supportPathwaysLoading: false,
		supportPathwaysError: "",

		// Household Profile
		householdProfile: null,
		householdProfileLoading: false,
		householdProfileError: "",

		// Eligible Schemes
		eligibleSchemes: [],
		eligibleSchemesLoading: false,
		eligibleSchemesError: "",

		// Support Recommendations
		supportRecommendations: {
			health_based_support: [],
			income_based_support: [],
			insurance_recommendations: [],
			general_support: [],
		},
		supportRecommendationsLoading: false,
		supportRecommendationsError: "",

		// Scheme Applications
		applications: [],
		applicationsLoading: false,
		applicationsError: "",

		// Scheme Claims
		claims: [],
		claimsLoading: false,
		claimsError: "",

		// Filters
		welfareSchemeFilters: {
			type: "",
		},
		insuranceSchemeFilters: {
			type: "",
		},
		allSchemeFilters: {
			type: "",
			scheme_source: "",
		},

		// Cache timestamps
		lastFetched: {
			healthConditions: null,
			welfareSchemes: null,
			insuranceSchemes: null,
			allSchemes: null,
			supportPathways: null,
			householdProfile: null,
			eligibleSchemes: null,
			supportRecommendations: null,
			applications: null,
			claims: null,
		},
	}),

	getters: {
		// Health Conditions getters
		getHealthConditionsByType:
			(state) =>
			(type: string): ProcessedHealthCondition[] => {
				return state.healthConditions.filter(
					(condition) => condition.condition_type === type,
				)
			},

		getHealthConditionsByName:
			(state) =>
			(name: string): ProcessedHealthCondition | undefined => {
				return state.healthConditions.find(
					(condition) => condition.name === name,
				)
			},

		// Welfare Schemes getters
		getGovernmentWelfareSchemes: (state): ProcessedWelfareScheme[] => {
			return state.welfareSchemes.filter(
				(scheme) => scheme.type === "Government",
			)
		},

		getPrivateWelfareSchemes: (state): ProcessedWelfareScheme[] => {
			return state.welfareSchemes.filter((scheme) => scheme.type === "Private")
		},

		// Insurance Schemes getters
		getGovernmentInsuranceSchemes: (state): ProcessedInsuranceScheme[] => {
			return state.insuranceSchemes.filter(
				(scheme) => scheme.type === "Government",
			)
		},

		getPrivateInsuranceSchemes: (state): ProcessedInsuranceScheme[] => {
			return state.insuranceSchemes.filter(
				(scheme) => scheme.type === "Private",
			)
		},

		// All Schemes getters
		getGovernmentSchemes: (
			state,
		): (ProcessedWelfareScheme | ProcessedInsuranceScheme)[] => {
			return state.allSchemes.filter((scheme) => scheme.type === "Government")
		},

		getPrivateSchemes: (
			state,
		): (ProcessedWelfareScheme | ProcessedInsuranceScheme)[] => {
			return state.allSchemes.filter((scheme) => scheme.type === "Private")
		},

		getWelfareSchemes: (
			state,
		): (ProcessedWelfareScheme | ProcessedInsuranceScheme)[] => {
			return state.allSchemes.filter((scheme) =>
				"scheme_source" in scheme ? scheme.scheme_source === "welfare" : true,
			)
		},

		getInsuranceSchemes: (
			state,
		): (ProcessedWelfareScheme | ProcessedInsuranceScheme)[] => {
			return state.allSchemes.filter((scheme) =>
				"scheme_source" in scheme
					? scheme.scheme_source === "insurance"
					: false,
			)
		},

		getEligibleGovernmentSchemes: (state): EligibilityResult[] => {
			return state.eligibleSchemes.filter(
				(scheme) => scheme.type === "Government" && scheme.is_eligible,
			)
		},

		getPartiallyEligibleSchemes: (state): EligibilityResult[] => {
			return state.eligibleSchemes.filter(
				(scheme) => !scheme.is_eligible && scheme.eligibility_score > 0,
			)
		},

		// Support Pathways getters
		getSupportPathwaysByTitle:
			(state) =>
			(title: string): ProcessedSupportPathway | undefined => {
				return state.supportPathways.find(
					(pathway) =>
						pathway.title &&
						pathway.title.toLowerCase().includes(title.toLowerCase()),
				)
			},

		// Household Profile getters
		getUserHealthConditions: (state): ProcessedHealthCondition[] => {
			return state.householdProfile?.health_conditions || []
		},

		hasVulnerabilityStatus: (state): boolean => {
			return Boolean(state.householdProfile?.vulnerability_status)
		},

		hasRationCard: (state): boolean => {
			return Boolean(state.householdProfile?.ration_card_holder)
		},

		hasCHE10: (state): boolean => {
			return Boolean(state.householdProfile?.che_10)
		},

		hasCHE25: (state): boolean => {
			return Boolean(state.householdProfile?.che_25)
		},

		// Summary getters
		totalRecommendations: (state): number => {
			const {
				health_based_support,
				income_based_support,
				insurance_recommendations,
				general_support,
			} = state.supportRecommendations
			return (
				health_based_support.length +
				income_based_support.length +
				insurance_recommendations.length +
				general_support.length
			)
		},

		isDataStale:
			(state) =>
			(
				dataType: keyof SupportStoreState["lastFetched"],
				maxAge: number = 5 * 60 * 1000,
			): boolean => {
				// 5 minutes default
				const lastFetched = state.lastFetched[dataType]
				if (!lastFetched) return true
				return Date.now() - lastFetched > maxAge
			},
	},

	actions: {
		// Health Conditions actions
		async fetchHealthConditions(
			forceRefresh = false,
		): Promise<ProcessedHealthCondition[]> {
			this.healthConditionsLoading = true
			this.healthConditionsError = ""

			try {
				const conditions = await supportService.getHealthConditions(
					true,
					forceRefresh,
				)
				this.healthConditions = conditions
				this.lastFetched.healthConditions = Date.now()
				return this.healthConditions
			} catch (error) {
				console.error("SupportStore: Failed to fetch health conditions:", error)
				this.healthConditionsError =
					error instanceof Error
						? error.message
						: "Failed to load health conditions"
				return []
			} finally {
				this.healthConditionsLoading = false
			}
		},

		// Welfare Schemes actions
		async fetchWelfareSchemes(
			filters: SupportFilters | null = null,
			forceRefresh = false,
		): Promise<ProcessedWelfareScheme[]> {
			this.welfareSchemesLoading = true
			this.welfareSchemesError = ""

			try {
				const schemes = await supportService.getWelfareSchemes(filters, {
					useCache: true,
					forceReload: forceRefresh,
				})
				this.welfareSchemes = schemes
				this.lastFetched.welfareSchemes = Date.now()
				return this.welfareSchemes
			} catch (error) {
				console.error("SupportStore: Failed to fetch welfare schemes:", error)
				this.welfareSchemesError =
					error instanceof Error
						? error.message
						: "Failed to load welfare schemes"
				return []
			} finally {
				this.welfareSchemesLoading = false
			}
		},

		// Insurance Schemes actions
		async fetchInsuranceSchemes(
			filters: SupportFilters | null = null,
			forceRefresh = false,
		): Promise<ProcessedInsuranceScheme[]> {
			this.insuranceSchemesLoading = true
			this.insuranceSchemesError = ""

			try {
				const schemes = await supportService.getInsuranceSchemes(filters, {
					useCache: true,
					forceReload: forceRefresh,
				})
				this.insuranceSchemes = schemes
				this.lastFetched.insuranceSchemes = Date.now()
				return this.insuranceSchemes
			} catch (error) {
				console.error("SupportStore: Failed to fetch insurance schemes:", error)
				this.insuranceSchemesError =
					error instanceof Error
						? error.message
						: "Failed to load insurance schemes"
				return []
			} finally {
				this.insuranceSchemesLoading = false
			}
		},

		// All Schemes actions
		async fetchAllSchemes(
			filters: SupportFilters | null = null,
			forceRefresh = false,
		): Promise<(ProcessedWelfareScheme | ProcessedInsuranceScheme)[]> {
			this.allSchemesLoading = true
			this.allSchemesError = ""

			try {
				const schemes = await supportService.getAllSchemes(filters, {
					useCache: true,
					forceReload: forceRefresh,
				})
				this.allSchemes = schemes
				this.lastFetched.allSchemes = Date.now()
				return this.allSchemes
			} catch (error) {
				console.error("SupportStore: Failed to fetch all schemes:", error)
				this.allSchemesError =
					error instanceof Error ? error.message : "Failed to load schemes"
				return []
			} finally {
				this.allSchemesLoading = false
			}
		},

		// Support Pathways actions
		async fetchSupportPathways(
			filters: SupportFilters | null = null,
			forceRefresh = false,
		): Promise<ProcessedSupportPathway[]> {
			this.supportPathwaysLoading = true
			this.supportPathwaysError = ""

			try {
				const pathways = await supportService.getSupportPathways(filters, {
					useCache: true,
					forceReload: forceRefresh,
				})
				this.supportPathways = pathways
				this.lastFetched.supportPathways = Date.now()
				return this.supportPathways
			} catch (error) {
				console.error("SupportStore: Failed to fetch support pathways:", error)
				this.supportPathwaysError =
					error instanceof Error
						? error.message
						: "Failed to load support pathways"
				return []
			} finally {
				this.supportPathwaysLoading = false
			}
		},

		// Household Profile actions
		async fetchHouseholdProfile(
			forceRefresh = false,
		): Promise<ProcessedHouseholdProfile | null> {
			this.householdProfileLoading = true
			this.householdProfileError = ""

			try {
				const profile = await supportService.getHouseholdProfile({
					useCache: true,
					forceReload: forceRefresh,
				})
				this.householdProfile = profile
				this.lastFetched.householdProfile = Date.now()
				return this.householdProfile
			} catch (error) {
				console.error("SupportStore: Failed to fetch household profile:", error)
				this.householdProfileError =
					error instanceof Error
						? error.message
						: "Failed to load household profile"
				return null
			} finally {
				this.householdProfileLoading = false
			}
		},

		// Update health conditions
		async updateHealthConditions(
			healthConditions: ProcessedHealthCondition[],
		): Promise<void> {
			try {
				await supportService.updateHealthConditions(healthConditions)

				// Refresh the health conditions list from server to get updated available conditions
				await this.fetchHealthConditions(true)

				// Force refresh household profile to get updated health conditions
				await this.fetchHouseholdProfile(true)

				// Clear dependent caches so they get refreshed with new data
				this.lastFetched.eligibleSchemes = null
				this.lastFetched.supportRecommendations = null
				this.lastFetched.welfareSchemes = null
				this.lastFetched.allSchemes = null
			} catch (error) {
				console.error(
					"SupportStore: Failed to update health conditions:",
					error,
				)
				throw error
			}
		},

		// Eligible Schemes actions
		async fetchEligibleSchemes(
			forceRefresh = false,
		): Promise<EligibilityResult[]> {
			this.eligibleSchemesLoading = true
			this.eligibleSchemesError = ""

			try {
				const schemes = await supportService.getEligibleSchemes({
					useCache: true,
					forceReload: forceRefresh,
				})
				this.eligibleSchemes = schemes
				this.lastFetched.eligibleSchemes = Date.now()
				return this.eligibleSchemes
			} catch (error) {
				console.error("SupportStore: Failed to fetch eligible schemes:", error)
				this.eligibleSchemesError =
					error instanceof Error
						? error.message
						: "Failed to load eligible schemes"
				return []
			} finally {
				this.eligibleSchemesLoading = false
			}
		},

		// Support Recommendations actions
		async fetchSupportRecommendations(
			forceRefresh = false,
		): Promise<SupportRecommendations> {
			this.supportRecommendationsLoading = true
			this.supportRecommendationsError = ""

			try {
				const recommendations = await supportService.getSupportRecommendations({
					useCache: true,
					forceReload: forceRefresh,
				})
				this.supportRecommendations = recommendations || {
					health_based_support: [],
					income_based_support: [],
					insurance_recommendations: [],
					general_support: [],
				}
				this.lastFetched.supportRecommendations = Date.now()
				return this.supportRecommendations
			} catch (error) {
				console.error(
					"SupportStore: Failed to fetch support recommendations:",
					error,
				)
				this.supportRecommendationsError =
					error instanceof Error
						? error.message
						: "Failed to load support recommendations"
				return {
					health_based_support: [],
					income_based_support: [],
					insurance_recommendations: [],
					general_support: [],
				}
			} finally {
				this.supportRecommendationsLoading = false
			}
		},

		// Applications actions
		async fetchApplications(
			forceRefresh = false,
		): Promise<SchemeApplication[]> {
			this.applicationsLoading = true
			this.applicationsError = ""

			try {
				const applications = await supportService.getSchemeApplications({
					useCache: true,
					forceReload: forceRefresh,
				})
				this.applications = applications
				this.lastFetched.applications = Date.now()
				return this.applications
			} catch (error) {
				console.error("SupportStore: Failed to fetch applications:", error)
				this.applicationsError =
					error instanceof Error ? error.message : "Failed to load applications"
				return []
			} finally {
				this.applicationsLoading = false
			}
		},

		async createApplication(
			applicationData: ApplicationFormData,
		): Promise<SchemeApplication | null> {
			try {
				const newApplication =
					await supportService.createSchemeApplication(applicationData)
				this.applications.unshift(newApplication)
				this.lastFetched.applications = Date.now()
				return newApplication
			} catch (error) {
				console.error("SupportStore: Failed to create application:", error)
				throw error
			}
		},

		async updateApplication(
			applicationName: string,
			applicationData: Partial<ApplicationFormData>,
		): Promise<SchemeApplication | null> {
			try {
				const updatedApplication = await supportService.updateSchemeApplication(
					applicationName,
					applicationData,
				)
				const index = this.applications.findIndex(
					(app) => app.name === applicationName,
				)
				if (index !== -1) {
					this.applications[index] = updatedApplication
				}
				this.lastFetched.applications = Date.now()
				return updatedApplication
			} catch (error) {
				console.error("SupportStore: Failed to update application:", error)
				throw error
			}
		},

		// Claims actions
		async fetchClaims(forceRefresh = false): Promise<SchemeClaim[]> {
			this.claimsLoading = true
			this.claimsError = ""

			try {
				const claims = await supportService.getSchemeClaims({
					useCache: true,
					forceReload: forceRefresh,
				})
				this.claims = claims
				this.lastFetched.claims = Date.now()
				return this.claims
			} catch (error) {
				console.error("SupportStore: Failed to fetch claims:", error)
				this.claimsError =
					error instanceof Error ? error.message : "Failed to load claims"
				return []
			} finally {
				this.claimsLoading = false
			}
		},

		async createClaim(claimData: ClaimFormData): Promise<SchemeClaim | null> {
			try {
				const newClaim = await supportService.createSchemeClaim(claimData)
				this.claims.unshift(newClaim)
				this.lastFetched.claims = Date.now()
				return newClaim
			} catch (error) {
				console.error("SupportStore: Failed to create claim:", error)
				throw error
			}
		},

		async updateClaim(
			claimName: string,
			claimData: Partial<ClaimFormData>,
		): Promise<SchemeClaim | null> {
			try {
				const updatedClaim = await supportService.updateSchemeClaim(
					claimName,
					claimData,
				)
				const index = this.claims.findIndex((claim) => claim.name === claimName)
				if (index !== -1) {
					this.claims[index] = updatedClaim
				}
				this.lastFetched.claims = Date.now()
				return updatedClaim
			} catch (error) {
				console.error("SupportStore: Failed to update claim:", error)
				throw error
			}
		},

		// Convenience methods
		async loadApplications(): Promise<void> {
			await this.fetchApplications()
		},

		async loadClaims(): Promise<void> {
			await this.fetchClaims()
		},

		// Filter actions
		setWelfareSchemeFilters(filters: Partial<SupportFilters>): void {
			this.welfareSchemeFilters = { ...this.welfareSchemeFilters, ...filters }
		},

		clearWelfareSchemeFilters(): void {
			this.welfareSchemeFilters = {
				type: "",
			}
		},

		setInsuranceSchemeFilters(filters: Partial<SupportFilters>): void {
			this.insuranceSchemeFilters = {
				...this.insuranceSchemeFilters,
				...filters,
			}
		},

		clearInsuranceSchemeFilters(): void {
			this.insuranceSchemeFilters = {
				type: "",
			}
		},

		setAllSchemeFilters(filters: Partial<SupportFilters>): void {
			this.allSchemeFilters = { ...this.allSchemeFilters, ...filters }
		},

		clearAllSchemeFilters(): void {
			this.allSchemeFilters = {
				type: "",
				scheme_source: "",
			}
		},

		// Cache management
		clearCache(
			dataType: keyof SupportStoreState["lastFetched"] | null = null,
		): void {
			if (dataType) {
				this.lastFetched[dataType] = null
			} else {
				// Clear all cache timestamps
				Object.keys(this.lastFetched).forEach((key) => {
					this.lastFetched[key as keyof SupportStoreState["lastFetched"]] = null
				})
			}

			// Clear service cache as well
			supportService.clearCache(dataType ? [String(dataType)] : null)
		},

		// Initialize store with essential data
		async initializeStore(): Promise<void> {
			try {
				// Load essential data in parallel
				await Promise.allSettled([
					this.fetchHealthConditions(),
					this.fetchHouseholdProfile(),
					this.fetchApplications(),
					this.fetchClaims(),
				])

				// Load recommendations if profile exists
				if (this.householdProfile) {
					await Promise.allSettled([
						this.fetchEligibleSchemes(),
						this.fetchSupportRecommendations(),
					])
				}
			} catch (error) {
				console.error("SupportStore: Failed to initialize store:", error)
				// Don't throw error to allow partial initialization
			}
		},

		// Reset store state
		resetStore(): void {
			// Reset all state to initial values
			this.healthConditions = []
			this.healthConditionsLoading = false
			this.healthConditionsError = ""

			this.welfareSchemes = []
			this.welfareSchemesLoading = false
			this.welfareSchemesError = ""

			this.insuranceSchemes = []
			this.insuranceSchemesLoading = false
			this.insuranceSchemesError = ""

			this.allSchemes = []
			this.allSchemesLoading = false
			this.allSchemesError = ""

			this.supportPathways = []
			this.supportPathwaysLoading = false
			this.supportPathwaysError = ""

			this.householdProfile = null
			this.householdProfileLoading = false
			this.householdProfileError = ""

			this.eligibleSchemes = []
			this.eligibleSchemesLoading = false
			this.eligibleSchemesError = ""

			this.supportRecommendations = {
				health_based_support: [],
				income_based_support: [],
				insurance_recommendations: [],
				general_support: [],
			}
			this.supportRecommendationsLoading = false
			this.supportRecommendationsError = ""

			this.applications = []
			this.applicationsLoading = false
			this.applicationsError = ""

			this.claims = []
			this.claimsLoading = false
			this.claimsError = ""

			this.welfareSchemeFilters = { type: "" }
			this.insuranceSchemeFilters = { type: "" }
			this.allSchemeFilters = { type: "", scheme_source: "" }

			// Clear cache timestamps
			Object.keys(this.lastFetched).forEach((key) => {
				this.lastFetched[key as keyof SupportStoreState["lastFetched"]] = null
			})

			// Reset service state
			supportService.reset()
		},
	},
})
