<template>
  <div class="income-management">
    <!-- Header Section -->
    <div class="header-section mb-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">Income Management</h1>
          <p class="text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-1">Manage your household income sources and track monthly earnings</p>
        </div>
        <div class="flex items-center space-x-3">
          <button 
            @click="openIncomeForm"
            :disabled="loading"
            class="inline-flex items-center px-4 py-2 bg-blue-600 text-white dark:text-black rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Plus class="w-4 h-4 mr-2" />
            Add Income Source
          </button>
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
      
      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <DollarSign class="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Total Monthly Income</p>
              <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">₹{{ canonicalTotalMonthlyIncome.toLocaleString('en-IN') }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Repeat class="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Recurring Income</p>
              <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">₹{{ canonicalTotalRecurringIncome.toLocaleString('en-IN') }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Calendar class="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">One-time Income</p>
              <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">₹{{ canonicalTotalOneTimeIncome.toLocaleString('en-IN') }}</p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border p-4">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <div class="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Hash class="w-4 h-4 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Income Sources</p>
              <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">{{ incomeCount }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Filter Section -->
    <IncomeFilter 
      :filters="currentFilters"
      :total-count="allIncomeSources.length"
      :filtered-count="filteredIncomeSources.length"
      :income-types="incomeTypes"
      @update:filters="handleFilterChange"
      class="mb-6"
    />

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p class="text-gray-600 dark:text-gray-400 dark:text-gray-500 ml-3">Loading income data...</p>
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
            <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error Loading Income Data</h3>
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

    <!-- Content Section -->
    <div v-else class="income-content">
      <!-- Empty State -->
      <div v-if="filteredIncomeSources.length === 0" class="empty-state">
        <div class="text-center py-12 bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border">
          <DollarSign class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
          <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
            {{ allIncomeSources.length === 0 ? 'No income sources found' : 'No income sources match your filters' }}
          </h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
            {{ allIncomeSources.length === 0 ? 'Get started by adding your first income source.' : 'Try adjusting your filters or add a new income source.' }}
          </p>
          <div class="mt-6">
            <button 
              v-if="allIncomeSources.length === 0"
              @click="openIncomeForm"
              class="inline-flex items-center px-4 py-2 border border-transparent shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 text-sm font-medium rounded-lg text-white dark:text-black bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Plus class="w-4 h-4 mr-2" />
              Add Income Source
            </button>
            <button 
              v-else
              @click="clearFilters"
              class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 dark:text-gray-600 bg-white dark:bg-gray-800 dark:bg-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 dark:bg-gray-100 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <!-- Income Sources List -->
      <div v-else class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border">
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-base font-medium text-gray-900 dark:text-gray-100">Income Sources</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">
            Showing {{ filteredIncomeSources.length }} of {{ allIncomeSources.length }} source{{ allIncomeSources.length !== 1 ? 's' : '' }} • ₹{{ canonicalTotalMonthlyIncome.toLocaleString('en-IN') }} monthly
          </p>
        </div>
        
        <!-- Table Header (Desktop) -->
        <div class="hidden md:grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 dark:bg-gray-900 dark:bg-gray-100 text-xs font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500 uppercase tracking-wider border-b">
          <div class="col-span-3">Income Type</div>
          <div class="col-span-2">Amount</div>
          <div class="col-span-2">Frequency</div>
          <div class="col-span-2">Status</div>
          <div class="col-span-2">Date Added</div>
          <div class="col-span-1 text-right">Actions</div>
        </div>
        
        <!-- Table Rows -->
        <div class="divide-y divide-gray-100 dark:divide-gray-700">
          <div 
            v-for="source in filteredIncomeSources" 
            :key="source.sourceId"
            class="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 dark:bg-gray-100 transition-colors"
          >
            <!-- Mobile Layout -->
            <div class="md:hidden space-y-2">
              <div class="flex items-center justify-between">
                <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ source.type }}</h4>
                <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">₹{{ source.amount.toLocaleString('en-IN') }}</span>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <span 
                    v-if="source.isRecurring"
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                  >
                    {{ formatFrequency(source.frequency) }}
                  </span>
                  <span 
                    v-else
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 dark:bg-gray-200 text-gray-800 dark:text-gray-200"
                  >
                    One-time
                  </span>
                  <span 
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    :class="source.isRecurring ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'"
                  >
                    {{ source.isRecurring ? 'Active' : 'Completed' }}
                  </span>
                </div>
                <span class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{{ formatDate(source.dateTime) }}</span>
              </div>
              <div class="flex items-center justify-end space-x-1">
                <button 
                  @click="editIncomeSource(source)"
                  class="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-200 hover:bg-blue-50 dark:bg-blue-900/20 rounded transition-colors"
                  title="Edit income source"
                >
                  <Edit2 class="w-3 h-3" />
                </button>
                <button 
                  @click="deleteIncomeSource(source)"
                  class="p-1.5 text-red-600 dark:text-red-400 hover:text-red-800 dark:text-red-200 hover:bg-red-50 dark:bg-red-900/20 rounded transition-colors"
                  title="Delete income source"
                >
                  <Trash2 class="w-3 h-3" />
                </button>
              </div>
            </div>

            <!-- Desktop Layout -->
            <div class="hidden md:contents">
              <div class="col-span-3 flex items-center">
                <div class="flex items-center">
                  <div class="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-3">
                    <DollarSign class="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ source.type }}</span>
                </div>
              </div>
              <div class="col-span-2 flex items-center">
                <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">₹{{ source.amount.toLocaleString('en-IN') }}</span>
              </div>
              <div class="col-span-2 flex items-center">
                <span 
                  v-if="source.isRecurring"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                >
                  {{ formatFrequency(source.frequency) }}
                </span>
                <span 
                  v-else
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 dark:bg-gray-200 text-gray-800 dark:text-gray-200"
                >
                  One-time
                </span>
              </div>
              <div class="col-span-2 flex items-center">
                <span 
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="source.isRecurring ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'"
                >
                  {{ source.isRecurring ? 'Active' : 'Completed' }}
                </span>
              </div>
              <div class="col-span-2 flex items-center">
                <span class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">{{ formatDate(source.dateTime) }}</span>
              </div>
              <div class="col-span-1 flex items-center justify-end space-x-1">
                <button 
                  @click="editIncomeSource(source)"
                  class="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-200 hover:bg-blue-50 dark:bg-blue-900/20 rounded transition-colors"
                  title="Edit income source"
                >
                  <Edit2 class="w-3 h-3" />
                </button>
                <button 
                  @click="deleteIncomeSource(source)"
                  class="p-1.5 text-red-600 dark:text-red-400 hover:text-red-800 dark:text-red-200 hover:bg-red-50 dark:bg-red-900/20 rounded transition-colors"
                  title="Delete income source"
                >
                  <Trash2 class="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Income Form Modal -->
    <IncomeForm 
      v-if="showIncomeForm"
      :is-open="showIncomeForm"
      :editing-source="editingSource"
      @close="closeIncomeForm"
      @submit="handleIncomeSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { 
  RefreshCw, 
  AlertCircle, 
  Plus,
  DollarSign,
  Repeat,
  Calendar,
  Hash,
  Edit2,
  Trash2
} from 'lucide-vue-next'

