<template>
  <div class="reports-dashboard">
    <!-- Header Section -->
    <div class="header-section mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Income Reports</h1>
          <p class="text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-1">Comprehensive income reports and analysis
          </p>
        </div>
        <div class="flex items-center space-x-3">
          <select v-model="selectedReport" @change="loadReportData"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400">
            <option value="summary">Income Summary</option>
            <option value="detailed">Detailed Analysis</option>
            <option value="trends">Trend Analysis</option>
          </select>
          <select v-model="selectedPeriod" @change="updatePeriodFilter"
            class="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400">
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="last_3_months">Last 3 Months</option>
            <option value="last_6_months">Last 6 Months</option>
            <option value="this_year">This Year</option>
            <option value="all_time">All Time</option>
          </select>
          <button @click="exportReport" :disabled="loading"
            class="inline-flex items-center px-4 py-2 bg-green-600 text-white dark:text-black rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors">
            <Download class="w-4 h-4 mr-2" />
            Export
          </button>
          <button @click="refreshReports" :disabled="loading"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors">
            <RefreshCw class="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p class="text-gray-600 dark:text-gray-400 dark:text-gray-500 ml-3">Loading reports...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state mb-6">
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <AlertCircle class="h-5 w-5 text-red-400" />
          </div>
          <div class="ml-3">
            <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error Loading Reports</h3>
            <p class="text-sm text-red-700 dark:text-red-300 mt-1">{{ error }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="space-y-6">
      <!-- Income Summary Report -->
      <div v-if="selectedReport === 'summary'" class="space-y-6">
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div
            class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <DollarSign class="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Total Income</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">₹{{
                  reportData.total_income.toLocaleString('en-IN') }}</p>
                <p class="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-1">{{
                  formatPeriod(selectedPeriod) }}</p>
              </div>
            </div>
          </div>

          <div
            class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Repeat class="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Recurring Income</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">₹{{
                  reportData.recurring_income.toLocaleString('en-IN') }}</p>
                <p class="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  {{ ((reportData.recurring_income / reportData.total_income) * 100).toFixed(1) }}% of total
                </p>
              </div>
            </div>
          </div>

          <div
            class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Calendar class="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">One-time Income</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">₹{{
                  reportData.one_time_income.toLocaleString('en-IN') }}</p>
                <p class="text-sm text-purple-600 dark:text-purple-400 mt-1">
                  {{ ((reportData.one_time_income / reportData.total_income) * 100).toFixed(1) }}% of total
                </p>
              </div>
            </div>
          </div>

          <div
            class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <BarChart3 class="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <div class="ml-4">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Income Sources</p>
                <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{
                  Object.keys(reportData.income_by_type).length }}</p>
                <p class="text-sm text-orange-600 dark:text-orange-400 mt-1">Active streams</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Income Breakdown Table -->
        <div
          class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border">
          <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Income Breakdown by Type</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-900 dark:bg-gray-100">
                <tr>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Income Type
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                  <th
                    class="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Monthly Equivalent
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 dark:bg-gray-200 divide-y divide-gray-200 dark:divide-gray-700">
                <tr v-for="(amount, type) in reportData.income_by_type" :key="type"
                  class="hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 dark:bg-gray-100">
                  <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                      <div class="w-3 h-3 rounded-full mr-3" :style="{ backgroundColor: getTypeColor(type) }"></div>
                      <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ type }}</span>
                    </div>
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    ₹{{ amount.toLocaleString('en-IN') }}
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {{ ((amount / reportData.total_income) * 100).toFixed(1) }}%
                  </td>
                  <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    ₹{{ amount.toLocaleString('en-IN') }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Detailed Analysis Report -->
      <div v-if="selectedReport === 'detailed'" class="space-y-6">
        <!-- Filter Controls -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">Analysis Filters</h3>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Income Type</label>
              <select v-model="analysisFilters.incomeType" @change="updateAnalysisFilters"
                class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400">
                <option value="">All Types</option>
                <option v-for="type in availableIncomeTypes" :key="type" :value="type">{{ type }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Recurring</label>
              <select v-model="analysisFilters.isRecurring" @change="updateAnalysisFilters"
                class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400">
                <option :value="null">All Income</option>
                <option :value="true">Recurring Only</option>
                <option :value="false">One-time Only</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Min Amount</label>
              <input v-model="analysisFilters.amountMin" @input="updateAnalysisFilters" type="number" placeholder="0"
                class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Max Amount</label>
              <input v-model="analysisFilters.amountMax" @input="updateAnalysisFilters" type="number" placeholder="∞"
                class="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500 dark:focus:ring-blue-400">
            </div>
          </div>
          <div class="mt-3 flex items-center justify-between">
            <div class="text-xs text-gray-500 dark:text-gray-400">
              Showing {{ incomes.length }} income sources • Total: ₹{{ totalMonthlyIncome.toLocaleString('en-IN') }}
            </div>
            <button @click="resetAnalysisFilters"
              class="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200">
              Reset Filters
            </button>
          </div>
        </div>

        <!-- Insights Section -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Income Insights</h3>
            <div class="text-xs text-gray-500 dark:text-gray-400">
              Based on {{ incomes.length }} income sources ({{ formatPeriod(selectedPeriod) }})
            </div>
          </div>

          <div v-if="insights.length === 0" class="text-center py-8">
            <Target class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No insights available</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Add more income data to generate
              insights</p>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="insight in insights" :key="insight.title" class="p-4 rounded-lg border" :class="{
              'bg-green-50 border-green-200': insight.type === 'positive',
              'bg-yellow-50 border-yellow-200': insight.type === 'neutral',
              'bg-red-50 border-red-200': insight.type === 'warning'
            }">
              <div class="flex items-start space-x-3">
                <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" :class="{
                  'bg-green-100 text-green-600': insight.type === 'positive',
                  'bg-yellow-100 text-yellow-600': insight.type === 'neutral',
                  'bg-red-100 text-red-600': insight.type === 'warning'
                }">
                  <CheckCircle v-if="insight.type === 'positive'" class="w-4 h-4" />
                  <AlertTriangle v-else-if="insight.type === 'warning'" class="w-4 h-4" />
                  <Info v-else class="w-4 h-4" />
                </div>
                <div>
                  <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ insight.title }}</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-1">{{ insight.description }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Performance Scores -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">Performance Scores</h3>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Stability Score -->
            <div class="text-center">
              <button @click="expandedScore = expandedScore === 'stability' ? null : 'stability'"
                class="w-full group focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 rounded-lg p-4 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div
                  class="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-3 transition-all duration-200"
                  :class="getScoreColorClass('stability', scores.stability)">
                  <div class="text-2xl font-bold" :class="getScoreTextColor('stability', scores.stability)">
                    {{ scores.stability }}
              </div>
                </div>
                <h4
                  class="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Stability
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ getScoreLabel('stability', scores.stability)
                  }}</p>
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
                  <div class="h-2 rounded-full transition-all duration-500"
                    :class="getScoreBarColor('stability', scores.stability)" :style="{ width: `${scores.stability}%` }">
              </div>
            </div>
                <div class="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center">
                  <span>Click for details</span>
                  <ChevronDown class="w-3 h-3 ml-1 transition-transform duration-200"
                    :class="{ 'rotate-180': expandedScore === 'stability' }" />
                </div>
              </button>

              <!-- Expanded Stability Details -->
              <div v-if="expandedScore === 'stability'"
                class="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-left">
                <h5 class="font-semibold text-gray-900 dark:text-gray-100 mb-3">Stability Analysis</h5>
                <div class="space-y-3 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Recurring Income:</span>
                    <span class="font-medium text-gray-900 dark:text-gray-100">₹{{
                      totalRecurringIncome.toLocaleString('en-IN') }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">One-time Income:</span>
                    <span class="font-medium text-gray-900 dark:text-gray-100">₹{{
                      totalOneTimeIncome.toLocaleString('en-IN') }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Stability Ratio:</span>
                    <span class="font-medium text-gray-900 dark:text-gray-100">{{ Math.round((totalRecurringIncome /
                      (totalRecurringIncome + totalOneTimeIncome)) * 100) }}%</span>
                  </div>
                  <div class="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p class="text-gray-700 dark:text-gray-300 mb-2">
                      <strong>What this means:</strong>
                    </p>
                    <p class="text-gray-600 dark:text-gray-400">
                      {{ getStabilityExplanation(scores.stability) }}
                    </p>
                  </div>
                  <div class="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p class="text-gray-700 dark:text-gray-300 mb-2">
                      <strong>Benchmarks:</strong>
                    </p>
                    <div class="space-y-1 text-xs">
                      <div class="flex justify-between">
                        <span>Excellent (80-100%):</span>
                        <span class="text-green-600 dark:text-green-400">Very stable income</span>
                      </div>
                      <div class="flex justify-between">
                        <span>Good (60-79%):</span>
                        <span class="text-blue-600 dark:text-blue-400">Stable income</span>
                      </div>
                      <div class="flex justify-between">
                        <span>Fair (40-59%):</span>
                        <span class="text-yellow-600 dark:text-yellow-400">Moderately stable</span>
                      </div>
                      <div class="flex justify-between">
                        <span>Poor (0-39%):</span>
                        <span class="text-red-600 dark:text-red-400">Unstable income</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Diversification Score -->
            <div class="text-center">
              <button @click="expandedScore = expandedScore === 'diversification' ? null : 'diversification'"
                class="w-full group focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 rounded-lg p-4 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div
                  class="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-3 transition-all duration-200"
                  :class="getScoreColorClass('diversification', scores.diversification)">
                  <div class="text-2xl font-bold" :class="getScoreTextColor('diversification', scores.diversification)">
                    {{ scores.diversification }}
              </div>
                </div>
                <h4
                  class="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Diversification
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ getScoreLabel('diversification',
                  scores.diversification) }}</p>
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
                  <div class="h-2 rounded-full transition-all duration-500"
                    :class="getScoreBarColor('diversification', scores.diversification)"
                  :style="{ width: `${scores.diversification}%` }"></div>
              </div>
                <div class="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center">
                  <span>Click for details</span>
                  <ChevronDown class="w-3 h-3 ml-1 transition-transform duration-200"
                    :class="{ 'rotate-180': expandedScore === 'diversification' }" />
            </div>
              </button>

              <!-- Expanded Diversification Details -->
              <div v-if="expandedScore === 'diversification'"
                class="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-left">
                <h5 class="font-semibold text-gray-900 dark:text-gray-100 mb-3">Diversification Analysis</h5>
                <div class="space-y-3 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Total Income Sources:</span>
                    <span class="font-medium text-gray-900 dark:text-gray-100">{{ availableIncomeTypes.length }}</span>
                  </div>
                  <div class="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p class="text-gray-700 dark:text-gray-300 mb-2">
                      <strong>Your Income Sources:</strong>
                    </p>
                    <div class="space-y-1">
                      <div v-for="type in availableIncomeTypes" :key="type" class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">{{ type }}:</span>
                        <span class="font-medium text-gray-900 dark:text-gray-100">
                          ₹{{ getIncomeByType(type).toLocaleString('en-IN') }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p class="text-gray-700 dark:text-gray-300 mb-2">
                      <strong>What this means:</strong>
                    </p>
                    <p class="text-gray-600 dark:text-gray-400">
                      {{ getDiversificationExplanation(scores.diversification) }}
                    </p>
                  </div>
                  <div class="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p class="text-gray-700 dark:text-gray-300 mb-2">
                      <strong>Benchmarks:</strong>
                    </p>
                    <div class="space-y-1 text-xs">
                      <div class="flex justify-between">
                        <span>Excellent (5+ sources):</span>
                        <span class="text-green-600 dark:text-green-400">Highly diversified</span>
                      </div>
                      <div class="flex justify-between">
                        <span>Good (4 sources):</span>
                        <span class="text-blue-600 dark:text-blue-400">Well diversified</span>
                      </div>
                      <div class="flex justify-between">
                        <span>Fair (3 sources):</span>
                        <span class="text-yellow-600 dark:text-yellow-400">Moderately diversified</span>
                      </div>
                      <div class="flex justify-between">
                        <span>Poor (1-2 sources):</span>
                        <span class="text-red-600 dark:text-red-400">Low diversification</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Growth Score -->
            <div class="text-center">
              <button @click="expandedScore = expandedScore === 'growth' ? null : 'growth'"
                class="w-full group focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 rounded-lg p-4 transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700">
                <div
                  class="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-3 transition-all duration-200"
                  :class="getScoreColorClass('growth', scores.growth)">
                  <div class="text-2xl font-bold" :class="getScoreTextColor('growth', scores.growth)">
                    {{ scores.growth }}
              </div>
                </div>
                <h4
                  class="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Growth
                </h4>
                <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">{{ getScoreLabel('growth', scores.growth) }}
                </p>
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-3">
                  <div class="h-2 rounded-full transition-all duration-500"
                    :class="getScoreBarColor('growth', scores.growth)" :style="{ width: `${scores.growth}%` }"></div>
              </div>
                <div class="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-center">
                  <span>Click for details</span>
                  <ChevronDown class="w-3 h-3 ml-1 transition-transform duration-200"
                    :class="{ 'rotate-180': expandedScore === 'growth' }" />
            </div>
              </button>

              <!-- Expanded Growth Details -->
              <div v-if="expandedScore === 'growth'" class="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg text-left">
                <h5 class="font-semibold text-gray-900 dark:text-gray-100 mb-3">Growth Analysis</h5>
                <div class="space-y-3 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Recent Activity (30 days):</span>
                    <span class="font-medium text-gray-900 dark:text-gray-100">{{ getRecentActivityCount() }}
                      updates</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Growth Trend:</span>
                    <span class="font-medium" :class="getGrowthTrendColor()">{{ getGrowthTrendText() }}</span>
                  </div>
                  <div class="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p class="text-gray-700 dark:text-gray-300 mb-2">
                      <strong>What this means:</strong>
                    </p>
                    <p class="text-gray-600 dark:text-gray-400">
                      {{ getGrowthExplanation(scores.growth) }}
                    </p>
                  </div>
                  <div class="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p class="text-gray-700 dark:text-gray-300 mb-2">
                      <strong>Recent vs Historical:</strong>
                    </p>
                    <div class="space-y-1">
                      <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Last 3 months avg:</span>
                        <span class="font-medium text-gray-900 dark:text-gray-100">₹{{
                          getRecentAverage().toLocaleString('en-IN') }}</span>
                      </div>
                      <div class="flex justify-between">
                        <span class="text-gray-600 dark:text-gray-400">Historical avg:</span>
                        <span class="font-medium text-gray-900 dark:text-gray-100">₹{{
                          getHistoricalAverage().toLocaleString('en-IN') }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <p class="text-gray-700 dark:text-gray-300 mb-2">
                      <strong>Benchmarks:</strong>
                    </p>
                    <div class="space-y-1 text-xs">
                      <div class="flex justify-between">
                        <span>Excellent (80-100%):</span>
                        <span class="text-green-600 dark:text-green-400">Strong growth</span>
                      </div>
                      <div class="flex justify-between">
                        <span>Good (60-79%):</span>
                        <span class="text-blue-600 dark:text-blue-400">Positive growth</span>
                      </div>
                      <div class="flex justify-between">
                        <span>Fair (40-59%):</span>
                        <span class="text-yellow-600 dark:text-yellow-400">Moderate growth</span>
                      </div>
                      <div class="flex justify-between">
                        <span>Poor (0-39%):</span>
                        <span class="text-red-600 dark:text-red-400">Low/no growth</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recommendations -->
        <div
          class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recommendations</h3>

          <div v-if="recommendations.length === 0" class="text-center py-8">
            <CheckCircle class="mx-auto h-12 w-12 text-green-400" />
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">All good!</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Your income management is on
              track</p>
          </div>

          <div v-else class="space-y-4">
            <div v-for="rec in recommendations" :key="rec.title"
              class="p-4 bg-gray-50 dark:bg-gray-900 dark:bg-gray-100 rounded-lg">
              <div class="flex items-start space-x-3">
                <div class="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" :class="{
                  'bg-red-100 text-red-600': rec.priority === 'high',
                  'bg-yellow-100 text-yellow-600': rec.priority === 'medium',
                  'bg-blue-100 text-blue-600': rec.priority === 'low'
                }">
                  <AlertTriangle v-if="rec.priority === 'high'" class="w-4 h-4" />
                  <Info v-else class="w-4 h-4" />
                </div>
                <div class="flex-1">
                  <div class="flex items-center justify-between">
                    <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ rec.title }}</h4>
                    <span class="text-xs px-2 py-1 rounded-full" :class="{
                      'bg-red-100 text-red-800': rec.priority === 'high',
                      'bg-yellow-100 text-yellow-800': rec.priority === 'medium',
                      'bg-blue-100 text-blue-800': rec.priority === 'low'
                    }">
                      {{ rec.priority.toUpperCase() }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-1">{{ rec.description }}</p>
                  <p class="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-600 mt-2 font-medium">{{ rec.action
                    }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Trend Analysis Report -->
      <div v-if="selectedReport === 'trends'" class="space-y-6">
        <div
          class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Trend Analysis</h3>

          <div v-if="reportData.monthly_trends && reportData.monthly_trends.length > 0" class="space-y-4">
            <div v-for="trend in reportData.monthly_trends" :key="trend.month"
              class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 dark:bg-gray-100 rounded-lg">
              <div class="flex-1">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ trend.month }}</span>
                  <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">₹{{
                    trend.total.toLocaleString('en-IN') }}</span>
                </div>
                <div class="mt-2 flex space-x-4">
                  <div class="flex items-center space-x-1">
                    <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span class="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500">Recurring: ₹{{
                      trend.recurring.toLocaleString('en-IN') }}</span>
                  </div>
                  <div class="flex items-center space-x-1">
                    <div class="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <span class="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500">One-time: ₹{{
                      trend.one_time.toLocaleString('en-IN') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="text-center py-12">
            <TrendingUp class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No trend data</h3>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Add more income data to see
              trends</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import {
  RefreshCw,
  AlertCircle,
  Download,
  DollarSign,
  Repeat,
  Calendar,
  BarChart3,
  Target,
  CheckCircle,
  AlertTriangle,
  Info,
  TrendingUp,
  ChevronDown
} from 'lucide-vue-next'
import { useIncome } from '../../composables/useIncome'
import { getClientTime, getClientDateString } from '../../utils/date'

