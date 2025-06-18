/**
 * Expense Store - Robust & Redundancy-Free
 * Centralized state management for expense data with clean separation of concerns
 * Follows the exact income store pattern for consistency
 */

import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { expenseService } from "../services/expense-service";
import type {
  ExpenseFilters,
  ExpenseFormData,
  ExpenseServiceOptions,
  FlattenedExpenseEntry,
  ExpenseAnalytics,
  ExpenseDashboardMetrics,
  ExpenseTypeRecord,
  GetExpenseTypesResponse,
} from "../types/expense";
import { safeArray } from "../types/expense";

// Default filters
const defaultFilters: ExpenseFilters = {
  searchTerm: "",
  type: "",
  category: "",
  dateFrom: "",
  dateTo: "",
  amountMin: undefined,
  amountMax: undefined,
  sortBy: "date",
  sortOrder: "desc",
  period: "this_month",
  isDirect: undefined,
};

export const useExpenseStore = defineStore("expense", () => {
  // State
  const expenses = ref<FlattenedExpenseEntry[]>([]);
  const expenseTypes = ref<GetExpenseTypesResponse>({
    medical_types: [],
    other_types: [],
  });
  const analytics = ref<ExpenseAnalytics | null>(null);
  const dashboardMetrics = ref<ExpenseDashboardMetrics | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const filters = ref<ExpenseFilters>({ ...defaultFilters });
  const lastFetch = ref<number | null>(null);
  const cacheExpiry = ref(5 * 60 * 1000); // 5 minutes

  // Computed properties
  const hasData = computed(() => expenses.value.length > 0);

  const isCacheValid = computed(() => {
    if (!lastFetch.value) return false;
    return Date.now() - lastFetch.value < cacheExpiry.value;
  });

  const filteredExpenses = computed(() => {
    let filtered = expenses.value.slice();
    const currentFilters = filters.value;

    // Search filter
    if (currentFilters.searchTerm) {
      const term = currentFilters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (expense) =>
          expense.category.toLowerCase().includes(term) ||
          (expense.description || "").toLowerCase().includes(term),
      );
    }

    // Type filter
    if (currentFilters.type) {
      filtered = filtered.filter(
        (expense) => expense.type === currentFilters.type,
      );
    }

    // Category filter
    if (currentFilters.category) {
      filtered = filtered.filter(
        (expense) => expense.category === currentFilters.category,
      );
    }

    // Date filters
    if (currentFilters.dateFrom) {
      const fromDate = new Date(currentFilters.dateFrom);
      filtered = filtered.filter(
        (expense) => new Date(expense.date_time) >= fromDate,
      );
    }

    if (currentFilters.dateTo) {
      const toDate = new Date(currentFilters.dateTo);
      filtered = filtered.filter(
        (expense) => new Date(expense.date_time) <= toDate,
      );
    }

    // Period filter (if no custom date range is set)
    if (
      currentFilters.period &&
      !currentFilters.dateFrom &&
      !currentFilters.dateTo
    ) {
      const now = new Date();
      let startDate: Date;
      let endDate: Date = now;

      switch (currentFilters.period) {
        case "today":
          startDate = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
          );
          break;
        case "this_week":
          startDate = new Date(now);
          startDate.setDate(now.getDate() - now.getDay());
          break;
        case "this_month":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "last_month":
          startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          endDate = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        case "last_3_months":
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
          break;
        case "last_6_months":
          startDate = new Date(now.getFullYear(), now.getMonth() - 6, 1);
          break;
        case "this_year":
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(0); // No filter for "all"
          endDate = new Date(8640000000000000); // Max date
      }

      if (currentFilters.period !== "all") {
        filtered = filtered.filter((expense) => {
          const expenseDate = new Date(expense.date_time);
          return expenseDate >= startDate && expenseDate <= endDate;
        });
      }
    }

    // Amount filters
    if (currentFilters.amountMin !== undefined) {
      filtered = filtered.filter(
        (expense) => expense.amount >= currentFilters.amountMin!,
      );
    }

    if (currentFilters.amountMax !== undefined) {
      filtered = filtered.filter(
        (expense) => expense.amount <= currentFilters.amountMax!,
      );
    }

    // Direct/Indirect filter for medical expenses
    if (
      currentFilters.isDirect !== undefined &&
      currentFilters.type === "medical"
    ) {
      filtered = filtered.filter(
        (expense) =>
          expense.type === "medical" &&
          Boolean(expense.is_direct) === currentFilters.isDirect,
      );
    }

    // Sorting
    if (currentFilters.sortBy) {
      filtered.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        if (currentFilters.sortBy === "date") {
          aValue = new Date(a.date_time).getTime();
          bValue = new Date(b.date_time).getTime();
        } else if (currentFilters.sortBy === "amount") {
          aValue = a.amount;
          bValue = b.amount;
        } else if (currentFilters.sortBy === "category") {
          aValue = a.category.toLowerCase();
          bValue = b.category.toLowerCase();
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

    return filtered;
  });

  const medicalExpenses = computed(() =>
    filteredExpenses.value.filter((expense) => expense.type === "medical"),
  );

  const otherExpenses = computed(() =>
    filteredExpenses.value.filter((expense) => expense.type === "other"),
  );

  const directMedicalExpenses = computed(() =>
    medicalExpenses.value.filter((expense) => expense.is_direct === true),
  );

  const indirectMedicalExpenses = computed(() =>
    medicalExpenses.value.filter((expense) => expense.is_direct === false),
  );

  const totalAmount = computed(() =>
    filteredExpenses.value.reduce((sum, expense) => sum + expense.amount, 0),
  );

  const medicalAmount = computed(() =>
    medicalExpenses.value.reduce((sum, expense) => sum + expense.amount, 0),
  );

  const otherAmount = computed(() =>
    otherExpenses.value.reduce((sum, expense) => sum + expense.amount, 0),
  );

  const directMedicalAmount = computed(() =>
    directMedicalExpenses.value.reduce(
      (sum, expense) => sum + expense.amount,
      0,
    ),
  );

  const indirectMedicalAmount = computed(() =>
    indirectMedicalExpenses.value.reduce(
      (sum, expense) => sum + expense.amount,
      0,
    ),
  );

  const expenseCount = computed(() => filteredExpenses.value.length);

  const averageExpense = computed(() => {
    const count = expenseCount.value;
    return count > 0 ? totalAmount.value / count : 0;
  });

  const expensesByDate = computed(() => {
    const grouped: Record<string, FlattenedExpenseEntry[]> = {};
    filteredExpenses.value.forEach((expense) => {
      const date = new Date(expense.date_time).toISOString().split("T")[0];
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(expense);
    });
    return grouped;
  });

  const expensesByCategory = computed(() => {
    const grouped: Record<string, FlattenedExpenseEntry[]> = {};
    filteredExpenses.value.forEach((expense) => {
      if (!grouped[expense.category]) {
        grouped[expense.category] = [];
      }
      grouped[expense.category].push(expense);
    });
    return grouped;
  });

  const topCategories = computed(() => {
    const categoryMap = new Map<string, { amount: number; count: number }>();
    filteredExpenses.value.forEach((expense) => {
      const existing = categoryMap.get(expense.category) || {
        amount: 0,
        count: 0,
      };
      categoryMap.set(expense.category, {
        amount: existing.amount + expense.amount,
        count: existing.count + 1,
      });
    });
    return Array.from(categoryMap.entries())
      .map(([category, data]) => ({ category, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);
  });

  const recentExpenses = computed(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return expenses.value
      .filter((expense) => new Date(expense.date_time) >= thirtyDaysAgo)
      .sort(
        (a, b) =>
          new Date(b.date_time).getTime() - new Date(a.date_time).getTime(),
      )
      .slice(0, 10);
  });

  const hasActiveFilters = computed(() => {
    return Object.entries(filters.value).some(([key, value]) => {
      const defaultValue = defaultFilters[key as keyof ExpenseFilters];
      return value !== "" && value !== defaultValue;
    });
  });

  // Actions
  async function fetchExpenses(options: ExpenseServiceOptions = {}) {
    if (loading.value) return;

    try {
      loading.value = true;
      error.value = null;

      const { forceRefresh = false, useCache = true } = options;

      // Let the service handle caching - don't duplicate cache logic here
      const data = await expenseService.getUserExpenses({
        ...options,
        filters: filters.value,
        useCache: useCache && !forceRefresh,
        forceRefresh,
      });

      expenses.value = data.expenses;
      analytics.value = data.analytics || null;
      lastFetch.value = Date.now();
      return data.expenses;
    } catch (err: any) {
      error.value = err.message || "Failed to fetch expenses";
      console.error("Error fetching expenses:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchExpensesWithAnalytics(
    options: ExpenseServiceOptions = {},
  ) {
    if (loading.value) return;

    try {
      loading.value = true;
      error.value = null;

      const { forceRefresh = false, useCache = true } = options;

      // Let the service handle caching - don't duplicate cache logic here
      const data = await expenseService.getUserExpensesWithAnalytics({
        ...options,
        filters: filters.value,
        useCache: useCache && !forceRefresh,
        forceRefresh,
      });

      expenses.value = data.expenses;
      analytics.value = data.analytics;

      lastFetch.value = Date.now();
    } catch (err: any) {
      error.value = err.message || "Failed to fetch expense analytics";
      console.error("Error fetching expense analytics:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchExpenseTypes(options: ExpenseServiceOptions = {}) {
    try {
      const data = await expenseService.getExpenseTypes(options);
      expenseTypes.value = data;
      return data;
    } catch (err: any) {
      error.value = err.message || "Failed to fetch expense types";
      console.error("Error fetching expense types:", err);
      throw err;
    }
  }

  async function fetchDashboardMetrics(
    period: string = "this_month",
    options: ExpenseServiceOptions = {},
  ) {
    try {
      const data = await expenseService.getDashboardMetrics(period, options);
      dashboardMetrics.value = data;
      return data;
    } catch (err: any) {
      error.value = err.message || "Failed to fetch dashboard metrics";
      console.error("Error fetching dashboard metrics:", err);
      throw err;
    }
  }

  async function refreshExpenses() {
    return await fetchExpenses({ forceRefresh: true });
  }

  async function createExpense(expenseData: ExpenseFormData) {
    try {
      loading.value = true;
      error.value = null;

      const result = await expenseService.createExpense(expenseData);

      // Refresh data after creation
      await refreshExpenses();

      return result;
    } catch (err: any) {
      error.value = err.message || "Failed to create expense";
      console.error("Error creating expense:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function updateExpense(
    expenseName: string,
    expenseData: ExpenseFormData,
  ) {
    try {
      loading.value = true;
      error.value = null;

      const result = await expenseService.updateExpense(
        expenseName,
        expenseData,
      );

      // Refresh data after update
      await refreshExpenses();

      return result;
    } catch (err: any) {
      error.value = err.message || "Failed to update expense";
      console.error("Error updating expense:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function deleteExpense(expenseName: string, expenseId: string) {
    try {
      loading.value = true;
      error.value = null;

      await expenseService.deleteExpense(expenseName, expenseId);

      // Refresh data after deletion
      await refreshExpenses();

      return true;
    } catch (err: any) {
      error.value = err.message || "Failed to delete expense";
      console.error("Error deleting expense:", err);
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function updateFilters(newFilters: Partial<ExpenseFilters>) {
    filters.value = { ...filters.value, ...newFilters };
  }

  function clearFilters() {
    filters.value = { ...defaultFilters };
  }

  function clearError() {
    error.value = null;
  }

  function clearCache() {
    expenses.value = [];
    analytics.value = null;
    dashboardMetrics.value = null;
    lastFetch.value = null;
    expenseService.clearCache();
  }

  function $reset() {
    expenses.value = [];
    expenseTypes.value = {
      medical_types: [],
      other_types: [],
    };
    analytics.value = null;
    dashboardMetrics.value = null;
    loading.value = false;
    error.value = null;
    filters.value = { ...defaultFilters };
    lastFetch.value = null;
  }

  return {
    // State
    expenses,
    expenseTypes,
    analytics,
    dashboardMetrics,
    loading,
    error,
    filters,
    lastFetch,
    cacheExpiry,

    // Computed
    hasData,
    isCacheValid,
    filteredExpenses,
    medicalExpenses,
    otherExpenses,
    directMedicalExpenses,
    indirectMedicalExpenses,
    totalAmount,
    medicalAmount,
    otherAmount,
    directMedicalAmount,
    indirectMedicalAmount,
    expenseCount,
    averageExpense,
    expensesByDate,
    expensesByCategory,
    topCategories,
    recentExpenses,
    hasActiveFilters,

    // Actions
    fetchExpenses,
    fetchExpensesWithAnalytics,
    fetchExpenseTypes,
    fetchDashboardMetrics,
    refreshExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    updateFilters,
    clearFilters,
    clearError,
    clearCache,
    $reset,
  };
});
