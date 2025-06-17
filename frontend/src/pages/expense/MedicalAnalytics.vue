<template>
  <div class="medical-analytics">
    <!-- Header Section -->
    <div class="header-section mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Medical Expense Analytics</h1>
          <p class="text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-1">Comprehensive CHE analysis according to WHO standards</p>
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
        <p class="text-gray-600 dark:text-gray-400 dark:text-gray-500 ml-3">Loading medical analytics...</p>
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
            <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error Loading Medical Analytics</h3>
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
    <div v-else class="analytics-content space-y-6">
      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <!-- Total Medical Expenses -->
          <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <Heart class="w-4 h-4 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Total Medical</p>
                <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">₹{{ medicalExpenseAmount.toLocaleString() }}</p>
              </div>
            </div>
          </div>

          <!-- Monthly Income -->
          <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <TrendingUp class="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Monthly Income</p>
                <p v-if="income.totalMonthlyIncome.value > 0" class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  ₹{{ income.totalMonthlyIncome.value.toLocaleString() }}
                </p>
                <p v-else class="text-lg font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500">N/A</p>
              </div>
            </div>
          </div>

          <!-- CHE Ratio -->
          <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Percent class="w-4 h-4 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">CHE Ratio</p>
                <p v-if="hasIncomeData" class="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {{ cheRatio.toFixed(2) }}%
                </p>
                <p v-else class="text-lg font-semibold text-gray-500 dark:text-gray-400 dark:text-gray-500">N/A</p>
              </div>
            </div>
          </div>

          <!-- Risk Level -->
          <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div :class="getRiskLevelBgColor(riskLevel)" class="w-8 h-8 rounded-full flex items-center justify-center">
                  <Shield :class="getRiskLevelTextColor(riskLevel)" class="w-4 h-4" />
                </div>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Risk Level</p>
                <p :class="getRiskLevelTextColor(riskLevel)" class="text-sm font-semibold capitalize">{{ riskLevel }}</p>
              </div>
            </div>
          </div>

          <!-- Financial Protection Status -->
          <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-4">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <div :class="getProtectionStatusBgColor(financialProtectionStatus)" class="w-8 h-8 rounded-full flex items-center justify-center">
                  <Shield :class="getProtectionStatusTextColor(financialProtectionStatus)" class="w-4 h-4" />
                </div>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Protection</p>
                <p :class="getProtectionStatusTextColor(financialProtectionStatus)" class="text-xs font-semibold capitalize">{{ financialProtectionStatus.replace('_', ' ') }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Advanced Charts Section -->
      <div v-if="hasIncomeData" class="advanced-charts">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- CHE Risk Gauge (ECharts) -->
          <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">CHE Risk Assessment Gauge</h2>
            <div class="h-64">
              <v-chart 
                :option="gaugeOption" 
                :autoresize="true"
                class="w-full h-full"
              />
            </div>
            <div class="mt-4 grid grid-cols-3 gap-4 text-center">
              <div class="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                <div class="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500">Safe Zone</div>
                <div class="text-sm font-semibold text-green-600 dark:text-green-400">≤ 10%</div>
                </div>
              <div class="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                <div class="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500">Moderate Risk</div>
                <div class="text-sm font-semibold text-yellow-600 dark:text-yellow-400">10-25%</div>
              </div>
              <div class="p-2 bg-red-50 dark:bg-red-900/20 rounded">
                <div class="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500">High Risk</div>
                <div class="text-sm font-semibold text-red-600 dark:text-red-400">≥ 25%</div>
              </div>
            </div>
          </div>

          <!-- Medical Category Breakdown (ApexCharts Pie) -->
          <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Medical Category Distribution</h2>
            <div class="h-64">
              <apexchart
                v-if="medicalCategoryBreakdown.length > 0"
                type="pie"
                :options="pieChartOptions"
                :series="pieChartSeries"
                height="100%"
              />
              <div v-else class="flex items-center justify-center h-full text-gray-500 dark:text-gray-400 dark:text-gray-500">
                <div class="text-center">
                  <Heart class="w-12 h-12 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
                  <p class="text-sm">No medical expenses found</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Income Data Missing Alert -->
      <div v-else class="income-missing-alert">
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

      <!-- WHO CHE Threshold Analysis with Advanced Progress Bars -->
      <div v-if="hasIncomeData" class="che-thresholds">
        <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-6">
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
                  <span class="text-xs font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-600">{{ cheRatio.toFixed(2) }}% / 10%</span>
                </div>
              </div>
              <p class="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-2">
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
                  <span class="text-xs font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-600">{{ cheRatio.toFixed(2) }}% / 25%</span>
            </div>
          </div>
              <p class="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-2">
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
                  <span class="text-xs font-semibold text-gray-700 dark:text-gray-300 dark:text-gray-600">{{ cheRatio.toFixed(2) }}% / 40%</span>
                </div>
              </div>
              <p class="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-2">
                Spending above 40% represents critical financial distress requiring immediate intervention.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Advanced Financial Analysis Charts -->
      <div v-if="hasIncomeData" class="financial-analysis-charts">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Income vs Expenses Comparison (ApexCharts Bar) -->
        <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Income vs Medical Expenses</h2>
            <div class="h-64">
              <apexchart
                type="bar"
                :options="barChartOptions"
                :series="barChartSeries"
                height="100%"
              />
            </div>
          </div>

          <!-- Financial Health Donut Chart (ECharts) -->
          <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Financial Health Overview</h2>
            <div class="h-64">
              <v-chart 
                :option="donutOption" 
                :autoresize="true"
                class="w-full h-full"
              />
                    </div>
                  </div>
                  </div>
      </div>

              <!-- Monthly Trends Chart (if data available) -->
        <div v-if="hasIncomeData && monthlyTrendsData.length > 0" class="monthly-trends">
          <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Monthly CHE Trends</h2>
            <div class="h-64">
              <v-chart 
                :option="lineChartOption" 
                :autoresize="true"
                class="w-full h-full"
              />
                </div>
              </div>
            </div>

      <!-- Medical Categorization Component -->
      <div class="medical-categorization-section mb-6">
        <MedicalCategorization 
          :medical-expenses="medicalExpenses"
          @category-selected="handleMedicalCategorySelected"
          @export-requested="handleMedicalExport"
        />
      </div>

      <!-- Medical Category Breakdown Table -->
      <div class="category-breakdown">
        <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Medical Expense Categories Summary</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Medical Categories Summary -->
            <div>
              <h3 class="text-sm font-medium text-red-900 mb-3 flex items-center">
                <Heart class="w-4 h-4 mr-2" />
                Medical Expenses Summary ({{ medicalExpenses.length }})
              </h3>
              <div class="space-y-2">
                <div 
                  v-for="category in medicalCategoryBreakdown" 
                  :key="category.category"
                  class="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:bg-red-900/30 transition-colors"
                >
                  <div class="flex items-center">
                    <div class="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
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

            <!-- Financial Impact Analysis -->
            <div v-if="hasIncomeData">
              <h3 class="text-sm font-medium text-blue-900 mb-3 flex items-center">
                <Calculator class="w-4 h-4 mr-2" />
                Financial Impact Analysis
              </h3>
              <div class="space-y-3">
                <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 hover:bg-blue-100 dark:bg-blue-900/30 transition-colors">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-gray-900 dark:text-gray-100">Monthly Income</span>
                    <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">₹{{ income.totalMonthlyIncome.value.toLocaleString() }}</span>
        </div>
      </div>
                <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 hover:bg-red-100 dark:bg-red-900/30 transition-colors">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-gray-900 dark:text-gray-100">Medical Expenses</span>
                    <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">₹{{ medicalExpenseAmount.toLocaleString() }}</span>
                </div>
              </div>
                <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 hover:bg-green-100 dark:bg-green-900/30 transition-colors">
                  <div class="flex items-center justify-between">
                    <span class="text-sm font-medium text-gray-900 dark:text-gray-100">Remaining Income</span>
                    <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">₹{{ (income.totalMonthlyIncome.value - medicalExpenseAmount).toLocaleString() }}</span>
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
        <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-6">
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
import { GaugeChart, LineChart, PieChart } from "echarts/charts"
import {
	GridComponent,
	LegendComponent,
	TitleComponent,
	TooltipComponent,
} from "echarts/components"
import { use } from "echarts/core"
import { CanvasRenderer } from "echarts/renderers"
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
import { computed, onMounted, ref, watch } from "vue"
import VChart from "vue-echarts"
import VueApexCharts from "vue3-apexcharts"

// Register ApexCharts component
const apexchart = VueApexCharts
import ExpenseFilter from "../../components/expense/ExpenseFilter.vue"
import MedicalCategorization from "../../components/expense/MedicalCategorization.vue"
import { useExpense } from "../../composables/useExpense"
import { useIncome } from "../../composables/useIncome"
import type { ExpenseFilters, ProcessedExpenseItem } from "../../types/expense"

// Register ECharts components
use([
	CanvasRenderer,
	GaugeChart,
	PieChart,
	LineChart,
	TitleComponent,
	TooltipComponent,
	LegendComponent,
	GridComponent,
])

// Composables
const {
	expenses,
	loading: expenseLoading,
	error: expenseError,
	medicalExpenses,
	medicalExpenseAmount,
	totalExpenseCount,
	loadExpenses,
	refreshExpenses,
	updateFilters,
	clearCache,
} = useExpense({ enableAdvancedAnalysis: false })

const income = useIncome()
const { totalIncome, getAnalytics } = income

// Local state
const expenseFilters = ref<ExpenseFilters>({
	searchTerm: "",
	dateFrom: "",
	dateTo: "",
	amountMin: "",
	amountMax: "",
	category: "",
	type: "medical", // Default to medical expenses only
	sortBy: "date",
	sortOrder: "desc",
	period: "this-month",
})

// Computed properties
const loading = computed(() => expenseLoading.value || income.loading)
const error = computed(() => expenseError.value || income.error)
const filteredExpenseCount = computed(() => expenses.value.length)
const hasIncomeData = computed(() => income.totalIncome.value > 0)

// CHE Calculations according to WHO standards
const cheRatio = computed(() => {
	if (!hasIncomeData.value || medicalExpenseAmount.value === 0) return 0
	return (medicalExpenseAmount.value / income.totalIncome.value) * 100
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
				count: expenses.length,
				totalAmount,
				percentage: totalMedical > 0 ? (totalAmount / totalMedical) * 100 : 0,
			}
		})
		.sort((a, b) => b.totalAmount - a.totalAmount)
})

