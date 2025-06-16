<template>
  <div class="categories-enhanced">
    <!-- Header Section -->
    <div class="header-section mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Expense Categories</h1>
          <p class="text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-1">Analyze your spending patterns with detailed category breakdown</p>
        </div>
        <div class="flex items-center space-x-3">
          <button 
            @click="handleRefresh"
            :disabled="loading"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 bg-white dark:bg-gray-800 dark:bg-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 dark:bg-gray-100 disabled:opacity-50 transition-colors"
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
        :filters="expenseFilters"
        :total-count="totalExpenseCount"
        :filtered-count="filteredExpenseCount"
        @update:filters="handleFiltersUpdate"
      />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p class="text-gray-600 dark:text-gray-400 dark:text-gray-500 ml-3">Loading category analysis...</p>
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
            <h3 class="text-sm font-medium  dark:text-red-200" :class="getFinancialStatusClass('expense', '800')">Error Loading Categories</h3>
            <p class="text-sm  dark:text-red-300 mt-1" :class="getFinancialStatusClass('expense', '700')">{{ error }}</p>
          </div>
        </div>
        <div class="mt-4">
          <button 
            @click="handleRefresh"
            class="bg-red-100 dark:bg-red-900/30 hover:bg-red-200  dark:text-red-200 px-3 py-1 rounded text-sm transition-colors" :class="getFinancialStatusClass('expense', '800')"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="categories-content space-y-6">
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <!-- Total Expenses -->
        <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Calculator class="w-4 h-4  dark:text-blue-400" :class="getFinancialStatusClass('medical', '600')" />
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Total Expenses</p>
              <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">₹{{ totalExpenseAmount.toLocaleString() }}</p>
            </div>
          </div>
        </div>

        <!-- Medical Expenses -->
        <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <Heart class="w-4 h-4  dark:text-red-400" :class="getFinancialStatusClass('expense', '600')" />
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Medical Expenses</p>
              <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">₹{{ medicalExpenseAmount.toLocaleString() }}</p>
            </div>
          </div>
        </div>

        <!-- Other Expenses -->
        <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <ShoppingBag class="w-4 h-4  dark:text-green-400" :class="getFinancialStatusClass('income', '600')" />
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Other Expenses</p>
              <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">₹{{ otherExpenseAmount.toLocaleString() }}</p>
            </div>
          </div>
        </div>

        <!-- Expense Count -->
        <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <TrendingUp class="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Total Transactions</p>
              <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ expenseCount }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Medical Categorization Component -->
      <div class="mb-6">
        <MedicalCategorization 
          :medical-expenses="medicalExpenses"
          @category-selected="handleMedicalCategorySelected"
          @export-requested="handleMedicalExport"
        />
      </div>

      <!-- Category Breakdown -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Medical Categories Summary -->
        <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-6">
          <h3 class="text-lg font-semibold text-red-900 mb-4 flex items-center">
            <Heart class="w-5 h-5 mr-2" />
            Medical Expenses Summary ({{ medicalExpenses.length }})
          </h3>
          <div class="space-y-3">
            <div 
              v-for="category in medicalCategoryBreakdown" 
              :key="category.category"
              class="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:bg-red-900/30 transition-colors cursor-pointer"
              @click="selectCategory(category)"
            >
              <div class="flex items-center">
                <div class="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center mr-3">
                  <Heart class="w-4 h-4  dark:text-red-400" :class="getFinancialStatusClass('expense', '600')" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ category.category }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{{ category.count }} transactions</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">₹{{ category.totalAmount.toLocaleString() }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{{ category.percentage.toFixed(1) }}%</p>
              </div>
            </div>
            <div v-if="medicalCategoryBreakdown.length === 0" class="text-center py-4 text-gray-500 dark:text-gray-400 dark:text-gray-500">
              <p class="text-sm">No medical expenses found</p>
            </div>
          </div>
        </div>

        <!-- Other Categories -->
        <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-6">
          <h3 class="text-lg font-semibold text-green-900 mb-4 flex items-center">
            <ShoppingBag class="w-5 h-5 mr-2" />
            Other Expenses ({{ otherExpenses.length }})
          </h3>
          <div class="space-y-3">
            <div 
              v-for="category in otherCategoryBreakdown" 
              :key="category.category"
              class="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:bg-green-900/30 transition-colors cursor-pointer"
              @click="selectCategory(category)"
            >
              <div class="flex items-center">
                <div class="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mr-3">
                  <ShoppingBag class="w-4 h-4  dark:text-green-400" :class="getFinancialStatusClass('income', '600')" />
                </div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ category.category }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{{ category.count }} transactions</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">₹{{ category.totalAmount.toLocaleString() }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{{ category.percentage.toFixed(1) }}%</p>
              </div>
            </div>
            <div v-if="otherCategoryBreakdown.length === 0" class="text-center py-4 text-gray-500 dark:text-gray-400 dark:text-gray-500">
              <p class="text-sm">No other expenses found</p>
            </div>
          </div>
        </div>
      </div>



      <!-- Selected Category Details -->
      <div v-if="selectedCategory" class="category-details">
        <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-6">
          <div class="flex items-center justify-between mb-6">
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Heart class="w-5 h-5  dark:text-blue-400" :class="getFinancialStatusClass('medical', '600')" />
              </div>
              <div>
                <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ selectedCategory.category }} Details</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                  {{ selectedCategory.type }} • 
                  {{ selectedCategory.count }} transactions • 
                  ₹{{ selectedCategory.averageAmount.toLocaleString() }} average
                </p>
              </div>
            </div>
            <button 
              @click="selectedCategory = null"
              class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:text-gray-500"
            >
              <X class="w-5 h-5" />
            </button>
          </div>

          <!-- Category Expenses List -->
          <div class="space-y-3">
            <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Recent Transactions</h3>
            <div 
              v-for="expense in selectedCategory.expenses.slice(0, 10)" 
              :key="expense.id"
              class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 dark:bg-gray-100 rounded-lg"
            >
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ expense.description || expense.category }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{{ formatDate(expense.date) }}</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">₹{{ expense.amount.toLocaleString() }}</p>
                <span v-if="expense.hasReceipt" class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30  dark:text-green-200" :class="getFinancialStatusClass('income', '800')">
                  Receipt
                </span>
              </div>
            </div>
            <div v-if="selectedCategory.expenses.length > 10" class="text-center pt-3">
              <p class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Showing 10 of {{ selectedCategory.expenses.length }} transactions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
	AlertCircle,
	Calculator,
	Heart,
	RefreshCw,
	ShoppingBag,
	TrendingUp,
	X,
} from "lucide-vue-next"
import { computed, onMounted, ref } from "vue"
import ExpenseFilter from "../../components/expense/ExpenseFilter.vue"
import MedicalCategorization from "../../components/expense/MedicalCategorization.vue"
import { useExpense } from "../../composables/useExpense"