// Initialize the income composable with advanced analysis enabled
const {
  state,
  filters,
  actions,
  groupedIncome,
  loading,
  error,
  incomes,
  totalMonthlyIncome,
  totalRecurringIncome,
  totalOneTimeIncome,
  incomeCount,
  incomeTypes
} = useIncome({ enableAdvancedAnalysis: true })

// Local state for report selection
const selectedReport = ref('summary')
const selectedPeriod = ref('last_3_months')

// Expanded score state
const expandedScore = ref(null)

// Analysis filters for detailed view
const analysisFilters = ref({
  incomeType: '',
  isRecurring: null,
  amountMin: '',
  amountMax: ''
})

// Available income types for filter dropdown
const availableIncomeTypes = computed(() => {
  const types = new Set()
  incomes.value.forEach(income => {
    income.sources.forEach(source => {
      types.add(source.type)
    })
  })
  return Array.from(types).sort()
})

// Computed insights based on real data and filters
const insights = computed(() => {
  if (!state || !incomes.value || incomes.value.length === 0) return []

  const insights = []
  const summary = groupedIncome.value.summary

  // Income stability insight
  if (summary.recurringIncome > summary.oneTimeIncome) {
    insights.push({
      type: 'positive',
      title: 'Strong Income Stability',
      description: `${Math.round((summary.recurringIncome / summary.totalMonthlyIncome) * 100)}% of your income is recurring, providing excellent financial stability.`
    })
  } else if (summary.recurringIncome < summary.oneTimeIncome * 0.3) {
    insights.push({
      type: 'warning',
      title: 'Low Recurring Income',
      description: 'Consider building more recurring income streams to improve financial stability.'
    })
  }

  // Diversification insight
  const uniqueTypes = new Set(incomes.value.flatMap(income =>
    income.sources.map(source => source.type)
  )).size

  if (uniqueTypes >= 4) {
    insights.push({
      type: 'positive',
      title: 'Well Diversified Income',
      description: `You have ${uniqueTypes} different income sources, which reduces financial risk.`
    })
  } else if (uniqueTypes <= 2) {
    insights.push({
      type: 'warning',
      title: 'Limited Income Diversity',
      description: 'Consider diversifying your income sources to reduce dependency risk.'
    })
  }

  // Growth insight based on recent vs older entries
  const now = new Date()
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())

  const recentIncomes = incomes.value.filter(income =>
    new Date(income.createdAt) >= threeMonthsAgo
  )
  const olderIncomes = incomes.value.filter(income =>
    new Date(income.createdAt) < threeMonthsAgo
  )

  if (recentIncomes.length > 0 && olderIncomes.length > 0) {
    const recentAvg = recentIncomes.reduce((sum, income) => sum + income.monthlyIncome, 0) / recentIncomes.length
    const olderAvg = olderIncomes.reduce((sum, income) => sum + income.monthlyIncome, 0) / olderIncomes.length
    const growthRate = ((recentAvg - olderAvg) / olderAvg) * 100

    if (growthRate > 10) {
      insights.push({
        type: 'positive',
        title: 'Income Growth Trend',
        description: `Your income has grown by ${Math.round(growthRate)}% over the last 3 months.`
      })
    } else if (growthRate < -10) {
      insights.push({
        type: 'warning',
        title: 'Declining Income Trend',
        description: `Your income has decreased by ${Math.round(Math.abs(growthRate))}% over the last 3 months.`
      })
    }
  }

  return insights
})

