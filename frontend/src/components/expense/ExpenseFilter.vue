<template>
	<div class="space-y-4">
		<!-- Filter Toggle Button -->
		<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
			<Button variant="outline" @click="showFilters = !showFilters"
				class="w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2 h-11 touch-manipulation">
				<SlidersHorizontal class="w-4 h-4" />
				<span>Filters</span>
				<Badge v-if="activeFilterCount > 0" :label="activeFilterCount.toString()" variant="subtle" />
			</Button>

			<div v-if="activeFilterCount > 0"
				class="flex flex-col sm:flex-row items-start sm:items-center gap-2 w-full sm:w-auto">
				<span class="text-sm text-gray-500 dark:text-gray-400">{{ filteredCount }} of {{ totalCount }}
					expenses</span>
				<Button variant="ghost" size="sm" @click="clearAllFilters"
					class="w-full sm:w-auto h-11 sm:h-auto text-red-600 dark:text-red-400 hover:text-red-700 dark:text-red-300 touch-manipulation">
					Clear All
				</Button>
			</div>
		</div>

		<!-- Filter Panel -->
		<Card v-show="showFilters" class="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
			<div class="p-3 sm:p-4 space-y-4 sm:space-y-6">
				<!-- Quick Date Filters -->
				<div>
					<h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Date Range</h4>
					<div class="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 mb-3">
						<Button v-for="period in quickDateFilters" :key="period.value" variant="outline" size="sm"
							@click="applyQuickDateFilter(period.value)"
							:class="{ 'bg-blue-50 border-blue-300 text-blue-700': isActiveDateFilter(period.value) }"
							class="h-11 sm:h-auto text-xs sm:text-sm touch-manipulation">
							{{ period.label }}
						</Button>
					</div>

					<!-- Custom Date Range -->
					<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
						<div>
							<label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">From
								Date</label>
							<TextInput type="date" v-model="localFilters.dateFrom" @input="onFilterChange"
								class="w-full h-11" size="sm" />
						</div>
						<div>
							<label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">To
								Date</label>
							<TextInput type="date" v-model="localFilters.dateTo" @input="onFilterChange"
								class="w-full h-11" size="sm" />
						</div>
					</div>
				</div>

				<!-- Type and Category Filters -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
					<!-- Expense Type Filter -->
					<div>
						<h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Expense Type</h4>
						<div class="space-y-3">
							<label class="flex items-center h-11 sm:h-auto">
								<input type="radio" name="expenseType" value="" v-model="localFilters.type"
									@change="onFilterChange" class="mr-3 w-4 h-4" />
								<span class="text-sm dark:text-gray-200">All Types</span>
							</label>
							<label class="flex items-center h-11 sm:h-auto">
								<input type="radio" name="expenseType" value="medical" v-model="localFilters.type"
									@change="onFilterChange" class="mr-3 w-4 h-4" />
								<span class="flex items-center text-sm dark:text-gray-200">
									<Stethoscope class="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
									Medical Only
								</span>
							</label>
							<label class="flex items-center h-11 sm:h-auto">
								<input type="radio" name="expenseType" value="other" v-model="localFilters.type"
									@change="onFilterChange" class="mr-3 w-4 h-4" />
								<span class="flex items-center text-sm dark:text-gray-200">
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
							placeholder="Search by category..." class="w-full h-11" size="sm" />
					</div>
				</div>

				<!-- Amount and Search Filters -->
				<div class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
					<!-- Amount Range -->
					<div>
						<h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Amount Range (₹)</h4>
						<div class="grid grid-cols-2 gap-3">
							<div>
								<label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Min
									Amount</label>
								<TextInput type="number" v-model="amountMinString" @input="onAmountMinChange"
									placeholder="0" min="0" step="0.01" class="w-full h-11" size="sm" />
							</div>
							<div>
								<label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Max
									Amount</label>
								<TextInput type="number" v-model="amountMaxString" @input="onAmountMaxChange"
									placeholder="No limit" min="0" step="0.01" class="w-full h-11" size="sm" />
							</div>
						</div>
					</div>

					<!-- Text Search -->
					<div>
						<h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Search</h4>
						<TextInput v-model="localFilters.searchTerm" @input="onFilterChange"
							placeholder="Search expenses..." class="w-full h-11" size="sm" />
					</div>
				</div>

				<!-- Medical Expense Specific Filters -->
				<div v-if="localFilters.type === 'medical' || !localFilters.type">
					<h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Medical Expense Type</h4>
					<div class="space-y-3">
						<label class="flex items-center h-11 sm:h-auto">
							<input type="radio" name="medicalType" :value="undefined" v-model="localFilters.isDirect"
								@change="onFilterChange" class="mr-3 w-4 h-4" />
							<span class="text-sm dark:text-gray-200">All Medical</span>
						</label>
						<label class="flex items-center h-11 sm:h-auto">
							<input type="radio" name="medicalType" :value="true" v-model="localFilters.isDirect"
								@change="onFilterChange" class="mr-3 w-4 h-4" />
							<span class="text-sm dark:text-gray-200">Direct Medical Only</span>
						</label>
						<label class="flex items-center h-11 sm:h-auto">
							<input type="radio" name="medicalType" :value="false" v-model="localFilters.isDirect"
								@change="onFilterChange" class="mr-3 w-4 h-4" />
							<span class="text-sm dark:text-gray-200">Indirect Medical Only</span>
						</label>
					</div>
				</div>

				<!-- Sorting Options -->
				<div>
					<h4 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Sort Options</h4>
					<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
						<div>
							<label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Sort
								By</label>
							<select v-model="localFilters.sortBy" @change="onFilterChange"
								class="w-full h-11 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 dark:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 touch-manipulation">
								<option value="date">Date</option>
								<option value="amount">Amount</option>
								<option value="category">Category</option>
							</select>
						</div>
						<div>
							<label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Order</label>
							<select v-model="localFilters.sortOrder" @change="onFilterChange"
								class="w-full h-11 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 dark:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400 touch-manipulation">
								<option value="desc">Newest First</option>
								<option value="asc">Oldest First</option>
							</select>
						</div>
					</div>
				</div>

				<!-- Active Filters Summary -->
				<div v-if="activeFilterCount > 0"
					class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
					<div class="flex flex-col sm:flex-row items-start justify-between gap-3 sm:gap-0">
						<div>
							<h5 class="text-sm font-medium text-blue-900 mb-1">Active Filters</h5>
							<div class="flex flex-wrap gap-1">
								<Badge v-for="filter in activeFilters" :key="filter.key" :label="filter.label"
									variant="subtle"
									class="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200" />
							</div>
						</div>
						<Button variant="ghost" size="sm" @click="clearAllFilters"
							class="w-full sm:w-auto h-11 sm:h-auto text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:text-blue-300 touch-manipulation">
							Clear
						</Button>
					</div>
				</div>
			</div>
		</Card>
	</div>
