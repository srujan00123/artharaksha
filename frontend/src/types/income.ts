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
 * NOTE: Only for RECURRING income sources. One-time income goes directly to ledger.
 * All CRUD operations on sources are performed via the parent Income record.
 */
export interface IncomeSourceRecord {
  name?: string; // Child table ID
  type: string;
  income: number;
  recur: true; // Always true - only recurring sources are stored here
  date_time: string;
  recur_frequency:
    | "daily"
    | "weekly"
    | "bi-weekly"
    | "monthly"
    | "quarterly"
    | "semi-annually"
    | "annually"
    | "yearly";
  stop_date?: string;
  ledger_entries: LedgerEntry[];
}

// Income type as returned by get_income_types API
export interface IncomeTypeRecord {
  name: string;
  type: string;
}

// Core ledger entry structure
export interface LedgerEntry {
  date_time: string;
  amount: number;
  income_type: "recurring" | "one-time";
  source_type?: string; // For direct entries without income source
  description?: string; // For direct entries
}

// Flattened ledger entry as returned by get_income_ledger
export interface FlattenedLedgerEntry {
  name: string; // Ledger entry name
  income_source?: string; // Source child name (null for direct entries)
  income_type: "recurring" | "one-time";
  date_time: string;
  amount: number;
  source_type: string; // Income type name
  description?: string; // For direct entries
  // Source details (only for entries with income_source)
  source_recur?: boolean;
  source_income?: number;
  source_date_time?: string;
  source_recur_frequency?:
    | "daily"
    | "weekly"
    | "bi-weekly"
    | "monthly"
    | "quarterly"
    | "semi-annually"
    | "annually"
    | "yearly";
  source_stop_date?: string;
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
  recurring_percentage: number;
  growth_rate: number;
  actual_monthly_income: number;
  // New fields for better metrics display
  monthly_recurring_income: number; // Actual monthly income from current month's ledger entries
  expected_monthly_income: number; // Expected monthly income from recurring sources
  period_recurring_income: number; // Actual recurring income for the filtered period
  period_one_time_income: number; // Actual one-time income for the filtered period
  period_total_income: number; // Total income for the filtered period
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
  recurring_sources: IncomeSourceRecord[];
  ledger_entries: FlattenedLedgerEntry[];
  analytics: IncomeAnalytics;
}

export interface GetIncomeTypesResponse {
  income_types: IncomeTypeRecord[];
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
  updated_count: number;
}

export interface UpdateAllRecurringLedgersResponse {
  status: "success" | "error";
  message: string;
  updated_count?: number;
}

// Filter interfaces (matches backend filter handling)
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
    | "today"
    | "this_week"
    | "this_month"
    | "last_month"
    | "last_3_months"
    | "last_6_months"
    | "this_year"
    | "all"
    | "custom";
  type?: string; // Primary filter name for income type
  frequency?:
    | "one-time"
    | "recurring"
    | "daily"
    | "weekly"
    | "bi-weekly"
    | "monthly"
    | "quarterly"
    | "semi-annually"
    | "annually"
    | "yearly";
  isRecurring?: boolean;
  amountMin?: number;
  amountMax?: number;
  searchTerm?: string;
  sortBy?: "date" | "amount" | "type";
  sortOrder?: "asc" | "desc";
}

// Ledger-specific filters
export interface LedgerFilters {
  income_type?: "recurring" | "one-time";
  dateFrom?: string;
  dateTo?: string;
}

// Form data interfaces for creating/updating income
export interface IncomeSourceFormData {
  type: string;
  income: number;
  recur: true; // Always true for income sources
  date_time: string;
  recur_frequency:
    | "daily"
    | "weekly"
    | "bi-weekly"
    | "monthly"
    | "quarterly"
    | "semi-annually"
    | "annually"
    | "yearly";
  stop_date?: string;
}

// API Request payload types
export interface AddIncomeSourcePayload {
  income_source: IncomeSourceFormData[];
  income_name: string;
}

export interface UpdateIncomeSourcePayload {
  income_source: IncomeSourceFormData[];
  income_name: string;
  source_name: string;
}

export interface DeleteIncomeSourcePayload {
  income_source: [];
  income_name: string;
  action: "delete";
  source_name: string;
}

export interface CreateOrUpdateIncomePayload {
  income_source: IncomeSourceFormData | IncomeSourceFormData[];
  income_name?: string;
  source_name?: string;
  action?: "delete";
}

export interface ValidateIncomeDataPayload {
  monthly_income: number;
  income_source: IncomeSourceFormData[];
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
  { value: "bi-weekly", label: "Bi-weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "semi-annually", label: "Semi-annually" },
  { value: "annually", label: "Annually" },
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

// Type guards
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

// Legacy types for backward compatibility (marked as deprecated)
/** @deprecated Use IncomeRecord instead */
export type Income = IncomeRecord;

/** @deprecated Use IncomeSourceRecord instead */
export type IncomeSourceType = IncomeSourceRecord;

/** @deprecated Use IncomeLedger instead */
export type IncomeLedger = LedgerEntry;

// Dashboard metrics response interface
export interface IncomeDashboardMetrics {
  actual_monthly_income: number; // Actual income from current month's ledger entries
  expected_monthly_income: number; // Expected income from recurring sources
  recurring_income: number;
  one_time_income: number;
  total_sources: number;
  recurring_percentage: number;
  growth_rate: number;
  top_income_type: string;
  income_by_type: Record<string, number>;
  monthly_trends: MonthlyTrend[];
  average_source_amount: number;
  period: string;
  start_date?: string;
  end_date?: string;
}

// Ledger Entry CRUD operations
export interface UpdateLedgerEntryPayload {
  ledger_entry_name: string;
  new_amount: number;
  new_date: string;
  new_type?: "recurring" | "one-time";
}

export interface UpdateLedgerEntryResponse {
  status: "success";
  message: string;
  updated_entry: {
    name: string;
    amount: number;
    date_time: string;
    income_type: "recurring" | "one-time";
  };
  changes: {
    amount_changed: boolean;
    type_changed: boolean;
  };
}

export interface DeleteLedgerEntryPayload {
  ledger_entry_name: string;
}

export interface DeleteLedgerEntryResponse {
  status: "success";
  message: string;
  deleted_type: "recurring" | "one-time";
}

export interface CreateLedgerEntryPayload {
  income_source_name: string;
  amount: number;
  date_time: string;
  income_type?: "recurring" | "one-time";
}

export interface CreateDirectLedgerEntryPayload {
  income_type: string;
  amount: number;
  date_time: string;
  description?: string;
}

export interface CreateLedgerEntryResponse {
  status: "success";
  message: string;
  entry_name: string;
}

// Frontend UI-specific types
export interface ProcessedIncomeItem {
  sourceId: string;
  incomeId: string;
  type: string;
  amount: number;
  isRecurring: true; // Always true for income sources
  dateTime: string;
  frequency: string;
  stop_date?: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface IncomeFormUIData {
  type: string;
  amount: number;
  isRecurring: boolean; // Can be true or false for form input
  dateTime: string;
  frequency?: string; // Optional for one-time income
  stop_date?: string;
}

// UI data for direct ledger entries (one-time income)
export interface DirectLedgerEntryFormData {
  income_type: string;
  amount: number;
  date_time: string;
  description?: string;
}

export interface LedgerEntryFormData {
  amount: number;
  date: string;
  income_type: "recurring" | "one-time";
  source_type: string;
}

// Form validation result
export interface IncomeValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}
