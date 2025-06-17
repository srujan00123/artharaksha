/**
 * Income Type Definitions - Exact Backend API Alignment
 * These types are generated to match the backend API documented in api_endpoints.md
 */

import type { Income as ArthaIncome } from "./Artha/Income";
import type { IncomeSourceType as ArthaIncomeSourceType } from "./Artha/IncomeSourceType";
import type { IncomeType as ArthaIncomeType } from "./Artha/IncomeType";

// Re-export Artha types for direct use
export type { ArthaIncome, ArthaIncomeSourceType, ArthaIncomeType };

// Backend API Response Types (exact structure from income.py)

/**
 * Income record as returned by get_user_income API
 *
 * NOTE: Only one IncomeRecord exists per household_profile.
 * All income sources are managed as children in the income_source array.
 */
export interface IncomeRecord {
  name: string;
  household_profile: string; // Links to Household Profile (which has user field)
  monthly_income: number;
  creation: string;
  modified: string;
  owner: string; // System field, not used for user linking
  income_source: IncomeSourceRecord[];
}

/**
 * Income source as returned by backend API
 *
 * NOTE: All CRUD operations on sources are performed via the parent Income record.
 */
export interface IncomeSourceRecord {
  name?: string;
  type: string;
  income: number;
  recur: boolean;
  date_time: string;
  recur_frequency?: "daily" | "weekly" | "monthly" | "yearly";
  stop_date?: string;
  ledger_entries: LedgerEntry[];
}

// Income type as returned by get_income_types API
export interface IncomeTypeRecord {
  name: string;
  type: string;
}

// Analytics data structure from backend API
export interface IncomeAnalytics {
  total_income: number;
  recurring_income: number;
  one_time_income: number;
  income_by_type: Record<string, number>;
  monthly_trends: MonthlyTrend[];
  summary: AnalyticsSummary;
  period?: string;
  start_date?: string;
  end_date?: string;
}

export interface MonthlyTrend {
  month: string;
  total: number;
  recurring: number;
  one_time: number;
}

export interface AnalyticsSummary {
  total_sources: number;
  average_source_amount: number;
  top_income_type: string;
}

// API Response interfaces (exact backend structure)
export interface GetUserIncomeResponse {
  income_records: IncomeRecord[];
  analytics?: IncomeAnalytics;
}

export interface CreateIncomeResponse {
  name: string;
  household_profile: string;
  monthly_income: number;
}

export interface ValidationResponse {
  is_valid: boolean;
  errors: Record<string, string>;
}

// Filter interface (matches backend filter handling)
export interface IncomeFilters {
  dateRange?:
    | "today"
    | "this-week"
    | "this-month"
    | "last-month"
    | "last-3-months"
    | "this-year";
  dateFrom?: string;
  dateTo?: string;
  period?:
    | "this_month"
    | "last_month"
    | "last_3_months"
    | "last_6_months"
    | "this_year";
  type?: string;
  incomeType?: string;
  frequency?:
    | "one-time"
    | "recurring"
    | "daily"
    | "weekly"
    | "monthly"
    | "yearly";
  isRecurring?: boolean;
  amountMin?: number;
  amountMax?: number;
  searchTerm?: string;
  sortBy?: "date" | "amount";
  sortOrder?: "asc" | "desc";
}

// Form data for creating/updating income (matches backend API parameters)
export interface IncomeFormData {
  monthly_income: number;
  income_source: IncomeSourceFormData[];
  income_name?: string; // For updates
}

export interface IncomeSourceFormData {
  type: string;
  income: number;
  recur: boolean;
  date_time: string;
  recur_frequency?: "daily" | "weekly" | "monthly" | "yearly";
  stop_date?: string; // End date for recurring income (optional)
}

// Frontend form interfaces (for UI components)
export interface IncomeFormUIData {
  type: string;
  amount: number;
  isRecurring: boolean;
  dateTime: string;
  frequency?: "daily" | "weekly" | "monthly" | "yearly";
  stop_date?: string; // End date for recurring income (optional)
}

export interface IncomeValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// Processed income item for display (flattened structure)
export interface ProcessedIncomeItem {
  sourceId: string;
  incomeId: string;
  type: string;
  amount: number;
  isRecurring: boolean;
  dateTime: string;
  frequency?: string;
  createdAt: string;
  updatedAt: string;
  sources?: ProcessedIncomeSource[];
  stop_date?: string; // End date for recurring income (optional)
}

