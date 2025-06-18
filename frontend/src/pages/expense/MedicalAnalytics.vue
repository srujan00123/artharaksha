<template>
  <div class="medical-analytics">
    <!-- Header Section -->
    <div class="header-section mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Medical Expense Analytics</h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">Comprehensive CHE analysis according to WHO standards</p>
        </div>
        <div class="flex items-center space-x-3">
          <button 
            @click="handleRefresh"
            :disabled="isLoading"
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
    <div v-if="isLoading" class="loading-state">
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p class="text-gray-600 dark:text-gray-400 ml-3">Loading medical analytics...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="hasError" class="error-state">
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <AlertCircle class="h-5 w-5 text-red-400" />
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error Loading Medical Analytics</h3>
            <p class="text-sm text-red-700 dark:text-red-300 mt-1">{{ errorMessage }}</p>
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
    <div v-else class="analytics-content space-y-6">
      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <!-- Total Medical Expenses -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <Heart class="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Medical</p>
                <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">₹{{ medicalExpenseAmount.toLocaleString() }}</p>
              </div>
            </div>
          </div>

          <!-- Monthly Income -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <TrendingUp class="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Monthly Income</p>
                <p v-if="totalIncomeAmount > 0" class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  ₹{{ totalIncomeAmount.toLocaleString() }}
                </p>
                <p v-else class="text-lg font-semibold text-gray-500 dark:text-gray-400">N/A</p>
              </div>
            </div>
          </div>

          <!-- CHE Ratio -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Percent class="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">CHE Ratio</p>
                <p v-if="hasIncomeData" class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {{ cheRatio.toFixed(2) }}%
                </p>
                <p v-else class="text-lg font-semibold text-gray-500 dark:text-gray-400">N/A</p>
              </div>
            </div>
          </div>

          <!-- Risk Level -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div :class="getRiskLevelBgColor(riskLevel)" class="w-8 h-8 rounded-full flex items-center justify-center">
                  <Shield :class="getRiskLevelTextColor(riskLevel)" class="w-4 h-4" />
                </div>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Risk Level</p>
                <p :class="getRiskLevelTextColor(riskLevel)" class="text-sm font-semibold capitalize">{{ riskLevel }}</p>
              </div>
            </div>
          </div>

          <!-- Financial Protection Status -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div :class="getProtectionStatusBgColor(financialProtectionStatus)" class="w-8 h-8 rounded-full flex items-center justify-center">
                  <Shield :class="getProtectionStatusTextColor(financialProtectionStatus)" class="w-4 h-4" />
                </div>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Protection</p>
                <p :class="getProtectionStatusTextColor(financialProtectionStatus)" class="text-xs font-semibold capitalize">{{ financialProtectionStatus.replace('_', ' ') }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Income Data Missing Alert -->
      <div v-if="!hasIncomeData" class="income-missing-alert">
        <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <AlertTriangle class="h-5 w-5 text-yellow-400" />
            </div>
            <div class="ml-3 flex-1">
              <h3 class="text-sm font-medium text-yellow-800">
                Income Data Required for CHE Analysis
              </h3>
              <p class="text-sm text-yellow-700 mt-1">
                To perform accurate Catastrophic Health Expenditure analysis according to WHO standards, please add your income information.
              </p>
              <div class="mt-3">
                <router-link 
                  to="/income/management"
                  class="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-yellow-800 bg-yellow-100 dark:bg-yellow-900/30 hover:bg-yellow-200 transition-colors"
                >
                  Add Income Data
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- WHO CHE Threshold Analysis -->
      <div v-if="hasIncomeData" class="che-thresholds">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">WHO CHE Threshold Analysis</h2>
          
          <div class="space-y-6">
            <!-- 10% Threshold -->
            <div class="threshold-analysis">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100">10% Income Threshold (WHO Standard)</h3>
                <span :class="che10Status.class" class="text-sm font-medium px-3 py-1 rounded-full">
                  {{ che10Status.text }}
                </span>
              </div>
              <div class="relative">
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6">
                  <div 
                    :class="che10Status.progressClass"
                    class="h-6 rounded-full transition-all duration-1000 ease-out relative overflow-hidden" 
                    :style="{ width: Math.min((cheRatio / 10) * 100, 100) + '%' }"
                  >
                    <div class="absolute inset-0 bg-gradient-to-r from-transparent to-white opacity-30 animate-pulse"></div>
                  </div>
                </div>
                <div class="absolute inset-0 flex items-center justify-center">
                  <span class="text-xs font-semibold text-gray-700 dark:text-gray-300">{{ cheRatio.toFixed(2) }}% / 10%</span>
                </div>
              </div>
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Households spending more than 10% of income on health are considered to face catastrophic health expenditure.
              </p>
            </div>

            <!-- 25% Threshold -->
            <div class="threshold-analysis">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100">25% Income Threshold (Severe CHE)</h3>
                <span :class="che25Status.class" class="text-sm font-medium px-3 py-1 rounded-full">
                  {{ che25Status.text }}
                </span>
              </div>
              <div class="relative">
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6">
                  <div 
                    :class="che25Status.progressClass"
                    class="h-6 rounded-full transition-all duration-1000 ease-out relative overflow-hidden" 
                    :style="{ width: Math.min((cheRatio / 25) * 100, 100) + '%' }"
                  >
                    <div class="absolute inset-0 bg-gradient-to-r from-transparent to-white opacity-30 animate-pulse"></div>
                  </div>
                </div>
                <div class="absolute inset-0 flex items-center justify-center">
                  <span class="text-xs font-semibold text-gray-700 dark:text-gray-300">{{ cheRatio.toFixed(2) }}% / 25%</span>
                </div>
              </div>
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Spending above 25% indicates severe financial hardship and potential impoverishment due to health costs.
              </p>
            </div>

            <!-- 40% Threshold -->
            <div class="threshold-analysis">
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100">40% Income Threshold (Critical CHE)</h3>
                <span :class="che40Status.class" class="text-sm font-medium px-3 py-1 rounded-full">
                  {{ che40Status.text }}
                </span>
              </div>
              <div class="relative">
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-6">
                  <div 
                    :class="che40Status.progressClass"
                    class="h-6 rounded-full transition-all duration-1000 ease-out relative overflow-hidden" 
                    :style="{ width: Math.min((cheRatio / 40) * 100, 100) + '%' }"
                  >
                    <div class="absolute inset-0 bg-gradient-to-r from-transparent to-white opacity-30 animate-pulse"></div>
                  </div>
                </div>
                <div class="absolute inset-0 flex items-center justify-center">
                  <span class="text-xs font-semibold text-gray-700 dark:text-gray-300">{{ cheRatio.toFixed(2) }}% / 40%</span>
                </div>
              </div>
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Spending above 40% represents critical financial distress requiring immediate intervention.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Medical Category Breakdown Table -->
      <div class="category-breakdown">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Medical Expense Categories Summary</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Medical Categories Summary -->
            <div>
              <h3 class="text-sm font-medium text-red-900 mb-3 flex items-center">
                <Heart class="w-4 h-4 mr-2" />
                Medical Expenses Summary ({{ medicalExpensesList.length }})
              </h3>
              <div class="space-y-2">
                <div 
                  v-for="category in medicalCategoryBreakdown" 
                  :key="category.category"
                  class="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  <div class="flex items-center">
                    <div class="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                    <div>
                      <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ category.category }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{{ category.count }} transactions</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">₹{{ category.totalAmount.toLocaleString() }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ category.percentage.toFixed(1) }}%</p>
                  </div>
                </div>
                <div v-if="medicalCategoryBreakdown.length === 0" class="text-center py-4 text-gray-500 dark:text-gray-400">
                  <p class="text-sm">No medical expenses found</p>
                </div>
              </div>
            </div>

            <!-- Financial Impact Analysis -->
            <div v-if="hasIncomeData">
              <h3 class="text-sm font-medium text-blue-900 mb-3 flex items-center">
                <Calculator class="w-4 h-4 mr-2" />
                Financial Impact Analysis
              </h3>
              <div class="space-y-3">
                <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-gray-900 dark:text-gray-100">Monthly Income</span>
                    <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">₹{{ totalIncomeAmount.toLocaleString() }}</span>
                  </div>
                </div>
                <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-gray-900 dark:text-gray-100">Medical Expenses</span>
                    <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">₹{{ medicalExpenseAmount.toLocaleString() }}</span>
                  </div>
                </div>
                <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-gray-900 dark:text-gray-100">Remaining Income</span>
                    <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">₹{{ (totalIncomeAmount - medicalExpenseAmount).toLocaleString() }}</span>
                  </div>
                </div>
                <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 hover:bg-purple-100 transition-colors">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-gray-900 dark:text-gray-100">CHE Ratio</span>
                    <span :class="getRiskLevelTextColor(riskLevel)" class="text-sm font-semibold">{{ cheRatio.toFixed(2) }}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recommendations -->
      <div v-if="hasIncomeData" class="recommendations">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recommendations</h2>
          <div class="space-y-3">
            <div v-for="recommendation in getRecommendations()" :key="recommendation.title" class="recommendation-item">
              <div :class="recommendation.bgClass" class="p-4 rounded-lg border hover:shadow-sm transition-all">
                <div class="flex items-start">
                  <component :is="recommendation.icon" :class="recommendation.iconClass" class="w-5 h-5 mt-0.5 mr-3" />
                  <div>
                    <h4 :class="recommendation.titleClass" class="font-semibold">{{ recommendation.title }}</h4>
                    <p :class="recommendation.textClass" class="text-sm mt-1">{{ recommendation.description }}</p>
                  </div>
                </div>
              </div>
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
	AlertTriangle,
	Calculator,
	CheckCircle,
	Heart,
	Info,
	Percent,
	RefreshCw,
	Shield,
	TrendingUp,
	XCircle,
} from "lucide-vue-next"
import { computed, onMounted, ref } from "vue"