// Mock monthly trends data (replace with actual data when available)
const monthlyTrendsData = computed(
	(): Array<{
		month: string
		cheRatio: number
		amount: number
	}> => {
		// This would come from your expense service in a real implementation
		return []
	},
)

// Chart Options and Data

// ECharts Gauge Option
const gaugeOption = computed(() => ({
	series: [
		{
			type: "gauge",
			center: ["50%", "60%"],
			startAngle: 200,
			endAngle: -20,
			min: 0,
			max: 50,
			splitNumber: 5,
			itemStyle: {
				color: getRiskLevelColor(riskLevel.value),
			},
			progress: {
				show: true,
				width: 18,
				itemStyle: {
					color: getRiskLevelColor(riskLevel.value),
				},
			},
			pointer: {
				show: true,
				length: "80%",
				width: 5,
				itemStyle: {
					color: getRiskLevelColor(riskLevel.value),
					shadowColor: "rgba(0, 0, 0, 0.3)",
					shadowBlur: 5,
					shadowOffsetX: 2,
					shadowOffsetY: 2,
				},
			},
			anchor: {
				show: true,
				showAbove: true,
				size: 8,
				itemStyle: {
					color: "#374151",
					borderWidth: 2,
					borderColor: "#fff",
					shadowColor: "rgba(0, 0, 0, 0.3)",
					shadowBlur: 5,
				},
			},
			axisLine: {
				lineStyle: {
					width: 18,
					color: [
						[0.2, "#10b981"], // Green for 0-10%
						[0.5, "#f59e0b"], // Yellow for 10-25%
						[1, "#ef4444"], // Red for 25%+
					],
				},
			},
			axisTick: {
				distance: -32,
				splitNumber: 5,
				lineStyle: {
					width: 2,
					color: "#999",
				},
			},
			splitLine: {
				distance: -38,
				length: 12,
				lineStyle: {
					width: 3,
					color: "#999",
				},
			},
			axisLabel: {
				distance: -12,
				color: "#666",
				fontSize: 11,
				formatter: (value: number) => value + "%",
			},
			title: {
				show: false,
			},
			detail: {
				valueAnimation: true,
				width: "60%",
				lineHeight: 40,
				borderRadius: 8,
				offsetCenter: [0, "35%"],
				fontSize: 18,
				fontWeight: "bolder",
				formatter: (value: number) => value.toFixed(2) + "%",
				color: getRiskLevelColor(riskLevel.value),
			},
			data: [
				{
					value: Math.min(cheRatio.value, 50),
					name: "CHE Ratio",
				},
			],
		},
	],
	tooltip: {
		formatter: `CHE Ratio: ${cheRatio.value.toFixed(2)}%<br/>Risk Level: ${riskLevel.value}`,
	},
}))

