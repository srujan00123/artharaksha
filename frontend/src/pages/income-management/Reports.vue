<template>
  <div class="reports-dashboard">
    <!-- Header Section -->
    <div class="header-section mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Income Reports</h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">Comprehensive analysis of your income patterns and trends</p>
        </div>
        <div class="flex items-center space-x-3">
          <select
            v-model="selectedPeriod"
            @change="updatePeriodFilter"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
          >
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="last_3_months">Last 3 Months</option>
            <option value="last_6_months">Last 6 Months</option>
            <option value="this_year">This Year</option>
            <option value="all_time">All Time</option>
          </select>
          <button 
            @click="refreshReports"
            :disabled="loading"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw class="w-4 h-4 mr-2" />
            Refresh
          </button>
          <button 
            @click="exportReport"
            :disabled="loading"
            class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg shadow-sm text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Download class="w-4 h-4 mr-2" />
            Export
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p class="text-gray-600 dark:text-gray-400 ml-3">Loading reports...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div class="flex items-center">
          <AlertCircle class="h-5 w-5 text-red-400" />
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error Loading Reports</h3>
            <p class="text-sm text-red-700 dark:text-red-300 mt-1">{{ error }}</p>
          </div>
        </div>
        <div class="mt-4">
          <button 
            @click="refreshReports"
            class="bg-red-100 dark:bg-red-900/30 hover:bg-red-200 text-red-800 dark:text-red-200 px-3 py-1 rounded text-sm transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>

    <!-- Reports Content -->
    <div v-else class="reports-content space-y-6">
      <!-- Income Summary Section -->
      <div class="income-summary">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Income Summary</h2>
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <DollarSign class="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Income</p>
                <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">₹{{ formatCurrency(analytics?.total_income || 0) }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                  <Repeat class="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Recurring Income</p>
                <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">₹{{ formatCurrency(analytics?.recurring_income || 0) }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                  <Calendar class="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">One-time Income</p>
                <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">₹{{ formatCurrency(analytics?.one_time_income || 0) }}</p>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                  <Hash class="w-4 h-4 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Income Sources</p>
                <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ analytics?.summary?.total_sources || 0 }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Detailed Analysis Section -->
      <div class="detailed-analysis">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Income by Type</h2>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Income Type Chart -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
            <h3 class="text-base font-medium text-gray-900 dark:text-gray-100 mb-4">Distribution by Type</h3>
            <div v-if="incomeByTypeData.length > 0" class="space-y-3">
              <div 
                v-for="item in incomeByTypeData" 
                :key="item.type"
                class="flex items-center justify-between"
              >
                <div class="flex items-center">
                  <div 
                    class="w-3 h-3 rounded-full mr-3"
                    :style="{ backgroundColor: item.color }"
                  ></div>
                  <span class="text-sm text-gray-700 dark:text-gray-300">{{ item.type }}</span>
                </div>
                <div class="text-right">
                  <div class="text-sm font-medium text-gray-900 dark:text-gray-100">₹{{ formatCurrency(item.amount) }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">{{ item.percentage }}%</div>
                </div>
              </div>
            </div>
            <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
              No income data available for the selected period
            </div>
          </div>

          <!-- Summary Statistics -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
            <h3 class="text-base font-medium text-gray-900 dark:text-gray-100 mb-4">Summary Statistics</h3>
            <div class="space-y-4">
              <div class="flex justify-between">
                <span class="text-sm text-gray-600 dark:text-gray-400">Average per Source</span>
                <span class="text-sm font-medium text-gray-900 dark:text-gray-100">₹{{ formatCurrency(analytics?.summary?.average_source_amount || 0) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-600 dark:text-gray-400">Top Income Type</span>
                <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ analytics?.summary?.top_income_type || 'N/A' }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-600 dark:text-gray-400">Recurring Percentage</span>
                <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ recurringPercentage }}%</span>
              </div>
              <div class="flex justify-between">
                <span class="text-sm text-gray-600 dark:text-gray-400">Period</span>
                <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ formatPeriod(selectedPeriod) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Trend Analysis Section -->
      <div class="trend-analysis">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Monthly Trends</h2>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
          <div v-if="monthlyTrends.length > 0" class="space-y-4">
            <!-- Trend Chart Area -->
            <div class="h-64 flex items-end space-x-2">
              <div 
                v-for="trend in monthlyTrends" 
                :key="trend.month"
                class="flex-1 flex flex-col items-center"
              >
                <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-t relative" :style="{ height: '200px' }">
                  <!-- Total bar -->
                  <div 
                    class="absolute bottom-0 w-full bg-blue-500 rounded-t transition-all duration-300"
                    :style="{ height: `${(trend.total / maxTrendValue) * 100}%` }"
                  ></div>
                  <!-- Recurring overlay -->
                  <div 
                    class="absolute bottom-0 w-full bg-green-500 rounded-t transition-all duration-300"
                    :style="{ height: `${(trend.recurring / maxTrendValue) * 100}%` }"
                  ></div>
                </div>
                <div class="mt-2 text-center">
                  <div class="text-xs font-medium text-gray-900 dark:text-gray-100">{{ trend.month }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">₹{{ formatCurrency(trend.total) }}</div>
                </div>
              </div>
            </div>
            
            <!-- Legend -->
            <div class="flex justify-center space-x-6">
              <div class="flex items-center">
                <div class="w-3 h-3 bg-blue-500 rounded mr-2"></div>
                <span class="text-sm text-gray-600 dark:text-gray-400">Total Income</span>
              </div>
              <div class="flex items-center">
                <div class="w-3 h-3 bg-green-500 rounded mr-2"></div>
                <span class="text-sm text-gray-600 dark:text-gray-400">Recurring Income</span>
              </div>
            </div>

            <!-- Trend Table -->
            <div class="mt-6 overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Month</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Recurring</th>
                    <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">One-time</th>
                  </tr>
                </thead>
                <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  <tr v-for="trend in monthlyTrends" :key="trend.month">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{{ trend.month }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">₹{{ formatCurrency(trend.total) }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">₹{{ formatCurrency(trend.recurring) }}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">₹{{ formatCurrency(trend.one_time) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <div v-else class="text-center py-8 text-gray-500 dark:text-gray-400">
            No trend data available for the selected period
          </div>
        </div>
      </div>

      <!-- Detailed Income Sources -->
      <div class="detailed-sources">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Detailed Income Sources</h2>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
          <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Showing {{ totalSources }} income sources for {{ formatPeriod(selectedPeriod) }}
            </p>
          </div>
          
          <div v-if="incomeSourcesList.length > 0" class="divide-y divide-gray-100 dark:divide-gray-700">
            <div 
              v-for="source in incomeSourcesList" 
              :key="`${source.incomeId}-${source.sourceId}`"
              class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <div class="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-3">
                    <DollarSign class="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ source.type }}</h4>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(source.date_time) }}</p>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-sm font-semibold text-gray-900 dark:text-gray-100">₹{{ formatCurrency(source.income) }}</div>
                  <div class="flex items-center space-x-2">
                    <span 
                      v-if="source.recur"
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                    >
                      {{ formatFrequency(source.recur_frequency) }}
                    </span>
                    <span 
                      v-else
                      class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                    >
                      One-time
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="p-8 text-center text-gray-500 dark:text-gray-400">
            No income sources found for the selected period
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { 
  RefreshCw, 
  Download, 
  AlertCircle, 
  DollarSign,
  Repeat,
  Calendar,
  Hash
} from 'lucide-vue-next'

// Composables
import { useIncome } from '../../composables/useIncome'

// Initialize income composable
const {
  incomes,
  analytics,
  loading,
  error,
  updateFilters,
  fetchIncomesWithAnalytics,
  initialize
} = useIncome()

// Local state
const selectedPeriod = ref('last_3_months')

// Computed properties for analytics data
const incomeByTypeData = computed(() => {
  if (!analytics.value?.income_by_type) return []
  
  const total = analytics.value.total_income || 1
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', 
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ]
  
  return Object.entries(analytics.value.income_by_type).map(([type, amount], index) => ({
    type,
    amount: Number(amount),
    percentage: ((Number(amount) / total) * 100).toFixed(1),
    color: colors[index % colors.length]
  })).sort((a, b) => b.amount - a.amount)
})

const monthlyTrends = computed(() => {
  return analytics.value?.monthly_trends || []
})

const maxTrendValue = computed(() => {
  if (monthlyTrends.value.length === 0) return 1
  return Math.max(...monthlyTrends.value.map(t => t.total))
})

const recurringPercentage = computed(() => {
  if (!analytics.value?.total_income || analytics.value.total_income === 0) return 0
  return ((analytics.value.recurring_income / analytics.value.total_income) * 100).toFixed(1)
})

const totalSources = computed(() => {
  return analytics.value?.summary?.total_sources || 0
})

const incomeSourcesList = computed(() => {
  const sources: any[] = []
  incomes.value.forEach(income => {
    if (income.income_source && Array.isArray(income.income_source)) {
      income.income_source.forEach(source => {
        sources.push({
          ...source,
          incomeId: income.name,
          sourceId: source.name || source.idx || Math.random().toString(36).substr(2, 9)
        })
      })
    }
  })
  return sources.sort((a, b) => new Date(b.date_time).getTime() - new Date(a.date_time).getTime())
})

// Utility functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN').format(amount)
}