// Computed recommendations based on current data
const recommendations = computed(() => {
  if (!state || !incomes.value || incomes.value.length === 0) return []

  const recommendations = []
  const summary = groupedIncome.value.summary

  // Recurring income recommendation
  if (summary.recurringIncome < summary.totalMonthlyIncome * 0.6) {
    recommendations.push({
      title: 'Increase Recurring Income',
      description: 'Focus on building subscription-based or salary income streams.',
      action: 'Aim for 60-80% of income to be recurring for better financial security.',
      priority: 'high'
    })
  }

  // Income source diversity
  const uniqueTypes = new Set(incomes.value.flatMap(income =>
    income.sources.map(source => source.type)
  )).size

  if (uniqueTypes < 3) {
    recommendations.push({
      title: 'Diversify Income Sources',
      description: 'Having multiple income streams reduces financial risk.',
      action: 'Consider adding freelance work, investments, or side businesses.',
      priority: 'medium'
    })
  }

  // Low income frequency
  if (incomes.value.length < 2) {
    recommendations.push({
      title: 'Track More Income Sources',
      description: 'Complete income tracking helps with better financial planning.',
      action: 'Add all your income sources, including small or irregular ones.',
      priority: 'low'
    })
  }

  return recommendations
})

// Computed performance scores
const scores = computed(() => {
  if (!state || !incomes.value || incomes.value.length === 0) {
    return { stability: 0, diversification: 0, growth: 0 }
  }

  const summary = groupedIncome.value.summary

  // Stability score (based on recurring income percentage)
  const stabilityScore = Math.min(100, Math.round((summary.recurringIncome / summary.totalMonthlyIncome) * 100))

  // Diversification score (based on number of unique income types)
  const uniqueTypes = new Set(incomes.value.flatMap(income =>
    income.sources.map(source => source.type)
  )).size
  const diversificationScore = Math.min(100, uniqueTypes * 20) // Max score at 5 types

  // Growth score (simplified - based on recent activity)
  const now = new Date()
  const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
  const recentActivity = incomes.value.filter(income =>
    new Date(income.updatedAt || income.createdAt) >= monthAgo
  ).length
  const growthScore = Math.min(100, recentActivity * 25) // Max score at 4 recent activities

  return {
    stability: stabilityScore,
    diversification: diversificationScore,
    growth: growthScore
  }
})