</template>

<script setup lang="ts">
import { Badge, Button, Card, TextInput } from "frappe-ui"
import { ShoppingBag, SlidersHorizontal, Stethoscope } from "lucide-vue-next"
import { computed, onMounted, ref, watch } from "vue"
import { useExpense } from "../../composables/useExpense"
import type { ExpenseFilters } from "../../types/expense"
import { getClientDateString, getClientTime } from "../../utils/date"

// Props
interface Props {
	totalCount?: number
	filteredCount?: number
}

const props = withDefaults(defineProps<Props>(), {
	totalCount: 0,
	filteredCount: 0,
})

// Emits
const emit = defineEmits<{
	"update:filters": [filters: ExpenseFilters]
}>()

// Use the expense composable
const {
	filters: storeFilters,
	updateFilters,
	clearFilters,
} = useExpense({ autoInitialize: false })

// Local state
const showFilters = ref(false)

// Local filters that sync with the store
const localFilters = ref<ExpenseFilters>({
	searchTerm: "",
	dateFrom: "",
	dateTo: "",
	amountMin: undefined,
	amountMax: undefined,
	category: "",
	type: "",
	sortBy: "date",
	sortOrder: "desc",
	period: "this_month",
	isDirect: undefined,
})

// String representations for amount inputs
const amountMinString = ref("")
const amountMaxString = ref("")

