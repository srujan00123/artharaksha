<template>
    <div class="space-y-4">
        <!-- Filter Toggle Button -->
        <div class="flex items-center justify-between">
            <Button variant="outline" @click="showFilters = !showFilters" class="flex items-center gap-2">
                <SlidersHorizontal class="w-4 h-4" />
                <span>Filters</span>
                <Badge v-if="activeFilterCount > 0" :label="activeFilterCount.toString()" variant="subtle" />
            </Button>

            <div v-if="activeFilterCount > 0" class="flex items-center gap-2">
                <span class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{{ filteredCount }} of {{ totalCount }} expenses</span>
                <Button variant="ghost" size="sm" @click="clearAllFilters" class="text-red-600 dark:text-red-400 hover:text-red-700 dark:text-red-300">
                    Clear All
                </Button>
            </div>
        </div>

        <!-- Filter Panel -->
        <Card v-show="showFilters" class="bg-gray-50 dark:bg-gray-900 dark:bg-gray-100 border border-gray-200 dark:border-gray-700">
            <div class="p-4 space-y-6">
                <!-- Quick Date Filters -->
                <div>
                    <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Date Range</h4>
                    <div class="flex flex-wrap gap-2 mb-3">
                        <Button v-for="period in quickDateFilters" :key="period.value" variant="outline" size="sm"
                            @click="applyQuickDateFilter(period.value)"
                            :class="{ 'bg-blue-50 border-blue-300 text-blue-700': isActiveDateFilter(period.value) }">
                            {{ period.label }}
                        </Button>
                    </div>

                    <!-- Custom Date Range -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-1">From Date</label>
                            <TextInput type="date" v-model="localFilters.dateFrom" @input="onFilterChange"
                                class="w-full" size="sm" />
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-1">To Date</label>
                            <TextInput type="date" v-model="localFilters.dateTo" @input="onFilterChange" class="w-full"
                                size="sm" />
                        </div>
                    </div>
                </div>

                <!-- Type and Category Filters -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Expense Type Filter -->
                    <div>
                        <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Expense Type</h4>
                        <div class="space-y-2">
                            <label class="flex items-center">
                                <input type="radio" name="expenseType" value="" v-model="localFilters.type"
                                    @change="onFilterChange" class="mr-2" />
                                <span class="text-sm">All Types</span>
                            </label>
                            <label class="flex items-center">
                                <input type="radio" name="expenseType" value="medical" v-model="localFilters.type"
                                    @change="onFilterChange" class="mr-2" />
                                <span class="flex items-center text-sm">
                                    <Stethoscope class="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                                    Medical Only
                                </span>
                            </label>
                            <label class="flex items-center">
                                <input type="radio" name="expenseType" value="other" v-model="localFilters.type"
                                    @change="onFilterChange" class="mr-2" />
                                <span class="flex items-center text-sm">
                                    <ShoppingBag class="w-4 h-4 mr-2 text-orange-600 dark:text-orange-400" />
                                    Other Only
                                </span>
                            </label>
                        </div>
                    </div>

                    <!-- Category Search -->
                    <div>
                        <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Category</h4>
                        <TextInput v-model="localFilters.category" @input="onFilterChange"
                            placeholder="Search by category..." class="w-full" size="sm" />
                    </div>
                </div>

                <!-- Amount and Search Filters -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Amount Range -->
                    <div>
                        <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Amount Range (₹)</h4>
                        <div class="grid grid-cols-2 gap-3">
                            <div>
                                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-1">Min Amount</label>
                                <TextInput type="number" v-model="localFilters.amountMin" @input="onFilterChange"
                                    placeholder="0" min="0" step="0.01" class="w-full" size="sm" />
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-1">Max Amount</label>
                                <TextInput type="number" v-model="localFilters.amountMax" @input="onFilterChange"
                                    placeholder="No limit" min="0" step="0.01" class="w-full" size="sm" />
                            </div>
                        </div>
                    </div>

                    <!-- Text Search -->
                    <div>
                        <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Search</h4>
                        <TextInput v-model="localFilters.searchTerm" @input="onFilterChange"
                            placeholder="Search expenses..." class="w-full" size="sm" />
                    </div>
                </div>

                <!-- Sorting Options -->
                <div>
                    <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Sort Options</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-1">Sort By</label>
                            <select v-model="localFilters.sortBy" @change="onFilterChange"
                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400">
                                <option value="date">Date</option>
                                <option value="amount">Amount</option>
                                <option value="category">Category</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-1">Order</label>
                            <select v-model="localFilters.sortOrder" @change="onFilterChange"
                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400">
                                <option value="desc">Newest First</option>
                                <option value="asc">Oldest First</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- Active Filters Summary -->
                <div v-if="activeFilterCount > 0" class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div class="flex items-start justify-between">
                        <div>
                            <h5 class="text-sm font-medium text-blue-900 mb-1">Active Filters</h5>
                            <div class="flex flex-wrap gap-1">
                                <Badge v-for="filter in activeFilters" :key="filter.key" :label="filter.label"
                                    variant="subtle" class="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200" />
                            </div>
                        </div>
                        <Button variant="ghost" size="sm" @click="clearAllFilters"
                            class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:text-blue-300">
                            Clear
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { SlidersHorizontal, Stethoscope, ShoppingBag } from 'lucide-vue-next'
import { Button, Card, TextInput, Badge } from 'frappe-ui'
import { getClientTime, getClientDateString } from '../../utils/date'
import type { ExpenseFilters, QuickDateFilter, ActiveFilter } from '../../types/expense'