const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A'
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return 'N/A'
  }
}

const formatFrequency = (frequency: string) => {
  if (!frequency) return 'Monthly'
  return frequency.charAt(0).toUpperCase() + frequency.slice(1)
}

const formatPeriod = (period: string) => {
  const map = {
    this_month: 'This Month',
    last_month: 'Last Month',
    last_3_months: 'Last 3 Months',
    last_6_months: 'Last 6 Months',
    this_year: 'This Year',
    all_time: 'All Time'
  }
  return map[period] || period
}

// Event handlers
const updatePeriodFilter = async () => {
  try {
    await updateFilters({ period: selectedPeriod.value })
    await fetchIncomesWithAnalytics(true)
  } catch (error) {
    console.error('Failed to update period filter:', error)
  }
}

const refreshReports = async () => {
  try {
    await fetchIncomesWithAnalytics(true)
  } catch (error) {
    console.error('Failed to refresh reports:', error)
  }
}

const exportReport = () => {
  const csvData = generateCSVData()
  const blob = new Blob([csvData], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `income-report-${selectedPeriod.value}-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

const generateCSVData = () => {
  let csv = 'Income Type,Amount,Percentage,Is Recurring,Date\n'
  
  incomeSourcesList.value.forEach(source => {
    const percentage = analytics.value?.total_income 
      ? ((source.income / analytics.value.total_income) * 100).toFixed(1)
      : '0'
    
    csv += `"${source.type}",${source.income},${percentage}%,"${source.recur ? 'Yes' : 'No'}","${formatDate(source.date_time)}"\n`
  })
  
  return csv
}

// Lifecycle
onMounted(async () => {
  try {
    // Initialize with analytics and set default period
    await initialize({ withAnalytics: true, forceRefresh: false })
    await updatePeriodFilter()
  } catch (error) {
    console.error('Reports: Failed to initialize:', error)
  }
})
</script>

<style scoped>
.reports-dashboard {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8;
}
</style> 