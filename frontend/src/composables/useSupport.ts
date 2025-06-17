/**
 * Support Composable
 * Reactive wrapper around support service and store with enhanced cache management
 * Enhanced to follow the expense management architecture pattern
 */

import { computed, onUnmounted, reactive, ref, watch } from "vue";
import { session } from "../data/session.js";
import { supportService } from "../services/support-service";
import { useSupportStore } from "../stores/support";
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
} from "../types/support";

// Options interface for the composable
interface UseSupportOptions {
  enableRealTimeUpdates?: boolean;
  cacheTimeout?: number;
  autoInitialize?: boolean;
  withAnalytics?: boolean;
}

// Main composable function
export function useSupport(options: UseSupportOptions = {}) {
  const {
    enableRealTimeUpdates = false,
    cacheTimeout = 5 * 60 * 1000,
    autoInitialize = true,
    withAnalytics = false,
  } = options;

  // Store
  const store = useSupportStore();

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
  });

  // Real-time polling for updates (optional)
  let updateInterval: number | null = null;

  // Base reactive properties from store
  const healthConditions = computed(() => store.healthConditions);
  const welfareSchemes = computed(() => store.welfareSchemes);
  const insuranceSchemes = computed(() => store.insuranceSchemes);
  const allSchemes = computed(() => store.allSchemes);
  const supportPathways = computed(() => store.supportPathways);
  const householdProfile = computed(() => store.householdProfile);
  const eligibleSchemes = computed(() => store.eligibleSchemes);
  const supportRecommendations = computed(() => store.supportRecommendations);
  const applications = computed(() => store.applications);
  const claims = computed(() => store.claims);

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
  }));

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
  }));

  // Computed summary statistics
  const totalRecommendations = computed(() => store.totalRecommendations);
  const hasProfile = computed(() => !!store.householdProfile);
  const hasApplications = computed(() => store.applications.length > 0);
  const hasClaims = computed(() => store.claims.length > 0);

  // Enhanced cache management with simplified approach
  const invalidateCache = (dataType?: string): void => {
    if (dataType) {
      store.clearCache(dataType as any);
    } else {
      store.clearCache();
    }
    state.lastSync = new Date();
  };

  // Loading methods with enhanced cache management
  const loadHealthConditions = async (
    forceRefresh = false,
  ): Promise<ProcessedHealthCondition[]> => {
    try {
      if (forceRefresh) {
        invalidateCache("healthConditions");
      }
      return await store.fetchHealthConditions(forceRefresh);
    } catch (error) {
      state.error =
        error instanceof Error
          ? error.message
          : "Failed to load health conditions";
      throw error;
    }
  };

  const loadWelfareSchemes = async (
    filters?: SupportFilters,
    forceRefresh = false,
  ): Promise<ProcessedWelfareScheme[]> => {
    try {
      if (filters) {
        state.activeFilters.welfare = filters;
      }
      if (forceRefresh) {
        invalidateCache("welfareSchemes");
      }
      return await store.fetchWelfareSchemes(filters, forceRefresh);
    } catch (error) {
      state.error =
        error instanceof Error
          ? error.message
          : "Failed to load welfare schemes";
      throw error;
    }
  };

  const loadInsuranceSchemes = async (
    filters?: SupportFilters,
    forceRefresh = false,
  ): Promise<ProcessedInsuranceScheme[]> => {
    try {
      if (filters) {
        state.activeFilters.insurance = filters;
      }
      if (forceRefresh) {
        invalidateCache("insuranceSchemes");
      }
      return await store.fetchInsuranceSchemes(filters, forceRefresh);
    } catch (error) {
      state.error =
        error instanceof Error
          ? error.message
          : "Failed to load insurance schemes";
      throw error;
    }
  };

  const loadAllSchemes = async (
    filters?: SupportFilters,
    forceRefresh = false,
  ): Promise<(ProcessedWelfareScheme | ProcessedInsuranceScheme)[]> => {
    try {
      if (filters) {
        state.activeFilters.all = filters;
      }
      if (forceRefresh) {
        invalidateCache("allSchemes");
      }
      return await store.fetchAllSchemes(filters, forceRefresh);
    } catch (error) {
      state.error =
        error instanceof Error ? error.message : "Failed to load schemes";
      throw error;
    }
  };

  const loadSupportPathways = async (
    filters?: SupportFilters,
    forceRefresh = false,
  ): Promise<ProcessedSupportPathway[]> => {
    try {
      if (forceRefresh) {
        invalidateCache("supportPathways");
      }
      return await store.fetchSupportPathways(filters, forceRefresh);
    } catch (error) {
      state.error =
        error instanceof Error
          ? error.message
          : "Failed to load support pathways";
      throw error;
    }
  };

  const loadHouseholdProfile = async (
    forceRefresh = false,
  ): Promise<ProcessedHouseholdProfile | null> => {
    try {
      if (forceRefresh) {
        invalidateCache("householdProfile");
      }
      return await store.fetchHouseholdProfile(forceRefresh);
    } catch (error) {
      state.error =
        error instanceof Error
          ? error.message
          : "Failed to load household profile";
      throw error;
    }
  };

  const loadEligibleSchemes = async (
    forceRefresh = false,
  ): Promise<EligibilityResult[]> => {
    try {
      if (forceRefresh) {
        invalidateCache("eligibleSchemes");
      }
      return await store.fetchEligibleSchemes(forceRefresh);
    } catch (error) {
      state.error =
        error instanceof Error
          ? error.message
          : "Failed to load eligible schemes";
      throw error;
    }
  };

  const loadSupportRecommendations = async (
    forceRefresh = false,
  ): Promise<SupportRecommendations> => {
    try {
      if (forceRefresh) {
        invalidateCache("supportRecommendations");
      }
      return await store.fetchSupportRecommendations(forceRefresh);
    } catch (error) {
      state.error =
        error instanceof Error
          ? error.message
          : "Failed to load support recommendations";
      throw error;
    }
  };

  const loadApplications = async (
    forceRefresh = false,
  ): Promise<SchemeApplication[]> => {
    try {
      if (forceRefresh) {
        invalidateCache("applications");
      }
      return await store.fetchApplications(forceRefresh);
    } catch (error) {
      state.error =
        error instanceof Error ? error.message : "Failed to load applications";
      throw error;
    }
  };

  const loadClaims = async (forceRefresh = false): Promise<SchemeClaim[]> => {
    try {
      if (forceRefresh) {
        invalidateCache("claims");
      }
      return await store.fetchClaims(forceRefresh);
    } catch (error) {
      state.error =
        error instanceof Error ? error.message : "Failed to load claims";
      throw error;
    }
  };

  // Refresh methods with cache control
  const refreshData = async (
    options: { useCache?: boolean } = {},
  ): Promise<void> => {
    const { useCache = true } = options;
    const forceRefresh = !useCache;

    if (state.isRefreshing) return;

    state.isRefreshing = true;
    state.error = null;

    try {
      if (!useCache) {
        invalidateCache();
      }

      // Load essential data in parallel
      await Promise.allSettled([
        loadHealthConditions(forceRefresh),
        loadHouseholdProfile(forceRefresh),
        loadApplications(forceRefresh),
        loadClaims(forceRefresh),
      ]);

      // Load additional data if profile exists
      if (store.householdProfile) {
        await Promise.allSettled([
          loadEligibleSchemes(forceRefresh),
          loadSupportRecommendations(forceRefresh),
        ]);
      }

      state.lastSync = new Date();
    } catch (error) {
      state.error =
        error instanceof Error ? error.message : "Failed to refresh data";
      console.error("Support composable: Failed to refresh data:", error);
    } finally {
      state.isRefreshing = false;
    }
  };

  // Individual refresh methods
  const refreshHealthConditions = async (): Promise<
    ProcessedHealthCondition[]
  > => {
    return await loadHealthConditions(true);
  };

  const refreshWelfareSchemes = async (
    filters?: SupportFilters,
  ): Promise<ProcessedWelfareScheme[]> => {
    return await loadWelfareSchemes(filters, true);
  };

  const refreshInsuranceSchemes = async (
    filters?: SupportFilters,
  ): Promise<ProcessedInsuranceScheme[]> => {
    return await loadInsuranceSchemes(filters, true);
  };

  const refreshAllSchemes = async (
    filters?: SupportFilters,
  ): Promise<(ProcessedWelfareScheme | ProcessedInsuranceScheme)[]> => {
    return await loadAllSchemes(filters, true);
  };

  const refreshSupportPathways = async (
    filters?: SupportFilters,
  ): Promise<ProcessedSupportPathway[]> => {
    return await loadSupportPathways(filters, true);
  };

  const refreshHouseholdProfile =
    async (): Promise<ProcessedHouseholdProfile | null> => {
      return await loadHouseholdProfile(true);
    };

  const refreshEligibleSchemes = async (): Promise<EligibilityResult[]> => {
    return await loadEligibleSchemes(true);
  };

  const refreshSupportRecommendations =
    async (): Promise<SupportRecommendations> => {
      return await loadSupportRecommendations(true);
    };

  const refreshApplications = async (): Promise<SchemeApplication[]> => {
    return await loadApplications(true);
  };

  const refreshClaims = async (): Promise<SchemeClaim[]> => {
    return await loadClaims(true);
  };

  // CRUD operations with enhanced error handling
  const updateHealthConditions = async (
    conditions: ProcessedHealthCondition[],
  ): Promise<void> => {
    try {
      await store.updateHealthConditions(conditions);
      // The store handles cache invalidation
    } catch (error) {
      state.error =
        error instanceof Error
          ? error.message
          : "Failed to update health conditions";

      // Handle sync issues gracefully
      if (error.message && error.message.includes("sync issue")) {
        // Automatically refresh data
        await refreshData({ useCache: false });
      }

      throw error;
    }
  };

  const createApplication = async (
    applicationData: ApplicationFormData,
  ): Promise<SchemeApplication | null> => {
    try {
      const result = await store.createApplication(applicationData);
      return result;
    } catch (error) {
      state.error =
        error instanceof Error ? error.message : "Failed to create application";
      throw error;
    }
  };

  const updateApplication = async (
    applicationName: string,
    applicationData: Partial<ApplicationFormData>,
  ): Promise<SchemeApplication | null> => {
    try {
      const result = await store.updateApplication(
        applicationName,
        applicationData,
      );
      return result;
    } catch (error) {
      state.error =
        error instanceof Error ? error.message : "Failed to update application";
      throw error;
    }
  };

  const deleteApplication = async (
    applicationName: string,
  ): Promise<boolean> => {
    try {
      const result =
        await supportService.deleteSchemeApplication(applicationName);

      if (result) {
        // Refresh applications list
        await loadApplications(true);
      }

      return result;
    } catch (error: any) {
      state.error =
        error instanceof Error ? error.message : "Failed to delete application";

      // Handle "not found" errors gracefully
      if (error.message && error.message.includes("not found")) {
        // Automatically refresh data
        await loadApplications(true);
        return true; // Consider it successful
      }

      throw error;
    }
  };

  const createClaim = async (
    claimData: ClaimFormData,
  ): Promise<SchemeClaim | null> => {
    try {
      const result = await store.createClaim(claimData);
      return result;
    } catch (error) {
      state.error =
        error instanceof Error ? error.message : "Failed to create claim";
      throw error;
    }
  };

  const updateClaim = async (
    claimName: string,
    claimData: Partial<ClaimFormData>,
  ): Promise<SchemeClaim | null> => {
    try {
      const result = await store.updateClaim(claimName, claimData);
      return result;
    } catch (error) {
      state.error =
        error instanceof Error ? error.message : "Failed to update claim";
      throw error;
    }
  };

  const deleteClaim = async (claimName: string): Promise<boolean> => {
    try {
      const result = await supportService.deleteSchemeClaim(claimName);

      if (result) {
        // Refresh claims list
        await loadClaims(true);
      }

      return result;
    } catch (error: any) {
      state.error =
        error instanceof Error ? error.message : "Failed to delete claim";

      // Handle "not found" errors gracefully
      if (error.message && error.message.includes("not found")) {
        // Automatically refresh data
        await loadClaims(true);
        return true; // Consider it successful
      }

      throw error;
    }
  };

  // Check if data is stale
  const isDataStale = (
    dataType: string,
    maxAge: number = cacheTimeout,
  ): boolean => {
    return store.isDataStale(dataType as any, maxAge);
  };

  // Initialize the composable with options
  const initialize = async (
    options: {
      withAnalytics?: boolean;
      period?: string;
    } = {},
  ): Promise<void> => {
    if (state.isInitialized) return;

    const { withAnalytics: initWithAnalytics = withAnalytics } = options;

    try {
      await store.initializeStore();
      state.isInitialized = true;
      state.lastSync = new Date();

      // Set up real-time updates if enabled
      if (enableRealTimeUpdates) {
        updateInterval = setInterval(async () => {
          if (session.user && !state.isRefreshing) {
            await refreshData({ useCache: true });
          }
        }, 30000); // Update every 30 seconds
      }
    } catch (error) {
      state.error =
        error instanceof Error
          ? error.message
          : "Failed to initialize support system";
      console.error("Failed to initialize support composable:", error);
    }
  };

  // Reset composable state
  const reset = (): void => {
    store.resetStore();
    state.isInitialized = false;
    state.lastSync = null;
    state.error = null;
    state.isRefreshing = false;
    state.activeFilters = {
      welfare: {} as SupportFilters,
      insurance: {} as SupportFilters,
      all: {} as SupportFilters,
    };
  };

  // Watch for user changes and reinitialize
  watch(
    () => session.user,
    (newUser, oldUser) => {
      if (newUser !== oldUser) {
        reset();
        if (newUser && autoInitialize) {
          initialize();
        }
      }
    },
  );

  // Auto-initialize if enabled
  if (autoInitialize && session.user) {
    initialize();
  }

  // Cleanup on unmount
  onUnmounted(() => {
    if (updateInterval) {
      clearInterval(updateInterval);
    }
  });

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
    refreshData,
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

    // CRUD operations
    updateHealthConditions,
    createApplication,
    updateApplication,
    deleteApplication,
    createClaim,
    updateClaim,
    deleteClaim,

    // Cache management
    invalidateCache,
    isDataStale,

    // Lifecycle
    initialize,
    reset,
  };
}

// Export type for the composable return
export type UseSupportReturn = ReturnType<typeof useSupport>;
