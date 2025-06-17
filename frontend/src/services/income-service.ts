/**
 * Income Service - Updated for new backend API and types
 * Only add/update/delete IncomeSourceType, ledger is backend-only
 */

import { call } from "frappe-ui";
import type {
  CreateIncomeResponse,
  GetUserIncomeResponse,
  IncomeAnalytics,
  IncomeFilters,
  IncomeRecord,
  IncomeServiceOptions,
  IncomeTypeRecord,
  ValidationResponse,
  AddIncomeSourcePayload,
  UpdateIncomeSourcePayload,
  DeleteIncomeSourcePayload,
} from "../types/income";
import { CACHE_KEYS, cacheService } from "./cache-service.js";

class IncomeService {
  /**
   * Get user income records (exact backend API response)
   */
  async getUserIncome(
    options: IncomeServiceOptions = {},
  ): Promise<IncomeRecord[]> {
    try {
      const {
        filters,
        include_analytics = false,
        forceRefresh = false,
        useCache = true,
      } = options;

      const cacheKey = useCache
        ? cacheService.generateFilterKey(CACHE_KEYS.USER_INCOME, filters || {})
        : null;

      if (cacheKey && !forceRefresh) {
        const cached = cacheService.getWithFilters(
          CACHE_KEYS.USER_INCOME,
          filters || {},
        );
        if (cached) {
          return cached;
        }
      }

      const response = await call("artha.api.income.get_user_income", {
        filters: filters ? JSON.stringify(filters) : null,
        include_analytics: include_analytics,
      });

      let incomeRecords: IncomeRecord[] = [];
      if (include_analytics && response?.income_records) {
        incomeRecords = response.income_records;
      } else if (Array.isArray(response)) {
        incomeRecords = response;
      } else {
        return [];
      }

      if (cacheKey && useCache) {
        cacheService.setWithFilters(
          CACHE_KEYS.USER_INCOME,
          filters || {},
          incomeRecords,
        );
      }
      return incomeRecords;
    } catch (error) {
      throw new Error(`Failed to fetch income data: ${error.message}`);
    }
  }

  /**
   * Get user income with analytics (exact backend API response)
   */
  async getUserIncomeWithAnalytics(
    options: IncomeServiceOptions = {},
  ): Promise<{
    incomes: IncomeRecord[];
    analytics: IncomeAnalytics;
  }> {
    try {
      const { filters, forceRefresh = false, useCache = true } = options;
      const incomeKey = useCache
        ? cacheService.generateFilterKey(CACHE_KEYS.USER_INCOME, filters || {})
        : null;
      const analyticsKey = useCache
        ? cacheService.generateFilterKey(
            CACHE_KEYS.USER_INCOME_ANALYTICS,
            filters || {},
          )
        : null;
      if (incomeKey && analyticsKey && !forceRefresh) {
        const cachedIncomes = cacheService.getWithFilters(
          CACHE_KEYS.USER_INCOME,
          filters || {},
        );
        const cachedAnalytics = cacheService.getWithFilters(
          CACHE_KEYS.USER_INCOME_ANALYTICS,
          filters || {},
        );
        if (cachedIncomes && cachedAnalytics) {
          return {
            incomes: cachedIncomes,
            analytics: cachedAnalytics,
          };
        }
      }
      const response: GetUserIncomeResponse = await call(
        "artha.api.income.get_user_income",
        {
          filters: filters ? JSON.stringify(filters) : null,
          include_analytics: true,
        },
      );
      const incomes = response.income_records || [];
      const analytics = response.analytics || {
        total_income: 0,
        recurring_income: 0,
        one_time_income: 0,
        income_by_type: {},
        monthly_trends: [],
        summary: {
          total_sources: 0,
          average_source_amount: 0,
          top_income_type: "",
        },
      };
      if (useCache) {
        if (incomeKey) {
          cacheService.setWithFilters(
            CACHE_KEYS.USER_INCOME,
            filters || {},
            incomes,
          );
        }
        if (analyticsKey) {
          cacheService.setWithFilters(
            CACHE_KEYS.USER_INCOME_ANALYTICS,
            filters || {},
            analytics,
          );
        }
      }
      return { incomes, analytics };
    } catch (error) {
      throw new Error(`Failed to fetch income analytics: ${error.message}`);
    }
  }