// Computed report data based on filtered incomes
const reportData = computed(() => {
  if (!incomes.value || incomes.value.length === 0) {
    return {
  total_income: 0,
  recurring_income: 0,
  one_time_income: 0,
  income_by_type: {},
  monthly_trends: []
    }
  }

  const summary = groupedIncome.value.summary

  // Group by income type
  const incomeByType = {}
  incomes.value.forEach(income => {
    income.sources.forEach(source => {
      if (!incomeByType[source.type]) {
        incomeByType[source.type] = 0
      }
      incomeByType[source.type] += source.amount
    })
  })

  // Generate monthly trends
  const monthlyTrends = []
  const monthlyData = {}

  incomes.value.forEach(income => {
    income.sources.forEach(source => {
      const date = new Date(source.dateTime)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { total: 0, recurring: 0, one_time: 0 }
      }

      monthlyData[monthKey].total += source.amount
      if (source.isRecurring) {
        monthlyData[monthKey].recurring += source.amount
      } else {
        monthlyData[monthKey].one_time += source.amount
      }
    })
  })

  // Convert to array and sort by month
  Object.entries(monthlyData).forEach(([month, data]) => {
    monthlyTrends.push({
      month: month,
      ...data
    })
  })

  monthlyTrends.sort((a, b) => a.month.localeCompare(b.month))

  return {
    total_income: summary.totalMonthlyIncome,
    recurring_income: summary.recurringIncome,
    one_time_income: summary.oneTimeIncome,
    income_by_type: incomeByType,
    monthly_trends: monthlyTrends
  }
})