// ECharts Donut Option
const donutOption = computed(() => {
	const remainingIncome = Math.max(
		0,
		income.totalIncome.value - medicalExpenseAmount.value,
	)

	return {
		tooltip: {
			trigger: "item",
			formatter: "{a} <br/>{b}: ₹{c} ({d}%)",
		},
		legend: {
			bottom: "5%",
			left: "center",
		},
		series: [
			{
				name: "Financial Allocation",
				type: "pie",
				radius: ["40%", "70%"],
				center: ["50%", "45%"],
				avoidLabelOverlap: false,
				itemStyle: {
					borderRadius: 10,
					borderColor: "#fff",
					borderWidth: 2,
				},
				label: {
					show: false,
					position: "center",
				},
				emphasis: {
					label: {
						show: true,
						fontSize: 20,
						fontWeight: "bold",
					},
				},
				labelLine: {
					show: false,
				},
				data: [
					{
						value: medicalExpenseAmount.value,
						name: "Medical Expenses",
						itemStyle: { color: "#ef4444" },
					},
					{
						value: remainingIncome,
						name: "Available Income",
						itemStyle: { color: "#10b981" },
					},
				],
			},
		],
	}
})

// ECharts Line Chart Option (for monthly trends)
const lineChartOption = computed(() => ({
	tooltip: {
		trigger: "axis",
	},
	legend: {
		data: ["CHE Ratio", "Medical Expenses"],
	},
	grid: {
		left: "3%",
		right: "4%",
		bottom: "3%",
		containLabel: true,
	},
	xAxis: {
		type: "category",
		boundaryGap: false,
		data: monthlyTrendsData.value.map((item) => item.month),
	},
	yAxis: [
		{
			type: "value",
			name: "CHE Ratio (%)",
			position: "left",
		},
		{
			type: "value",
			name: "Amount (₹)",
			position: "right",
		},
	],
	series: [
		{
			name: "CHE Ratio",
			type: "line",
			yAxisIndex: 0,
			data: monthlyTrendsData.value.map((item) => item.cheRatio),
			smooth: true,
			lineStyle: {
				color: "#8b5cf6",
			},
		},
		{
			name: "Medical Expenses",
			type: "line",
			yAxisIndex: 1,
			data: monthlyTrendsData.value.map((item) => item.amount),
			smooth: true,
			lineStyle: {
				color: "#ef4444",
			},
		},
	],
}))

