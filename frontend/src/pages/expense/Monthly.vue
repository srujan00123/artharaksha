<template>
  <div class="monthly-expenses">
    <!-- Header Section -->
    <div class="header-section mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Monthly Expense Analysis</h1>
          <p class="text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-1">Track and analyze your month-wise spending patterns</p>
        </div>
        <div class="flex items-center space-x-3">
          <button 
            @click="handleRefresh"
            :disabled="state.loading"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 bg-white dark:bg-gray-800 dark:bg-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 dark:bg-gray-100 disabled:opacity-50 transition-colors"
          >
            <RefreshCw class="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="state.loading" class="loading-state">
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p class="text-gray-600 dark:text-gray-400 dark:text-gray-500 ml-3">Loading monthly analysis...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="state.error" class="error-state">
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <AlertCircle class="h-5 w-5 text-red-400" />
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error Loading Data</h3>
            <p class="text-sm text-red-700 dark:text-red-300 mt-1">{{ state.error }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="space-y-6">
      <!-- Monthly Trend Analysis -->
      <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Monthly Trend Analysis</h2>
          <div class="flex items-center space-x-2">
            <span class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{{ monthlyAnalysis.period }}</span>
            <TrendingUp class="w-4 h-4 text-green-600 dark:text-green-400" v-if="monthlyAnalysis.trend === 'up'" />
            <TrendingDown class="w-4 h-4 text-red-600 dark:text-red-400" v-else-if="monthlyAnalysis.trend === 'down'" />
            <Minus class="w-4 h-4 text-gray-400 dark:text-gray-500" v-else />
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="text-center">
            <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">₹{{ monthlyAnalysis.currentMonth.toLocaleString() }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">This Month</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-gray-600 dark:text-gray-400 dark:text-gray-500">₹{{ monthlyAnalysis.lastMonth.toLocaleString() }}</p>
            <p class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Last Month</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold" :class="monthlyAnalysis.changeClass">
              {{ monthlyAnalysis.changeText }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Change</p>
          </div>
        </div>

        <!-- Quick insights -->
        <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg" v-if="monthlyAnalysis.insight">
          <p class="text-sm text-blue-800 dark:text-blue-200">
            <Lightbulb class="w-4 h-4 inline mr-1" />
            {{ monthlyAnalysis.insight }}
          </p>
        </div>
      </div>

      <!-- Monthly Breakdown Chart -->
      <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Last 6 Months Breakdown</h2>
        <div class="space-y-4">
          <div 
            v-for="month in monthlyBreakdown" 
            :key="month.period"
            class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 dark:bg-gray-100 rounded-lg"
          >
            <div class="flex items-center space-x-3">
              <div class="w-12 text-center">
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ month.monthShort }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{{ month.year }}</p>
              </div>
              <div class="flex-1">
                <div class="flex items-center space-x-2 mb-1">
                  <p class="text-sm font-medium text-gray-900 dark:text-gray-100">₹{{ month.total.toLocaleString() }}</p>
                  <span v-if="month.change !== 0" :class="month.changeClass" class="text-xs">
                    {{ month.changeText }}
                  </span>
                </div>
                <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    class="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    :style="{ width: month.percentage + '%' }"
                  ></div>
                </div>
              </div>
            </div>
            <div class="text-right text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
              {{ month.count }} expenses
            </div>
          </div>
        </div>
      </div>

      <!-- Category Breakdown This Month -->
      <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">This Month by Category</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div 
            v-for="category in currentMonthCategories" 
            :key="category.name"
            class="bg-gray-50 dark:bg-gray-900 dark:bg-gray-100 rounded-lg p-4"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center space-x-2">
                <div :class="category.colorClass" class="w-3 h-3 rounded-full"></div>
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ category.name }}</p>
              </div>
              <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">₹{{ category.amount.toLocaleString() }}</p>
            </div>
            <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
              <span>{{ category.count }} expenses</span>
              <span>{{ category.percentage }}%</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-2">
              <div 
                :class="category.colorClass" 
                class="h-1.5 rounded-full transition-all duration-300" 
                :style="{ width: category.percentage + '%' }"
              ></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Expenses This Month -->
      <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Recent Expenses This Month</h2>
          <router-link 
            to="/expenses/overview" 
            class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-200 text-sm font-medium"
          >
            View All →
          </router-link>
        </div>

        <div v-if="recentExpenses.length === 0" class="text-center py-8">
          <FileText class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
          <p class="text-gray-500 dark:text-gray-400 dark:text-gray-500">No expenses recorded this month</p>
        </div>

        <div v-else class="space-y-2">
          <div 
            v-for="expense in recentExpenses" 
            :key="expense.id"
            class="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 dark:bg-gray-100 rounded-lg transition-colors"
          >
            <div class="flex items-center space-x-3">
              <div :class="getCategoryColor(expense.category)" class="w-2 h-2 rounded-full"></div>
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ expense.category }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{{ formatDate(expense.date) }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">₹{{ expense.amount.toLocaleString() }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500" v-if="expense.description">{{ expense.description }}</p>
            </div>
          </div>
        </div>
      </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { 
  RefreshCw, 
  AlertCircle, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Lightbulb,
  FileText
} from 'lucide-vue-next'
import type { ProcessedExpenseItem } from '../../types/expense'

// Composables
import { useExpense } from '../../composables/useExpense'

// Initialize composable
const composableResult = useExpense({ enableAdvancedAnalysis: true }) as any
const state = composableResult.state
const actions = composableResult.actions

// Monthly analysis computed property
const monthlyAnalysis = computed(() => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  // Calculate current month expenses
  const currentMonthExpenses = state.filteredExpenses.filter((expense: ProcessedExpenseItem) => {
    const expenseDate = new Date(expense.date)
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
  })
  
  // Calculate last month expenses
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear
  const lastMonthExpenses = state.filteredExpenses.filter((expense: ProcessedExpenseItem) => {
    const expenseDate = new Date(expense.date)
    return expenseDate.getMonth() === lastMonth && expenseDate.getFullYear() === lastMonthYear
  })
  
  const currentMonthTotal = currentMonthExpenses.reduce((sum: number, expense: ProcessedExpenseItem) => sum + expense.amount, 0)
  const lastMonthTotal = lastMonthExpenses.reduce((sum: number, expense: ProcessedExpenseItem) => sum + expense.amount, 0)
  
  // Calculate change
  const change = currentMonthTotal - lastMonthTotal
  const changePercentage = lastMonthTotal > 0 ? (change / lastMonthTotal) * 100 : 0
  
  let trend: 'up' | 'down' | 'stable' = 'stable'
  let changeClass = 'text-gray-600'
  let changeText = '₹0'
  let insight = ''
  
  if (change > 0) {
    trend = 'up'
    changeClass = 'text-red-600'
    changeText = `+₹${change.toLocaleString()}`
    insight = `You spent ${changePercentage.toFixed(1)}% more this month compared to last month.`
  } else if (change < 0) {
    trend = 'down' 
    changeClass = 'text-green-600'
    changeText = `-₹${Math.abs(change).toLocaleString()}`
    insight = `Great! You saved ${Math.abs(changePercentage).toFixed(1)}% compared to last month.`
  } else {
    insight = 'Your spending this month is similar to last month.'
  }
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const period = `${monthNames[currentMonth]} vs ${monthNames[lastMonth]}`
  
  return {
    currentMonth: currentMonthTotal,
    lastMonth: lastMonthTotal,
    change,
    changePercentage,
    trend,
    changeClass,
    changeText,
    period,
    insight
  }
})

