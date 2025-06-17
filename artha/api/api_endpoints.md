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
    type?: string; // Primary filter name for income type
    incomeType?: string; // Legacy support, maps to 'type'
    frequency?: 'one-time' | 'recurring' | 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'semi-annually' | 'annually' | 'yearly';
    isRecurring?: boolean;
    amountMin?: number;
    amountMax?: number;
    searchTerm?: string;
    sortBy?: 'date' | 'amount' | 'type';
    sortOrder?: 'asc' | 'desc';
  };
  include_analytics?: boolean;
}

Response:
// When include_analytics=false (default):
Array<{
  name: string;
  household_profile: string;
  monthly_income: number;
  creation: string;
  modified: string;
  owner: string;
  income_source: Array<{
    name?: string; // Child table ID
    type: string;
    income: number;
    recur: boolean;
    date_time: string;
    recur_frequency?: 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'semi-annually' | 'annually' | 'yearly';
    stop_date?: string;
    ledger_entries: Array<{
      date_time: string;
      amount: number;
      income_type: 'recurring' | 'one-time';
    }>;
  }>;
}>

// When include_analytics=true:
{
  income_records: Array<{
    name: string;
    household_profile: string;
    monthly_income: number;
    creation: string;
    modified: string;
    owner: string;
    income_source: Array<{
      name?: string; // Child table ID
      type: string;
      income: number;
      recur: boolean;
      date_time: string;
      recur_frequency?: 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'semi-annually' | 'annually' | 'yearly';
      stop_date?: string;
      ledger_entries: Array<{
        date_time: string;
        amount: number;
        income_type: 'recurring' | 'one-time';
      }>;
    }>;
  }>;
  analytics: {
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
    period?: string;
    start_date?: string;
    end_date?: string;
  };
}
```

### 3. Get Income Ledger

```typescript
GET /api/method/artha.api.income.get_income_ledger

Parameters:
{
  filters?: {
    income_type?: 'recurring' | 'one-time';
    dateFrom?: string; // YYYY-MM-DD
    dateTo?: string; // YYYY-MM-DD
  };
}

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
  source_recur_frequency?: 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'semi-annually' | 'annually' | 'yearly';
  source_stop_date?: string;
}>
```

### 4. Create or Update Income Source

```typescript
POST /api/method/artha.api.income.create_or_update_income

Parameters:
{
  income_source: string; // JSON stringified array of IncomeSourceFormData
  income_name?: string; // For updates, null for new Income record
  source_name?: string; // For updating/deleting specific source
  action?: 'delete'; // For deleting a source
}

IncomeSourceFormData format (as JSON string):
{
  type: string;
  income: number;
  recur: boolean;
  date_time: string;
  recur_frequency?: 'daily' | 'weekly' | 'bi-weekly' | 'monthly' | 'quarterly' | 'semi-annually' | 'annually' | 'yearly';
  stop_date?: string;
}

Response:
{
  name: string;
  household_profile: string;
  monthly_income: number;
}
```

### 5. Get Monthly Income Summary

```typescript
GET / api / method / artha.api.income.get_monthly_income_summary;

Response: {
  monthly_income: number;
  recurring_income: number;
  one_time_income: number;
  total_sources: number;
}
```

### 6. Validate Income Data

```typescript
POST / api / method / artha.api.income.validate_income_data;

Parameters: {
  monthly_income: number;
  income_source: string; // JSON stringified array of IncomeSourceFormData
}

Response: {
  is_valid: boolean;
  errors: Record<string, string>;
}
```

### 7. Get Income Insights

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

### 8. Get Income Dashboard Metrics

```typescript
GET /api/method/artha.api.income.get_income_dashboard_metrics

Parameters:
{
  period?: 'this_month' | 'last_month' | 'last_3_months' | 'last_6_months' | 'this_year';
}