// Score utility functions
const getScoreColorClass = (scoreType, score) => {
  if (score >= 80) return 'bg-green-100 dark:bg-green-900/30'
  if (score >= 60) return 'bg-blue-100 dark:bg-blue-900/30'
  if (score >= 40) return 'bg-yellow-100 dark:bg-yellow-900/30'
  return 'bg-red-100 dark:bg-red-900/30'
}

const getScoreTextColor = (scoreType, score) => {
  if (score >= 80) return 'text-green-600 dark:text-green-400'
  if (score >= 60) return 'text-blue-600 dark:text-blue-400'
  if (score >= 40) return 'text-yellow-600 dark:text-yellow-400'
  return 'text-red-600 dark:text-red-400'
}

const getScoreBarColor = (scoreType, score) => {
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-blue-500'
  if (score >= 40) return 'bg-yellow-500'
  return 'bg-red-500'
}

const getScoreLabel = (scoreType, score) => {
  if (score >= 80) return 'Excellent'
  if (score >= 60) return 'Good'
  if (score >= 40) return 'Fair'
  return 'Poor'
}

const getStabilityExplanation = (score) => {
  if (score >= 80) return 'Your income is highly stable with a strong foundation of recurring sources. This provides excellent financial predictability and security.'
  if (score >= 60) return 'You have a stable income foundation with good recurring sources. Consider building more recurring streams for even better stability.'
  if (score >= 40) return 'Your income has moderate stability. Focus on converting one-time sources to recurring streams where possible.'
  return 'Your income is primarily from one-time sources, which creates financial uncertainty. Prioritize building recurring income streams.'
}

