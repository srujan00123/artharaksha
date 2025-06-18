<template>
  <div class="categories-enhanced">
    <!-- Header Section -->
    <div class="header-section mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Expense Categories
          </h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">
            Comprehensive analysis of your spending patterns across all categories
          </p>
        </div>
        <div class="flex items-center space-x-3">
          <button 
            @click="handleRefresh"
            :disabled="loading"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw class="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>
    </div>

    <!-- Expense Filter Integration -->
    <div class="filters-section mb-6">
      <ExpenseFilter
        :total-count="totalExpenseCount"
        :filtered-count="filteredExpenseCount"
        @update:filters="handleFiltersUpdate"
      />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p class="text-gray-600 dark:text-gray-400 ml-3">Loading category analysis...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <AlertCircle class="h-5 w-5 text-red-400" />
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800 dark:text-red-200">
              Error Loading Categories
            </h3>
            <p class="text-sm text-red-700 dark:text-red-300 mt-1">{{ error }}</p>
          </div>
        </div>
        <div class="mt-4">
          <button 
            @click="handleRefresh"
            class="bg-red-100 dark:bg-red-900/30 hover:bg-red-200 text-red-800 dark:text-red-200 px-3 py-1 rounded text-sm transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="categories-content space-y-6">
      <!-- Overview Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <SummaryCard
          title="Total Expenses"
          :amount="totalAmount"
          icon="calculator"
          color="blue"
        />
        <SummaryCard
          title="Medical Expenses"
          :amount="medicalAmount"
          :subtitle="`${medicalPercentage.toFixed(1)}% of total`"
          icon="heart"
          color="red"
        />
        <SummaryCard
          title="Other Expenses"
          :amount="otherAmount"
          :subtitle="`${otherPercentage.toFixed(1)}% of total`"
          icon="shopping-bag"
          color="green"
        />
        <SummaryCard
          title="Categories"
          :amount="totalCategories"
          :subtitle="`${totalTransactions} transactions`"
          icon="hash"
          color="purple"
          :is-count="true"
        />
      </div>

      <!-- Medical Categorization Component -->
      <div v-if="hasMedicalExpenses" class="mb-6">
        <MedicalCategorization 
          :medical-expenses="medicalExpenses"
          @category-selected="handleMedicalCategorySelected"
          @export-requested="handleMedicalExport"
        />
      </div>

      <!-- All Categories Overview -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
              All Categories
            </h2>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Complete breakdown of all expense categories
            </p>
          </div>
          <div class="flex items-center space-x-2">
            <button
              @click="toggleSortOrder"
              class="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowUpDown class="w-4 h-4 mr-2" />
              {{ sortOrder === 'desc' ? 'Highest First' : 'Lowest First' }}
            </button>
          </div>
        </div>

        <!-- Categories Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="category in sortedAllCategories"
            :key="`${category.type}-${category.category}`"
            class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-all cursor-pointer"
            @click="selectCategory(category)"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div 
                  :class="getCategoryIconBg(category.type)"
                  class="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
                >
                  <component 
                    :is="getCategoryIcon(category.type)" 
                    :class="getCategoryIconColor(category.type)"
                    class="w-5 h-5" 
                  />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {{ category.category }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ getCategoryTypeLabel(category.type) }}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  ₹{{ category.totalAmount.toLocaleString() }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ category.count }} transactions
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="allCategories.length === 0" class="text-center py-12">
          <ShoppingBag class="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No Categories Found
          </h3>
          <p class="text-gray-500 dark:text-gray-400">
            Categories will appear here once you add expenses
          </p>
        </div>
      </div>

      <!-- Selected Category Details -->
      <CategoryDetailsModal
        v-if="selectedCategory"
        :category="selectedCategory"
        @close="selectedCategory = null"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import {
	AlertCircle,
	ArrowUpDown,
	Car,
	RefreshCw,
	ShoppingBag,
	Stethoscope,
} from "lucide-vue-next"
import { computed, onMounted, ref } from "vue"
import CategoryDetailsModal from "../../components/expense/CategoryDetailsModal.vue"
import ExpenseFilter from "../../components/expense/ExpenseFilter.vue"
import MedicalCategorization from "../../components/expense/MedicalCategorization.vue"
import SummaryCard from "../../components/expense/SummaryCard.vue"
import { useExpense } from "../../composables/useExpense"

import type { ExpenseFilters, FlattenedExpenseEntry } from "../../types/expense"

// Composables
const {
	expenses,
	allExpenses,
	loading,
	error,
	medicalExpenses,
	otherExpenses,
	directMedicalExpenses,
	indirectMedicalExpenses,
	totalAmount,
	medicalAmount,
	otherAmount,
	directMedicalAmount,
	indirectMedicalAmount,
	expenseCount,
	refreshData,
	updateFilters,
	clearCache,
	initialize,
} = useExpense({ autoInitialize: false })

// Local state
const selectedCategory = ref<CategoryBreakdown | null>(null)
const sortOrder = ref<"asc" | "desc">("desc")
const expenseFilters = ref<ExpenseFilters>({
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
})

// Types
interface CategoryBreakdown {
	category: string
	type: "direct_medical" | "indirect_medical" | "other"
	count: number
	totalAmount: number
	averageAmount: number
	percentage: number
	expenses: FlattenedExpenseEntry[]
}

// Computed properties
const hasMedicalExpenses = computed(() => medicalExpenses.value.length > 0)
const medicalPercentage = computed(() =>
	totalAmount.value > 0 ? (medicalAmount.value / totalAmount.value) * 100 : 0,
)
const otherPercentage = computed(() =>
	totalAmount.value > 0 ? (otherAmount.value / totalAmount.value) * 100 : 0,
)
const totalCategories = computed(() => allCategories.value.length)
const totalTransactions = computed(() => expenses.value.length)
const filteredExpenseCount = computed(() => expenses.value.length)
const totalExpenseCount = computed(() => allExpenses.value.length)