// Props
interface Props {
    filters: ExpenseFilters
    totalCount: number
    filteredCount: number
    // Simple callback for cache invalidation
    onCacheInvalidate?: () => Promise<void>
}

const props = withDefaults(defineProps<Props>(), {
    totalCount: 0,
    filteredCount: 0,
    onCacheInvalidate: undefined
})

// Emits - simplified
const emit = defineEmits<{
    'update:filters': [filters: ExpenseFilters]
}>()

// Local state
const showFilters = ref(false)

// Local filters matching ExpenseFilters interface
const localFilters = ref<ExpenseFilters>({
    searchTerm: '',
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
    category: '',
    type: '',
    sortBy: 'date',
    sortOrder: 'desc',
    period: ''
})

// Quick date filter options matching QuickDateFilter interface
const quickDateFilters: QuickDateFilter[] = [
    { label: 'Today', value: 'today', dateFrom: getClientDateString(), dateTo: getClientDateString() },
    { label: 'This Week', value: 'this-week', dateFrom: getWeekStart(), dateTo: getClientDateString() },
    { label: 'This Month', value: 'this-month', dateFrom: getMonthStart(), dateTo: getClientDateString() },
    { label: 'Last Month', value: 'last-month', dateFrom: getLastMonthStart(), dateTo: getLastMonthEnd() },
    { label: 'Last 3 Months', value: 'last-3-months', dateFrom: getThreeMonthsAgo(), dateTo: getClientDateString() },
    { label: 'This Year', value: 'this-year', dateFrom: getYearStart(), dateTo: getClientDateString() }
]

// Computed properties
const activeFilterCount = computed(() => {
    let count = 0
    if (localFilters.value.searchTerm) count++
    if (localFilters.value.dateFrom || localFilters.value.dateTo) count++
    if (localFilters.value.amountMin || localFilters.value.amountMax) count++
    if (localFilters.value.category) count++
    if (localFilters.value.type) count++
    return count
})

const activeFilters = computed((): ActiveFilter[] => {
    const filters: ActiveFilter[] = []
    
    if (localFilters.value.searchTerm) {
        filters.push({ key: 'search', label: `Search: "${localFilters.value.searchTerm}"`, value: localFilters.value.searchTerm })
    }
    
    if (localFilters.value.type) {
        filters.push({ key: 'type', label: `Type: ${localFilters.value.type}`, value: localFilters.value.type })
    }
    
    if (localFilters.value.category) {
        filters.push({ key: 'category', label: `Category: ${localFilters.value.category}`, value: localFilters.value.category })
    }
    
    if (localFilters.value.dateFrom || localFilters.value.dateTo) {
        const dateLabel = formatDateRange()
        filters.push({ key: 'date', label: `Date: ${dateLabel}`, value: dateLabel })
    }
    
    if (localFilters.value.amountMin || localFilters.value.amountMax) {
        const amountLabel = formatAmountRange()
        filters.push({ key: 'amount', label: `Amount: ${amountLabel}`, value: amountLabel })
    }
    
    return filters
})

// Helper functions for date calculations
function getWeekStart(): string {
    const now = getClientTime()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    return startOfWeek.toISOString().split('T')[0]
}

function getMonthStart(): string {
    const now = getClientTime()
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
}

function getLastMonthStart(): string {
    const now = getClientTime()
    return new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
}

function getLastMonthEnd(): string {
    const now = getClientTime()
    return new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
}

function getThreeMonthsAgo(): string {
    const now = getClientTime()
    return new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().split('T')[0]
}

function getYearStart(): string {
    const now = getClientTime()
    return new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
}

function formatDateRange(): string {
    const from = localFilters.value.dateFrom
    const to = localFilters.value.dateTo
    
    if (from && to) {
        return `${from} to ${to}`
    } else if (from) {
        return `From ${from}`
    } else if (to) {
        return `Until ${to}`
    }
    return ''
}

function formatAmountRange(): string {
    const min = localFilters.value.amountMin
    const max = localFilters.value.amountMax
    
    if (min && max) {
        return `₹${min} - ₹${max}`
    } else if (min) {
        return `₹${min}+`
    } else if (max) {
        return `Up to ₹${max}`
    }
    return ''
}

// Methods - simplified
function onFilterChange() {
    emit('update:filters', { ...localFilters.value })
    
    // Call cache invalidation callback if provided
    if (props.onCacheInvalidate) {
        props.onCacheInvalidate()
    }
}

function applyQuickDateFilter(period: string) {
    const filter = quickDateFilters.find(f => f.value === period)
    if (filter) {
        localFilters.value.dateFrom = filter.dateFrom
        localFilters.value.dateTo = filter.dateTo
        localFilters.value.period = period
        onFilterChange()
    }
}

function isActiveDateFilter(period: string): boolean {
    return localFilters.value.period === period
}

function clearAllFilters() {
    localFilters.value = {
        searchTerm: '',
        dateFrom: '',
        dateTo: '',
        amountMin: '',
        amountMax: '',
        category: '',
        type: '',
        sortBy: 'date',
        sortOrder: 'desc',
        period: ''
    }
    onFilterChange()
}

// Watchers
watch(() => props.filters, (newFilters) => {
    localFilters.value = { ...newFilters }
}, { immediate: true, deep: true })

// Initialize
onMounted(() => {
    // Set default period to this month if no filters are set
    if (!props.filters.period && !props.filters.dateFrom && !props.filters.dateTo) {
        applyQuickDateFilter('this-month')
    }
})
</script>

<style scoped>
/* Custom styles if needed */
</style>