const getDiversificationExplanation = (score) => {
  if (score >= 80) return 'Your income is highly diversified across multiple sources, which reduces dependency risk and provides financial resilience.'
  if (score >= 60) return 'You have good income diversification. Consider exploring additional income streams to further reduce risk.'
  if (score >= 40) return 'Your income has moderate diversification. Adding 1-2 more income sources would improve your financial security.'
  return 'Your income has limited diversification. You are vulnerable to disruptions in your primary income source. Focus on building additional streams.'
}

const getGrowthExplanation = (score) => {
  if (score >= 80) return 'Your income shows strong growth momentum with frequent updates and positive trends. Keep up the excellent progress!'
  if (score >= 60) return 'Your income shows positive growth signals. Continue monitoring and optimizing your income sources for sustained growth.'
  if (score >= 40) return 'Your income shows moderate growth activity. Consider actively managing and expanding your income sources.'
  return 'Your income shows limited growth activity. Focus on actively developing and optimizing your income streams for better financial progress.'
}

const getIncomeByType = (type) => {
  let total = 0
  incomes.value.forEach(income => {
    income.sources.forEach(source => {
      if (source.type === type) {
        total += source.amount
      }
    })
  })
  return total
}

const getRecentActivityCount = () => {
  const now = new Date()
  const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
  return incomes.value.filter(income =>
    new Date(income.updatedAt || income.createdAt) >= monthAgo
  ).length
}