// ApexCharts Pie Chart Options
const pieChartOptions = computed(() => ({
	chart: {
		type: "pie",
		height: 280,
	},
	labels: medicalCategoryBreakdown.value.map((cat) => cat.category),
	colors: [
		"#ef4444",
		"#f97316",
		"#f59e0b",
		"#eab308",
		"#84cc16",
		"#22c55e",
		"#10b981",
		"#14b8a6",
	],
	legend: {
		position: "bottom",
		fontSize: "12px",
	},
	tooltip: {
		y: {
			formatter: (value: number) => `₹${value.toLocaleString()}`,
		},
	},
	plotOptions: {
		pie: {
			donut: {
				size: "45%",
			},
		},
	},
	dataLabels: {
		enabled: true,
		formatter: (val: number) => `${val.toFixed(1)}%`,
		style: {
			fontSize: "11px",
		},
	},
}))

const pieChartSeries = computed(() =>
	medicalCategoryBreakdown.value.map((cat) => cat.totalAmount),
)

// ApexCharts Bar Chart Options
const barChartOptions = computed(() => ({
	chart: {
		type: "bar",
		height: 280,
	},
	plotOptions: {
		bar: {
			horizontal: false,
			columnWidth: "55%",
			endingShape: "rounded",
		},
	},
	dataLabels: {
		enabled: false,
	},
	stroke: {
		show: true,
		width: 2,
		colors: ["transparent"],
	},
	xaxis: {
		categories: ["Monthly Comparison"],
		labels: {
			style: {
				fontSize: "11px",
			},
		},
	},
	yaxis: {
		title: {
			text: "Amount (₹)",
			style: {
				fontSize: "12px",
			},
		},
		labels: {
			formatter: (value: number) => `₹${value.toLocaleString()}`,
			style: {
				fontSize: "11px",
			},
		},
	},
	fill: {
		opacity: 1,
	},
	tooltip: {
		y: {
			formatter: (val: number) => `₹${val.toLocaleString()}`,
		},
	},
	colors: ["#10b981", "#ef4444"],
	legend: {
		fontSize: "12px",
	},
}))