// Monthly breakdown for last 6 months
const monthlyBreakdown = computed(() => {
  const now = new Date()
  
  // Define the type for monthly breakdown items
  interface MonthlyBreakdownItem {
    period: string
    monthShort: string
    year: number
    total: number
    count: number
    change: number
    changeText: string
    changeClass: string
    percentage: number
  }
  
  const months: MonthlyBreakdownItem[] = []
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthExpenses = state.filteredExpenses
      .filter((expense: ProcessedExpenseItem) => {
        const expenseDate = new Date(expense.date)
        return expenseDate.getMonth() === date.getMonth() && 
               expenseDate.getFullYear() === date.getFullYear()
      })
    
    const total = monthExpenses.reduce((sum: number, expense: ProcessedExpenseItem) => sum + expense.amount, 0)
    const count = monthExpenses.length
    
    // Calculate change from previous month
    const prevDate = new Date(date.getFullYear(), date.getMonth() - 1, 1)
    const prevMonthExpenses = state.filteredExpenses
      .filter((expense: ProcessedExpenseItem) => {
        const expenseDate = new Date(expense.date)
        return expenseDate.getMonth() === prevDate.getMonth() && 
               expenseDate.getFullYear() === prevDate.getFullYear()
      })
    const prevTotal = prevMonthExpenses.reduce((sum: number, expense: ProcessedExpenseItem) => sum + expense.amount, 0)
    const change = total - prevTotal
    
    months.push({
      period: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`,
      monthShort: date.toLocaleDateString('en-US', { month: 'short' }),
      year: date.getFullYear(),
      total,
      count,
      change,
      changeText: change > 0 ? `+${Math.abs(change).toLocaleString()}` : change < 0 ? `-${Math.abs(change).toLocaleString()}` : '0',
      changeClass: change > 0 ? 'text-red-600' : change < 0 ? 'text-green-600' : 'text-gray-500',
      percentage: 0 // Will be calculated below
    })
  }
  
  // Calculate percentages based on max value
  const maxTotal = Math.max(...months.map(m => m.total))
  months.forEach(month => {
    month.percentage = maxTotal > 0 ? (month.total / maxTotal) * 100 : 0
  })
  
  return months
})

// Current month category breakdown
const currentMonthCategories = computed(() => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  const currentMonthExpenses = state.filteredExpenses.filter((expense: ProcessedExpenseItem) => {
    const expenseDate = new Date(expense.date)
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
  })
  
  // Group by category
  const categoryMap = new Map()
  currentMonthExpenses.forEach((expense: ProcessedExpenseItem) => {
    const existing = categoryMap.get(expense.category) || { amount: 0, count: 0 }
    categoryMap.set(expense.category, {
      amount: existing.amount + expense.amount,
      count: existing.count + 1
    })
  })
  
  const totalAmount = currentMonthExpenses.reduce((sum: number, expense: ProcessedExpenseItem) => sum + expense.amount, 0)
  
  const categories = Array.from(categoryMap.entries()).map(([name, data]) => ({
    name,
    amount: data.amount,
    count: data.count,
    percentage: totalAmount > 0 ? Math.round((data.amount / totalAmount) * 100) : 0,
    colorClass: getCategoryColor(name)
  }))
  
  return categories.sort((a, b) => b.amount - a.amount)
})

// Recent expenses this month (last 5)
const recentExpenses = computed(() => {
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  
  return state.filteredExpenses
    .filter((expense: ProcessedExpenseItem) => {
      const expenseDate = new Date(expense.date)
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
    })
    .sort((a: ProcessedExpenseItem, b: ProcessedExpenseItem) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5)
})

// Utility functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric'
  })
}

const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    'Therapy': 'bg-blue-500',
    'Consultation': 'bg-green-500',
    'Medicine': 'bg-purple-500',
    'Equipment': 'bg-yellow-500',
    'Transportation': 'bg-pink-500',
    'Accommodation': 'bg-indigo-500',
    'Other': 'bg-gray-500'
  }
  return colors[category] || 'bg-gray-500'
}

// Event handlers
const handleRefresh = async () => {
  try {
    // Clear cache and refresh
    actions.clearCache()
    await actions.refreshExpenses()
  } catch (error) {
    console.error('Failed to refresh expenses:', error)
  }
}

// Lifecycle
onMounted(async () => {
  try {
    console.log('Monthly Analysis: Initializing...')
    await actions.initialize()
    console.log('Monthly Analysis: Initialization complete')
  } catch (error) {
    console.error('Monthly Analysis: Initialization failed:', error)
  }
})
</script>

<style scoped>
.monthly-expenses {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8;
}
</style>