const getGrowthTrendText = () => {
  const now = new Date()
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())

  const recentIncomes = incomes.value.filter(income =>
    new Date(income.createdAt) >= threeMonthsAgo
  )
  const olderIncomes = incomes.value.filter(income =>
    new Date(income.createdAt) < threeMonthsAgo
  )

  if (recentIncomes.length === 0 || olderIncomes.length === 0) return 'Insufficient data'

  const recentAvg = recentIncomes.reduce((sum, income) => sum + income.monthlyIncome, 0) / recentIncomes.length
  const olderAvg = olderIncomes.reduce((sum, income) => sum + income.monthlyIncome, 0) / olderIncomes.length
  const growthRate = ((recentAvg - olderAvg) / olderAvg) * 100

  if (growthRate > 10) return `+${Math.round(growthRate)}% (Growing)`
  if (growthRate > 0) return `+${Math.round(growthRate)}% (Stable)`
  if (growthRate > -10) return `${Math.round(growthRate)}% (Declining)`
  return `${Math.round(growthRate)}% (Steep decline)`
}

const getGrowthTrendColor = () => {
  const trendText = getGrowthTrendText()
  if (trendText.includes('Growing')) return 'text-green-600 dark:text-green-400'
  if (trendText.includes('Stable')) return 'text-blue-600 dark:text-blue-400'
  if (trendText.includes('Declining')) return 'text-yellow-600 dark:text-yellow-400'
  if (trendText.includes('Steep decline')) return 'text-red-600 dark:text-red-400'
  return 'text-gray-600 dark:text-gray-400'
}