export interface ProcessedIncomeSource {
  type: string;
  amount: number;
  isRecurring: boolean;
  dateTime: string;
  frequency?: string;
}

// Service options
export interface IncomeServiceOptions {
  filters?: IncomeFilters;
  include_analytics?: boolean;
  forceRefresh?: boolean;
  useCache?: boolean;
}

// Store state interface
export interface IncomeStoreState {
  incomes: IncomeRecord[];
  incomeTypes: IncomeTypeRecord[];
  loading: boolean;
  error: string;
  filters: IncomeFilters;
  lastFetch: number | null;
  cacheExpiry: number;
}

// Constants for frequency options (matching backend)
export const RECUR_FREQUENCY_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
] as const;

export type RecurFrequency = (typeof RECUR_FREQUENCY_OPTIONS)[number]["value"];

// Utility functions for data conversion
export function convertIncomeAmount(amount: string | number): number {
  return typeof amount === "string"
    ? Number.parseFloat(amount) || 0
    : amount || 0;
}

export function convertRecurFlag(isRecurring: boolean): 0 | 1 {
  return isRecurring ? 1 : 0;
}

export function convertRecurFlag_ToBoolean(recur: 0 | 1): boolean {
  return recur === 1;
}

// Utility: always return an array, never undefined
export function safeArray<T>(arr: T[] | undefined | null): T[] {
  return Array.isArray(arr) ? arr : [];
}

// Update type guards to use Array.isArray
export function isIncomeRecord(obj: any): obj is IncomeRecord {
  return (
    obj &&
    typeof obj.name === "string" &&
    typeof obj.household_profile === "string" &&
    typeof obj.monthly_income === "number" &&
    Array.isArray(obj.income_source)
  );
}

export function isIncomeSourceRecord(obj: any): obj is IncomeSourceRecord {
  return (
    obj &&
    typeof obj.type === "string" &&
    typeof obj.income === "number" &&
    typeof obj.date_time === "string" &&
    typeof obj.recur === "boolean" &&
    Array.isArray(obj.ledger_entries)
  );
}

// --- New types for source operations ---

/**
 * Payload for adding a new income source to the single Income record
 * NOTE: monthly_income is not sent from the client; it is always computed by the backend.
 */
export interface AddIncomeSourcePayload {
  income_source: IncomeSourceFormData[]; // New source(s) to add
  income_name: string; // Parent Income record name
}

/**
 * Payload for updating an existing income source
 * NOTE: monthly_income is not sent from the client; it is always computed by the backend.
 */
export interface UpdateIncomeSourcePayload {
  income_source: IncomeSourceFormData[]; // Updated source data (single item)
  income_name: string; // Parent Income record name
  source_name: string; // Name of the child to update
}

/**
 * Payload for deleting an income source
 * NOTE: monthly_income is not sent from the client; it is always computed by the backend.
 */
export interface DeleteIncomeSourcePayload {
  income_source: []; // Always empty for delete
  income_name: string; // Parent Income record name
  action: "delete";
  source_name: string; // Name of the child to delete
}

// --- Core Types ---

export interface LedgerEntry {
  date_time: string;
  amount: number;
  income_type: "recurring" | "one-time";
}

export interface GetIncomeTypesResponse {
  income_types: Array<{
    name: string;
    type: string;
  }>;
}

export interface GetMonthlyIncomeSummaryResponse {
  monthly_income: number;
  recurring_income: number;
  one_time_income: number;
  total_sources: number;
}

export interface GetIncomeInsightsResponse {
  insights: Array<{
    type: "positive" | "neutral" | "warning";
    title: string;
    description: string;
  }>;
  recommendations: Array<{
    priority: "high" | "medium" | "low";
    title: string;
    description: string;
    action: string;
  }>;
  scores: {
    stability: number;
    diversification: number;
    growth: number;
  };
}

export interface UpdateRecurringLedgerEntriesResponse {
  status: "success";
  message: string;
}

// --- API Request Types ---

export interface CreateOrUpdateIncomePayload {
  income_source: IncomeSourceFormData | IncomeSourceFormData[];
  income_name?: string;
  source_name?: string;
  action?: "delete";
}
