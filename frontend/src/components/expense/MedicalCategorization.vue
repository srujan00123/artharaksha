<template>
  <div class="medical-categorization">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Medical Expense Categorization</h2>
        <p class="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-1">WHO-compliant direct and indirect medical expense analysis</p>
      </div>
      <div class="flex items-center space-x-2">
        <button 
          @click="toggleView"
          class="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 bg-white dark:bg-gray-800 dark:bg-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 dark:bg-gray-100 transition-colors"
        >
          <BarChart3 class="w-4 h-4 mr-2" />
          {{ viewMode === 'cards' ? 'Chart View' : 'Card View' }}
        </button>
        <button 
          @click="exportData"
          class="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 bg-white dark:bg-gray-800 dark:bg-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 dark:bg-gray-100 transition-colors"
        >
          <Download class="w-4 h-4 mr-2" />
          Export
        </button>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <!-- Total Medical -->
      <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
              <Heart class="w-4 h-4 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Total Medical</p>
            <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">₹{{ totalMedicalAmount.toLocaleString() }}</p>
          </div>
        </div>
      </div>

      <!-- Direct Medical -->
      <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <Stethoscope class="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Direct Medical</p>
            <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">₹{{ directMedicalAmount.toLocaleString() }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{{ directMedicalPercentage.toFixed(1) }}% of total</p>
          </div>
        </div>
      </div>

      <!-- Indirect Medical -->
      <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <Car class="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Indirect Medical</p>
            <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">₹{{ indirectMedicalAmount.toLocaleString() }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{{ indirectMedicalPercentage.toFixed(1) }}% of total</p>
          </div>
        </div>
      </div>

      <!-- Transaction Count -->
      <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-4">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <Hash class="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div class="ml-3">
            <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Transactions</p>
            <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ totalTransactions }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{{ directTransactions }}D + {{ indirectTransactions }}I</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-if="viewMode === 'cards'" class="cards-view">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Direct Medical Expenses -->
        <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border">
          <div class="p-6 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-3">
                  <Stethoscope class="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-blue-900">Direct Medical Expenses</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Healthcare services and treatments</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">₹{{ directMedicalAmount.toLocaleString() }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{{ directMedicalCategoriesComputed.length }} categories</p>
              </div>
            </div>
          </div>
          
          <div class="p-6">
            <div class="space-y-3">
              <div 
                v-for="category in directMedicalCategoriesComputed" 
                :key="category.category"
                class="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:bg-blue-900/30 transition-colors cursor-pointer"
                @click="selectCategory(category)"
              >
                <div class="flex items-center">
                  <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mr-3">
                    <component :is="getCategoryIcon(category.category)" class="w-4 h-4 text-blue-600 dark:text-blue-400" />
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
              <div v-if="directMedicalCategoriesComputed.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400 dark:text-gray-500">
                <Stethoscope class="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p class="text-sm">No direct medical expenses found</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Indirect Medical Expenses -->
        <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border">
          <div class="p-6 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <Car class="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 class="text-lg font-semibold text-purple-900">Indirect Medical Expenses</h3>
                  <p class="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Transportation, accommodation, and related costs</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">₹{{ indirectMedicalAmount.toLocaleString() }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{{ indirectMedicalCategoriesComputed.length }} categories</p>
              </div>
            </div>
          </div>
          
          <div class="p-6">
            <div class="space-y-3">
              <div 
                v-for="category in indirectMedicalCategoriesComputed" 
                :key="category.category"
                class="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 transition-colors cursor-pointer"
                @click="selectCategory(category)"
              >
                <div class="flex items-center">
                  <div class="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <component :is="getCategoryIcon(category.category)" class="w-4 h-4 text-purple-600 dark:text-purple-400" />
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
              <div v-if="indirectMedicalCategoriesComputed.length === 0" class="text-center py-8 text-gray-500 dark:text-gray-400 dark:text-gray-500">
                <Car class="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p class="text-sm">No indirect medical expenses found</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Chart View -->
    <div v-else class="chart-view">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Direct vs Indirect Comparison Chart -->
        <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Direct vs Indirect Medical Expenses</h3>
          <div class="h-64">
            <apexchart
              type="donut"
              :options="comparisonChartOptions"
              :series="comparisonChartSeries"
              height="100%"
            />
          </div>
        </div>

        <!-- Category Breakdown Chart -->
        <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Category Breakdown</h3>
          <div class="h-64">
            <apexchart
              type="bar"
              :options="categoryChartOptions"
              :series="categoryChartSeries"
              height="100%"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Selected Category Details Modal -->
    <div v-if="selectedCategory" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" @click="closeModal">
      <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden" @click.stop>
        <div class="p-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div class="flex items-center space-x-3">
              <div :class="selectedCategory.type === 'direct' ? 'bg-blue-100' : 'bg-purple-100'" class="w-10 h-10 rounded-lg flex items-center justify-center">
                <component :is="getCategoryIcon(selectedCategory.category)" :class="selectedCategory.type === 'direct' ? 'text-blue-600' : 'text-purple-600'" class="w-5 h-5" />
              </div>
              <div>
                <h2 class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ selectedCategory.category }}</h2>
                <p class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                  {{ selectedCategory.type === 'direct' ? 'Direct' : 'Indirect' }} Medical • 
                  {{ selectedCategory.count }} transactions • 
                  ₹{{ selectedCategory.averageAmount.toLocaleString() }} average
                </p>
              </div>
            </div>
            <button 
              @click="closeModal"
              class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:text-gray-500 transition-colors"
            >
              <X class="w-5 h-5" />
            </button>
          </div>
        </div>

        <div class="p-6 overflow-y-auto max-h-96">
          <h3 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Recent Transactions</h3>
          <div class="space-y-3">
            <div 
              v-for="expense in selectedCategory.expenses.slice(0, 10)" 
              :key="expense.id"
              class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 dark:bg-gray-100 rounded-lg"
            >
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ expense.description || expense.category }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{{ formatDate(expense.date) }} • {{ expense.provider || 'Healthcare' }}</p>
              </div>
              <div class="text-right">
                <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">₹{{ expense.amount.toLocaleString() }}</p>
                <div class="flex items-center space-x-1 mt-1">
                  <span v-if="expense.hasReceipt" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                    Receipt
                  </span>
                  <span :class="selectedCategory.type === 'direct' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'" class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium">
                    {{ selectedCategory.type === 'direct' ? 'Direct' : 'Indirect' }}
                  </span>
                </div>
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
import { ref, computed, defineProps, defineEmits } from 'vue'
import { 
  Heart, 
  Stethoscope, 
  Car, 
  Hash, 
  BarChart3, 
  Download, 
  X,
  Pill,
  Building2,
  Bed,
  Syringe,
  Plane,
  Home,
  Utensils,
  Phone
} from 'lucide-vue-next'
import VueApexCharts from 'vue3-apexcharts'
import type { ProcessedExpenseItem } from '../../types/expense'