import ExpenseFilter from "../../components/expense/ExpenseFilter.vue"
import { useExpense } from "../../composables/useExpense"
import { useIncome } from "../../composables/useIncome"
import type { ExpenseFilters, FlattenedExpenseEntry } from "../../types/expense"

// Composables
const {
	medicalExpenses,
	medicalAmount,
	fetchExpenses,
	refreshExpenses,
	updateFilters,
	clearCache: clearExpenseCache,
	loading: expenseLoading,
	error: expenseError,
	expenses,
	allExpenses,
} = useExpense({ autoInitialize: false })

const {
	totalIncome,
	initialize: initializeIncome,
	loading: incomeLoading,
	error: incomeError,
} = useIncome()

// Local state
const isLoading = ref(true)
const errorMessage = ref("")
const expenseFilters = ref<ExpenseFilters>({
	searchTerm: "",
	dateFrom: "",
	dateTo: "",
	amountMin: undefined,
	amountMax: undefined,
	category: "",
	type: "medical", // Default to medical expenses only
	sortBy: "date",
	sortOrder: "desc",
	period: "this_month",
})

// Computed properties
const hasError = computed(() => !!errorMessage.value)
const filteredExpenseCount = computed(() => expenses.value.length)
const totalExpenseCount = computed(() => allExpenses.value.length)
const medicalExpenseAmount = computed(() => medicalAmount.value || 0)
const totalIncomeAmount = computed(() => totalIncome.value || 0)
const hasIncomeData = computed(() => totalIncomeAmount.value > 0)
const medicalExpensesList = computed(() => medicalExpenses.value || [])

