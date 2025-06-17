/**
 * Income Service - Updated for new backend API and types
 * Only add/update/delete IncomeSourceType, ledger is backend-only
 */

import { call } from "frappe-ui";
import type {
  AddIncomeSourcePayload,
  CreateIncomeResponse,
  DeleteIncomeSourcePayload,
  FlattenedLedgerEntry,
  GetIncomeInsightsResponse,
  GetIncomeTypesResponse,
  GetMonthlyIncomeSummaryResponse,
  GetUserIncomeResponse,
  IncomeAnalytics,
  IncomeFilters,
  IncomeRecord,
  IncomeServiceOptions,
  IncomeTypeRecord,
  IncomeDashboardMetrics,
  LedgerFilters,
  UpdateAllRecurringLedgersResponse,
  UpdateIncomeSourcePayload,
  UpdateRecurringLedgerEntriesResponse,
  ValidateIncomeDataPayload,
  ValidationResponse,
} from "../types/income";
import { safeArray } from "../types/income";
import { CACHE_KEYS, cacheService } from "./cache-service.js";

// Normalize income record to ensure all fields are present and properly typed
function normalizeIncomeRecord(record: any): IncomeRecord {
  if (!record) {
    throw new Error("Invalid income record: record is null or undefined");
  }

  return {
    name: record.name || "",
    household_profile: record.household_profile || "",
    monthly_income: Number(record.monthly_income ?? 0),
    creation: record.creation || "",
    modified: record.modified || "",
    owner: record.owner || "",
    income_source: safeArray(record.income_source).map((src: any) => ({
      name: src.name || "",
      type: src.type || "",
      income: Number(src.income || 0),
      recur: Boolean(src.recur),
      recur_frequency: src.recur_frequency || undefined,
      date_time: src.date_time || "",
      stop_date: src.stop_date || undefined,
      ledger_entries: safeArray(src.ledger_entries).map((entry: any) => ({
        date_time: entry.date_time || "",
        amount: Number(entry.amount || 0),
        income_type: entry.income_type || "one-time",
      })),
    })),
  };
}