const apexchart = VueApexCharts

// Props
interface Props {
  medicalExpenses: ProcessedExpenseItem[]
}

const props = defineProps<Props>()

// Filter expenses based on backend isDirect field
const directMedicalExpenses = computed(() => 
  props.medicalExpenses.filter(expense => expense.isDirect === true)
)

const indirectMedicalExpenses = computed(() => 
  props.medicalExpenses.filter(expense => expense.isDirect === false)
)

const directMedicalAmount = computed(() => 
  directMedicalExpenses.value.reduce((sum, expense) => sum + expense.amount, 0)
)

const indirectMedicalAmount = computed(() => 
  indirectMedicalExpenses.value.reduce((sum, expense) => sum + expense.amount, 0)
)

// Emits
const emit = defineEmits<{
  categorySelected: [category: CategoryBreakdown]
  exportRequested: [data: any]
}>()

// Local state
const viewMode = ref<'cards' | 'charts'>('cards')
const selectedCategory = ref<CategoryBreakdown | null>(null)

// Category breakdown interface
interface CategoryBreakdown {
  category: string
  type: 'direct' | 'indirect'
  count: number
  totalAmount: number
  averageAmount: number
  percentage: number
  expenses: ProcessedExpenseItem[]
}



// Computed properties
const totalMedicalAmount = computed(() => 
  props.medicalExpenses.reduce((sum, expense) => sum + expense.amount, 0)
)

const directMedicalPercentage = computed(() => 
  totalMedicalAmount.value > 0 ? (directMedicalAmount.value / totalMedicalAmount.value) * 100 : 0
)

const indirectMedicalPercentage = computed(() => 
  totalMedicalAmount.value > 0 ? (indirectMedicalAmount.value / totalMedicalAmount.value) * 100 : 0
)

const totalTransactions = computed(() => props.medicalExpenses.length)
const directTransactions = computed(() => directMedicalExpenses.value.length)
const indirectTransactions = computed(() => indirectMedicalExpenses.value.length)

// Category breakdowns
const directMedicalCategoriesComputed = computed((): CategoryBreakdown[] => {
  const categoryMap = new Map<string, ProcessedExpenseItem[]>()
  
  directMedicalExpenses.value.forEach(expense => {
    const category = expense.category
    if (!categoryMap.has(category)) {
      categoryMap.set(category, [])
    }
    categoryMap.get(category)!.push(expense)
  })

  const totalDirect = directMedicalAmount.value
  
  return Array.from(categoryMap.entries()).map(([category, expenses]) => {
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    return {
      category,
      type: 'direct' as const,
      count: expenses.length,
      totalAmount,
      averageAmount: totalAmount / expenses.length,
      percentage: totalDirect > 0 ? (totalAmount / totalDirect) * 100 : 0,
      expenses: expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }
  }).sort((a, b) => b.totalAmount - a.totalAmount)
})