// CHE Calculations according to WHO standards
const cheRatio = computed(() => {
	if (!hasIncomeData.value || medicalExpenseAmount.value === 0) return 0
	return (medicalExpenseAmount.value / totalIncomeAmount.value) * 100
})

const riskLevel = computed(() => {
	if (!hasIncomeData.value) return "unknown"
	const ratio = cheRatio.value

	if (ratio <= 10) return "minimal"
	if (ratio <= 25) return "moderate"
	if (ratio <= 40) return "high"
	return "critical"
})

const financialProtectionStatus = computed(() => {
	if (!hasIncomeData.value) return "unknown"
	const ratio = cheRatio.value

	if (ratio <= 10) return "protected"
	if (ratio <= 25) return "partially_protected"
	return "unprotected"
})

// WHO Threshold Status
const che10Status = computed(() => {
	const ratio = cheRatio.value
	const exceeded = ratio > 10

	return {
		text: exceeded ? "CHE Detected" : "Safe",
		class: exceeded ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800",
		progressClass: exceeded
			? "bg-gradient-to-r from-red-400 to-red-600"
			: "bg-gradient-to-r from-green-400 to-green-600",
	}
})

const che25Status = computed(() => {
	const ratio = cheRatio.value
	const exceeded = ratio > 25

	return {
		text: exceeded ? "Severe CHE" : "Safe",
		class: exceeded ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800",
		progressClass: exceeded
			? "bg-gradient-to-r from-red-500 to-red-700"
			: "bg-gradient-to-r from-yellow-400 to-yellow-600",
	}
})