  /**
   * Get income types (exact backend API response)
   */
  async getIncomeTypes(
    options: IncomeServiceOptions = {},
  ): Promise<IncomeTypeRecord[]> {
    try {
      const { forceRefresh = false, useCache = true } = options;
      if (useCache && !forceRefresh) {
        const cached = cacheService.get(CACHE_KEYS.INCOME_TYPES);
        if (cached) {
          return cached;
        }
      }
      const response = await call("artha.api.income.get_income_types");
      const incomeTypes: IncomeTypeRecord[] = response || [];
      if (useCache) {
        cacheService.set(
          CACHE_KEYS.INCOME_TYPES,
          incomeTypes,
          24 * 60 * 60 * 1000,
        );
      }
      return incomeTypes;
    } catch (error) {
      throw new Error(`Failed to fetch income types: ${error.message}`);
    }
  }

  /**
   * Create, update, or delete an income source (single Income record per household)
   * Only add/update/delete IncomeSourceType, ledger is backend-only
   */
  async createOrUpdateIncome(
    payload:
      | AddIncomeSourcePayload
      | UpdateIncomeSourcePayload
      | DeleteIncomeSourcePayload,
  ): Promise<CreateIncomeResponse> {
    try {
      const response: CreateIncomeResponse = await call(
        "artha.api.income.create_or_update_income",
        {
          income_source: JSON.stringify(payload.income_source),
          income_name: (payload as any).income_name || null,
          action: (payload as any).action || null,
          source_name: (payload as any).source_name || null,
        },
      );
      this.clearCache();
      return response;
    } catch (error) {
      throw new Error(`Failed to save income: ${error.message}`);
    }
  }

  async deleteIncome(incomeId: string): Promise<void> {
    try {
      await call("frappe.client.delete", {
        doctype: "Income",
        name: incomeId,
      });
      this.clearCache();
    } catch (error) {
      throw new Error(`Failed to delete Income record: ${error.message}`);
    }
  }

  async getIncomeAnalytics(
    period:
      | "this_month"
      | "last_month"
      | "last_3_months"
      | "last_6_months"
      | "this_year" = "last_3_months",
    filters?: IncomeFilters,
  ): Promise<IncomeAnalytics> {
    try {
      const analyticsFilters = { ...filters, period };
      const result = await this.getUserIncomeWithAnalytics({
        filters: analyticsFilters,
      });
      return result.analytics;
    } catch (error) {
      throw new Error(`Failed to fetch income analytics: ${error.message}`);
    }
  }

  async validateIncomeData(incomeData: {
    monthly_income: number;
    income_source: any[];
  }): Promise<ValidationResponse> {
    try {
      const response: ValidationResponse = await call(
        "artha.api.income.validate_income_data",
        {
          monthly_income: incomeData.monthly_income,
          income_source: JSON.stringify(incomeData.income_source),
        },
      );
      return (
        response || {
          is_valid: false,
          errors: { general: "Validation failed" },
        }
      );
    } catch (error) {
      return {
        is_valid: false,
        errors: { general: `Validation error: ${error.message}` },
      };
    }
  }

  clearCache(): void {
    cacheService.delete(CACHE_KEYS.USER_INCOME);
    cacheService.delete(CACHE_KEYS.USER_INCOME_ANALYTICS);
    cacheService.delete(CACHE_KEYS.INCOME_TYPES);
    cacheService.clearKey(CACHE_KEYS.USER_INCOME);
    cacheService.clearKey(CACHE_KEYS.USER_INCOME_ANALYTICS);
  }
}

export const incomeService = new IncomeService();
