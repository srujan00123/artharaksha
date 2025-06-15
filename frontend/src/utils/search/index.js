// Search filter helper
export function createSearchFilter(searchTerm) {
    const term = searchTerm.toLowerCase().trim()
    return (item) => {
        if (!term) return true
        return Object.values(item).some(value =>
            String(value).toLowerCase().includes(term)
        )
    }
}

// Create Frappe-style filters for server-side filtering
export function createFrappeFilters(filters) {
    const frappeFilters = {}

    // Date range filter
    if (filters.dateFrom && filters.dateTo) {
        frappeFilters.creation = ['between', [filters.dateFrom, filters.dateTo + ' 23:59:59']]
    } else if (filters.dateFrom) {
        frappeFilters.creation = ['>=', filters.dateFrom]
    } else if (filters.dateTo) {
        frappeFilters.creation = ['<=', filters.dateTo + ' 23:59:59']
    }

    // Household profile filter (always applied)
    if (filters.householdProfile) {
        frappeFilters.household_profile = filters.householdProfile
    }

    return frappeFilters
}

// Sort utilities
export function getSortField(sortBy) {
    switch (sortBy) {
        case 'amount':
            return 'total_amount'
        case 'date':
        default:
            return 'creation'
    }
}

export function getSortOrder(order) {
    return order === 'asc' ? 'asc' : 'desc'
} 