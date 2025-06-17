/**
 * Income Store - Exact Backend API Alignment
 * No backward compatibility - uses exact backend structure
 */

import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { incomeService } from "../services/income-service";
import type {
  IncomeAnalytics,
  IncomeFilters,
  IncomeFormData,
  IncomeRecord,
  IncomeTypeRecord,
  AddIncomeSourcePayload,
  UpdateIncomeSourcePayload,
  DeleteIncomeSourcePayload,
} from "../types/income";
import {
  convertIncomeAmount,
  convertRecurFlag_ToBoolean,
} from "../types/income";

export const useIncomeStore = defineStore("income", () => {
  // State - using exact backend types
  const incomes = ref<IncomeRecord[]>([]);
  const incomeTypes = ref<IncomeTypeRecord[]>([]);
  const analytics = ref<IncomeAnalytics | null>(null);
  const loading = ref(false);
  const error = ref("");
  const lastFetch = ref<number | null>(null);
  const recurringSources = ref<any[]>([]);

  // Filters state - exact backend filter structure
  const filters = ref<IncomeFilters>({
    searchTerm: "",
    dateFrom: "",
    dateTo: "",
    amountMin: "",
    amountMax: "",
    type: "",
    frequency: "",
    isRecurring: null,
    sortBy: "date",
    sortOrder: "desc",
  });

  // Computed properties - working with exact backend data
  const totalMonthlyIncome = computed(() => {
    const total = incomes.value.reduce((total, income) => {
      const amount = convertIncomeAmount(income.monthly_income);
      return total + amount;
    }, 0);
    return total;
  });

  const totalRecurringIncome = computed(() => {
    const total = incomes.value.reduce((total, income) => {
      if (!income.income_source) return total;
      return (
        total +
        income.income_source.reduce((sourceTotal, source) => {
          const isRecurring = convertRecurFlag_ToBoolean(source.recur);
          const amount = isRecurring ? source.income : 0;
          return sourceTotal + amount;
        }, 0)
      );
    }, 0);
    return total;
  });

  const totalOneTimeIncome = computed(() => {
    const total = incomes.value.reduce((total, income) => {
      if (!income.income_source) return total;
      return (
        total +
        income.income_source.reduce((sourceTotal, source) => {
          const isRecurring = convertRecurFlag_ToBoolean(source.recur);
          const amount = !isRecurring ? source.income : 0;
          return sourceTotal + amount;
        }, 0)
      );
    }, 0);
    return total;
  });

  // Canonical computed properties: prefer backend analytics if available
  const canonicalTotalMonthlyIncome = computed(() => {
    if (analytics.value && typeof analytics.value.total_income === "number") {
      return analytics.value.total_income;
    }
    return totalMonthlyIncome.value;
  });

  const canonicalTotalRecurringIncome = computed(() => {
    if (
      analytics.value &&
      typeof analytics.value.recurring_income === "number"
    ) {
      return analytics.value.recurring_income;
    }
    return totalRecurringIncome.value;
  });

  const canonicalTotalOneTimeIncome = computed(() => {
    if (
      analytics.value &&
      typeof analytics.value.one_time_income === "number"
    ) {
      return analytics.value.one_time_income;
    }
    return totalOneTimeIncome.value;
  });

  const totalSources = computed(() => {
    const total = incomes.value.reduce((total, income) => {
      const sourceCount = income.income_source?.length || 0;
      return total + sourceCount;
    }, 0);
    return total;
  });

  const filteredIncomes = computed(() => {
    let filtered = [...incomes.value];

    // Apply search filter
    if (filters.value.searchTerm) {
      const searchTerm = filters.value.searchTerm.toLowerCase();
      filtered = filtered.filter((income) =>
        income.income_source?.some((source) =>
          source.type.toLowerCase().includes(searchTerm),
        ),
      );
    }

    // Apply type filter
    if (filters.value.type) {
      filtered = filtered.filter((income) =>
        income.income_source?.some(
          (source) => source.type === filters.value.type,
        ),
      );
    }

    // Apply frequency filter
    if (filters.value.frequency) {
      if (filters.value.frequency === "one-time") {
        filtered = filtered.filter((income) =>
          income.income_source?.some(
            (source) => !convertRecurFlag_ToBoolean(source.recur),
          ),
        );
      } else {
        filtered = filtered.filter((income) =>
          income.income_source?.some(
            (source) =>
              convertRecurFlag_ToBoolean(source.recur) &&
              source.recur_frequency === filters.value.frequency,
          ),
        );
      }
    }

    // Apply recurring filter
    if (filters.value.isRecurring !== null) {
      filtered = filtered.filter((income) =>
        income.income_source?.some(
          (source) =>
            convertRecurFlag_ToBoolean(source.recur) ===
            filters.value.isRecurring,
        ),
      );
    }

    // Apply amount filters
    if (filters.value.amountMin) {
      const minAmount = Number.parseFloat(filters.value.amountMin);
      filtered = filtered.filter(
        (income) => convertIncomeAmount(income.monthly_income) >= minAmount,
      );
    }

    if (filters.value.amountMax) {
      const maxAmount = Number.parseFloat(filters.value.amountMax);
      filtered = filtered.filter(
        (income) => convertIncomeAmount(income.monthly_income) <= maxAmount,
      );
    }

    // Apply date filters
    if (filters.value.dateFrom) {
      const fromDate = new Date(filters.value.dateFrom);
      filtered = filtered.filter(
        (income) => new Date(income.creation) >= fromDate,
      );
    }

    if (filters.value.dateTo) {
      const toDate = new Date(filters.value.dateTo);
      filtered = filtered.filter(
        (income) => new Date(income.creation) <= toDate,
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (filters.value.sortBy) {
        case "amount":
          aValue = convertIncomeAmount(a.monthly_income);
          bValue = convertIncomeAmount(b.monthly_income);
          break;
        case "date":
          aValue = new Date(a.creation);
          bValue = new Date(b.creation);
          break;
        default:
          aValue = new Date(a.creation);
          bValue = new Date(b.creation);
      }

      if (filters.value.sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  });

  // Actions - using exact backend API
  async function fetchIncomes(forceRefresh = false) {
    if (loading.value) return;

    try {
      loading.value = true;
      error.value = "";

      const result = await incomeService.getUserIncome({
        filters: filters.value,
        forceRefresh,
        useCache: !forceRefresh,
      });

      incomes.value = result;
      lastFetch.value = Date.now();
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to fetch incomes";
      console.error("Store: Error fetching incomes:", err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchIncomesWithAnalytics(forceRefresh = false) {
    if (loading.value) return;

    try {
      loading.value = true;
      error.value = "";

      const result = await incomeService.getUserIncomeWithAnalytics({
        filters: filters.value,
        forceRefresh,
        useCache: !forceRefresh,
      });

      incomes.value = result.incomes;
      analytics.value = result.analytics;
      recurringSources.value = result.recurring_sources || [];
      lastFetch.value = Date.now();
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to fetch income analytics";
      console.error("Store: Error fetching income analytics:", err);
    } finally {
      loading.value = false;
    }
  }

  async function fetchIncomeTypes(forceRefresh = false) {
    try {
      const result = await incomeService.getIncomeTypes({
        forceRefresh,
        useCache: !forceRefresh,
      });

      incomeTypes.value = result;
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to fetch income types";
      console.error("Store: Error fetching income types:", err);
    }
  }

  async function createIncome(payload: AddIncomeSourcePayload) {
    try {
      loading.value = true;
      error.value = "";

      await incomeService.createOrUpdateIncome(payload);

      // Refresh data after creation
      await fetchIncomes(true);
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to create income";
      console.error("Store: Error creating income:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateIncome(payload: UpdateIncomeSourcePayload) {
    try {
      loading.value = true;
      error.value = "";

      await incomeService.createOrUpdateIncome(payload);

      // Refresh data after update
      await fetchIncomes(true);
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to update income";
      console.error("Store: Error updating income:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteIncome(incomeId: string) {
    try {
      loading.value = true;
      error.value = "";

      await incomeService.deleteIncome(incomeId);

      // Remove from local state
      incomes.value = incomes.value.filter(
        (income) => income.name !== incomeId,
      );
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to delete income";
      console.error("Store: Error deleting income:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteIncomeSource(payload: DeleteIncomeSourcePayload) {
    try {
      loading.value = true;
      error.value = "";

      await incomeService.createOrUpdateIncome(payload);

      // Refresh data after deletion
      await fetchIncomes(true);
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to delete income source";
      console.error("Store: Error deleting income source:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function updateFilters(newFilters: Partial<IncomeFilters>) {
    filters.value = { ...filters.value, ...newFilters };
  }

  function resetFilters() {
    filters.value = {
      searchTerm: "",
      dateFrom: "",
      dateTo: "",
      amountMin: "",
      amountMax: "",
      type: "",
      frequency: "",
      isRecurring: null,
      sortBy: "date",
      sortOrder: "desc",
    };
  }

  function clearCache() {
    incomeService.clearCache();
    lastFetch.value = null;
  }

  // Helper to always fetch analytics for this month
  async function fetchMonthlyAnalytics(forceRefresh = false) {
    await fetchIncomesWithAnalytics(forceRefresh);
  }

  return {
    // State
    incomes,
    incomeTypes,
    analytics,
    loading,
    error,
    filters,
    lastFetch,
    recurringSources,

    // Computed
    totalMonthlyIncome,
    totalRecurringIncome,
    totalOneTimeIncome,
    totalSources,
    filteredIncomes,
    canonicalTotalMonthlyIncome,
    canonicalTotalRecurringIncome,
    canonicalTotalOneTimeIncome,

    // Actions
    fetchIncomes,
    fetchIncomesWithAnalytics,
    fetchIncomeTypes,
    createIncome,
    updateIncome,
    deleteIncome,
    deleteIncomeSource,
    updateFilters,
    resetFilters,
    clearCache,
    fetchMonthlyAnalytics,
  };
});