// Helper: Convert object with numeric keys to array
function objectToArray(obj: any): any[] {
  if (Array.isArray(obj)) return obj;
  if (obj && typeof obj === "object") {
    const keys = Object.keys(obj);
    if (keys.every((k) => !isNaN(Number(k)))) {
      return keys.map((k) => obj[k]);
    }
  }
  return [];
}

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
          return objectToArray(cached).map(normalizeIncomeRecord);
        }
      }

      const response = await call("artha.api.income.get_user_income", {
        filters: filters ? JSON.stringify(filters) : null,
        include_analytics: include_analytics,
      });

      let incomeRecords: IncomeRecord[] = [];
      if (include_analytics && response?.income_records) {
        incomeRecords = safeArray(response.income_records).map(
          normalizeIncomeRecord,
        );
      } else if (Array.isArray(response)) {
        incomeRecords = safeArray(response).map(normalizeIncomeRecord);
      } else if (response && !Array.isArray(response)) {
        // Handle case where a single record is returned
        incomeRecords = [normalizeIncomeRecord(response)];
      } else {
        return [];
      }

      if (cacheKey && useCache) {
        cacheService.setWithFilters(
          CACHE_KEYS.USER_INCOME,
          incomeRecords,
          filters || {},
        );
      }
      return incomeRecords;
    } catch (error) {
      const errorMessage = error?.message || "Unknown error occurred";
      console.error("Failed to fetch income data:", error);
      throw new Error(`Failed to fetch income data: ${errorMessage}`);
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
            incomes: objectToArray(cachedIncomes).map(normalizeIncomeRecord),
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

      const incomes = safeArray(response.income_records).map(
        normalizeIncomeRecord,
      );
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
            incomes,
            filters || {},
          );
        }
        if (analyticsKey) {
          cacheService.setWithFilters(
            CACHE_KEYS.USER_INCOME_ANALYTICS,
            analytics,
            filters || {},
          );
        }
      }
      return { incomes, analytics };
    } catch (error) {
      throw new Error(`Failed to fetch income analytics: ${error.message}`);
    }
  }

  /**
   * Get flattened income ledger entries (new endpoint)
   */
  async getIncomeLedger(
    filters?: LedgerFilters,
    options: IncomeServiceOptions = {},
  ): Promise<FlattenedLedgerEntry[]> {
    try {
      const { forceRefresh = false, useCache = true } = options;

      const cacheKey = useCache
        ? cacheService.generateFilterKey(
            CACHE_KEYS.INCOME_LEDGER,
            filters || {},
          )
        : null;

      if (cacheKey && !forceRefresh) {
        const cached = cacheService.getWithFilters(
          CACHE_KEYS.INCOME_LEDGER,
          filters || {},
        );
        if (cached) {
          return safeArray(cached);
        }
      }

      const response = await call("artha.api.income.get_income_ledger", {
        filters: filters ? JSON.stringify(filters) : null,
      });

      const ledgerEntries: FlattenedLedgerEntry[] = safeArray(response).map(
        (entry: any) => ({
          name: entry.name || "",
          income_source: entry.income_source || "",
          income_type: entry.income_type || "one-time",
          date_time: entry.date_time || "",
          amount: Number(entry.amount || 0),
          source_type: entry.source_type || "",
          source_recur: Boolean(entry.source_recur),
          source_income: Number(entry.source_income || 0),
          source_date_time: entry.source_date_time || "",
          source_recur_frequency: entry.source_recur_frequency,
          source_stop_date: entry.source_stop_date,
        }),
      );

      if (cacheKey && useCache) {
        cacheService.setWithFilters(
          CACHE_KEYS.INCOME_LEDGER,
          ledgerEntries,
          filters || {},
        );
      }

      return ledgerEntries;
    } catch (error) {
      throw new Error(`Failed to fetch income ledger: ${error.message}`);
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

      const response: GetIncomeTypesResponse = await call(
        "artha.api.income.get_income_types",
      );

      // Backend now returns {income_types: [...]} format consistently
      const incomeTypes = safeArray(response.income_types);

      if (useCache) {
        cacheService.set(CACHE_KEYS.INCOME_TYPES, incomeTypes, {
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
        });
      }
      return incomeTypes;
    } catch (error) {
      throw new Error(`Failed to fetch income types: ${error.message}`);
    }
  }

  /**
   * Get monthly income summary
   */
  async getMonthlyIncomeSummary(
    options: IncomeServiceOptions = {},
  ): Promise<GetMonthlyIncomeSummaryResponse> {
    try {
      const response: GetMonthlyIncomeSummaryResponse = await call(
        "artha.api.income.get_monthly_income_summary",
      );
      return (
        response || {
          monthly_income: 0,
          recurring_income: 0,
          one_time_income: 0,
          total_sources: 0,
        }
      );
    } catch (error) {
      throw new Error(
        `Failed to fetch monthly income summary: ${error.message}`,
      );
    }
  }

  /**
   * Get income insights and recommendations
   */
  async getIncomeInsights(
    options: IncomeServiceOptions = {},
  ): Promise<GetIncomeInsightsResponse> {
    try {
      const response: GetIncomeInsightsResponse = await call(
        "artha.api.income.get_income_insights",
      );
      return (
        response || {
          insights: [],
          recommendations: [],
          scores: {
            stability: 0,
            diversification: 0,
            growth: 0,
          },
        }
      );
    } catch (error) {
      throw new Error(`Failed to fetch income insights: ${error.message}`);
    }
  }

  /**
   * Get dashboard metrics with computed values
   */
  async getDashboardMetrics(
    period: string = "this_month",
    options: IncomeServiceOptions = {},
  ): Promise<IncomeDashboardMetrics> {
    try {
      const { forceRefresh = false, useCache = true } = options;

      const cacheKey = useCache
        ? cacheService.generateFilterKey(
            `${CACHE_KEYS.USER_INCOME_ANALYTICS}_dashboard`,
            { period },
          )
        : null;

      if (cacheKey && !forceRefresh) {
        const cached = cacheService.getWithFilters(
          `${CACHE_KEYS.USER_INCOME_ANALYTICS}_dashboard`,
          { period },
        );
        if (cached) {
          return cached;
        }
      }

      const response: IncomeDashboardMetrics = await call(
        "artha.api.income.get_income_dashboard_metrics",
        { period },
      );

      const metrics = response || {
        actual_monthly_income: 0,
        recurring_income: 0,
        one_time_income: 0,
        total_sources: 0,
        recurring_percentage: 0,
        growth_rate: 0,
        top_income_type: "",
        income_by_type: {},
        monthly_trends: [],
        average_source_amount: 0,
        period: period,
      };

      if (cacheKey && useCache) {
        cacheService.setWithFilters(
          `${CACHE_KEYS.USER_INCOME_ANALYTICS}_dashboard`,
          metrics,
          { period },
        );
      }

      return metrics;
    } catch (error) {
      throw new Error(`Failed to fetch dashboard metrics: ${error.message}`);
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

  /**
   * Validate income data before saving
   */
  async validateIncomeData(
    payload: ValidateIncomeDataPayload,
  ): Promise<ValidationResponse> {
    try {
      const response: ValidationResponse = await call(
        "artha.api.income.validate_income_data",
        {
          monthly_income: payload.monthly_income,
          income_source: JSON.stringify(payload.income_source),
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

  /**
   * Update recurring ledger entries
   */
  async updateRecurringLedgerEntries(): Promise<UpdateRecurringLedgerEntriesResponse> {
    try {
      const response: UpdateRecurringLedgerEntriesResponse = await call(
        "artha.api.income.update_recurring_ledger_entries",
      );
      this.clearCache();
      return (
        response || {
          status: "success",
          message: "Updated recurring ledger entries",
          updated_count: 0,
        }
      );
    } catch (error) {
      throw new Error(
        `Failed to update recurring ledger entries: ${error.message}`,
      );
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

  clearCache(): void {
    cacheService.delete(CACHE_KEYS.USER_INCOME);
    cacheService.delete(CACHE_KEYS.USER_INCOME_ANALYTICS);
    cacheService.delete(CACHE_KEYS.INCOME_TYPES);
    cacheService.delete(CACHE_KEYS.INCOME_LEDGER);
    cacheService.clearKey(CACHE_KEYS.USER_INCOME);
    cacheService.clearKey(CACHE_KEYS.USER_INCOME_ANALYTICS);
    cacheService.clearKey(CACHE_KEYS.INCOME_LEDGER);
  }
}

export const incomeService = new IncomeService();
