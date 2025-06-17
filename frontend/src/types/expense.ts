import type { Expense } from "./Artha/Expense";
import type { ExpenseType as BackendExpenseType } from "./Artha/ExpenseType";
import type { MedicalExpenseType as BackendMedicalExpenseType } from "./Artha/MedicalExpenseType";

/**
 * Expense Types - Following Income Management Pattern
 * Clean, consistent interfaces that match backend structure
 */

// Helper: Safely convert array-like objects to arrays (matching income pattern)
export function safeArray(obj: any): any[] {
  if (Array.isArray(obj)) return obj;
  if (obj && typeof obj === "object") {
    const keys = Object.keys(obj);
    if (keys.every((k) => !isNaN(Number(k)))) {
      return keys.map((k) => obj[k]);
    }
  }
  return [];
}

/**
 * Core expense record structure (matches backend Expense doctype)
 */
export interface ExpenseRecord {
  name: string;
  household_profile: string;
  monthly_expense: number;
  creation: string;
  modified: string;
  owner: string;
  medical_expenses: MedicalExpenseItem[];
  other_expenses: OtherExpenseItem[];
}

/**
 * Medical expense item (matches backend Medical Expense Type child table)
 */
export interface MedicalExpenseItem {
  name: string;
  medical_expense_type: string;
  amount: number;
  date_time: string;
  description?: string;
  proof_of_payment?: string;
  is_direct: boolean;
}

/**
 * Other expense item (matches backend Expense Type child table)
 */
export interface OtherExpenseItem {
  name: string;
  expense_type: string;
  amount: number;
  date_time: string;
  description?: string;
}

/**
 * Flattened expense entry (like FlattenedLedgerEntry for income)
 */
export interface FlattenedExpenseEntry {
  name: string;
  parent: string;
  type: "medical" | "other";
  category: string;
  amount: number;
  date_time: string;
  description?: string;
  is_direct?: boolean;
  proof_of_payment?: string;
  household_profile: string;
  creation: string;
  modified: string;
}

/**
 * Expense type record (like IncomeTypeRecord)
 */
export interface ExpenseTypeRecord {
  name: string;
  expense_type: string;
  category?: string;
  is_direct?: boolean;
}

/**
 * Expense filters (matching income filter pattern)
 */
export interface ExpenseFilters {
  searchTerm?: string;
  type?: "medical" | "other" | "";
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  sortBy?: "date" | "amount" | "category";
  sortOrder?: "asc" | "desc";
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
  isDirect?: boolean;
}

/**
 * Expense analytics (matching income analytics pattern)
 */
export interface ExpenseAnalytics {
  total_expenses: number;
  medical_expenses: number;
  other_expenses: number;
  direct_medical: number;
  indirect_medical: number;
  expense_by_category: Record<string, number>;
  monthly_trends: Array<{
    month: string;
    total: number;
    medical: number;
    other: number;
    direct: number;
    indirect: number;
  }>;
  summary: {
    total_count: number;
    average_expense: number;
    top_category: string;
  };
  period: string;
}

/**
 * Expense dashboard metrics (matching income dashboard pattern)
 */
export interface ExpenseDashboardMetrics {
  total_expenses: number;
  medical_expenses: number;
  other_expenses: number;
  direct_medical: number;
  indirect_medical: number;
  expense_count: number;
  average_expense: number;
  top_category: string;
  expense_by_category: Record<string, number>;
  monthly_trends: Array<{
    month: string;
    total: number;
    medical: number;
    other: number;
    direct: number;
    indirect: number;
  }>;
  period: string;
  start_date?: string;
  end_date?: string;
}

/**
 * Service options (matching income service pattern)
 */
export interface ExpenseServiceOptions {
  filters?: ExpenseFilters;
  include_analytics?: boolean;
  forceRefresh?: boolean;
  useCache?: boolean;
}

/**
 * Expense form data for creating/updating
 */
export interface ExpenseFormData {
  type: "medical" | "other";
  category: string;
  amount: string;
  date_time: string;
  description?: string;
  is_direct?: boolean;
  proof_of_payment?: string;
}

/**
 * Validation types
 */
export interface ExpenseValidationErrors {
  general?: string;
  type?: string;
  category?: string;
  amount?: string;
  date_time?: string;
  description?: string;
}