// Components
import { IncomeForm, IncomeFilter } from '../../components/income'

// Composables
import { useIncome } from '../../composables/useIncome'
import type { 
  IncomeFilters, 
  IncomeFormData, 
  IncomeFormUIData
} from '../../types/income'
import {
  convertIncomeAmount,
  convertRecurFlag_ToBoolean,
  convertRecurFlag
} from '../../types/income'

// Initialize income composable
const {
  incomes,
  incomeTypes,
  loading,
  error,
  canonicalTotalMonthlyIncome,
  canonicalTotalRecurringIncome,
  canonicalTotalOneTimeIncome,
  totalSources,
  filteredIncomes,
  fetchIncomes,
  createIncome,
  updateIncome,
  deleteIncome,
  updateFilters,
  resetFilters,
  initialize,
  fetchMonthlyAnalytics
} = useIncome()

// Local state
const showIncomeForm = ref(false)
const editingSource = ref<any>(null)

// Current filters state
const currentFilters = ref<IncomeFilters>({
  searchTerm: '',
  dateFrom: '',
  dateTo: '',
  amountMin: '',
  amountMax: '',
  type: '',
  frequency: '',
  isRecurring: null,
  sortBy: 'date',
  sortOrder: 'desc'
})

// Computed properties for display
const incomeCount = computed(() => totalSources.value)