const che40Status = computed(() => {
	const ratio = cheRatio.value
	const exceeded = ratio > 40

	return {
		text: exceeded ? "Critical CHE" : "Safe",
		class: exceeded ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800",
		progressClass: exceeded
			? "bg-gradient-to-r from-red-600 to-red-800"
			: "bg-gradient-to-r from-red-400 to-red-600",
	}
})

// Category breakdown
interface CategoryBreakdown {
	category: string
	count: number
	totalAmount: number
	percentage: number
}

const medicalCategoryBreakdown = computed((): CategoryBreakdown[] => {
	const categoryMap = new Map<string, FlattenedExpenseEntry[]>()

	medicalExpensesList.value.forEach((expense) => {
		const category = expense.category || "Uncategorized"
		if (!categoryMap.has(category)) {
			categoryMap.set(category, [])
		}
		categoryMap.get(category)!.push(expense)
	})

	const totalMedical = medicalExpenseAmount.value

	return Array.from(categoryMap.entries())
		.map(([category, expenses]) => {
			const totalAmount = expenses.reduce(
				(sum, expense) => sum + (expense.amount || 0),
				0,
			)
			return {
				category,
				count: expenses.length,
				totalAmount,
				percentage: totalMedical > 0 ? (totalAmount / totalMedical) * 100 : 0,
			}
		})
		.sort((a, b) => b.totalAmount - a.totalAmount)
})

// Risk level styling functions
const getRiskLevelBgColor = (level: string) => {
	const colors = {
		minimal: "bg-green-100",
		moderate: "bg-yellow-100",
		high: "bg-orange-100",
		critical: "bg-red-100",
		unknown: "bg-gray-100",
	}
	return colors[level] || colors.unknown
}

const getRiskLevelTextColor = (level: string) => {
	const colors = {
		minimal: "text-green-600",
		moderate: "text-yellow-600",
		high: "text-orange-600",
		critical: "text-red-600",
		unknown: "text-gray-600",
	}
	return colors[level] || colors.unknown
}

const getProtectionStatusBgColor = (status: string) => {
	const colors = {
		protected: "bg-green-100",
		partially_protected: "bg-yellow-100",
		unprotected: "bg-red-100",
		unknown: "bg-gray-100",
	}
	return colors[status] || colors.unknown
}

