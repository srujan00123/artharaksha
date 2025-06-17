/**
 * Expense Service - Robust & Redundancy-Free
 * Following the exact income service pattern for consistency
 * Provides clean, cached, type-safe operations for expense management
 */

import { call } from "frappe-ui";
import type {
  ExpenseFilters,
  ExpenseFormData,
  ExpenseServiceOptions,
  FlattenedExpenseEntry,
  ExpenseAnalytics,
  ExpenseDashboardMetrics,
  ExpenseTypeRecord,
  CreateExpenseResponse,
  GetUserExpensesResponse,
  GetExpenseTypesResponse,
  GetExpenseDashboardMetricsResponse,
  ExpenseValidationResult,
} from "../types/expense";
import { safeArray } from "../types/expense";
import { CACHE_KEYS, cacheService } from "./cache-service.js";
import { apiService, API_ENDPOINTS } from "./api-service.js";

/**
 * Expense Service Class
 * Centralized, robust service layer with consistent error handling and caching
 */
class ExpenseService {
  private readonly cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private readonly longCacheExpiry = 30 * 60 * 1000; // 30 minutes for static data

  /**
   * Normalize expense entry to ensure consistent structure
   */
  private normalizeExpenseEntry(entry: any): FlattenedExpenseEntry {
    return {
      name: entry.name || "",
      parent: entry.parent || "",
      type: entry.type || "other",
      category: entry.category || "",
      amount: Number(entry.amount || 0),
      date_time: entry.date_time || "",
      description: entry.description || "",
      is_direct:
        entry.is_direct !== undefined ? Boolean(entry.is_direct) : undefined,
      proof_of_payment: entry.proof_of_payment || undefined,
      household_profile: entry.household_profile || "",
      creation: entry.creation || "",
      modified: entry.modified || "",
    };
  }

  /**
   * Get user expenses with analytics (primary unified method)
   * Returns complete expense data with optional analytics
   */
  async getUserExpensesWithAnalytics(
    options: ExpenseServiceOptions = {},
  ): Promise<{
    expenses: FlattenedExpenseEntry[];
    analytics: ExpenseAnalytics;
  }> {
    const { filters, forceRefresh = false, useCache = true } = options;

    // Generate cache keys
    const cacheKey = useCache
      ? cacheService.generateFilterKey(
          CACHE_KEYS.USER_EXPENSES_ANALYTICS,
          filters || {},
        )
      : null;

    // Check cache first
    if (cacheKey && !forceRefresh) {
      const cached = cacheService.getWithFilters(
        CACHE_KEYS.USER_EXPENSES_ANALYTICS,
        filters || {},
      );
      if (cached) {
        return cached;
      }
    }

    try {
      const response: GetUserExpensesResponse = await apiService.execute(
        call(API_ENDPOINTS.EXPENSE.USER_EXPENSES, {
          filters: filters ? JSON.stringify(filters) : null,
          include_analytics: true,
        }),
      );

      // Process response data
      const expenses = safeArray(response.expenses).map(
        this.normalizeExpenseEntry,
      );

      const analytics = response.analytics || {
        total_expenses: 0,
        medical_expenses: 0,
        other_expenses: 0,
        direct_medical: 0,
        indirect_medical: 0,
        expense_by_category: {},
        monthly_trends: [],
        summary: {
          total_count: 0,
          average_expense: 0,
          top_category: "",
        },
        period: "this_month",
        start_date: "",
        end_date: "",
      };

      const result = {
        expenses,
        analytics,
      };

      // Cache the result
      if (cacheKey && useCache) {
        cacheService.setWithFilters(
          CACHE_KEYS.USER_EXPENSES_ANALYTICS,
          result,
          filters || {},
          { maxAge: this.cacheExpiry },
        );
      }

      return result;
    } catch (error: any) {
      console.error("Failed to fetch expenses with analytics:", error);
      throw new Error(
        `Failed to load expense data: ${error.message || "Unknown error"}`,
      );
    }
  }

  /**
   * Get user expenses (basic method without analytics)
   */
  async getUserExpenses(
    options: ExpenseServiceOptions = {},
  ): Promise<GetUserExpensesResponse> {
    const result = await this.getUserExpensesWithAnalytics({
      ...options,
      include_analytics: false,
    });
    return {
      expenses: result.expenses,
      analytics: undefined,
    };
  }

  /**
   * Get expense types (medical and other categories)
   */
  async getExpenseTypes(
    options: ExpenseServiceOptions = {},
  ): Promise<GetExpenseTypesResponse> {
    const { useCache = true, forceRefresh = false } = options;
    const cacheKey = CACHE_KEYS.EXPENSE_TYPES;

    if (useCache && !forceRefresh) {
      const cached = cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const response = await apiService.execute(
        call(API_ENDPOINTS.EXPENSE.TYPES),
      );

      const result: GetExpenseTypesResponse = {
        medical_types: safeArray(response.medical_types || []),
        other_types: safeArray(response.other_types || []),
      };

      // Cache for longer duration since types don't change often
      if (useCache) {
        cacheService.set(cacheKey, result, { maxAge: this.longCacheExpiry });
      }

      return result;
    } catch (error: any) {
      console.error("Failed to fetch expense types:", error);
      throw new Error(
        `Failed to load expense types: ${error.message || "Unknown error"}`,
      );
    }
  }