// Get all income sources flattened from the store's filtered results
const allIncomeSources = computed(() => {
  const sources: any[] = []
  incomes.value.forEach(income => {
    if (income.income_source && Array.isArray(income.income_source)) {
      income.income_source.forEach(source => {
        sources.push({
          ...source,
          sourceId: `${income.name}-${source.name || source.idx}`,
          incomeId: income.name,
          createdAt: income.creation,
          updatedAt: income.modified,
          // Convert backend fields to display format
          amount: source.income,
          isRecurring: convertRecurFlag_ToBoolean(source.recur),
          dateTime: source.date_time,
          frequency: source.recur_frequency
        })
      })
    }
  })
  return sources.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

// Use filtered incomes from store
const filteredIncomeSources = computed(() => {
  const sources: any[] = []
  filteredIncomes.value.forEach(income => {
    if (income.income_source && Array.isArray(income.income_source)) {
      income.income_source.forEach(source => {
        sources.push({
          ...source,
          sourceId: `${income.name}-${source.name || source.idx}`,
          incomeId: income.name,
          createdAt: income.creation,
          updatedAt: income.modified,
          // Convert backend fields to display format
          amount: source.income,
          isRecurring: convertRecurFlag_ToBoolean(source.recur),
          dateTime: source.date_time,
          frequency: source.recur_frequency
        })
      })
    }
  })
  return sources.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
})

// Utility functions
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

// Event handlers
const handleRefresh = async () => {
  try {
    await fetchIncomes(true)
  } catch (error) {
    console.error('Failed to refresh incomes:', error)
  }
}

const handleFilterChange = async (filters: IncomeFilters) => {
  console.log('Income page: Filter change received:', filters)
  currentFilters.value = { ...filters }
  
  // Update filters in store and refetch
  updateFilters(filters)
  await fetchIncomes(true)
}

const clearFilters = async () => {
  console.log('Income page: Clearing filters')
  const defaultFilters: IncomeFilters = {
    searchTerm: '',
    dateFrom: '',
    dateTo: '',
    amountMin: '',
    amountMax: '',
    type: '',
    frequency: '',
    isRecurring: null,
    sortBy: 'date',
    sortOrder: 'desc'
  }
  currentFilters.value = defaultFilters
  resetFilters()
  await fetchIncomes(true)
}

const openIncomeForm = () => {
  editingSource.value = null
  showIncomeForm.value = true
}

const closeIncomeForm = () => {
  showIncomeForm.value = false
  editingSource.value = null
}

const editIncomeSource = (source: any) => {
  editingSource.value = {
    ...source,
    isRecurring: source.isRecurring || false,
    frequency: source.frequency || ''
  }
  showIncomeForm.value = true
}

const handleIncomeSubmit = async (formData: IncomeFormUIData) => {
  console.log('Income Dashboard: Form submitted with data:', formData)
  
  try {
    // Convert form data to backend API format
    const backendFormData: IncomeFormData = {
      monthly_income: formData.amount, // Backend calculates monthly income
      income_source: [{
        type: formData.type,
        income: formData.amount,
        recur: convertRecurFlag(formData.isRecurring),
        date_time: formData.dateTime,
        recur_frequency: formData.frequency
      }],
      income_name: editingSource.value ? editingSource.value.incomeId : undefined
    }
    
    if (editingSource.value) {
      console.log('Income Dashboard: Updating existing income')
      await updateIncome(backendFormData)
    } else {
      console.log('Income Dashboard: Creating new income')
      await createIncome(backendFormData)
    }
    
    console.log('Income Dashboard: Refreshing incomes...')
    // Refresh data
    await fetchIncomes(true)
    
    console.log('Income Dashboard: Closing form...')
    // Close form after successful submission
    closeIncomeForm()
    
    console.log('Income Dashboard: Form submission completed successfully')
    
  } catch (error) {
    console.error('Income Dashboard: Failed to save income:', error)
    alert('Failed to save income. Please try again.')
    throw error
  }
}

const deleteIncomeSource = async (source: any) => {
  if (confirm(`Are you sure you want to delete the ${source.type} income source (₹${source.amount.toLocaleString('en-IN')})?`)) {
    try {
      // Delete the entire income record
      await deleteIncome(source.incomeId)
      
      // Refresh data
      await fetchIncomes(true)
    } catch (error) {
      console.error('Failed to delete income source:', error)
      alert('Failed to delete income source. Please try again.')
    }
  }
}

// Lifecycle
onMounted(async () => {
  try {
    // Initialize with analytics and load all data
    await initialize({ withAnalytics: true, forceRefresh: false })
    await fetchMonthlyAnalytics(false)
  } catch (error) {
    console.error('Income Dashboard: Initialization failed:', error)
  }
})
</script>

<style scoped>
.income-management {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8;
}
</style>