/**
 * Expense Service - Following Income Service Pattern
 * Handles all expense-related API operations with consistent caching and error handling
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
  ExpenseValidationErrors,
} from "../types/expense";
import { safeArray } from "../types/expense";
import { CACHE_KEYS, cacheService } from "./cache-service.js";

// Default cache expiry: 5 minutes
const DEFAULT_CACHE_EXPIRY = 5 * 60 * 1000;

/**
 * Expense Service Class
 * Clean API operations following income service architecture
 */
class ExpenseService {
  /**
   * Get user expenses with optional filtering and analytics
   * Follows the exact pattern of income service getUserIncome
   */
  async getUserExpenses(
    options: ExpenseServiceOptions = {},
  ): Promise<GetUserExpensesResponse> {
    const {
      filters,
      include_analytics = false,
      forceRefresh = false,
      useCache = true,
    } = options;

    const cacheKey = `${CACHE_KEYS.USER_EXPENSES}_${JSON.stringify(filters || {})}_${include_analytics}`;

    if (useCache && !forceRefresh) {
      const cached = cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const result = await call("artha.api.expense.get_user_expenses", {
        filters: filters || {},
        include_analytics,
      });

      // Process and normalize the response
      const expenses = this.normalizeExpenses(result.expenses || []);
      const response: GetUserExpensesResponse = {
        expenses,
        analytics: result.analytics || undefined,
      };

      // Cache the result
      if (useCache) {
        cacheService.set(cacheKey, response, { maxAge: DEFAULT_CACHE_EXPIRY });
      }

      return response;
    } catch (error: any) {
      console.error("Failed to fetch user expenses:", error);
      throw new Error(
        `Failed to load expenses: ${error.message || "Unknown error"}`,
      );
    }
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
      const result = await call("artha.api.expense.get_expense_types");

      const response: GetExpenseTypesResponse = {
        medical_types: safeArray(result.medical_types || []),
        other_types: safeArray(result.other_types || []),
      };

      // Cache for longer duration since types don't change often
      if (useCache) {
        cacheService.set(cacheKey, response, { maxAge: 30 * 60 * 1000 }); // 30 minutes
      }

      return response;
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
      const result = await call(
        "artha.api.expense.get_expense_dashboard_metrics",
        {
          period,
        },
      );

      const response: GetExpenseDashboardMetricsResponse = {
        total_expenses: result.total_expenses || 0,
        medical_expenses: result.medical_expenses || 0,
        other_expenses: result.other_expenses || 0,
        direct_medical: result.direct_medical || 0,
        indirect_medical: result.indirect_medical || 0,
        expense_count: result.expense_count || 0,
        average_expense: result.average_expense || 0,
        top_category: result.top_category || "",
        expense_by_category: result.expense_by_category || {},
        monthly_trends: safeArray(result.monthly_trends || []),
        period,
        start_date: result.start_date,
        end_date: result.end_date,
      };

      // Cache for shorter duration for dashboard data
      if (useCache) {
        cacheService.set(cacheKey, response, { maxAge: 2 * 60 * 1000 }); // 2 minutes
      }

      return response;
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
          `Validation failed: ${JSON.stringify(validation.errors)}`,
        );
      }

      const result = await call("artha.api.expense.create_expense", {
        expense_data: expenseData,
      });

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
          `Validation failed: ${JSON.stringify(validation.errors)}`,
        );
      }

      const result = await call("artha.api.expense.update_expense", {
        expense_name: expenseName,
        expense_data: expenseData,
      });

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
   */
  async deleteExpense(
    expenseName: string,
    expenseId: string,
  ): Promise<boolean> {
    try {
      await call("artha.api.expense.delete_expense", {
        expense_name: expenseName,
        expense_id: expenseId,
      });

      // Invalidate relevant caches
      this.invalidateExpenseCaches();

      return true;
    } catch (error: any) {
      console.error("Failed to delete expense:", error);
      throw new Error(
        `Failed to delete expense: ${error.message || "Unknown error"}`,
      );
    }
  }

  /**
   * Validate expense data
   */
  validateExpenseData(expenseData: ExpenseFormData): ExpenseValidationResult {
    const errors: ExpenseValidationErrors = {};

    // Type validation
    if (
      !expenseData.type ||
      (expenseData.type !== "medical" && expenseData.type !== "other")
    ) {
      errors.type = "Please select a valid expense type";
    }

    // Category validation
    if (!expenseData.category || expenseData.category.trim() === "") {
      errors.category = "Please select a category";
    }

    // Amount validation
    const amount = parseFloat(expenseData.amount);
    if (!expenseData.amount || isNaN(amount) || amount <= 0) {
      errors.amount = "Please enter a valid amount greater than 0";
    }

    // Date validation
    if (!expenseData.date_time) {
      errors.date_time = "Please select a date";
    } else {
      const expenseDate = new Date(expenseData.date_time);
      const today = new Date();
      if (expenseDate > today) {
        errors.date_time = "Expense date cannot be in the future";
      }
    }

    return {
      is_valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Normalize expenses from API response to consistent format
   */
  private normalizeExpenses(rawExpenses: any[]): FlattenedExpenseEntry[] {
    if (!Array.isArray(rawExpenses)) {
      return [];
    }

    return rawExpenses.map((expense) => ({
      name: expense.name || "",
      parent: expense.parent || "",
      type: expense.type || "other",
      category: expense.category || "",
      amount: parseFloat(expense.amount) || 0,
      date_time: expense.date_time || "",
      description: expense.description || "",
      is_direct: expense.is_direct || false,
      proof_of_payment: expense.proof_of_payment || null,
      household_profile: expense.household_profile || "",
      creation: expense.creation || "",
      modified: expense.modified || "",
    }));
  }

  /**
   * Invalidate expense-related caches
   */
  private invalidateExpenseCaches(): void {
    // Remove all expense-related cache entries
    const cacheKeys = [
      CACHE_KEYS.USER_EXPENSES,
      CACHE_KEYS.EXPENSE_DASHBOARD,
      CACHE_KEYS.USER_EXPENSES_ANALYTICS,
    ];

    cacheKeys.forEach((key) => {
      cacheService.clearKey(key);
    });
  }

  /**
   * Clear all expense caches
   */
  clearCache(): void {
    this.invalidateExpenseCaches();
  }
}

// Export singleton instance
export const expenseService = new ExpenseService();