export interface ExpenseValidationResult {
  is_valid: boolean;
  errors: ExpenseValidationErrors;
}

/**
 * API response types (matching income pattern)
 */
export interface GetUserExpensesResponse {
  expenses: FlattenedExpenseEntry[];
  analytics?: ExpenseAnalytics;
}

export interface GetExpenseTypesResponse {
  medical_types: ExpenseTypeRecord[];
  other_types: ExpenseTypeRecord[];
}

export interface CreateExpenseResponse {
  name: string;
  household_profile: string;
  monthly_expense: number;
}

export interface GetExpenseDashboardMetricsResponse
  extends ExpenseDashboardMetrics {}

/**
 * Store state interface (matching income store pattern)
 */
export interface ExpenseStoreState {
  expenses: FlattenedExpenseEntry[];
  expenseTypes: {
    medical_types: ExpenseTypeRecord[];
    other_types: ExpenseTypeRecord[];
  };
  analytics: ExpenseAnalytics | null;
  dashboardMetrics: ExpenseDashboardMetrics | null;
  loading: boolean;
  error: string | null;
  filters: ExpenseFilters;
  lastFetch: number | null;
  cacheExpiry: number;
}

/**
 * Payload types for mutations (matching income pattern)
 */
export interface CreateExpensePayload {
  expense_data: ExpenseFormData;
}

export interface UpdateExpensePayload {
  expense_name: string;
  expense_data: ExpenseFormData;
}

export interface DeleteExpensePayload {
  expense_name: string;
  expense_id: string;
}

export interface ValidateExpenseDataPayload {
  expense_data: ExpenseFormData;
}

/**
 * Filter types for UI components
 */
export interface QuickDateFilter {
  label: string;
  value: string;
  dateFrom: string;
  dateTo: string;
}

export interface ActiveFilter {
  key: string;
  label: string;
  value: string;
}

/**
 * UI-specific processed expense item (simplified from the complex one)
 */
export interface ProcessedExpenseItem {
  id: string;
  name: string;
  type: "medical" | "other";
  category: string;
  description: string;
  amount: number;
  date: string;
  hasReceipt: boolean;
  receiptUrl: string | null;
  isDirect?: boolean;
  creation: string;
  parent: string;
  household_profile: string;
  rawData?: any;
  docIndex?: number;
  expenseIndex?: number;
}

/**
 * Constants for expense categories
 */
export const MEDICAL_EXPENSE_CATEGORIES = [
  { value: "Consultation", label: "Consultation" },
  { value: "Diagnostics", label: "Diagnostics" },
  { value: "Medicines", label: "Medicines" },
  { value: "Hospitalization", label: "Hospitalization" },
  { value: "Travel", label: "Travel" },
  { value: "Accommodation", label: "Accommodation" },
  { value: "Wage Loss", label: "Wage Loss" },
  { value: "Other Medical", label: "Other Medical" },
] as const;

export const OTHER_EXPENSE_CATEGORIES = [
  { value: "Food & Groceries", label: "Food & Groceries" },
  { value: "Transportation", label: "Transportation" },
  { value: "Education", label: "Education" },
  { value: "Utilities", label: "Utilities" },
  { value: "Rent/Housing", label: "Rent/Housing" },
  { value: "Clothing", label: "Clothing" },
  { value: "Entertainment", label: "Entertainment" },
  { value: "Other Expenses", label: "Other Expenses" },
] as const;

/**
 * Type guards
 */
export function isMedicalExpenseItem(obj: any): obj is MedicalExpenseItem {
  return (
    obj &&
    typeof obj.medical_expense_type === "string" &&
    typeof obj.amount === "number"
  );
}

export function isOtherExpenseItem(obj: any): obj is OtherExpenseItem {
  return (
    obj &&
    typeof obj.expense_type === "string" &&
    typeof obj.amount === "number"
  );
}

export function isProcessedExpenseItem(obj: any): obj is ProcessedExpenseItem {
  return (
    obj &&
    typeof obj.id === "string" &&
    (obj.type === "medical" || obj.type === "other") &&
    typeof obj.category === "string" &&
    typeof obj.amount === "number"
  );
}

// Re-export backend types for convenience
export type {
  Expense as BackendExpense,
  BackendMedicalExpenseType,
  BackendExpenseType,
};
