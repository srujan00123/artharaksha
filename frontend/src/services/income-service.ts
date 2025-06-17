/**
 * Income Service - Robust & Redundancy-Free
 * Gold standard service layer following exact backend API structure
 * Provides clean, cached, type-safe operations for income management
 */

import { call } from "frappe-ui";
import type {
  AddIncomeSourcePayload,
  CreateDirectLedgerEntryPayload,
  CreateIncomeResponse,
  CreateLedgerEntryPayload,
  CreateLedgerEntryResponse,
  DeleteIncomeSourcePayload,
  DeleteLedgerEntryPayload,
  DeleteLedgerEntryResponse,
  FlattenedLedgerEntry,
  GetIncomeInsightsResponse,
  GetIncomeTypesResponse,
  GetMonthlyIncomeSummaryResponse,
  GetUserIncomeResponse,
  IncomeAnalytics,
  IncomeFilters,
  IncomeRecord,
  IncomeServiceOptions,
  IncomeSourceRecord,
  IncomeTypeRecord,
  IncomeDashboardMetrics,
  LedgerFilters,
  UpdateIncomeSourcePayload,
  UpdateLedgerEntryPayload,
  UpdateLedgerEntryResponse,
  UpdateRecurringLedgerEntriesResponse,
  ValidateIncomeDataPayload,
  ValidationResponse,
} from "../types/income";
import { safeArray } from "../types/income";
import { CACHE_KEYS, cacheService } from "./cache-service.js";
import { apiService, API_ENDPOINTS } from "./api-service.js";

/**
 * Income Service Class
 * Centralized, robust service layer with consistent error handling and caching
 */
class IncomeService {
  private readonly cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private readonly longCacheExpiry = 30 * 60 * 1000; // 30 minutes for static data

