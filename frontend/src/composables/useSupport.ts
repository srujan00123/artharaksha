/**
 * Support Composable
 * Reactive wrapper around support service and store with cache invalidation
 */

import { computed, onUnmounted, reactive, ref, watch } from "vue"
import { session } from "../data/session.js"
import { CACHE_KEYS, cacheService } from "../services/cache-service.js"
import { supportService } from "../services/support-service"
import { useSupportStore } from "../stores/support"
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
	SupportServiceOptions,
} from "../types/support"

// Options interface for the composable
interface UseSupportOptions {
	enableRealTimeUpdates?: boolean
	cacheTimeout?: number
	autoInitialize?: boolean
}

// Main composable function
export function useSupport(options: UseSupportOptions = {}) {
	const {
		enableRealTimeUpdates = false,
		cacheTimeout = 5 * 60 * 1000,
		autoInitialize = true,
	} = options

	// Store
	const store = useSupportStore()

	// Local state for additional functionality
	const state = reactive({
		isInitialized: false,
		lastSync: null as Date | null,
		activeFilters: {
			welfare: {} as SupportFilters,
			insurance: {} as SupportFilters,
			all: {} as SupportFilters,
		},
		error: null as string | null,
		isRefreshing: false,
	})

	// Real-time polling for updates (optional)
	let updateInterval: number | null = null

	// Base reactive properties from store
	const healthConditions = computed(() => store.healthConditions)
	const welfareSchemes = computed(() => store.welfareSchemes)
	const insuranceSchemes = computed(() => store.insuranceSchemes)
	const allSchemes = computed(() => store.allSchemes)
	const supportPathways = computed(() => store.supportPathways)
	const householdProfile = computed(() => store.householdProfile)
	const eligibleSchemes = computed(() => store.eligibleSchemes)
	const supportRecommendations = computed(() => store.supportRecommendations)
	const applications = computed(() => store.applications)
	const claims = computed(() => store.claims)

	// Loading states
	const loading = computed(() => ({
		healthConditions: store.healthConditionsLoading,
		welfareSchemes: store.welfareSchemesLoading,
		insuranceSchemes: store.insuranceSchemesLoading,
		allSchemes: store.allSchemesLoading,
		supportPathways: store.supportPathwaysLoading,
		householdProfile: store.householdProfileLoading,
		eligibleSchemes: store.eligibleSchemesLoading,
		supportRecommendations: store.supportRecommendationsLoading,
		applications: store.applicationsLoading,
		claims: store.claimsLoading,
		any:
			store.healthConditionsLoading ||
			store.welfareSchemesLoading ||
			store.insuranceSchemesLoading ||
			store.allSchemesLoading ||
			store.supportPathwaysLoading ||
			store.householdProfileLoading ||
			store.eligibleSchemesLoading ||
			store.supportRecommendationsLoading ||
			store.applicationsLoading ||
			store.claimsLoading,
	}))

	// Error states
	const errors = computed(() => ({
		healthConditions: store.healthConditionsError,
		welfareSchemes: store.welfareSchemesError,
		insuranceSchemes: store.insuranceSchemesError,
		allSchemes: store.allSchemesError,
		supportPathways: store.supportPathwaysError,
		householdProfile: store.householdProfileError,
		eligibleSchemes: store.eligibleSchemesError,
		supportRecommendations: store.supportRecommendationsError,
		applications: store.applicationsError,
		claims: store.claimsError,
		any:
			store.healthConditionsError ||
			store.welfareSchemesError ||
			store.insuranceSchemesError ||
			store.allSchemesError ||
			store.supportPathwaysError ||
			store.householdProfileError ||
			store.eligibleSchemesError ||
			store.supportRecommendationsError ||
			store.applicationsError ||
			store.claimsError,
	}))

	// Computed summary statistics
	const totalRecommendations = computed(() => store.totalRecommendations)
	const hasProfile = computed(() => !!store.householdProfile)
	const hasApplications = computed(() => store.applications.length > 0)
	const hasClaims = computed(() => store.claims.length > 0)

	// Enhanced cache management with user context
	const getCacheKey = (dataType: string, filters?: SupportFilters): string => {
		const userId = session.user || "anonymous"
		const filterSuffix = filters ? `-${JSON.stringify(filters)}` : ""

		// Map data types to cache keys
		const cacheKeyMap = {
			healthConditions: CACHE_KEYS.HEALTH_CONDITIONS,
			welfareSchemes: CACHE_KEYS.WELFARE_SCHEMES,
			insuranceSchemes: CACHE_KEYS.INSURANCE_SCHEMES,
			allSchemes: CACHE_KEYS.ALL_SCHEMES,
			supportPathways: CACHE_KEYS.SUPPORT_PATHWAYS,
			householdProfile: CACHE_KEYS.HOUSEHOLD_PROFILE,
			eligibleSchemes: CACHE_KEYS.ELIGIBLE_SCHEMES,
			supportRecommendations: CACHE_KEYS.SUPPORT_RECOMMENDATIONS,
			applications: CACHE_KEYS.SCHEME_APPLICATIONS,
			claims: CACHE_KEYS.SCHEME_CLAIMS,
			userHealthConditions: CACHE_KEYS.USER_HEALTH_CONDITIONS,
		}

		const baseKey = cacheKeyMap[dataType] || dataType
		return `${baseKey}-${userId}${filterSuffix}`
	}

	// Cache invalidation with proper user context and centralized keys
	const invalidateCache = (dataType?: string): void => {
		const userId = session.user

		if (dataType) {
			// Clear specific cache type using centralized keys
			const cacheKey = getCacheKey(dataType)
			cacheService.delete(cacheKey, { userId })

			// Also clear related caches when health conditions change
			if (
				dataType === "healthConditions" ||
				dataType === "userHealthConditions"
			) {
				// Clear dependent caches
				cacheService.delete(getCacheKey("eligibleSchemes"), { userId })
				cacheService.delete(getCacheKey("supportRecommendations"), { userId })
				cacheService.delete(getCacheKey("welfareSchemes"), { userId })
				cacheService.delete(getCacheKey("allSchemes"), { userId })
			}

			store.clearCache(dataType as any)
		} else {
			// Clear all support-related caches using centralized keys
			const supportCacheKeys = [
				CACHE_KEYS.HEALTH_CONDITIONS,
				CACHE_KEYS.WELFARE_SCHEMES,
				CACHE_KEYS.INSURANCE_SCHEMES,
				CACHE_KEYS.ALL_SCHEMES,
				CACHE_KEYS.SUPPORT_PATHWAYS,
				CACHE_KEYS.ELIGIBLE_SCHEMES,
				CACHE_KEYS.SUPPORT_RECOMMENDATIONS,
				CACHE_KEYS.SCHEME_APPLICATIONS,
				CACHE_KEYS.SCHEME_CLAIMS,
				CACHE_KEYS.USER_HEALTH_CONDITIONS,
			]

			supportCacheKeys.forEach((key) => {
				cacheService.delete(`${key}-${userId}`, { userId })
			})

			store.clearCache()
		}

		state.lastSync = new Date()
	}

	// Loading methods with enhanced cache invalidation
	const loadHealthConditions = async (
		forceRefresh = false,
	): Promise<ProcessedHealthCondition[]> => {
		try {
			if (forceRefresh) {
				invalidateCache("healthConditions")
			}
			return await store.fetchHealthConditions(forceRefresh)
		} catch (error) {
			state.error =
				error instanceof Error
					? error.message
					: "Failed to load health conditions"
			throw error
		}
	}

	const loadWelfareSchemes = async (
		filters?: SupportFilters,
		forceRefresh = false,
	): Promise<ProcessedWelfareScheme[]> => {
		try {
			if (filters) {
				state.activeFilters.welfare = filters
			}
			if (forceRefresh) {
				invalidateCache("welfareSchemes")
			}
			return await store.fetchWelfareSchemes(filters, forceRefresh)
		} catch (error) {
			state.error =
				error instanceof Error
					? error.message
					: "Failed to load welfare schemes"
			throw error
		}
	}

	const loadInsuranceSchemes = async (
		filters?: SupportFilters,
		forceRefresh = false,
	): Promise<ProcessedInsuranceScheme[]> => {
		try {
			if (filters) {
				state.activeFilters.insurance = filters
			}
			if (forceRefresh) {
				invalidateCache("insuranceSchemes")
			}
			return await store.fetchInsuranceSchemes(filters, forceRefresh)
		} catch (error) {
			state.error =
				error instanceof Error
					? error.message
					: "Failed to load insurance schemes"
			throw error
		}
	}

	const loadAllSchemes = async (
		filters?: SupportFilters,
		forceRefresh = false,
	): Promise<(ProcessedWelfareScheme | ProcessedInsuranceScheme)[]> => {
		try {
			if (filters) {
				state.activeFilters.all = filters
			}
			if (forceRefresh) {
				invalidateCache("allSchemes")
			}
			return await store.fetchAllSchemes(filters, forceRefresh)
		} catch (error) {
			state.error =
				error instanceof Error ? error.message : "Failed to load schemes"
			throw error
		}
	}

	const loadSupportPathways = async (
		filters?: SupportFilters,
		forceRefresh = false,
	): Promise<ProcessedSupportPathway[]> => {
		try {
			if (forceRefresh) {
				invalidateCache("supportPathways")
			}
			return await store.fetchSupportPathways(filters, forceRefresh)
		} catch (error) {
			state.error =
				error instanceof Error
					? error.message
					: "Failed to load support pathways"
			throw error
		}
	}

	const loadHouseholdProfile = async (
		forceRefresh = false,
	): Promise<ProcessedHouseholdProfile | null> => {
		try {
			if (forceRefresh) {
				invalidateCache("householdProfile")
			}
			return await store.fetchHouseholdProfile(forceRefresh)
		} catch (error) {
			state.error =
				error instanceof Error
					? error.message
					: "Failed to load household profile"
			throw error
		}
	}

	const loadEligibleSchemes = async (
		forceRefresh = false,
	): Promise<EligibilityResult[]> => {
		try {
			if (forceRefresh) {
				invalidateCache("eligibleSchemes")
			}
			return await store.fetchEligibleSchemes(forceRefresh)
		} catch (error) {
			state.error =
				error instanceof Error
					? error.message
					: "Failed to load eligible schemes"
			throw error
		}
	}

	const loadSupportRecommendations = async (
		forceRefresh = false,
	): Promise<SupportRecommendations> => {
		try {
			if (forceRefresh) {
				invalidateCache("supportRecommendations")
			}
			return await store.fetchSupportRecommendations(forceRefresh)
		} catch (error) {
			state.error =
				error instanceof Error
					? error.message
					: "Failed to load support recommendations"
			throw error
		}
	}

	const loadApplications = async (
		forceRefresh = false,
	): Promise<SchemeApplication[]> => {
		try {
			if (forceRefresh) {
				invalidateCache("applications")
			}
			return await store.fetchApplications(forceRefresh)
		} catch (error) {
			state.error =
				error instanceof Error ? error.message : "Failed to load applications"
			throw error
		}
	}

	const loadClaims = async (forceRefresh = false): Promise<SchemeClaim[]> => {
		try {
			if (forceRefresh) {
				invalidateCache("claims")
			}
			return await store.fetchClaims(forceRefresh)
		} catch (error) {
			state.error =
				error instanceof Error ? error.message : "Failed to load claims"
			throw error
		}
	}

	// Refresh methods (force refresh with cache invalidation)
	const refreshHealthConditions = async (): Promise<
		ProcessedHealthCondition[]
	> => {
		return await loadHealthConditions(true)
	}

	const refreshWelfareSchemes = async (
		filters?: SupportFilters,
	): Promise<ProcessedWelfareScheme[]> => {
		return await loadWelfareSchemes(filters, true)
	}

	const refreshInsuranceSchemes = async (
		filters?: SupportFilters,
	): Promise<ProcessedInsuranceScheme[]> => {
		return await loadInsuranceSchemes(filters, true)
	}

	const refreshAllSchemes = async (
		filters?: SupportFilters,
	): Promise<(ProcessedWelfareScheme | ProcessedInsuranceScheme)[]> => {
		return await loadAllSchemes(filters, true)
	}

	const refreshSupportPathways = async (
		filters?: SupportFilters,
	): Promise<ProcessedSupportPathway[]> => {
		return await loadSupportPathways(filters, true)
	}

	const refreshHouseholdProfile =
		async (): Promise<ProcessedHouseholdProfile | null> => {
			return await loadHouseholdProfile(true)
		}

	const refreshEligibleSchemes = async (): Promise<EligibilityResult[]> => {
		return await loadEligibleSchemes(true)
	}

	const refreshSupportRecommendations =
		async (): Promise<SupportRecommendations> => {
			return await loadSupportRecommendations(true)
		}

	const refreshApplications = async (): Promise<SchemeApplication[]> => {
		return await loadApplications(true)
	}

	const refreshClaims = async (): Promise<SchemeClaim[]> => {
		return await loadClaims(true)
	}

	// CRUD operations with cache invalidation
	const updateHealthConditions = async (
		conditions: ProcessedHealthCondition[],
	): Promise<void> => {
		try {
			await store.updateHealthConditions(conditions)
			// Invalidate health conditions cache and all dependent caches
			invalidateCache("healthConditions")
			invalidateCache("userHealthConditions")
			// The invalidateCache function will automatically clear dependent caches
		} catch (error) {
			state.error =
				error instanceof Error
					? error.message
					: "Failed to update health conditions"
			throw error
		}
	}

	const createApplication = async (
		applicationData: ApplicationFormData,
	): Promise<SchemeApplication | null> => {
		try {
			const result = await store.createApplication(applicationData)
			invalidateCache("applications")
			return result
		} catch (error) {
			state.error =
				error instanceof Error ? error.message : "Failed to create application"
			throw error
		}
	}

	const updateApplication = async (
		applicationName: string,
		applicationData: Partial<ApplicationFormData>,
	): Promise<SchemeApplication | null> => {
		try {
			const result = await store.updateApplication(
				applicationName,
				applicationData,
			)
			invalidateCache("applications")
			return result
		} catch (error) {
			state.error =
				error instanceof Error ? error.message : "Failed to update application"
			throw error
		}
	}

	const createClaim = async (
		claimData: ClaimFormData,
	): Promise<SchemeClaim | null> => {
		try {
			const result = await store.createClaim(claimData)
			invalidateCache("claims")
			return result
		} catch (error) {
			state.error =
				error instanceof Error ? error.message : "Failed to create claim"
			throw error
		}
	}

	const updateClaim = async (
		claimName: string,
		claimData: Partial<ClaimFormData>,
	): Promise<SchemeClaim | null> => {
		try {
			const result = await store.updateClaim(claimName, claimData)
			invalidateCache("claims")
			return result
		} catch (error) {
			state.error =
				error instanceof Error ? error.message : "Failed to update claim"
			throw error
		}
	}

	// Check if data is stale
	const isDataStale = (
		dataType: string,
		maxAge: number = cacheTimeout,
	): boolean => {
		return store.isDataStale(dataType as any, maxAge)
	}

	// Force refresh all data with proper error handling
	const refreshAll = async (): Promise<void> => {
		if (state.isRefreshing) return

		state.isRefreshing = true
		state.error = null

		try {
			// Clear all caches first
			invalidateCache()

			// Load essential data in parallel
			await Promise.allSettled([
				refreshHealthConditions(),
				refreshHouseholdProfile(),
				refreshApplications(),
				refreshClaims(),
			])

			// Load additional data if profile exists
			if (store.householdProfile) {
				await Promise.allSettled([
					refreshEligibleSchemes(),
					refreshSupportRecommendations(),
				])
			}

			state.lastSync = new Date()
		} catch (error) {
			state.error =
				error instanceof Error ? error.message : "Failed to refresh data"
			console.error("Support composable: Failed to refresh all data:", error)
		} finally {
			state.isRefreshing = false
		}
	}

	// Initialize the composable
	const initialize = async (): Promise<void> => {
		if (state.isInitialized) return

		try {
			await store.initializeStore()
			state.isInitialized = true
			state.lastSync = new Date()

			// Set up real-time updates if enabled
			if (enableRealTimeUpdates) {
				updateInterval = setInterval(async () => {
					if (session.user && !state.isRefreshing) {
						await refreshAll()
					}
				}, 30000) // Update every 30 seconds
			}
		} catch (error) {
			state.error =
				error instanceof Error
					? error.message
					: "Failed to initialize support system"
			console.error("Failed to initialize support composable:", error)
		}
	}

	// Reset composable state
	const reset = (): void => {
		store.resetStore()
		state.isInitialized = false
		state.lastSync = null
		state.error = null
		state.isRefreshing = false
		state.activeFilters = {
			welfare: {} as SupportFilters,
			insurance: {} as SupportFilters,
			all: {} as SupportFilters,
		}

		// Clear all support-related caches
		invalidateCache()
	}

	// Watch for user changes and reinitialize
	watch(
		() => session.user,
		(newUser, oldUser) => {
			if (newUser !== oldUser) {
				reset()
				if (newUser && autoInitialize) {
					initialize()
				}
			}
		},
	)

	// Auto-initialize if enabled
	if (autoInitialize && session.user) {
		initialize()
	}

	// Cleanup on unmount
	onUnmounted(() => {
		if (updateInterval) {
			clearInterval(updateInterval)
		}
	})

	// Return the composable API
	return {
		// State
		state: computed(() => state),
		healthConditions,
		welfareSchemes,
		insuranceSchemes,
		allSchemes,
		supportPathways,
		householdProfile,
		eligibleSchemes,
		supportRecommendations,
		applications,
		claims,
		loading,
		errors,

		// Computed
		totalRecommendations,
		hasProfile,
		hasApplications,
		hasClaims,

		// Loading methods
		loadHealthConditions,
		loadWelfareSchemes,
		loadInsuranceSchemes,
		loadAllSchemes,
		loadSupportPathways,
		loadHouseholdProfile,
		loadEligibleSchemes,
		loadSupportRecommendations,
		loadApplications,
		loadClaims,

		// Refresh methods
		refreshHealthConditions,
		refreshWelfareSchemes,
		refreshInsuranceSchemes,
		refreshAllSchemes,
		refreshSupportPathways,
		refreshHouseholdProfile,
		refreshEligibleSchemes,
		refreshSupportRecommendations,
		refreshApplications,
		refreshClaims,
		refreshAll,

		// CRUD operations
		updateHealthConditions,
		createApplication,
		updateApplication,
		createClaim,
		updateClaim,

		// Cache management
		invalidateCache,
		isDataStale,

		// Lifecycle
		initialize,
		reset,
	}
}

// Export type for the composable return
export type UseSupportReturn = ReturnType<typeof useSupport>
