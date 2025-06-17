# Income API Endpoints Documentation

## Overview

The Income API provides endpoints for managing income records, sources, and ledger entries. Each household profile has a unique Income record with child tables for Income Source Type and Income Ledger.

**Note:** Only `IncomeSourceType` (income sources) can be created, updated, or deleted from the frontend. The ledger is auto-populated and managed by the backend.

## Base Structure

- Income (Doctype) -> Unique per Household Profile
  - Income Source Type (Child Table)
  - Income Ledger (Child Table, backend-only)

## API Endpoints

### 1. Get Income Types

```typescript
GET / api / method / artha.api.income.get_income_types;

Response: {
  income_types: Array<{
    name: string;
    type: string;
  }>;
}
```

### 2. Get User Income

```typescript
GET /api/method/artha.api.income.get_user_income

Parameters:
{
  filters?: {
    dateRange?: 'today' | 'this-week' | 'this-month' | 'last-month' | 'last-3-months' | 'this-year';
    dateFrom?: string; // YYYY-MM-DD
    dateTo?: string; // YYYY-MM-DD
    period?: 'this_month' | 'last_month' | 'last_3_months' | 'last_6_months' | 'this_year';
    type?: string;
    incomeType?: string;
    frequency?: 'one-time' | 'recurring' | 'daily' | 'weekly' | 'monthly' | 'yearly';
    isRecurring?: boolean;
    amountMin?: number;
    amountMax?: number;
    searchTerm?: string;
    sortBy?: 'date' | 'amount';
    sortOrder?: 'asc' | 'desc';
  };
  include_analytics?: boolean;
}

Response:
{
  income_records: Array<{
    name: string;
    household_profile: string;
    monthly_income: number;
    creation: string;
    modified: string;
    owner: string;
    income_source: Array<{
      name: string;
      type: string;
      income: number;
      recur: boolean;
      date_time: string;
      recur_frequency?: string;
      stop_date?: string;
      ledger_entries: Array<{
        date_time: string;
        amount: number;
        income_type: 'recurring' | 'one-time';
      }>;
    }>;
  }>;
  analytics?: {
    total_income: number;
    recurring_income: number;
    one_time_income: number;
    income_by_type: Record<string, number>;
    monthly_trends: Array<{
      month: string;
      total: number;
      recurring: number;
      one_time: number;
    }>;
    summary: {
      total_sources: number;
      average_source_amount: number;
      top_income_type: string;
    };
    period: string;
    start_date: string;
    end_date: string;
  };
}
```

### 3. Create or Update Income Source

```typescript
POST /api/method/artha.api.income.create_or_update_income

Parameters:
{
  income_source: {
    type: string;
    income: number;
    recur: boolean;
    date_time?: string;
    recur_frequency?: string;
    stop_date?: string;
  } | Array<{
    type: string;
    income: number;
    recur: boolean;
    date_time?: string;
    recur_frequency?: string;
    stop_date?: string;
  }>;
  income_name?: string;
  source_name?: string;
  action?: 'delete';
}

Response:
{
  name: string;
  household_profile: string;
  monthly_income: number;
}
```

### 4. Get Monthly Income Summary

```typescript
GET / api / method / artha.api.income.get_monthly_income_summary;

Response: {
  monthly_income: number;
  recurring_income: number;
  one_time_income: number;
  total_sources: number;
}
```

### 5. Get Income Insights

```typescript
GET / api / method / artha.api.income.get_income_insights;

Response: {
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
  }
}
```

### 6. Update Recurring Ledger Entries

```typescript
POST / api / method / artha.api.income.update_recurring_ledger_entries;

Response: {
  status: "success";
  message: string;
}
```

### 7. Get Full Income Ledger

```typescript
GET / api / method / artha.api.income.get_income_ledger;

Response: Array<{
  name: string; // Ledger entry name
  income_source: string; // Source child name
  income_type: "recurring" | "one-time";
  date_time: string;
  amount: number;
  source_type: string;
  source_recur: boolean;
  source_income: number;
  source_date_time: string;
  source_recur_frequency?: string;
  source_stop_date?: string;
}>;
```

## Important Notes

1. **Income Source Types**:

   - Each income source can be recurring or one-time
   - Recurring sources require a frequency
   - Stop date is optional for recurring sources
   - Only income sources are editable from the frontend

2. **Ledger Entries**:

   - Automatically created based on source configuration
   - For recurring income without stop date, entries are created up to current date
   - One-time income creates a single ledger entry
   - Ledger is backend-only and not editable from the frontend

3. **Monthly Income Calculation**:

   - Recurring income is converted to monthly equivalent
   - One-time income is counted only in the month it occurs
   - Total monthly income is the sum of all valid sources

4. **Filtering**:

   - Multiple filter options available
   - Date ranges can be specified in multiple formats
   - Analytics can be included in the response

5. **Error Handling**:
   - All endpoints return proper error messages
   - Failed operations are logged for debugging
   - Validation is performed on all inputs

## Type Definitions

```typescript
interface IncomeSource {
  type: string;
  income: number;
  recur: boolean;
  date_time?: string;
  recur_frequency?: "daily" | "weekly" | "monthly" | "yearly";
  stop_date?: string;
}

interface LedgerEntry {
  date_time: string;
  amount: number;
  income_type: "recurring" | "one-time";
}

interface IncomeRecord {
  name: string;
  household_profile: string;
  monthly_income: number;
  creation: string;
  modified: string;
  owner: string;
  income_source: Array<IncomeSource & { ledger_entries: LedgerEntry[] }>;
}
```

## Table Usage

- **Recurring Incomes Table:** Use `get_user_income` and filter sources with `recur: true`. Only these can be edited/deleted in this table.
- **Full Ledger Table:** Use `get_user_income` and flatten all `income_source[].ledger_entries[]` into a single array, attaching source info from the parent source. Only one-time incomes (`income_type: 'one-time'`) can be edited/deleted in this table.

### Example: Flattening Ledger Entries in the Frontend

```js
const ledgerEntries = [];
for (const income of income_records) {
  for (const source of income.income_source) {
    for (const entry of source.ledger_entries) {
      ledgerEntries.push({
        ...entry,
        source_type: source.type,
        source_recur: source.recur,
        source_income: source.income,
        source_date_time: source.date_time,
        source_recur_frequency: source.recur_frequency,
        source_stop_date: source.stop_date,
        incomeId: income.name,
        sourceId: source.name,
      });
    }
  }
}
```