  /**
   * Normalize income record to ensure consistent structure
   */
  private normalizeIncomeRecord(record: any): IncomeRecord {
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
        recur: true as const, // Always true for income sources
        recur_frequency: src.recur_frequency || "monthly",
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

  /**
   * Normalize flattened ledger entry
   */
  private normalizeLedgerEntry(entry: any): FlattenedLedgerEntry {
    return {
      name: entry.name || "",
      income_source: entry.income_source || undefined,
      income_type: entry.income_type || "one-time",
      date_time: entry.date_time || "",
      amount: Number(entry.amount || 0),
      source_type: entry.source_type || "",
      description: entry.description || undefined,
      source_recur: entry.source_recur || undefined,
      source_income: entry.source_income
        ? Number(entry.source_income)
        : undefined,
      source_date_time: entry.source_date_time || undefined,
      source_recur_frequency: entry.source_recur_frequency || undefined,
      source_stop_date: entry.source_stop_date || undefined,
    };
  }

  /**
   * Get user income with analytics (primary method)
   * Returns complete income data with optional analytics
   */
  async getUserIncomeWithAnalytics(
    options: IncomeServiceOptions = {},
  ): Promise<{
    incomes: IncomeRecord[];
    analytics: IncomeAnalytics;
    recurringSources: IncomeSourceRecord[];
    ledgerEntries: FlattenedLedgerEntry[];
  }> {
    const { filters, forceRefresh = false, useCache = true } = options;

    // Generate cache keys
    const cacheKey = useCache
      ? cacheService.generateFilterKey(
          CACHE_KEYS.USER_INCOME_ANALYTICS,
          filters || {},
        )
      : null;

    // Check cache first
    if (cacheKey && !forceRefresh) {
      const cached = cacheService.getWithFilters(
        CACHE_KEYS.USER_INCOME_ANALYTICS,
        filters || {},
      );
      if (cached) {
        return cached;
      }
    }

    try {
      const response: GetUserIncomeResponse = await apiService.execute(
        call(API_ENDPOINTS.INCOME.USER_INCOME, {
          filters: filters ? JSON.stringify(filters) : null,
          include_analytics: true,
        }),
      );

      // Process response data
      const recurringSources = safeArray(response.recurring_sources).map(
        (source) => ({
          ...source,
          recur: true as const,
          ledger_entries: safeArray(source.ledger_entries || []),
        }),
      );

      const ledgerEntries = safeArray(response.ledger_entries).map(
        this.normalizeLedgerEntry,
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
        recurring_percentage: 0,
        growth_rate: 0,
        actual_monthly_income: 0,
        monthly_recurring_income: 0,
        period_recurring_income: 0,
        period_one_time_income: 0,
        period_total_income: 0,
      };

      // Create synthetic income records from sources for compatibility
      const incomes: IncomeRecord[] =
        recurringSources.length > 0
          ? [
              {
                name: "synthetic-income-record",
                household_profile: "current",
                monthly_income: analytics.monthly_recurring_income || 0,
                creation: new Date().toISOString(),
                modified: new Date().toISOString(),
                owner: "current-user",
                income_source: recurringSources,
              },
            ]
          : [];

      const result = {
        incomes,
        analytics,
        recurringSources,
        ledgerEntries,
      };

      // Cache the result
      if (cacheKey && useCache) {
        cacheService.setWithFilters(
          CACHE_KEYS.USER_INCOME_ANALYTICS,
          result,
          filters || {},
          { maxAge: this.cacheExpiry },
        );
      }

      return result;
    } catch (error: any) {
      console.error("Failed to fetch income with analytics:", error);
      throw new Error(
        `Failed to load income data: ${error.message || "Unknown error"}`,
      );
    }
  }

  /**
   * Get user income (basic method without analytics)
   */
  async getUserIncome(
    options: IncomeServiceOptions = {},
  ): Promise<IncomeRecord[]> {
    const result = await this.getUserIncomeWithAnalytics({
      ...options,
      include_analytics: false,
    });
    return result.incomes;
  }

  /**
   * Get income ledger entries
   */
  async getIncomeLedger(
    filters?: LedgerFilters,
    options: IncomeServiceOptions = {},
  ): Promise<FlattenedLedgerEntry[]> {
    const result = await this.getUserIncomeWithAnalytics({
      ...options,
      filters: filters as IncomeFilters,
    });
    return result.ledgerEntries;
  }

  /**
   * Get income types
   */
  async getIncomeTypes(
    options: IncomeServiceOptions = {},
  ): Promise<IncomeTypeRecord[]> {
    const { useCache = true, forceRefresh = false } = options;
    const cacheKey = CACHE_KEYS.INCOME_TYPES;

    if (useCache && !forceRefresh) {
      const cached = cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const response: GetIncomeTypesResponse = await apiService.execute(
        call(API_ENDPOINTS.INCOME.TYPES),
      );

      const incomeTypes = safeArray(response.income_types || []);

      if (useCache) {
        cacheService.set(cacheKey, incomeTypes, {
          maxAge: this.longCacheExpiry,
        });
      }

      return incomeTypes;
    } catch (error: any) {
      console.error("Failed to fetch income types:", error);
      throw new Error(
        `Failed to load income types: ${error.message || "Unknown error"}`,
      );
    }
  }

  /**
   * Get monthly income summary
   */
  async getMonthlyIncomeSummary(
    options: IncomeServiceOptions = {},
  ): Promise<GetMonthlyIncomeSummaryResponse> {
    try {
      return await apiService.execute(
        call("artha.api.income.get_monthly_income_summary"),
      );
    } catch (error: any) {
      console.error("Failed to fetch monthly income summary:", error);
      throw new Error(
        `Failed to load monthly income summary: ${error.message || "Unknown error"}`,
      );
    }
  }

  /**
   * Get income insights
   */
  async getIncomeInsights(
    options: IncomeServiceOptions = {},
  ): Promise<GetIncomeInsightsResponse> {
    try {
      return await apiService.execute(
        call("artha.api.income.get_income_insights"),
      );
    } catch (error: any) {
      console.error("Failed to fetch income insights:", error);
      throw new Error(
        `Failed to load income insights: ${error.message || "Unknown error"}`,
      );
    }
  }

  /**
   * Get dashboard metrics
   */
  async getDashboardMetrics(
    period: string = "this_month",
    options: IncomeServiceOptions = {},
  ): Promise<IncomeDashboardMetrics> {
    const { useCache = true, forceRefresh = false } = options;
    const cacheKey = `${CACHE_KEYS.INCOME_FILTERS}_dashboard_${period}`;

    if (useCache && !forceRefresh) {
      const cached = cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const result = await apiService.execute(
        call("artha.api.income.get_income_dashboard_metrics", { period }),
      );

      if (useCache) {
        cacheService.set(cacheKey, result, { maxAge: 2 * 60 * 1000 }); // 2 minutes for dashboard
      }

      return result;
    } catch (error: any) {
      console.error("Failed to fetch dashboard metrics:", error);
      throw new Error(
        `Failed to load dashboard metrics: ${error.message || "Unknown error"}`,
      );
    }
  }

  /**
   * Create or update income source
   */
  async createOrUpdateIncome(
    payload:
      | AddIncomeSourcePayload
      | UpdateIncomeSourcePayload
      | DeleteIncomeSourcePayload,
  ): Promise<CreateIncomeResponse> {
    try {
      const result = await apiService.execute(
        call(API_ENDPOINTS.INCOME.CREATE_OR_UPDATE, payload),
      );

      // Invalidate caches
      this.invalidateIncomeCaches();

      return result;
    } catch (error: any) {
      console.error("Failed to create/update income:", error);
      throw new Error(
        `Failed to save income: ${error.message || "Unknown error"}`,
      );
    }
  }

  /**
   * Create direct ledger entry (one-time income)
   */
  async createDirectLedgerEntry(
    payload: CreateDirectLedgerEntryPayload,
  ): Promise<CreateLedgerEntryResponse> {
    try {
      const result = await apiService.execute(
        call("artha.api.income.create_direct_ledger_entry", payload),
      );

      // Invalidate caches
      this.invalidateIncomeCaches();

      return result;
    } catch (error: any) {
      console.error("Failed to create direct ledger entry:", error);
      throw new Error(
        `Failed to create ledger entry: ${error.message || "Unknown error"}`,
      );
    }
  }

  /**
   * Update ledger entry
   */
  async updateLedgerEntry(
    payload: UpdateLedgerEntryPayload,
  ): Promise<UpdateLedgerEntryResponse> {
    try {
      const result = await apiService.execute(
        call("artha.api.income.update_ledger_entry", payload),
      );

      // Invalidate caches
      this.invalidateIncomeCaches();

      return result;
    } catch (error: any) {
      console.error("Failed to update ledger entry:", error);
      throw new Error(
        `Failed to update ledger entry: ${error.message || "Unknown error"}`,
      );
    }
  }

  /**
   * Delete ledger entry
   */
  async deleteLedgerEntry(
    payload: DeleteLedgerEntryPayload,
  ): Promise<DeleteLedgerEntryResponse> {
    try {
      const result = await apiService.execute(
        call("artha.api.income.delete_ledger_entry", payload),
      );

      // Invalidate caches
      this.invalidateIncomeCaches();

      return result;
    } catch (error: any) {
      console.error("Failed to delete ledger entry:", error);
      throw new Error(
        `Failed to delete ledger entry: ${error.message || "Unknown error"}`,
      );
    }
  }

  /**
   * Create ledger entry for existing source
   */
  async createLedgerEntry(
    payload: CreateLedgerEntryPayload,
  ): Promise<CreateLedgerEntryResponse> {
    try {
      const result = await apiService.execute(
        call("artha.api.income.create_ledger_entry", payload),
      );

      // Invalidate caches
      this.invalidateIncomeCaches();

      return result;
    } catch (error: any) {
      console.error("Failed to create ledger entry:", error);
      throw new Error(
        `Failed to create ledger entry: ${error.message || "Unknown error"}`,
      );
    }
  }

  /**
   * Update recurring ledger entries
   */
  async updateRecurringLedgerEntries(): Promise<UpdateRecurringLedgerEntriesResponse> {
    try {
      const result = await apiService.execute(
        call("artha.api.income.update_recurring_ledger_entries"),
      );

      // Invalidate caches
      this.invalidateIncomeCaches();

      return result;
    } catch (error: any) {
      console.error("Failed to update recurring ledger entries:", error);
      throw new Error(
        `Failed to update recurring entries: ${error.message || "Unknown error"}`,
      );
    }
  }

  /**
   * Validate income data
   */
  async validateIncomeData(
    payload: ValidateIncomeDataPayload,
  ): Promise<ValidationResponse> {
    try {
      return await apiService.execute(
        call(API_ENDPOINTS.INCOME.VALIDATE, payload),
      );
    } catch (error: any) {
      console.error("Failed to validate income data:", error);
      throw new Error(
        `Failed to validate income data: ${error.message || "Unknown error"}`,
      );
    }
  }

  /**
   * Delete income record
   */
  async deleteIncome(incomeId: string): Promise<void> {
    try {
      await apiService.execute(
        call("frappe.client.delete", {
          doctype: "Income",
          name: incomeId,
        }),
      );

      // Invalidate caches
      this.invalidateIncomeCaches();
    } catch (error: any) {
      console.error("Failed to delete income:", error);
      throw new Error(
        `Failed to delete income: ${error.message || "Unknown error"}`,
      );
    }
  }

  /**
   * Invalidate all income-related caches
   */
  private invalidateIncomeCaches(): void {
    cacheService.clearKey(CACHE_KEYS.USER_INCOME);
    cacheService.clearKey(CACHE_KEYS.USER_INCOME_ANALYTICS);
    cacheService.clearKey(CACHE_KEYS.INCOME_LEDGER);
    cacheService.clearKey(CACHE_KEYS.INCOME_FILTERS);
    cacheService.clearPattern("income-dashboard");
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.invalidateIncomeCaches();
    cacheService.clearKey(CACHE_KEYS.INCOME_TYPES);
  }
}

// Export singleton instance
export const incomeService = new IncomeService();
