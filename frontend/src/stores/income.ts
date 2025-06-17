/**
 * Income Store - Updated for new backend API and types
 * Only add/update/delete IncomeSourceType, ledger is backend-only
 */

import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { incomeService } from "../services/income-service";
import {
  IncomeAnalytics,
  IncomeFilters,
  IncomeRecord,
  IncomeTypeRecord,
  AddIncomeSourcePayload,
  UpdateIncomeSourcePayload,
  DeleteIncomeSourcePayload,
  safeArray,
} from "../types/income";

export const useIncomeStore = defineStore("income", () => {
  // State
  const incomes = ref<IncomeRecord[]>([]);
  const incomeTypes = ref<IncomeTypeRecord[]>([]);
  const analytics = ref<IncomeAnalytics | null>(null);
  const loading = ref(false);
  const error = ref("");
  const lastFetch = ref<number | null>(null);

  // Filters state - use correct types
  const filters = ref<IncomeFilters>({
    searchTerm: "",
    dateFrom: "",
    dateTo: "",
    amountMin: undefined,
    amountMax: undefined,
    type: "",
    frequency: undefined,
    isRecurring: undefined,
    sortBy: "date",
    sortOrder: "desc",
    period: undefined,
  });

  // Computed properties
  const totalMonthlyIncome = computed(() => {
    return incomes.value.reduce(
      (total, income) => total + (income.monthly_income || 0),
      0,
    );
  });

  const totalRecurringIncome = computed(() => {
    return incomes.value.reduce((total, income) => {
      return (
        total +
        safeArray(income.income_source).reduce((sourceTotal, source) => {
          return source.recur ? sourceTotal + source.income : sourceTotal;
        }, 0)
      );
    }, 0);
  });

  const totalOneTimeIncome = computed(() => {
    return incomes.value.reduce((total, income) => {
      return (
        total +
        safeArray(income.income_source).reduce((sourceTotal, source) => {
          return !source.recur ? sourceTotal + source.income : sourceTotal;
        }, 0)
      );
    }, 0);
  });

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
    return incomes.value.reduce(
      (total, income) => total + safeArray(income.income_source).length,
      0,
    );
  });

  const filteredIncomes = computed(() => {
    let filtered = [...incomes.value];
    if (filters.value.searchTerm) {
      const searchTerm = filters.value.searchTerm.toLowerCase();
      filtered = filtered.filter((income) =>
        safeArray(income.income_source).some((source) =>
          source.type.toLowerCase().includes(searchTerm),
        ),
      );
    }
    if (filters.value.type) {
      filtered = filtered.filter((income) =>
        safeArray(income.income_source).some(
          (source) => source.type === filters.value.type,
        ),
      );
    }
    if (filters.value.frequency) {
      if (filters.value.frequency === "one-time") {
        filtered = filtered.filter((income) =>
          safeArray(income.income_source).some((source) => !source.recur),
        );
      } else {
        filtered = filtered.filter((income) =>
          safeArray(income.income_source).some(
            (source) =>
              source.recur &&
              source.recur_frequency === filters.value.frequency,
          ),
        );
      }
    }
    if (typeof filters.value.isRecurring === "boolean") {
      filtered = filtered.filter((income) =>
        safeArray(income.income_source).some(
          (source) => source.recur === filters.value.isRecurring,
        ),
      );
    }
    if (typeof filters.value.amountMin === "number") {
      filtered = filtered.filter(
        (income) => income.monthly_income >= filters.value.amountMin!,
      );
    }
    if (typeof filters.value.amountMax === "number") {
      filtered = filtered.filter(
        (income) => income.monthly_income <= filters.value.amountMax!,
      );
    }
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
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      switch (filters.value.sortBy) {
        case "amount":
          aValue = a.monthly_income;
          bValue = b.monthly_income;
          break;
        case "date":
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

  // Actions
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
      lastFetch.value = Date.now();
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to fetch income analytics";
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
    }
  }

  async function createIncome(payload: AddIncomeSourcePayload) {
    try {
      loading.value = true;
      error.value = "";
      await incomeService.createOrUpdateIncome(payload);
      await fetchIncomes(true);
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to create income";
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
      await fetchIncomes(true);
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to update income";
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
      incomes.value = incomes.value.filter(
        (income) => income.name !== incomeId,
      );
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to delete income";
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
      await fetchIncomes(true);
    } catch (err) {
      error.value =
        err instanceof Error ? err.message : "Failed to delete income source";
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
      amountMin: undefined,
      amountMax: undefined,
      type: "",
      frequency: undefined,
      isRecurring: undefined,
      sortBy: "date",
      sortOrder: "desc",
      period: undefined,
    };
  }

  function clearCache() {
    incomeService.clearCache();
    lastFetch.value = null;
  }

  async function fetchMonthlyAnalytics(forceRefresh = false) {
    await fetchIncomesWithAnalytics(forceRefresh);
  }

  return {
    incomes,
    incomeTypes,
    analytics,
    loading,
    error,
    filters,
    lastFetch,
    totalMonthlyIncome,
    totalRecurringIncome,
    totalOneTimeIncome,
    totalSources,
    filteredIncomes,
    canonicalTotalMonthlyIncome,
    canonicalTotalRecurringIncome,
    canonicalTotalOneTimeIncome,
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