const barChartSeries = computed(() => [
	{
		name: "Monthly Income",
		data: [income.totalIncome.value],
	},
	{
		name: "Medical Expenses",
		data: [medicalExpenseAmount.value],
	},
])

// Risk level styling functions
const getRiskLevelColor = (level: string) => {
	const colors = {
		minimal: "#10b981",
		moderate: "#f59e0b",
		high: "#f97316",
		critical: "#ef4444",
		unknown: "#6b7280",
	}
	return colors[level] || colors.unknown
}

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

const getRiskAlertBgColor = (level: string) => {
	const colors = {
		minimal: "bg-green-50",
		moderate: "bg-yellow-50",
		high: "bg-orange-50",
		critical: "bg-red-50",
		unknown: "bg-gray-50",
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
const getRiskRecommendation = () => {
	const level = riskLevel.value
	const recommendations = {
		minimal:
			"Your medical expenses are within safe limits. Continue monitoring and maintain emergency savings.",
		moderate:
			"Medical expenses are approaching concerning levels. Consider reviewing healthcare costs and exploring insurance options.",
		high: "Medical expenses represent a significant financial burden. Urgent review of healthcare spending and financial protection needed.",
		critical:
			"Medical expenses pose critical financial risk. Immediate intervention required to prevent financial hardship.",
		unknown: "Add income data to assess your financial risk level.",
	}
	return recommendations[level] || recommendations.unknown
}

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
const handleRefresh = async () => {
	try {
		clearCache()
		await refreshExpenses()
		await income.fetchIncome({ forceRefresh: true })
	} catch (err) {
		console.error("Error refreshing data:", err)
	}
}

const handleFiltersUpdate = async (newFilters: ExpenseFilters) => {
	expenseFilters.value = { ...newFilters }
	await updateFilters(newFilters)
}

const handleMedicalCategorySelected = (category: any) => {
	console.log("Medical category selected in analytics:", category)
	// Handle medical category selection for analytics
}

const handleMedicalExport = (data: any) => {
	console.log("Medical categorization export requested in analytics:", data)
	// Handle export functionality with analytics context
	const analyticsData = {
		...data,
		cheAnalysis: {
			cheRatio: cheRatio.value,
			riskLevel: riskLevel.value,
			financialProtectionStatus: financialProtectionStatus.value,
			totalMonthlyIncome: income.totalIncome.value,
			medicalExpenseAmount: medicalExpenseAmount.value,
		},
		timestamp: new Date().toISOString(),
	}

	const blob = new Blob([JSON.stringify(analyticsData, null, 2)], {
		type: "application/json",
	})
	const url = URL.createObjectURL(blob)
	const a = document.createElement("a")
	a.href = url
	a.download = `medical-analytics-categorization-${new Date().toISOString().split("T")[0]}.json`
	document.body.appendChild(a)
	a.click()
	document.body.removeChild(a)
	URL.revokeObjectURL(url)
}

// Lifecycle
onMounted(async () => {
	try {
		await loadExpenses({ useCache: true })
		await income.initialize({ withAnalytics: true, forceRefresh: true })
		await income.fetchIncomeWithAnalytics({ forceRefresh: false })
	} catch (err) {
		console.error("Error loading initial data:", err)
	}
})

// Watch for filter changes to ensure responsiveness
watch(
	expenseFilters,
	async (newFilters) => {
		await updateFilters(newFilters)
	},
	{ deep: true },
)
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

.advanced-charts {
  @apply transition-all duration-300;
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