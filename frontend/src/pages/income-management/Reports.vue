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

<<<<<<< HEAD
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
=======
      <!-- Detailed Income Sources -->
      <div class="detailed-sources">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Detailed Income Sources</h2>
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
          <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p class="text-sm text-gray-600 dark:text-gray-400">
              Showing {{ totalSources }} income sources for {{ formatPeriod(selectedPeriod) }}
            </p>
>>>>>>> cache
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
<<<<<<< HEAD
                  <p class="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-1">{{ rec.description }}</p>
                  <p class="text-sm text-gray-700 dark:text-gray-300 dark:text-gray-600 mt-2 font-medium">{{ rec.action
                    }}</p>
=======
>>>>>>> cache
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
<<<<<<< HEAD

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
=======
  return map[period] || period
>>>>>>> cache
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