const getProtectionStatusTextColor = (status: string) => {
	const colors = {
		protected: "text-green-600",
		partially_protected: "text-yellow-600",
		unprotected: "text-red-600",
		unknown: "text-gray-600",
	}
	return colors[status] || colors.unknown
}

// Recommendations
const getRecommendations = () => {
	const level = riskLevel.value
	const recommendations: Array<{
		title: string
		description: string
		icon: any
		bgClass: string
		iconClass: string
		titleClass: string
		textClass: string
	}> = []

	if (level === "minimal") {
		recommendations.push({
			title: "Maintain Financial Health",
			description:
				"Continue your current approach and build emergency savings for unexpected medical costs.",
			icon: CheckCircle,
			bgClass: "bg-green-50",
			iconClass: "text-green-500",
			titleClass: "text-green-800",
			textClass: "text-green-700",
		})
	}

	if (level === "moderate") {
		recommendations.push({
			title: "Review Healthcare Costs",
			description:
				"Consider exploring health insurance options and preventive care to reduce future medical expenses.",
			icon: Info,
			bgClass: "bg-yellow-50",
			iconClass: "text-yellow-500",
			titleClass: "text-yellow-800",
			textClass: "text-yellow-700",
		})
	}

	if (level === "high" || level === "critical") {
		recommendations.push({
			title: "Urgent Financial Protection Needed",
			description:
				"Seek immediate assistance through government health schemes, insurance, or financial counseling.",
			icon: XCircle,
			bgClass: "bg-red-50",
			iconClass: "text-red-500",
			titleClass: "text-red-800",
			textClass: "text-red-700",
		})
	}

	// Always recommend exploring schemes
	recommendations.push({
		title: "Explore Government Health Schemes",
		description:
			"Check eligibility for Ayushman Bharat, state health insurance, and other welfare programs.",
		icon: Shield,
		bgClass: "bg-blue-50",
		iconClass: "text-blue-500",
		titleClass: "text-blue-800",
		textClass: "text-blue-700",
	})

	return recommendations
}

// Methods
const loadData = async () => {
	try {
		isLoading.value = true
		errorMessage.value = ""

		// Set medical filter by default
		await updateFilters(expenseFilters.value)
		
		// Fetch expenses first
		await fetchExpenses({ useCache: true, forceRefresh: false })
		
		// Try to initialize income (but don't fail if it doesn't work)
		try {
			await initializeIncome({ withAnalytics: true, forceRefresh: false, period: "this_month" })
		} catch (incomeErr) {
			console.warn("Income initialization failed:", incomeErr)
			// Don't throw - just continue without income data
		}
		
	} catch (err: any) {
		console.error("Error loading data:", err)
		errorMessage.value = err.message || "Failed to load medical analytics data"
	} finally {
		isLoading.value = false
	}
}

const handleRefresh = async () => {
	try {
		clearExpenseCache()
		await loadData()
	} catch (err: any) {
		console.error("Error refreshing data:", err)
		errorMessage.value = err.message || "Failed to refresh data"
	}
}

const handleFiltersUpdate = async (newFilters: ExpenseFilters) => {
	try {
		expenseFilters.value = { ...newFilters }
		await updateFilters(newFilters)
		await fetchExpenses({ forceRefresh: false, useCache: true })
	} catch (err: any) {
		console.error("Error updating filters:", err)
		errorMessage.value = err.message || "Failed to update filters"
	}
}

// Lifecycle
onMounted(async () => {
	await loadData()
})
</script>

<style scoped>
.medical-analytics {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8;
}

.threshold-analysis {
  @apply border border-gray-200 rounded-lg p-4;
}

.recommendation-item {
  @apply transition-all duration-200;
}

/* Custom animations for progress bars */
@keyframes progressFill {
  from {
    width: 0%;
  }
  to {
    width: var(--progress-width);
  }
}

.animate-progress {
  animation: progressFill 1s ease-out;
}
</style>