const getRecentAverage = () => {
  const now = new Date()
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())

  const recentIncomes = incomes.value.filter(income =>
    new Date(income.createdAt) >= threeMonthsAgo
  )

  if (recentIncomes.length === 0) return 0
  return recentIncomes.reduce((sum, income) => sum + income.monthlyIncome, 0) / recentIncomes.length
}

const getHistoricalAverage = () => {
  const now = new Date()
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())

  const olderIncomes = incomes.value.filter(income =>
    new Date(income.createdAt) < threeMonthsAgo
  )

  if (olderIncomes.length === 0) return 0
  return olderIncomes.reduce((sum, income) => sum + income.monthlyIncome, 0) / olderIncomes.length
}

// Methods
const updatePeriodFilter = async () => {
  const now = getClientTime()
  let dateFrom = ''
  let dateTo = getClientDateString()

  switch (selectedPeriod.value) {
    case 'this_month':
      dateFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
      break
    case 'last_month':
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      dateFrom = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}-01`
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
      dateTo = `${lastMonthEnd.getFullYear()}-${String(lastMonthEnd.getMonth() + 1).padStart(2, '0')}-${String(lastMonthEnd.getDate()).padStart(2, '0')}`
      break
    case 'last_3_months':
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)
      dateFrom = `${threeMonthsAgo.getFullYear()}-${String(threeMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`
      break
    case 'last_6_months':
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)
      dateFrom = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}-01`
      break
    case 'this_year':
      dateFrom = `${now.getFullYear()}-01-01`
      break
    case 'all_time':
      dateFrom = ''
      dateTo = ''
      break
  }

  await actions.updateFilters({
    dateFrom,
    dateTo,
    period: selectedPeriod.value
  })
}

const refreshReports = async () => {
  await actions.refreshIncomes()
}

const updateAnalysisFilters = async () => {
  await actions.updateFilters({
    incomeType: analysisFilters.value.incomeType,
    isRecurring: analysisFilters.value.isRecurring,
    amountMin: analysisFilters.value.amountMin,
    amountMax: analysisFilters.value.amountMax
  })
}

const resetAnalysisFilters = async () => {
  analysisFilters.value = {
    incomeType: '',
    isRecurring: null,
    amountMin: '',
    amountMax: ''
  }
  await updateAnalysisFilters()
}

const exportReport = () => {
  const csvData = generateCSVData()
  const blob = new Blob([csvData], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `income-report-${selectedReport.value}-${selectedPeriod.value}-${new Date().toISOString().split('T')[0]}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

const generateCSVData = () => {
  let csv = ''

  if (selectedReport.value === 'summary') {
    csv = 'Income Type,Amount,Percentage\n'
    Object.entries(reportData.value.income_by_type).forEach(([type, amount]) => {
      const numAmount = Number(amount)
      const percentage = ((numAmount / reportData.value.total_income) * 100).toFixed(1)
      csv += `"${type}",${numAmount},${percentage}%\n`
    })
  } else if (selectedReport.value === 'trends') {
    csv = 'Month,Total,Recurring,One-time\n'
    reportData.value.monthly_trends.forEach((trend) => {
      csv += `"${trend.month}",${trend.total},${trend.recurring},${trend.one_time}\n`
    })
  } else if (selectedReport.value === 'detailed') {
    csv = 'Income Source,Type,Amount,Is Recurring,Date\n'
    incomes.value.forEach(income => {
      income.sources.forEach(source => {
        csv += `"${source.type}","${source.type}",${source.amount},"${source.isRecurring ? 'Yes' : 'No'}","${source.dateTime}"\n`
      })
    })
  }

  return csv
}

const formatPeriod = (period: string) => {
  const map = {
    'this_month': 'This Month',
    'last_month': 'Last Month',
    'last_3_months': 'Last 3 Months',
    'last_6_months': 'Last 6 Months',
    'this_year': 'This Year',
    'all_time': 'All Time'
  }
  return map[period] || period
}

const getTypeColor = (type: string) => {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ]
  const index = type.length % colors.length
  return colors[index]
}

// Watch for changes in report type
watch(selectedReport, async () => {
  if (selectedReport.value === 'detailed') {
    // Ensure we have the latest data for detailed analysis
    await actions.ensureDataLoaded()
  }
})

// Lifecycle
onMounted(async () => {
  try {
    // Initialize the composable and load data
    await actions.initialize({ loadData: true })
    // Set initial period filter
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