// Quick date filter options
const quickDateFilters = [
	{
		label: "Today",
		value: "today",
		dateFrom: getClientDateString(),
		dateTo: getClientDateString(),
	},
	{
		label: "This Week",
		value: "this_week",
		dateFrom: getWeekStart(),
		dateTo: getClientDateString(),
	},
	{
		label: "This Month",
		value: "this_month",
		dateFrom: getMonthStart(),
		dateTo: getClientDateString(),
	},
	{
		label: "Last Month",
		value: "last_month",
		dateFrom: getLastMonthStart(),
		dateTo: getLastMonthEnd(),
	},
	{
		label: "Last 3 Months",
		value: "last_3_months",
		dateFrom: getThreeMonthsAgo(),
		dateTo: getClientDateString(),
	},
	{
		label: "This Year",
		value: "this_year",
		dateFrom: getYearStart(),
		dateTo: getClientDateString(),
	},
]

// Computed properties
const activeFilterCount = computed(() => {
	let count = 0
	if (localFilters.value.searchTerm) count++
	if (
		localFilters.value.dateFrom ||
		localFilters.value.dateTo ||
		localFilters.value.period !== "all"
	)
		count++
	if (localFilters.value.amountMin && localFilters.value.amountMin > 0) count++
	if (localFilters.value.amountMax && localFilters.value.amountMax > 0) count++
	if (localFilters.value.category) count++
	if (localFilters.value.type) count++
	if (localFilters.value.isDirect !== undefined) count++
	return count
})

const activeFilters = computed(() => {
	const filters: Array<{ key: string; label: string; value: string }> = []

	if (localFilters.value.searchTerm) {
		filters.push({
			key: "search",
			label: `Search: "${localFilters.value.searchTerm}"`,
			value: localFilters.value.searchTerm,
		})
	}

	if (localFilters.value.type) {
		filters.push({
			key: "type",
			label: `Type: ${localFilters.value.type}`,
			value: localFilters.value.type,
		})
	}

	if (localFilters.value.category) {
		filters.push({
			key: "category",
			label: `Category: ${localFilters.value.category}`,
			value: localFilters.value.category,
		})
	}

	if (localFilters.value.dateFrom || localFilters.value.dateTo) {
		const dateLabel = formatDateRange()
		filters.push({ key: "date", label: `Date: ${dateLabel}`, value: dateLabel })
	} else if (localFilters.value.period && localFilters.value.period !== "all") {
		const periodLabel =
			quickDateFilters.find((p) => p.value === localFilters.value.period)
				?.label || localFilters.value.period
		filters.push({
			key: "period",
			label: `Period: ${periodLabel}`,
			value: localFilters.value.period || "",
		})
	}

	if (
		(localFilters.value.amountMin && localFilters.value.amountMin > 0) ||
		(localFilters.value.amountMax && localFilters.value.amountMax > 0)
	) {
		const amountLabel = formatAmountRange()
		filters.push({
			key: "amount",
			label: `Amount: ${amountLabel}`,
			value: amountLabel,
		})
	}

	if (localFilters.value.isDirect !== undefined) {
		filters.push({
			key: "isDirect",
			label: `Medical: ${localFilters.value.isDirect ? "Direct" : "Indirect"}`,
			value: localFilters.value.isDirect.toString(),
		})
	}

	return filters
})

// Helper functions for date calculations
function getWeekStart(): string {
	const now = getClientTime()
	const startOfWeek = new Date(now)
	startOfWeek.setDate(now.getDate() - now.getDay())
	return startOfWeek.toISOString().split("T")[0]
}