  /**
   * Get dashboard metrics for expense overview
   */
  async getDashboardMetrics(
    period: string = "this_month",
    options: ExpenseServiceOptions = {},
  ): Promise<GetExpenseDashboardMetricsResponse> {
    const { useCache = true, forceRefresh = false } = options;
    const cacheKey = `${CACHE_KEYS.EXPENSE_DASHBOARD}_${period}`;

    if (useCache && !forceRefresh) {
      const cached = cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const response = await apiService.execute(
        call(API_ENDPOINTS.EXPENSE.DASHBOARD_METRICS, { period }),
      );

      const result: GetExpenseDashboardMetricsResponse = {
        total_expenses: response.total_expenses || 0,
        medical_expenses: response.medical_expenses || 0,
        other_expenses: response.other_expenses || 0,
        direct_medical: response.direct_medical || 0,
        indirect_medical: response.indirect_medical || 0,
        expense_count: response.expense_count || 0,
        average_expense: response.average_expense || 0,
        top_category: response.top_category || "",
        expense_by_category: response.expense_by_category || {},
        monthly_trends: safeArray(response.monthly_trends || []),
        period,
        start_date: response.start_date,
        end_date: response.end_date,
      };

      // Cache for shorter duration for dashboard data
      if (useCache) {
        cacheService.set(cacheKey, result, { maxAge: 2 * 60 * 1000 }); // 2 minutes
      }

      return result;
    } catch (error: any) {
      console.error("Failed to fetch expense dashboard metrics:", error);
      throw new Error(
        `Failed to load dashboard metrics: ${error.message || "Unknown error"}`,
      );
    }
  }

  /**
   * Create a new expense
   */
  async createExpense(
    expenseData: ExpenseFormData,
  ): Promise<CreateExpenseResponse> {
    try {
      // Validate data first
      const validation = this.validateExpenseData(expenseData);
      if (!validation.is_valid) {
        throw new Error(
          `Validation failed: ${Object.values(validation.errors).join(", ")}`,
        );
      }

      const result = await apiService.execute(
        call(API_ENDPOINTS.EXPENSE.CREATE, { expense_data: expenseData }),
      );

      // Invalidate relevant caches
      this.invalidateExpenseCaches();

      return {
        name: result.name,
        household_profile: result.household_profile,
        monthly_expense: result.monthly_expense,
      };
    } catch (error: any) {
      console.error("Failed to create expense:", error);
      throw new Error(
        `Failed to create expense: ${error.message || "Unknown error"}`,
      );
    }
  }

  /**
   * Update an existing expense
   */
  async updateExpense(
    expenseName: string,
    expenseData: ExpenseFormData,
  ): Promise<CreateExpenseResponse> {
    try {
      // Validate data first
      const validation = this.validateExpenseData(expenseData);
      if (!validation.is_valid) {
        throw new Error(
          `Validation failed: ${Object.values(validation.errors).join(", ")}`,
        );
      }

      const result = await apiService.execute(
        call(API_ENDPOINTS.EXPENSE.UPDATE, {
          expense_name: expenseName,
          expense_data: expenseData,
        }),
      );

      // Invalidate relevant caches
      this.invalidateExpenseCaches();

      return {
        name: result.name,
        household_profile: result.household_profile,
        monthly_expense: result.monthly_expense,
      };
    } catch (error: any) {
      console.error("Failed to update expense:", error);
      throw new Error(
        `Failed to update expense: ${error.message || "Unknown error"}`,
      );
    }
  }

  /**
   * Delete an expense
   * Enhanced with graceful handling of "not found" errors and cache invalidation
   */
  async deleteExpense(
    expenseName: string,
    expenseId: string,
  ): Promise<boolean> {
    try {
      const result = await apiService.execute(
        call(API_ENDPOINTS.EXPENSE.DELETE, {
          expense_name: expenseName,
          expense_id: expenseId,
        }),
      );

      // Invalidate relevant caches
      this.invalidateExpenseCaches();

      return true;
    } catch (error: any) {
      console.error("Failed to delete expense:", error);

      // Handle "not found" errors gracefully - consider as success
      if (
        error.message &&
        (error.message.includes("not found") ||
          error.message.includes("does not exist") ||
          error.message.includes("already deleted"))
      ) {
        console.warn(
          `Expense ${expenseId} not found, treating as successful deletion`,
        );
        // Still invalidate cache to ensure data consistency
        this.invalidateExpenseCaches();
        return true;
      }

      throw new Error(
        `Failed to delete expense: ${error.message || "Unknown error"}`,
      );
    }
  }

  /**
   * Validate expense data
   */
  validateExpenseData(expenseData: ExpenseFormData): ExpenseValidationResult {
    const errors: Record<string, string> = {};

    // Type validation
    if (!expenseData.type || !["medical", "other"].includes(expenseData.type)) {
      errors.type = "Please select a valid expense type";
    }

    // Category validation
    if (!expenseData.category || expenseData.category.trim() === "") {
      errors.category = "Please select a category";
    }

    // Amount validation
    const amount = Number.parseFloat(expenseData.amount || "0");
    if (isNaN(amount) || amount <= 0) {
      errors.amount = "Please enter a valid amount greater than 0";
    }

    // Date validation
    if (!expenseData.date_time) {
      errors.date_time = "Please select a date";
    } else {
      try {
        const expenseDate = new Date(expenseData.date_time);
        const today = new Date();
        if (expenseDate > today) {
          errors.date_time = "Expense date cannot be in the future";
        }
      } catch {
        errors.date_time = "Please enter a valid date";
      }
    }

    return {
      is_valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Invalidate all expense-related caches
   */
  private invalidateExpenseCaches(): void {
    cacheService.clearKey(CACHE_KEYS.USER_EXPENSES);
    cacheService.clearKey(CACHE_KEYS.USER_EXPENSES_ANALYTICS);
    cacheService.clearKey(CACHE_KEYS.EXPENSE_FILTERS);
    cacheService.clearPattern("expense-dashboard");
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.invalidateExpenseCaches();
    cacheService.clearKey(CACHE_KEYS.EXPENSE_TYPES);
  }
}

// Export singleton instance
export const expenseService = new ExpenseService();