Response: {
  actual_monthly_income: number;      // Only from recurring sources
  recurring_income: number;           // Monthly recurring income
  one_time_income: number;            // One-time income for period
  total_sources: number;              // Total number of income sources
  recurring_percentage: number;       // Percentage of income that's recurring
  growth_rate: number;                // Growth rate vs previous period (%)
  top_income_type: string;            // Highest earning income type
  income_by_type: Record<string, number>;  // Income grouped by type
  monthly_trends: Array<{             // Monthly trend data
    month: string;
    total: number;
    recurring: number;
    one_time: number;
  }>;
  average_source_amount: number;      // Average amount per source
  period: string;                     // Period used for calculation
  start_date?: string;               // Period start date
  end_date?: string;                 // Period end date
}
```

### 9. Update Recurring Ledger Entries

```typescript
POST / api / method / artha.api.income.update_recurring_ledger_entries;

Response: {
  status: "success";
  message: string;
  updated_count: number;
}
```

### 10. Update All Recurring Ledgers (Scheduled Job)

```typescript
POST /api/method/artha.api.income.update_all_recurring_ledgers

Response: {
  status: "success" | "error";
  message: string;
  updated_count?: number;
}
```

## Important Notes

1. **Income Source Types**:

   - Each income source can be recurring or one-time
   - Recurring sources require a frequency from the supported list
   - Stop date is optional for recurring sources
   - Only income sources are editable from the frontend

2. **Supported Frequencies**:

   - `daily` - Every day
   - `weekly` - Same day each week
   - `bi-weekly` - Same day every 2 weeks
   - `monthly` - Same date each month (handles month-end properly)
   - `quarterly` - Same date every 3 months
   - `semi-annually` - Same date every 6 months
   - `annually` / `yearly` - Same date each year

3. **Ledger Entries**:

   - Automatically created based on source configuration
   - For recurring income without stop date, entries are created up to current date
   - One-time income creates a single ledger entry
   - Ledger is backend-only and not editable from the frontend
   - Enhanced frequency calculation using `dateutil.relativedelta` for accurate date progression

4. **Monthly Income Calculation**:

   - Only recurring income is included in monthly_income calculation
   - One-time income is tracked separately in ledger entries
   - Backend automatically recalculates monthly_income when sources change

5. **Filtering**:

   - Multiple filter options available
   - Date ranges can be specified in multiple formats
   - Analytics can be included in the response
   - Ledger-specific filtering available via get_income_ledger

6. **Error Handling**:
   - All endpoints return proper error messages
   - Failed operations are logged for debugging
   - Validation is performed on all inputs
   - Frequency validation ensures only supported values are accepted

## Type Definitions

```typescript
interface IncomeSource {
  type: string;
  income: number;
  recur: boolean;
  date_time?: string;
  recur_frequency?:
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

interface FlattenedLedgerEntry {
  name: string;
  income_source: string;
  income_type: "recurring" | "one-time";
  date_time: string;
  amount: number;
  source_type: string;
  source_recur: boolean;
  source_income: number;
  source_date_time: string;
  source_recur_frequency?: string;
  source_stop_date?: string;
}
```

## Usage Examples

### Filtering Recurring Income Sources

```javascript
const recurringIncome = await call("artha.api.income.get_user_income", {
  filters: { frequency: "recurring" },
});
```

### Getting Ledger Entries for a Specific Period

```javascript
const ledgerEntries = await call("artha.api.income.get_income_ledger", {
  filters: {
    dateFrom: "2024-01-01",
    dateTo: "2024-01-31",
    income_type: "recurring",
  },
});
```

### Adding a New Income Source

```javascript
const result = await call("artha.api.income.create_or_update_income", {
  income_source: [
    {
      type: "Salary",
      income: 5000,
      recur: true,
      recur_frequency: "monthly",
      date_time: "2024-01-01 00:00:00",
    },
  ],
});
```

### Table Usage

- **Recurring Incomes Table:** Use `get_user_income` and filter sources with `recur: true`. Only these can be edited/deleted in this table.
- **Full Ledger Table:** Use `get_income_ledger` to get flattened entries, or use `get_user_income` and flatten all `income_source[].ledger_entries[]` manually. Only one-time incomes (`income_type: 'one-time'`) can be edited/deleted in this table.

### Example: Using the Dedicated Ledger Endpoint

```javascript
// Get all ledger entries (preferred method)
const ledgerEntries = await call("artha.api.income.get_income_ledger");

// Filter for one-time entries only
const oneTimeEntries = await call("artha.api.income.get_income_ledger", {
  filters: { income_type: "one-time" },
});
```
