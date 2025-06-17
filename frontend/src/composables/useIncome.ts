/**
 * Income Composable - Updated for new backend API and types
 * Only add/update/delete IncomeSourceType, ledger is backend-only
 */

import { computed } from "vue";
import { useIncomeStore } from "../stores/income";
import type {
  IncomeFilters,
  IncomeFormData,
  AddIncomeSourcePayload,
  UpdateIncomeSourcePayload,
  DeleteIncomeSourcePayload,
} from "../types/income";

export function useIncome() {
  const store = useIncomeStore();

  // Reactive state from store
  const incomes = computed(() => store.incomes);
  const incomeTypes = computed(() => store.incomeTypes);
  const analytics = computed(() => store.analytics);
  const loading = computed(() => store.loading);
  const error = computed(() => store.error);
  const filters = computed(() => store.filters);

  // Computed totals
  const totalMonthlyIncome = computed(() => store.totalMonthlyIncome);
  const totalRecurringIncome = computed(() => store.totalRecurringIncome);
  const totalOneTimeIncome = computed(() => store.totalOneTimeIncome);
  const totalSources = computed(() => store.totalSources);
  const filteredIncomes = computed(() => store.filteredIncomes);

  // Canonical values (prefer backend analytics)
  const canonicalTotalMonthlyIncome = computed(
    () => store.canonicalTotalMonthlyIncome,
  );
  const canonicalTotalRecurringIncome = computed(
    () => store.canonicalTotalRecurringIncome,
  );
  const canonicalTotalOneTimeIncome = computed(
    () => store.canonicalTotalOneTimeIncome,
  );

  // Helper to fetch analytics for this month
  const fetchMonthlyAnalytics = async (forceRefresh = false) => {
    await store.fetchMonthlyAnalytics(forceRefresh);
  };

  // Actions
  const fetchIncomes = async (forceRefresh = false) => {
    await store.fetchIncomes(forceRefresh);
  };

  const fetchIncomesWithAnalytics = async (forceRefresh = false) => {
    await store.fetchIncomesWithAnalytics(forceRefresh);
  };

  const fetchIncomeTypes = async (forceRefresh = false) => {
    await store.fetchIncomeTypes(forceRefresh);
  };

  const createIncome = async (payload: AddIncomeSourcePayload) => {
    await store.createIncome(payload);
  };

  const updateIncome = async (payload: UpdateIncomeSourcePayload) => {
    await store.updateIncome(payload);
  };

  const deleteIncome = async (incomeId: string) => {
    await store.deleteIncome(incomeId);
  };

  const deleteIncomeSource = async (payload: DeleteIncomeSourcePayload) => {
    await store.deleteIncomeSource(payload);
  };

  const updateFilters = (newFilters: Partial<IncomeFilters>) => {
    store.updateFilters(newFilters);
  };

  const resetFilters = () => {
    store.resetFilters();
  };

  const clearCache = () => {
    store.clearCache();
  };

  // Initialization helper
  const initialize = async (
    options: { withAnalytics?: boolean; forceRefresh?: boolean } = {},
  ) => {
    const { withAnalytics = false, forceRefresh = false } = options;
    try {
      await fetchIncomeTypes(forceRefresh);
      if (withAnalytics) {
        await fetchIncomesWithAnalytics(forceRefresh);
      } else {
        await fetchIncomes(forceRefresh);
      }
    } catch (error) {
      throw error;
    }
  };

  return {
    incomes,
    incomeTypes,
    analytics,
    loading,
    error,
    filters,
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
    initialize,
    fetchMonthlyAnalytics,
  };
}
