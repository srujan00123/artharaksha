/**
 * Income Store - Pinia store for income management
 * Updated for new backend API and types
 */

import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { incomeService } from "../services/income-service";
import type {
  AddIncomeSourcePayload,
  CreateDirectLedgerEntryPayload,
  CreateLedgerEntryPayload,
  DeleteIncomeSourcePayload,
  DeleteLedgerEntryPayload,
  FlattenedLedgerEntry,
  GetIncomeInsightsResponse,
  GetMonthlyIncomeSummaryResponse,
  IncomeAnalytics,
  IncomeFilters,
  IncomeRecord,
  IncomeServiceOptions,
  IncomeStoreState,
  IncomeTypeRecord,
  IncomeDashboardMetrics,
  LedgerFilters,
  UpdateIncomeSourcePayload,
  UpdateLedgerEntryPayload,
} from "../types/income";
import { safeArray } from "../types/income";

export const useIncomeStore = defineStore("income", () => {
  // State
  const incomes = ref<IncomeRecord[]>([]);
  const incomeTypes = ref<IncomeTypeRecord[]>([]);
  const ledgerEntries = ref<FlattenedLedgerEntry[]>([]);
  const analytics = ref<IncomeAnalytics | null>(null);
  const dashboardMetrics = ref<IncomeDashboardMetrics | null>(null);
  const monthlyIncomeSummary = ref<GetMonthlyIncomeSummaryResponse | null>(
    null,
  );
  const incomeInsights = ref<GetIncomeInsightsResponse | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const filters = ref<IncomeFilters>({});
  const ledgerFilters = ref<LedgerFilters>({});
  const lastFetch = ref<number | null>(null);
  const cacheExpiry = ref(300000); // 5 minutes

  // Getters (computed properties)
  const hasData = computed(() => safeArray(incomes.value).length > 0);

  const totalIncome = computed(() =>
    safeArray(incomes.value).reduce(
      (total, income) => total + Number(income.monthly_income || 0),
      0,
    ),
  );

  const totalSources = computed(() =>
    safeArray(incomes.value).reduce(
      (total, income) => total + safeArray(income.income_source).length,
      0,
    ),
  );

  const recurringSources = computed(() =>
    safeArray(incomes.value).flatMap((income) =>
      safeArray(income.income_source).filter((source) => Boolean(source.recur)),
    ),
  );

  const recurringIncome = computed(() =>
    recurringSources.value.reduce(
      (total, source) => total + Number(source.income || 0),
      0,
    ),
  );

  const oneTimeIncome = computed(() =>
    safeArray(incomes.value)
      .flatMap((income) =>
        safeArray(income.income_source).filter(
          (source) => !Boolean(source.recur),
        ),
      )
      .reduce((total, source) => total + Number(source.income || 0), 0),
  );

  const incomeByType = computed(() => {
    const typeMap: Record<string, number> = {};
    safeArray(incomes.value).forEach((income) => {
      safeArray(income.income_source).forEach((source) => {
        if (source.type) {
          typeMap[source.type] =
            (typeMap[source.type] || 0) + Number(source.income || 0);
        }
      });
    });
    return typeMap;
  });

  const allSources = computed(() =>
    safeArray(incomes.value).flatMap((income) =>
      safeArray(income.income_source),
    ),
  );

  const filteredSources = computed(() => {
    let sources = allSources.value;
    const currentFilters = filters.value;

    // Type filter
    if (currentFilters.type) {
      sources = sources.filter((source) => source.type === currentFilters.type);
    }

    // Frequency filter - improved logic
    if (currentFilters.frequency) {
      if (currentFilters.frequency === "recurring") {
        sources = sources.filter((source) => Boolean(source.recur));
      } else if (currentFilters.frequency === "one-time") {
        sources = sources.filter((source) => !Boolean(source.recur));
      } else {
        sources = sources.filter(
          (source) => source.recur_frequency === currentFilters.frequency,
        );
      }
    }

    // isRecurring filter (separate from frequency for boolean filtering)
    if (currentFilters.isRecurring !== undefined) {
      if (currentFilters.isRecurring) {
        sources = sources.filter((source) => Boolean(source.recur));
      } else {
        sources = sources.filter((source) => !Boolean(source.recur));
      }
    }

    // Date range filter
    if (currentFilters.dateFrom && currentFilters.dateTo) {
      sources = sources.filter((source) => {
        if (!source.date_time) return false;
        const sourceDate = new Date(source.date_time);
        return (
          sourceDate >= new Date(currentFilters.dateFrom!) &&
          sourceDate <= new Date(currentFilters.dateTo!)
        );
      });
    }

    // Amount range filters
    if (currentFilters.amountMin !== undefined) {
      sources = sources.filter(
        (source) => Number(source.income || 0) >= currentFilters.amountMin!,
      );
    }

    if (currentFilters.amountMax !== undefined) {
      sources = sources.filter(
        (source) => Number(source.income || 0) <= currentFilters.amountMax!,
      );
    }

    // Search filter
    if (currentFilters.searchTerm) {
      const term = currentFilters.searchTerm.toLowerCase();
      sources = sources.filter((source) =>
        source.type?.toLowerCase().includes(term),
      );
    }

    // Sort sources
    if (currentFilters.sortBy) {
      sources.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (currentFilters.sortBy === "date") {
          aValue = new Date(a.date_time || 0).getTime();
          bValue = new Date(b.date_time || 0).getTime();
        } else if (currentFilters.sortBy === "amount") {
          aValue = Number(a.income || 0);
          bValue = Number(b.income || 0);
        } else if (currentFilters.sortBy === "type") {
          aValue = (a.type || "").toLowerCase();
          bValue = (b.type || "").toLowerCase();
          // For string comparison
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

    return sources;
  });

  const filteredLedgerEntries = computed(() => {
    let entries = safeArray(ledgerEntries.value);
    const currentFilters = ledgerFilters.value;

    if (currentFilters.income_type) {
      entries = entries.filter(
        (entry) => entry.income_type === currentFilters.income_type,
      );
    }

    if (currentFilters.dateFrom) {
      entries = entries.filter(
        (entry) =>
          new Date(entry.date_time) >= new Date(currentFilters.dateFrom!),
      );
    }

    if (currentFilters.dateTo) {
      entries = entries.filter(
        (entry) =>
          new Date(entry.date_time) <= new Date(currentFilters.dateTo!),
      );
    }

    return entries.sort(
      (a, b) =>
        new Date(b.date_time).getTime() - new Date(a.date_time).getTime(),
    );
  });

  const recentSources = computed(() =>
    allSources.value
      .sort(
        (a, b) =>
          new Date(b.date_time).getTime() - new Date(a.date_time).getTime(),
      )
      .slice(0, 5),
  );

  const topIncomeTypes = computed(() =>
    Object.entries(incomeByType.value)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([type, amount]) => ({ type, amount })),
  );

  // Cache validation
  const isCacheValid = computed(() => {
    if (!lastFetch.value) return false;
    return Date.now() - lastFetch.value < cacheExpiry.value;
  });

  // Actions
  async function fetchIncome(options: IncomeServiceOptions = {}) {
    if (loading.value) return;

    try {
      loading.value = true;
      error.value = null;

      const { forceRefresh = false } = options;

      if (!forceRefresh && isCacheValid.value && hasData.value) {
        return;
      }

      const data = await incomeService.getUserIncome({
        ...options,
        useCache: !forceRefresh,
      });

      incomes.value = data;
      lastFetch.value = Date.now();
    } catch (err: any) {
      error.value = err.message || "Failed to fetch income data";
      console.error("Error fetching income:", err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchIncomeWithAnalytics(options: IncomeServiceOptions = {}) {
    if (loading.value) return;

    try {
      loading.value = true;
      error.value = null;

      const { forceRefresh = false } = options;

      if (
        !forceRefresh &&
        isCacheValid.value &&
        hasData.value &&
        analytics.value
      ) {
        return;
      }

      const data = await incomeService.getUserIncomeWithAnalytics({
        ...options,
        useCache: !forceRefresh,
      });

      incomes.value = data.incomes;
      analytics.value = data.analytics;

      // Store the ledger entries directly from the new API
      ledgerEntries.value = data.ledgerEntries;

      lastFetch.value = Date.now();
    } catch (err: any) {
      error.value = err.message || "Failed to fetch income analytics";
      console.error("Error fetching income analytics:", err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchIncomeLedger(
    filters?: LedgerFilters,
    options: IncomeServiceOptions = {},
  ) {
    if (loading.value) return;

    try {
      loading.value = true;
      error.value = null;

      const data = await incomeService.getIncomeLedger(filters, options);
      ledgerEntries.value = data;
    } catch (err: any) {
      error.value = err.message || "Failed to fetch income ledger";
      console.error("Error fetching income ledger:", err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchIncomeTypes(options: IncomeServiceOptions = {}) {
    if (loading.value) return;

    try {
      loading.value = true;
      error.value = null;

      const data = await incomeService.getIncomeTypes(options);
      incomeTypes.value = data;
    } catch (err: any) {
      error.value = err.message || "Failed to fetch income types";
      console.error("Error fetching income types:", err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchMonthlyIncomeSummary(options: IncomeServiceOptions = {}) {
    if (loading.value) return;

    try {
      loading.value = true;
      error.value = null;

      const data = await incomeService.getMonthlyIncomeSummary(options);
      monthlyIncomeSummary.value = data;
    } catch (err: any) {
      error.value = err.message || "Failed to fetch monthly income summary";
      console.error("Error fetching monthly income summary:", err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchIncomeInsights(options: IncomeServiceOptions = {}) {
    if (loading.value) return;

    try {
      loading.value = true;
      error.value = null;

      const data = await incomeService.getIncomeInsights(options);
      incomeInsights.value = data;
    } catch (err: any) {
      error.value = err.message || "Failed to fetch income insights";
      console.error("Error fetching income insights:", err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchDashboardMetrics(
    period: string = "this_month",
    options: IncomeServiceOptions = {},
  ) {
    if (loading.value) return;

    try {
      loading.value = true;
      error.value = null;

      const data = await incomeService.getDashboardMetrics(period, options);
      dashboardMetrics.value = data;
    } catch (err: any) {
      error.value = err.message || "Failed to fetch dashboard metrics";
      console.error("Error fetching dashboard metrics:", err);
    } finally {
      loading.value = false;
    }
  }

  async function addIncomeSource(payload: AddIncomeSourcePayload) {
    try {
      loading.value = true;
      error.value = null;

      await incomeService.createOrUpdateIncome(payload);
      await fetchIncome({ forceRefresh: true });
    } catch (err: any) {
      error.value = err.message || "Failed to add income source";
      console.error("Error adding income source:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function addDirectLedgerEntry(payload: CreateDirectLedgerEntryPayload) {
    try {
      loading.value = true;
      error.value = null;

      await incomeService.createDirectLedgerEntry(payload);
      await fetchIncome({ forceRefresh: true });
    } catch (err: any) {
      error.value = err.message || "Failed to add direct ledger entry";
      console.error("Error adding direct ledger entry:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateIncomeSource(payload: UpdateIncomeSourcePayload) {
    try {
      loading.value = true;
      error.value = null;

      await incomeService.createOrUpdateIncome(payload);
      await fetchIncome({ forceRefresh: true });
    } catch (err: any) {
      error.value = err.message || "Failed to update income source";
      console.error("Error updating income source:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteIncomeSource(payload: DeleteIncomeSourcePayload) {
    try {
      loading.value = true;
      error.value = null;

      await incomeService.createOrUpdateIncome(payload);
      await fetchIncome({ forceRefresh: true });
    } catch (err: any) {
      error.value = err.message || "Failed to delete income source";
      console.error("Error deleting income source:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteIncome(incomeId: string) {
    try {
      loading.value = true;
      error.value = null;

      await incomeService.deleteIncome(incomeId);

      // Remove from local state
      incomes.value = incomes.value.filter(
        (income) => income.name !== incomeId,
      );
    } catch (err: any) {
      error.value = err.message || "Failed to delete income";
      console.error("Error deleting income:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateRecurringLedgerEntries() {
    try {
      loading.value = true;
      error.value = null;

      const result = await incomeService.updateRecurringLedgerEntries();

      // Refresh data after update
      await fetchIncome({ forceRefresh: true });
      if (ledgerEntries.value.length > 0) {
        await fetchIncomeLedger(ledgerFilters.value, { forceRefresh: true });
      }

      return result;
    } catch (err: any) {
      error.value = err.message || "Failed to update recurring ledger entries";
      console.error("Error updating recurring ledger entries:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateLedgerEntry(payload: UpdateLedgerEntryPayload) {
    try {
      loading.value = true;
      error.value = null;

      const result = await incomeService.updateLedgerEntry(payload);

      // Refresh data after update
      await fetchIncome({ forceRefresh: true });
      await fetchIncomeLedger(ledgerFilters.value, { forceRefresh: true });

      return result;
    } catch (err: any) {
      error.value = err.message || "Failed to update ledger entry";
      console.error("Error updating ledger entry:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteLedgerEntry(payload: DeleteLedgerEntryPayload) {
    try {
      loading.value = true;
      error.value = null;

      const result = await incomeService.deleteLedgerEntry(payload);

      // Refresh data after deletion
      await fetchIncome({ forceRefresh: true });
      await fetchIncomeLedger(ledgerFilters.value, { forceRefresh: true });

      return result;
    } catch (err: any) {
      error.value = err.message || "Failed to delete ledger entry";
      console.error("Error deleting ledger entry:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function createLedgerEntry(payload: CreateLedgerEntryPayload) {
    try {
      loading.value = true;
      error.value = null;

      const result = await incomeService.createLedgerEntry(payload);

      // Refresh data after creation
      await fetchIncome({ forceRefresh: true });
      await fetchIncomeLedger(ledgerFilters.value, { forceRefresh: true });

      return result;
    } catch (err: any) {
      error.value = err.message || "Failed to create ledger entry";
      console.error("Error creating ledger entry:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function updateFilters(newFilters: Partial<IncomeFilters>) {
    filters.value = { ...filters.value, ...newFilters };
  }

  function updateLedgerFilters(newFilters: Partial<LedgerFilters>) {
    ledgerFilters.value = { ...ledgerFilters.value, ...newFilters };
  }

  function clearFilters() {
    filters.value = {};
  }

  function clearLedgerFilters() {
    ledgerFilters.value = {};
  }

  function clearError() {
    error.value = null;
  }

  function clearCache() {
    incomes.value = [];
    incomeTypes.value = [];
    ledgerEntries.value = [];
    analytics.value = null;
    monthlyIncomeSummary.value = null;
    incomeInsights.value = null;
    lastFetch.value = null;
    incomeService.clearCache();
  }

  // Initialize store
  function $reset() {
    incomes.value = [];
    incomeTypes.value = [];
    ledgerEntries.value = [];
    analytics.value = null;
    monthlyIncomeSummary.value = null;
    incomeInsights.value = null;
    loading.value = false;
    error.value = null;
    filters.value = {};
    ledgerFilters.value = {};
    lastFetch.value = null;
  }

  return {
    // State
    incomes,
    incomeTypes,
    ledgerEntries,
    analytics,
    dashboardMetrics,
    monthlyIncomeSummary,
    incomeInsights,
    loading,
    error,
    filters,
    ledgerFilters,
    lastFetch,
    cacheExpiry,

    // Getters
    hasData,
    totalIncome,
    totalSources,
    recurringSources,
    recurringIncome,
    oneTimeIncome,
    incomeByType,
    allSources,
    filteredSources,
    filteredLedgerEntries,
    recentSources,
    topIncomeTypes,
    isCacheValid,

    // Actions
    fetchIncome,
    fetchIncomeWithAnalytics,
    fetchIncomeLedger,
    fetchIncomeTypes,
    fetchMonthlyIncomeSummary,
    fetchIncomeInsights,
    fetchDashboardMetrics,
    addIncomeSource,
    addDirectLedgerEntry,
    updateIncomeSource,
    deleteIncomeSource,
    deleteIncome,
    updateRecurringLedgerEntries,
    updateLedgerEntry,
    deleteLedgerEntry,
    createLedgerEntry,
    updateFilters,
    updateLedgerFilters,
    clearFilters,
    clearLedgerFilters,
    clearError,
    clearCache,
    $reset,
  };
});