// Create comprehensive category breakdown
const createAllCategories = (): CategoryBreakdown[] => {
	const allCats: CategoryBreakdown[] = []

	// Add direct medical categories
	const directCategories = createCategoryBreakdown(
		directMedicalExpenses.value,
		"direct_medical",
		directMedicalAmount.value,
	)
	allCats.push(...directCategories)

	// Add indirect medical categories
	const indirectCategories = createCategoryBreakdown(
		indirectMedicalExpenses.value,
		"indirect_medical",
		indirectMedicalAmount.value,
	)
	allCats.push(...indirectCategories)

	// Add other categories
	const otherCategories = createCategoryBreakdown(
		otherExpenses.value,
		"other",
		otherAmount.value,
	)
	allCats.push(...otherCategories)

	return allCats
}

const createCategoryBreakdown = (
	expenses: FlattenedExpenseEntry[],
	type: CategoryBreakdown["type"],
	totalAmount: number,
): CategoryBreakdown[] => {
	const categoryMap = new Map<string, FlattenedExpenseEntry[]>()

	expenses.forEach((expense) => {
		const category = expense.category || "Uncategorized"
		if (!categoryMap.has(category)) {
			categoryMap.set(category, [])
		}
		categoryMap.get(category)!.push(expense)
	})

	return Array.from(categoryMap.entries())
		.map(([category, categoryExpenses]) => {
			const categoryTotal = categoryExpenses.reduce(
				(sum, expense) => sum + (expense.amount || 0),
				0,
			)
			return {
				category,
				type,
				count: categoryExpenses.length,
				totalAmount: categoryTotal,
				averageAmount: Math.round(categoryTotal / categoryExpenses.length),
				percentage: totalAmount > 0 ? (categoryTotal / totalAmount) * 100 : 0,
				expenses: categoryExpenses.sort(
					(a, b) =>
						new Date(b.date_time).getTime() - new Date(a.date_time).getTime(),
				),
			}
		})
		.sort((a, b) => b.totalAmount - a.totalAmount)
}

const allCategories = computed(() => createAllCategories())

const sortedAllCategories = computed(() => {
	const sorted = [...allCategories.value]
	return sorted.sort((a, b) => {
		if (sortOrder.value === "desc") {
			return b.totalAmount - a.totalAmount
		} else {
			return a.totalAmount - b.totalAmount
		}
	})
})

// Helper functions
const getCategoryIcon = (type: string) => {
	switch (type) {
		case "direct_medical":
			return Stethoscope
		case "indirect_medical":
			return Car
		case "other":
			return ShoppingBag
		default:
			return Heart
	}
}

const getCategoryIconBg = (type: string) => {
	switch (type) {
		case "direct_medical":
			return "bg-blue-100 dark:bg-blue-900/30"
		case "indirect_medical":
			return "bg-purple-100 dark:bg-purple-900/30"
		case "other":
			return "bg-green-100 dark:bg-green-900/30"
		default:
			return "bg-gray-100 dark:bg-gray-900/30"
	}
}

const getCategoryIconColor = (type: string) => {
	switch (type) {
		case "direct_medical":
			return "text-blue-600 dark:text-blue-400"
		case "indirect_medical":
			return "text-purple-600 dark:text-purple-400"
		case "other":
			return "text-green-600 dark:text-green-400"
		default:
			return "text-gray-600 dark:text-gray-400"
	}
}

const getCategoryTypeLabel = (type: string) => {
	switch (type) {
		case "direct_medical":
			return "Direct Medical"
		case "indirect_medical":
			return "Indirect Medical"
		case "other":
			return "Other Expense"
		default:
			return "Medical"
	}
}

// Methods
const handleRefresh = async () => {
	try {
		clearCache()
		await refreshData({
			withAnalytics: true,
			useCache: false,
		})
	} catch (err) {
		console.error("Error refreshing data:", err)
	}
}

const handleFiltersUpdate = async (newFilters: ExpenseFilters) => {
	expenseFilters.value = { ...newFilters }
	await updateFilters(newFilters)
	await refreshData({
		withAnalytics: true,
		useCache: true,
	})
}

const toggleSortOrder = () => {
	sortOrder.value = sortOrder.value === "desc" ? "asc" : "desc"
}

const selectCategory = (category: CategoryBreakdown) => {
	selectedCategory.value =
		selectedCategory.value?.category === category.category &&
		selectedCategory.value?.type === category.type
			? null
			: category
}

const handleMedicalCategorySelected = (category: any) => {
	console.log("Medical category selected:", category)
	// Handle medical category selection if needed
}

const handleMedicalExport = (data: any) => {
	console.log("Medical categorization export requested:", data)
	// Handle export functionality
	const blob = new Blob([JSON.stringify(data, null, 2)], {
		type: "application/json",
	})
	const url = URL.createObjectURL(blob)
	const a = document.createElement("a")
	a.href = url
	a.download = `medical-categorization-${new Date().toISOString().split("T")[0]}.json`
	document.body.appendChild(a)
	a.click()
	document.body.removeChild(a)
	URL.revokeObjectURL(url)
}

// Lifecycle
onMounted(async () => {
	try {
		await initialize({
			withAnalytics: true,
			period: "this_month",
		})
	} catch (err) {
		console.error("Error loading initial data:", err)
	}
})
</script>

<style scoped>
.categories-enhanced {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8;
}
</style>