const indirectMedicalCategoriesComputed = computed((): CategoryBreakdown[] => {
  const categoryMap = new Map<string, ProcessedExpenseItem[]>()
  
  indirectMedicalExpenses.value.forEach(expense => {
    const category = expense.category
    if (!categoryMap.has(category)) {
      categoryMap.set(category, [])
    }
    categoryMap.get(category)!.push(expense)
  })

  const totalIndirect = indirectMedicalAmount.value
  
  return Array.from(categoryMap.entries()).map(([category, expenses]) => {
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0)
    return {
      category,
      type: 'indirect' as const,
      count: expenses.length,
      totalAmount,
      averageAmount: totalAmount / expenses.length,
      percentage: totalIndirect > 0 ? (totalAmount / totalIndirect) * 100 : 0,
      expenses: expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    }
  }).sort((a, b) => b.totalAmount - a.totalAmount)
})

// Chart options and data
const comparisonChartOptions = computed(() => ({
  chart: {
    type: 'donut',
    height: 280
  },
  labels: ['Direct Medical', 'Indirect Medical'],
  colors: ['#3b82f6', '#8b5cf6'],
  legend: {
    position: 'bottom',
    fontSize: '12px'
  },
  tooltip: {
    y: {
      formatter: (value: number) => `₹${value.toLocaleString()}`
    }
  },
  plotOptions: {
    pie: {
      donut: {
        size: '45%',
        labels: {
          show: true,
          total: {
            show: true,
            label: 'Total Medical',
            formatter: () => `₹${totalMedicalAmount.value.toLocaleString()}`
          }
        }
      }
    }
  },
  dataLabels: {
    enabled: true,
    formatter: (val: number) => `${val.toFixed(1)}%`,
    style: {
      fontSize: '11px'
    }
  }
}))

const comparisonChartSeries = computed(() => [
  directMedicalAmount.value,
  indirectMedicalAmount.value
])

const categoryChartOptions = computed(() => ({
  chart: {
    type: 'bar',
    height: 280
  },
  plotOptions: {
    bar: {
      horizontal: true,
      columnWidth: '55%',
      endingShape: 'rounded'
    }
  },
  dataLabels: {
    enabled: false
  },
  xaxis: {
    categories: [
      ...directMedicalCategoriesComputed.value.slice(0, 5).map(cat => cat.category),
      ...indirectMedicalCategoriesComputed.value.slice(0, 5).map(cat => cat.category)
    ],
    labels: {
      style: {
        fontSize: '10px'
      }
    }
  },
  yaxis: {
    title: {
      text: 'Amount (₹)',
      style: {
        fontSize: '12px'
      }
    },
    labels: {
      formatter: (value: number) => `₹${value.toLocaleString()}`,
      style: {
        fontSize: '10px'
      }
    }
  },
  colors: ['#3b82f6', '#8b5cf6'],
  tooltip: {
    y: {
      formatter: (val: number) => `₹${val.toLocaleString()}`
    }
  }
}))

const categoryChartSeries = computed(() => [{
  name: 'Amount',
  data: [
    ...directMedicalCategoriesComputed.value.slice(0, 5).map(cat => cat.totalAmount),
    ...indirectMedicalCategoriesComputed.value.slice(0, 5).map(cat => cat.totalAmount)
  ]
}])

// Methods
const toggleView = () => {
  viewMode.value = viewMode.value === 'cards' ? 'charts' : 'cards'
}

const selectCategory = (category: CategoryBreakdown) => {
  selectedCategory.value = category
  emit('categorySelected', category)
}

const closeModal = () => {
  selectedCategory.value = null
}

const exportData = () => {
  const exportData = {
    summary: {
      totalMedical: totalMedicalAmount.value,
      directMedical: directMedicalAmount.value,
      indirectMedical: indirectMedicalAmount.value,
      directPercentage: directMedicalPercentage.value,
      indirectPercentage: indirectMedicalPercentage.value
    },
    directCategories: directMedicalCategoriesComputed.value,
    indirectCategories: indirectMedicalCategoriesComputed.value
  }
  emit('exportRequested', exportData)
}

const getCategoryIcon = (category: string) => {
  const categoryLower = category.toLowerCase()
  
  if (categoryLower.includes('medicine') || categoryLower.includes('drug') || categoryLower.includes('pharmacy')) {
    return Pill
  }
  if (categoryLower.includes('hospital') || categoryLower.includes('clinic')) {
    return Building2
  }
  if (categoryLower.includes('bed') || categoryLower.includes('admission')) {
    return Bed
  }
  if (categoryLower.includes('injection') || categoryLower.includes('vaccine')) {
    return Syringe
  }
  if (categoryLower.includes('transport') || categoryLower.includes('travel') || categoryLower.includes('flight')) {
    return categoryLower.includes('flight') ? Plane : Car
  }
  if (categoryLower.includes('accommodation') || categoryLower.includes('hotel')) {
    return Home
  }
  if (categoryLower.includes('food') || categoryLower.includes('meal')) {
    return Utensils
  }
  if (categoryLower.includes('phone') || categoryLower.includes('communication')) {
    return Phone
  }
  
  return Heart
}

const formatDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return dateString
  }
}
</script>

<style scoped>
.medical-categorization {
  @apply w-full;
}

.cards-view {
  @apply transition-all duration-300;
}

.chart-view {
  @apply transition-all duration-300;
}
</style> 