import type { ExpenseFilters, ProcessedExpenseItem } from "../../types/expense"

// Composables
const {
	expenses,
	allExpenses,
	loading,
	error,
	medicalExpenses,
	otherExpenses,
	totalExpenseAmount,
	medicalExpenseAmount,
	otherExpenseAmount,
	expenseCount,
	totalExpenseCount,
	loadExpenses,
	refreshExpenses,
	updateFilters,
	clearCache,
} = useExpense({ enableAdvancedAnalysis: false })

// Local state
const selectedCategory = ref<CategoryBreakdown | null>(null)
const expenseFilters = ref<ExpenseFilters>({
	searchTerm: "",
	dateFrom: "",
	dateTo: "",
	amountMin: "",
	amountMax: "",
	category: "",
	type: "",
	sortBy: "date",
	sortOrder: "desc",
	period: "this-month",
})

// Category breakdown interface
interface CategoryBreakdown {
	category: string
	type: "medical" | "other"
	count: number
	totalAmount: number
	averageAmount: number
	percentage: number
	expenses: ProcessedExpenseItem[]
}

// Computed properties for category analysis
const medicalCategoryBreakdown = computed((): CategoryBreakdown[] => {
	const categoryMap = new Map<string, ProcessedExpenseItem[]>()

	medicalExpenses.value.forEach((expense) => {
		const category = expense.category
		if (!categoryMap.has(category)) {
			categoryMap.set(category, [])
		}
		categoryMap.get(category)!.push(expense)
	})

	const totalMedical = medicalExpenseAmount.value

	return Array.from(categoryMap.entries())
		.map(([category, expenses]) => {
			const totalAmount = expenses.reduce(
				(sum, expense) => sum + expense.amount,
				0,
			)
			return {
				category,
				type: "medical" as const,
				count: expenses.length,
				totalAmount,
				averageAmount: totalAmount / expenses.length,
				percentage: totalMedical > 0 ? (totalAmount / totalMedical) * 100 : 0,
				expenses: expenses.sort(
					(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
				),
			}
		})
		.sort((a, b) => b.totalAmount - a.totalAmount)
})

const otherCategoryBreakdown = computed((): CategoryBreakdown[] => {
	const categoryMap = new Map<string, ProcessedExpenseItem[]>()

	otherExpenses.value.forEach((expense) => {
		const category = expense.category
		if (!categoryMap.has(category)) {
			categoryMap.set(category, [])
		}
		categoryMap.get(category)!.push(expense)
	})

	const totalOther = otherExpenseAmount.value

	return Array.from(categoryMap.entries())
		.map(([category, expenses]) => {
			const totalAmount = expenses.reduce(
				(sum, expense) => sum + expense.amount,
				0,
			)
			return {
				category,
				type: "other" as const,
				count: expenses.length,
				totalAmount,
				averageAmount: totalAmount / expenses.length,
				percentage: totalOther > 0 ? (totalAmount / totalOther) * 100 : 0,
				expenses: expenses.sort(
					(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
				),
			}
		})
		.sort((a, b) => b.totalAmount - a.totalAmount)
})

const filteredExpenseCount = computed(() => expenses.value.length)

// Methods
const handleRefresh = async () => {
	try {
		clearCache()
		await refreshExpenses()
	} catch (err) {
		console.error("Error refreshing data:", err)
	}
}

const handleFiltersUpdate = async (newFilters: ExpenseFilters) => {
	expenseFilters.value = { ...newFilters }
	await updateFilters(newFilters)
}

const selectCategory = (category: CategoryBreakdown) => {
	selectedCategory.value =
		selectedCategory.value?.category === category.category ? null : category
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

const formatDate = (dateString: string): string => {
	try {
		return new Date(dateString).toLocaleDateString("en-IN", {
			year: "numeric",
			month: "short",
			day: "numeric",
		})
	} catch {
		return dateString
	}
}

// Lifecycle
onMounted(async () => {
	try {
		await loadExpenses({ useCache: true })
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