import { debounce } from 'frappe-ui'

// Re-export Frappe UI utilities
export { debounce }

// Currency utilities (used in Dashboard.vue, ExpenseForm.vue)
export { formatCurrency, calculateCHE, getCHEColorClass, getCHEStatusText } from './currency'

// Date utilities (used across components)
export { formatDate, getTimeAgo, getDateRange, getDefaultDateFilter } from './date'

// Search utilities (used in filtering)
export { createSearchFilter, createFrappeFilters, getSortField, getSortOrder } from './search'

// File utilities (used in file upload components)
export { fileToBase64, uploadFile } from './file'

// Expense utilities (used across expense components)
export {
    MEDICAL_EXPENSE_CATEGORIES,
    OTHER_EXPENSE_CATEGORIES,
    INSURANCE_SCHEMES,
    CONDITION_SEVERITY,
    getCategoryInfo,
    extractExpenseDate,
    validateProcessedExpense,
    formatAmount,
    formatExpenseDate,
    getExpenseSummary,
    searchExpenses,
    sortExpenses
} from './expense'

// Services and Composables are available via @/data/index.js - no need to re-export here 