function getMonthStart(): string {
	const now = getClientTime()
	return new Date(now.getFullYear(), now.getMonth(), 1)
		.toISOString()
		.split("T")[0]
}

function getLastMonthStart(): string {
	const now = getClientTime()
	return new Date(now.getFullYear(), now.getMonth() - 1, 1)
		.toISOString()
		.split("T")[0]
}

function getLastMonthEnd(): string {
	const now = getClientTime()
	return new Date(now.getFullYear(), now.getMonth(), 0)
		.toISOString()
		.split("T")[0]
}

function getThreeMonthsAgo(): string {
	const now = getClientTime()
	return new Date(now.getFullYear(), now.getMonth() - 3, 1)
		.toISOString()
		.split("T")[0]
}

function getYearStart(): string {
	const now = getClientTime()
	return new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0]
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
	return ""
}

function formatAmountRange(): string {
	const min = localFilters.value.amountMin
	const max = localFilters.value.amountMax

	if (min && min > 0 && max && max > 0) {
		return `₹${min} - ₹${max}`
	} else if (min && min > 0) {
		return `₹${min}+`
	} else if (max && max > 0) {
		return `Up to ₹${max}`
	}
	return ""
}

// Methods
function onFilterChange() {
	// Update the store and emit to parent
	updateFilters(localFilters.value)
	emit("update:filters", localFilters.value)
}

function onAmountMinChange() {
	const value = Number.parseFloat(amountMinString.value)
	localFilters.value.amountMin = isNaN(value) || value <= 0 ? undefined : value
	onFilterChange()
}

function onAmountMaxChange() {
	const value = Number.parseFloat(amountMaxString.value)
	localFilters.value.amountMax = isNaN(value) || value <= 0 ? undefined : value
	onFilterChange()
}

function applyQuickDateFilter(period: string) {
	const filter = quickDateFilters.find((f) => f.value === period)
	if (filter) {
		localFilters.value.dateFrom = ""
		localFilters.value.dateTo = ""
		// Type-safe period assignment
		const validPeriods = [
			"today",
			"this_week",
			"this_month",
			"last_month",
			"last_3_months",
			"last_6_months",
			"this_year",
			"all",
			"custom",
		] as const
		if (validPeriods.includes(period as any)) {
			localFilters.value.period = period as (typeof validPeriods)[number]
		}
		onFilterChange()
	}
}

function isActiveDateFilter(period: string): boolean {
	return localFilters.value.period === period
}

function clearAllFilters() {
	localFilters.value = {
		searchTerm: "",
		dateFrom: "",
		dateTo: "",
		amountMin: undefined,
		amountMax: undefined,
		category: "",
		type: "",
		sortBy: "date",
		sortOrder: "desc",
		period: "this_month",
		isDirect: undefined,
	}
	amountMinString.value = ""
	amountMaxString.value = ""

	// Clear store filters and emit to parent
	clearFilters()
	emit("update:filters", localFilters.value)
}

// Sync local filters with store filters
watch(
	storeFilters,
	(newFilters) => {
		if (newFilters) {
			localFilters.value = { ...newFilters }
			// Update string representations
			amountMinString.value = newFilters.amountMin
				? newFilters.amountMin.toString()
				: ""
			amountMaxString.value = newFilters.amountMax
				? newFilters.amountMax.toString()
				: ""
		}
	},
	{ deep: true, immediate: true },
)

// Initialize on mount
onMounted(() => {
	// Sync with store filters on mount
	if (storeFilters.value) {
		localFilters.value = { ...storeFilters.value }
		amountMinString.value = storeFilters.value.amountMin
			? storeFilters.value.amountMin.toString()
			: ""
		amountMaxString.value = storeFilters.value.amountMax
			? storeFilters.value.amountMax.toString()
			: ""
	}
})
</script>

<style scoped>
/* Custom styles if needed */
</style>