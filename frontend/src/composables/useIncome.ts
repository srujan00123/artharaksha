/**
 * Income Composable
 * Reactive wrapper around income service and store
 * Follows the expense management pattern with clean separation of concerns
 */

import { computed, onUnmounted, watch } from "vue";
import { session } from "../data/session.js";
import { useIncomeStore } from "../stores/income-store";
import type {
  AddIncomeSourcePayload,
  CreateDirectLedgerEntryPayload,
  CreateLedgerEntryPayload,
  DeleteIncomeSourcePayload,
  DeleteLedgerEntryPayload,
  IncomeFilters,
  IncomeServiceOptions,
  LedgerFilters,
  UpdateIncomeSourcePayload,
  UpdateLedgerEntryPayload,
} from "../types/income";

// Options interface for the composable
interface UseIncomeOptions {
  autoInitialize?: boolean;
  cacheTimeout?: number;
}

// Cache invalidation options
interface CacheInvalidationOptions {
  incomeData?: boolean;
  analytics?: boolean;
  ledgerData?: boolean;
  incomeTypes?: boolean;
  all?: boolean;
}

export function useIncome(options: UseIncomeOptions = {}) {
  const { autoInitialize = true, cacheTimeout = 300000 } = options;

  // Use the store
  const incomeStore = useIncomeStore();

  // Reactive state from store
  const incomes = computed(() => incomeStore.incomes);
  const incomeTypes = computed(() => incomeStore.incomeTypes);
  const recurringSources = computed(() => incomeStore.recurringSources);
  const ledgerEntries = computed(() => incomeStore.ledgerEntries);
  const analytics = computed(() => incomeStore.analytics);
  const dashboardMetrics = computed(() => incomeStore.dashboardMetrics);
  const monthlyIncomeSummary = computed(() => incomeStore.monthlyIncomeSummary);
  const incomeInsights = computed(() => incomeStore.incomeInsights);
  const loading = computed(() => incomeStore.loading);
  const error = computed(() => incomeStore.error);
  const filters = computed(() => incomeStore.filters);
  const ledgerFilters = computed(() => incomeStore.ledgerFilters);

  // Computed totals from store
  const totalIncome = computed(() => incomeStore.totalIncome);
  const recurringIncome = computed(() => incomeStore.recurringIncome);
  const oneTimeIncome = computed(() => incomeStore.oneTimeIncome);
  const totalSources = computed(() => incomeStore.totalSources);
  const allSources = computed(() => incomeStore.allSources);
  const recentSources = computed(() => incomeStore.recentSources);
  const topIncomeTypes = computed(() => incomeStore.topIncomeTypes);
  const incomeByType = computed(() => incomeStore.incomeByType);

  // Filtered data - always use filtered sources and entries from store
  const filteredSources = computed(() => incomeStore.recurringSources);
  const filteredLedgerEntries = computed(() => {
    let entries = incomeStore.ledgerEntries;
    const currentFilters = incomeStore.filters;

    // Apply filters to ledger entries
    if (currentFilters.type) {
      entries = entries.filter(
        (entry) => entry.source_type === currentFilters.type,
      );
    }

    if (currentFilters.isRecurring !== undefined) {
      if (currentFilters.isRecurring) {
        entries = entries.filter((entry) => entry.income_type === "recurring");
      } else {
        entries = entries.filter((entry) => entry.income_type === "one-time");
      }
    }

    if (currentFilters.dateFrom) {
      const fromDate = new Date(currentFilters.dateFrom);
      entries = entries.filter(
        (entry) => new Date(entry.date_time) >= fromDate,
      );
    }

    if (currentFilters.dateTo) {
      const toDate = new Date(currentFilters.dateTo);
      entries = entries.filter((entry) => new Date(entry.date_time) <= toDate);
    }

    if (currentFilters.amountMin !== undefined) {
      entries = entries.filter(
        (entry) => Number(entry.amount || 0) >= currentFilters.amountMin!,
      );
    }

    if (currentFilters.amountMax !== undefined) {
      entries = entries.filter(
        (entry) => Number(entry.amount || 0) <= currentFilters.amountMax!,
      );
    }

    if (currentFilters.searchTerm) {
      const term = currentFilters.searchTerm.toLowerCase();
      entries = entries.filter((entry) =>
        entry.source_type?.toLowerCase().includes(term),
      );
    }

    // Sorting
    if (currentFilters.sortBy) {
      entries = [...entries].sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (currentFilters.sortBy === "date") {
          aValue = new Date(a.date_time || 0).getTime();
          bValue = new Date(b.date_time || 0).getTime();
        } else if (currentFilters.sortBy === "amount") {
          aValue = Number(a.amount || 0);
          bValue = Number(b.amount || 0);
        } else if (currentFilters.sortBy === "type") {
          aValue = (a.source_type || "").toLowerCase();
          bValue = (b.source_type || "").toLowerCase();
          if (currentFilters.sortOrder === "desc") {
            return bValue.localeCompare(aValue);
          }
          return aValue.localeCompare(bValue);
        } else {
          return 0;
        }

        if (
          currentFilters.sortBy === "date" ||
          currentFilters.sortBy === "amount"
        ) {
          if (currentFilters.sortOrder === "desc") {
            return bValue - aValue;
          }
          return aValue - bValue;
        }
        return 0;
      });
    }

    return entries;
  });

  // Helper methods for common operations
  const hasData = computed(() => incomeStore.hasData);
  const isCacheValid = computed(() => incomeStore.isCacheValid);

  // Add error handling wrapper
  const handleError = (error: unknown, message: string) => {
    console.error(message, error);
    throw error instanceof Error ? error : new Error(message);
  };

  // Actions with proper error handling and cache integration
  const fetchIncome = async (options: IncomeServiceOptions = {}) => {
    try {
      return await incomeStore.fetchIncome(options);
    } catch (error) {
      handleError(error, "Failed to fetch income");
    }
  };

  const fetchIncomeWithAnalytics = async (
    options: IncomeServiceOptions = {},
  ) => {
    try {
      return await incomeStore.fetchIncomeWithAnalytics(options);
    } catch (error) {
      handleError(error, "Failed to fetch income with analytics");
    }
  };

  const fetchIncomeLedger = async (
    filters?: LedgerFilters,
    options: IncomeServiceOptions = {},
  ) => {
    try {
      // Ledger entries are now fetched as part of the main API
      // Just update the filters and refresh data
      if (filters) {
        updateFilters(filters as IncomeFilters);
      }
      return await refreshData({ withAnalytics: true });
    } catch (error) {
      handleError(error, "Failed to fetch income ledger");
    }
  };

  const fetchIncomeTypes = async (options: IncomeServiceOptions = {}) => {
    try {
      return await incomeStore.fetchIncomeTypes(options);
    } catch (error) {
      handleError(error, "Failed to fetch income types");
    }
  };

  const fetchMonthlyIncomeSummary = async (
    options: IncomeServiceOptions = {},
  ) => {
    try {
      return await incomeStore.fetchMonthlyIncomeSummary(options);
    } catch (error) {
      handleError(error, "Failed to fetch monthly income summary");
    }
  };

  const fetchIncomeInsights = async (options: IncomeServiceOptions = {}) => {
    try {
      return await incomeStore.fetchIncomeInsights(options);
    } catch (error) {
      handleError(error, "Failed to fetch income insights");
    }
  };

  const fetchDashboardMetrics = async (
    period = "this_month",
    options: IncomeServiceOptions = {},
  ) => {
    try {
      return await incomeStore.fetchDashboardMetrics(period, options);
    } catch (error) {
      handleError(error, "Failed to fetch dashboard metrics");
    }
  };

  const fetchIncomeAnalytics = async (
    filters?: IncomeFilters,
    options: IncomeServiceOptions = {},
  ) => {
    try {
      return await incomeStore.fetchIncomeAnalytics(filters, options);
    } catch (error) {
      handleError(error, "Failed to fetch income analytics");
    }
  };

  const fetchIncomeFilterOptions = async (
    options: IncomeServiceOptions = {},
  ) => {
    try {
      return await incomeStore.fetchIncomeFilterOptions(options);
    } catch (error) {
      handleError(error, "Failed to fetch filter options");
    }
  };

  const fetchPeriodInfo = async (
    filters?: IncomeFilters,
    options: IncomeServiceOptions = {},
  ) => {
    try {
      return await incomeStore.fetchPeriodInfo(filters, options);
    } catch (error) {
      handleError(error, "Failed to fetch period info");
    }
  };

  const cleanupIncomeData = async () => {
    try {
      return await incomeStore.cleanupIncomeData();
    } catch (error) {
      handleError(error, "Failed to cleanup income data");
    }
  };

  const addIncomeSource = async (payload: AddIncomeSourcePayload) => {
    try {
      return await incomeStore.addIncomeSource(payload);
    } catch (error) {
      handleError(error, "Failed to add income source");
    }
  };

  const addDirectLedgerEntry = async (
    payload: CreateDirectLedgerEntryPayload,
  ) => {
    try {
      return await incomeStore.addDirectLedgerEntry(payload);
    } catch (error) {
      handleError(error, "Failed to add direct ledger entry");
    }
  };

  const updateIncomeSource = async (payload: UpdateIncomeSourcePayload) => {
    try {
      return await incomeStore.updateIncomeSource(payload);
    } catch (error) {
      handleError(error, "Failed to update income source");
    }
  };

  const deleteIncome = async (incomeId: string) => {
    try {
      return await incomeStore.deleteIncome(incomeId);
    } catch (error) {
      handleError(error, "Failed to delete income");
    }
  };

  const deleteIncomeSource = async (payload: DeleteIncomeSourcePayload) => {
    try {
      return await incomeStore.deleteIncomeSource(payload);
    } catch (error) {
      handleError(error, "Failed to delete income source");
    }
  };

  const updateRecurringLedgerEntries = async () => {
    try {
      return await incomeStore.updateRecurringLedgerEntries();
    } catch (error) {
      handleError(error, "Failed to update recurring ledger entries");
    }
  };

  const updateLedgerEntry = async (payload: UpdateLedgerEntryPayload) => {
    try {
      return await incomeStore.updateLedgerEntry(payload);
    } catch (error) {
      handleError(error, "Failed to update ledger entry");
    }
  };

  const deleteLedgerEntry = async (payload: DeleteLedgerEntryPayload) => {
    try {
      return await incomeStore.deleteLedgerEntry(payload);
    } catch (error) {
      handleError(error, "Failed to delete ledger entry");
    }
  };

  const createLedgerEntry = async (payload: CreateLedgerEntryPayload) => {
    try {
      return await incomeStore.createLedgerEntry(payload);
    } catch (error) {
      handleError(error, "Failed to create ledger entry");
    }
  };

  const updateFilters = (newFilters: Partial<IncomeFilters>) => {
    incomeStore.updateFilters(newFilters);
  };

  const updateLedgerFilters = (newFilters: Partial<LedgerFilters>) => {
    incomeStore.updateLedgerFilters(newFilters);
  };

  const clearFilters = () => {
    incomeStore.clearFilters();
  };

  const clearLedgerFilters = () => {
    incomeStore.clearLedgerFilters();
  };

  const clearError = () => {
    incomeStore.clearError();
  };

  // Cache management methods
  const clearCache = () => {
    incomeStore.clearCache();
  };

  const invalidateCache = async (options: CacheInvalidationOptions = {}) => {
    const {
      incomeData = false,
      analytics = false,
      ledgerData = false,
      incomeTypes = false,
      all = false,
    } = options;

    try {
      if (all) {
        incomeStore.clearCache();
        await initialize({ withAnalytics: true, forceRefresh: true });
        return;
      }

      // Selective cache invalidation with better error handling
      if (incomeData || analytics) {
        // Clear income and analytics cache, then refetch
        incomeStore.clearCache();
        await fetchIncomeWithAnalytics({ forceRefresh: true });
      }

      if (ledgerData) {
        // Refetch ledger data
        await fetchIncomeLedger(ledgerFilters.value, { forceRefresh: true });
      }

      if (incomeTypes) {
        // Refetch income types
        await fetchIncomeTypes({ forceRefresh: true });
      }
    } catch (error) {
      handleError(error, "Failed to invalidate cache");
    }
  };

  const refreshData = async (
    options: {
      withAnalytics?: boolean;
      withLedger?: boolean;
      withSummary?: boolean;
      withInsights?: boolean;
      withDashboard?: boolean;
      useCache?: boolean;
    } = {},
  ) => {
    const {
      withAnalytics = true,
      withLedger = false,
      withSummary = false,
      withInsights = false,
      withDashboard = true,
      useCache = false,
    } = options;

    try {
      const forceRefresh = !useCache;

      // Always refresh income types first (but respect cache if useCache is true)
      await fetchIncomeTypes({ forceRefresh, useCache });

      // Fetch income data with proper error handling
      if (withAnalytics) {
        await fetchIncomeWithAnalytics({ forceRefresh, useCache });
      } else {
        await fetchIncome({ forceRefresh, useCache });
      }

      // Optionally fetch additional data in parallel when possible
      const additionalFetches: Promise<any>[] = [];

      if (withLedger) {
        additionalFetches.push(
          fetchIncomeLedger(ledgerFilters.value, { forceRefresh, useCache }),
        );
      }

      if (withSummary) {
        additionalFetches.push(
          fetchMonthlyIncomeSummary({ forceRefresh, useCache }),
        );
      }

      if (withInsights) {
        additionalFetches.push(fetchIncomeInsights({ forceRefresh, useCache }));
      }

      if (withDashboard) {
        additionalFetches.push(
          fetchDashboardMetrics("this_month", { forceRefresh, useCache }),
        );
      }

      // Execute additional fetches in parallel
      if (additionalFetches.length > 0) {
        await Promise.allSettled(additionalFetches);
      }
    } catch (error) {
      handleError(error, "Failed to refresh income data");
    }
  };

  // Initialization helper with better error handling and options
  const initialize = async (
    options: {
      withAnalytics?: boolean;
      forceRefresh?: boolean;
      period?:
        | "this_month"
        | "last_month"
        | "last_3_months"
        | "last_6_months"
        | "this_year";
    } = {},
  ) => {
    const { withAnalytics = false, forceRefresh = false, period } = options;
    try {
      // Set default period to this_month if no period is provided
      const defaultPeriod = period || "this_month";
      incomeStore.updateFilters({ period: defaultPeriod });

      // Always fetch income types first
      await incomeStore.fetchIncomeTypes({ forceRefresh });

      // Fetch income data with analytics by default for better UX
      if (withAnalytics) {
        await incomeStore.fetchIncomeWithAnalytics({ forceRefresh });
      } else {
        await incomeStore.fetchIncome({ forceRefresh });
      }
    } catch (error) {
      handleError(error, "Failed to initialize income data");
    }
  };

  // Simple cache invalidation and refresh - this is what components should call
  const invalidateAndRefresh = async (): Promise<void> => {
    clearCache();
    await fetchIncomeWithAnalytics({ forceRefresh: true });
  };

  // Add analytics helper
  const getAnalytics = computed(() => {
    if (!analytics.value) return null;
    return {
      totalIncome: analytics.value.total_income || 0,
      recurringIncome: analytics.value.recurring_income || 0,
      oneTimeIncome: analytics.value.one_time_income || 0,
      monthlyTrends: analytics.value.monthly_trends || [],
      incomeByType: analytics.value.income_by_type || {},
      summary: analytics.value.summary || {
        total_sources: 0,
        average_source_amount: 0,
        top_income_type: "",
      },
    };
  });

  // Add period helper
  const setPeriod = async (
    period:
      | "this_month"
      | "last_month"
      | "last_3_months"
      | "last_6_months"
      | "this_year",
  ) => {
    try {
      incomeStore.updateFilters({ period });
      await incomeStore.fetchIncomeWithAnalytics({ forceRefresh: true });
    } catch (error) {
      handleError(error, "Failed to update period");
    }
  };

  // Helper to get user-friendly error message
  const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
      if (error.message.includes("household profile")) {
        return "Please create a household profile first before managing income.";
      } else if (error.message.includes("required")) {
        return "Please fill in all required fields.";
      } else if (error.message.includes("validation")) {
        return "Please check your input values and try again.";
      } else if (error.message.includes("permission")) {
        return "You don't have permission to perform this action.";
      } else if (
        error.message.includes("network") ||
        error.message.includes("fetch")
      ) {
        return "Network error. Please check your connection and try again.";
      }
      return error.message;
    }
    return "An unexpected error occurred. Please try again.";
  };

  // Add household profile check helper
  const checkHouseholdProfile = async () => {
    try {
      // Try to fetch income data which will verify household profile exists
      await incomeStore.fetchIncome({ forceRefresh: true });
      return true;
    } catch (error: any) {
      if (error.message?.includes("household profile")) {
        return false;
      }
      // Re-throw other errors
      throw error;
    }
  };

  // Watch for user changes and reinitialize
  let userWatcher: (() => void) | null = null;
  const setupUserWatcher = () => {
    userWatcher = watch(
      () => session.user,
      (newUser, oldUser) => {
        if (newUser !== oldUser) {
          incomeStore.$reset();
          if (newUser) {
            initialize();
          }
        }
      },
    );
  };

  // Auto-initialize if enabled
  if (autoInitialize) {
    setupUserWatcher();
    if (session.user) {
      initialize();
    }
  }

  // Cleanup
  onUnmounted(() => {
    if (userWatcher) {
      userWatcher();
    }
  });

  return {
    // State
    incomes,
    incomeTypes,
    recurringSources,
    ledgerEntries,
    analytics,
    dashboardMetrics,
    monthlyIncomeSummary,
    incomeInsights,
    loading,
    error,
    filters,
    ledgerFilters,

    // Computed values
    totalIncome,
    recurringIncome,
    oneTimeIncome,
    totalSources,
    allSources,
    filteredSources,
    filteredLedgerEntries,
    recentSources,
    topIncomeTypes,
    incomeByType,
    hasData,
    isCacheValid,

    // Actions
    fetchIncome,
    fetchIncomeWithAnalytics,
    fetchIncomeLedger,
    fetchIncomeTypes,
    fetchMonthlyIncomeSummary,
    fetchIncomeInsights,
    fetchDashboardMetrics,
    fetchIncomeAnalytics,
    fetchIncomeFilterOptions,
    fetchPeriodInfo,
    cleanupIncomeData,
    addIncomeSource,
    addDirectLedgerEntry,
    updateIncomeSource,
    deleteIncome,
    deleteIncomeSource,
    updateRecurringLedgerEntries,
    updateLedgerEntry,
    deleteLedgerEntry,
    createLedgerEntry,
    updateFilters,
    updateLedgerFilters,
    clearFilters,
    clearLedgerFilters,
    clearError,

    // Cache management
    clearCache,
    invalidateCache,
    refreshData,

    // Utilities
    initialize,
    invalidateAndRefresh,
    getAnalytics,
    setPeriod,
    checkHouseholdProfile,
    getErrorMessage,
  };
}
