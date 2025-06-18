/**
 * Income Management Page - Robust & Redundancy-Free
 * Uses new architecture with proper error handling and cache management
 */

<template>
  <div class="income-management p-3 sm:p-4 lg:p-6 space-y-4 lg:space-y-6">
    <!-- Header Section -->
    <div class="bg-gradient-to-r from-green-600 to-green-500 rounded-xl p-4 sm:p-6 lg:p-8 text-white">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">
            Income Management
          </h1>
          <p class="text-green-100 text-sm sm:text-base lg:text-lg mb-4 max-w-3xl leading-relaxed">
            Manage your household income sources and track monthly earnings
          </p>
        </div>
        <div class="hidden sm:block">
          <div class="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
            <TrendingUp class="w-8 h-8 text-white" />
          </div>
        </div>
      </div>
    </div>

    <!-- Action Bar -->
    <Card class="p-4 sm:p-5 lg:p-6 bg-white dark:bg-slate-800">
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
        <div class="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          <button 
            v-if="currentView === 'sources'"
            @click="openIncomeSourceForm" 
            :disabled="loading" 
            variant="solid" 
            size="sm" 
            class="w-full sm:w-auto"
          >
            <Plus class="w-4 h-4 mr-2" />
            Add Income Source
          </button>
          <button 
            v-if="currentView === 'ledger'"
            @click="openDirectIncomeForm" 
            :disabled="loading" 
            variant="solid" 
            size="sm" 
            class="w-full sm:w-auto"
          >
            <Plus class="w-4 h-4 mr-2" />
            Add Income
          </button>
          <Button @click="handleRefresh" :disabled="loading" variant="outline" size="sm" class="w-full sm:w-auto">
            <RefreshCw class="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        <!-- View Toggle -->
        <div class="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 w-full sm:w-auto">
          <button @click="currentView = 'sources'" :class="[
              'px-3 py-1 text-sm font-medium rounded-md transition-colors flex-1 sm:flex-none',
              currentView === 'sources' 
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          ]">
            Sources
          </button>
          <button @click="switchToLedgerView" :class="[
              'px-3 py-1 text-sm font-medium rounded-md transition-colors flex-1 sm:flex-none',
              currentView === 'ledger' 
                ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 shadow-sm' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          ]">
            Ledger
          </button>
        </div>
      </div>
    </Card>
    
    <!-- Summary Cards using analytics from new architecture -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      <Card class="p-4 sm:p-5 lg:p-6 bg-white dark:bg-slate-800">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <DollarSign class="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <div class="ml-3 min-w-0 flex-1">
            <p class="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Actual Monthly Income</p>
            <p class="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">₹{{
              (analytics?.monthly_recurring_income || dashboardMetrics?.actual_monthly_income || 0).toLocaleString('en-IN') }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ totalSources }} sources (₹{{ (analytics?.expected_monthly_income || dashboardMetrics?.expected_monthly_income || 0).toLocaleString('en-IN') }} expected)</p>
          </div>
        </div>
      </Card>

      <Card class="p-4 sm:p-5 lg:p-6 bg-white dark:bg-slate-800">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <Repeat class="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div class="ml-3 min-w-0 flex-1">
            <p class="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Period Recurring Income</p>
            <p class="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">₹{{
              (analytics?.period_recurring_income || recurringIncome || 0).toLocaleString('en-IN') }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ (analytics?.recurring_percentage || 0).toFixed(1) }}% of period total
            </p>
          </div>
        </div>
      </Card>

      <Card class="p-4 sm:p-5 lg:p-6 bg-white dark:bg-slate-800">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
              <Calendar class="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div class="ml-3 min-w-0 flex-1">
            <p class="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Period One-time Income</p>
            <p class="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">₹{{
              (analytics?.period_one_time_income || oneTimeIncome || 0).toLocaleString('en-IN') }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">This period</p>
          </div>
        </div>
      </Card>

      <Card class="p-4 sm:p-5 lg:p-6 bg-white dark:bg-slate-800">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
              <TrendingUp class="w-4 h-4 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          <div class="ml-3 min-w-0 flex-1">
            <p class="text-xs sm:text-sm font-medium text-gray-500 dark:text-gray-400 truncate">Growth Rate</p>
            <p class="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
              {{ (analytics?.growth_rate || 0) >= 0 ? '+' : '' }}{{ (analytics?.growth_rate || 0).toFixed(1) }}%
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">vs last period</p>
          </div>
        </div>
      </Card>
    </div>

    <!-- Filter Section - Only show in ledger view -->
    <IncomeFilter 
      v-if="currentView === 'ledger'"
      :total-count="getTotalCount()"
      :filtered-count="getFilteredCount()"
      :income-types="incomeTypes"
      :current-view="currentView"
    />

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p class="text-gray-600 dark:text-gray-400 ml-3">Loading income data...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
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
        <Button variant="outline" size="sm" @click="handleRefresh">
          Try Again
        </Button>
      </div>
    </div>

    <!-- Content Section -->
    <div v-else class="income-content">
      <!-- Sources View -->
      <IncomeSources
        v-if="currentView === 'sources'"
        :sources="filteredSources"
        :total-count="filteredSources.length"
        :monthly-total="analytics?.monthly_recurring_income || 0"
        :selected-items="selectedItems"
        :loading="loading"
        @add-source="openIncomeSourceForm"
        @edit-source="editIncomeSource"
        @delete-source="deleteIncomeSourceHandler"
        @source-selection="handleSourceSelection"
        @toggle-select-all="toggleSelectAll"
        @clear-filters="clearFilters"
      />

      <!-- Ledger View -->
      <IncomeLedger
        v-if="currentView === 'ledger'"
        :entries="filteredLedgerEntries"
        :total-count="filteredLedgerEntries.length"
        :total-amount="getLedgerTotalAmount()"
        :selected-items="selectedLedgerItems"
        :loading="loading"
        @add-source="openDirectIncomeForm"
        @edit-entry="editLedgerEntry"
        @delete-entry="deleteLedgerEntryHandler"
        @ledger-selection="handleLedgerSelection"
        @toggle-select-all="toggleSelectAllLedger"
      />
    </div>

    <!-- Modals -->
    <IncomeForm 
      v-if="showIncomeForm"
      :is-open="showIncomeForm"
      :editing-source="editingSource"
      :mode="incomeFormMode"
      @close="closeIncomeForm"
      @submit="handleIncomeSubmit"
    />

    <!-- Ledger Entry Edit Modal -->
    <LedgerEntryModal
      :is-open="showLedgerModal"
      :entry="editingLedgerEntry"
      :loading="loading"
      @close="closeLedgerModal"
      @submit="handleLedgerSubmit"
    />
  </div>
</template>

<script setup lang="ts">
import { 
  AlertCircle, 
  Calendar,
  DollarSign,
  Plus,
  RefreshCw,
  Repeat,
  TrendingUp,
} from "lucide-vue-next"
import { onMounted, ref, watch } from "vue"

// Components
import { IncomeFilter, IncomeForm, IncomeSources, IncomeLedger, LedgerEntryModal } from "../../components/income"

// Composables - Using new robust architecture
import { useIncome } from "../../composables/useIncome"
import type { 
  AddIncomeSourcePayload,
  CreateDirectLedgerEntryPayload,
  DeleteIncomeSourcePayload,
  FlattenedLedgerEntry,
  IncomeFormUIData,
  IncomeSourceFormData,
  IncomeSourceRecord,
  LedgerEntryFormData,
  UpdateIncomeSourcePayload,
  UpdateLedgerEntryPayload,
} from "../../types/income"

// Initialize the income composable with new architecture
const {
  // State
  incomes,
  incomeTypes,
  analytics,
  dashboardMetrics,
  loading,
  error,
  
  // Computed values
  totalSources,
  recurringIncome,
  oneTimeIncome,
  filteredSources,
  filteredLedgerEntries,
  hasData,
  
  // Actions
  addIncomeSource,
  addDirectLedgerEntry,
  updateIncomeSource,
  deleteIncomeSource,
  updateLedgerEntry,
  deleteLedgerEntry,
  fetchDashboardMetrics,
  clearFilters,
  refreshData,
  initialize,
} = useIncome()

// View management
const currentView = ref<'sources' | 'ledger'>('sources')
const showIncomeForm = ref(false)
const incomeFormMode = ref<'source' | 'direct'>('source')
const editingSource = ref<IncomeSourceRecord | null>(null)
const showLedgerModal = ref(false)
const editingLedgerEntry = ref<FlattenedLedgerEntry | null>(null)

// Selection management
const selectedItems = ref<string[]>([])
const selectedLedgerItems = ref<string[]>([])

// Helper functions - simplified using new architecture
const getTotalCount = () => {
  return currentView.value === 'sources' ? filteredSources.value.length : filteredLedgerEntries.value.length
}

const getFilteredCount = () => {
  return currentView.value === 'sources' ? filteredSources.value.length : filteredLedgerEntries.value.length
}

const getLedgerTotalAmount = () => {
  return filteredLedgerEntries.value.reduce((sum, entry) => sum + Number(entry.amount || 0), 0)
}

// View switching
const switchToLedgerView = () => {
  currentView.value = 'ledger'
  // Ledger entries are automatically available from the main API call
}

// Selection handlers
const handleSourceSelection = (source: IncomeSourceRecord, selected: boolean) => {
  const sourceId = source.name || source.type
  if (selected) {
    if (!selectedItems.value.includes(sourceId)) {
      selectedItems.value.push(sourceId)
    }
  } else {
    const index = selectedItems.value.indexOf(sourceId)
    if (index > -1) {
      selectedItems.value.splice(index, 1)
    }
  }
}

const handleLedgerSelection = (entry: FlattenedLedgerEntry, selected: boolean) => {
  if (selected) {
    if (!selectedLedgerItems.value.includes(entry.name)) {
      selectedLedgerItems.value.push(entry.name)
    }
  } else {
    const index = selectedLedgerItems.value.indexOf(entry.name)
    if (index > -1) {
      selectedLedgerItems.value.splice(index, 1)
    }
  }
}

// Toggle select all functionality
const toggleSelectAll = (selected: boolean) => {
  if (selected) {
    selectedItems.value = filteredSources.value.map(source => source.name || source.type)
  } else {
    selectedItems.value = []
  }
}

const toggleSelectAllLedger = (selected: boolean) => {
  if (selected) {
    selectedLedgerItems.value = filteredLedgerEntries.value.map(entry => entry.name)
  } else {
    selectedLedgerItems.value = []
  }
}

// Ledger management
const editLedgerEntry = (entry: FlattenedLedgerEntry) => {
  editingLedgerEntry.value = entry
  showLedgerModal.value = true
}

const deleteLedgerEntryHandler = async (entry: FlattenedLedgerEntry) => {
  if (confirm(`Are you sure you want to delete this ${entry.source_type} entry (₹${entry.amount?.toLocaleString('en-IN')})?`)) {
    try {
      const result = await deleteLedgerEntry({ ledger_entry_name: entry.name })
      
      // Show success message
      if (result.message?.includes("already deleted")) {
        // Entry was already deleted, refresh data to show current state
        await refreshData({ withAnalytics: true, useCache: false })
      }
    } catch (error) {
      console.error('Failed to delete ledger entry:', error)
      alert('Failed to delete ledger entry. Please try again.')
    }
  }
}

const closeLedgerModal = () => {
  showLedgerModal.value = false
  editingLedgerEntry.value = null
}

const handleLedgerSubmit = async (formData: LedgerEntryFormData, entryName: string) => {
  try {
    const payload: UpdateLedgerEntryPayload = {
      ledger_entry_name: entryName,
      new_amount: formData.amount,
      new_date: new Date(formData.date).toISOString(),
      new_type: formData.income_type,
    }

    await updateLedgerEntry(payload)
    closeLedgerModal()
  } catch (error) {
    console.error('Failed to update ledger entry:', error)
    alert('Failed to update ledger entry. Please try again.')
  }
}

// Main handlers - simplified using new architecture
const handleRefresh = async () => {
  // Only force refresh when user explicitly clicks refresh button
  await refreshData({ withAnalytics: true, withDashboard: true, useCache: false })
}

const openIncomeSourceForm = () => {
  editingSource.value = null
  incomeFormMode.value = 'source'
  showIncomeForm.value = true
}

const openDirectIncomeForm = () => {
  editingSource.value = null
  incomeFormMode.value = 'direct'
  showIncomeForm.value = true
}

const closeIncomeForm = () => {
  showIncomeForm.value = false
  editingSource.value = null
}

const editIncomeSource = (source: IncomeSourceRecord) => {
  editingSource.value = source
  incomeFormMode.value = 'source'
  showIncomeForm.value = true
}

const handleIncomeSubmit = async (formData: IncomeFormUIData) => {
  try {
    const mainIncomeRecord = incomes.value[0]
    if (!mainIncomeRecord) {
      throw new Error("No income record found for household")
    }

    if (incomeFormMode.value === 'source') {
      // Source mode: Always create/update recurring income sources
      const sourceData: IncomeSourceFormData = {
        type: formData.type,
        income: formData.amount,
        recur: true, // Always true for income sources
        date_time: formData.dateTime,
        recur_frequency: formData.frequency as "daily" | "weekly" | "bi-weekly" | "monthly" | "quarterly" | "semi-annually" | "annually" | "yearly",
        stop_date: formData.stop_date,
      }
      
      if (editingSource.value) {
        const payload: UpdateIncomeSourcePayload = {
          income_source: [sourceData],
          income_name: mainIncomeRecord.name,
          source_name: editingSource.value.name || '',
        }
        await updateIncomeSource(payload)
      } else {
        const payload: AddIncomeSourcePayload = {
          income_source: [sourceData],
          income_name: mainIncomeRecord.name,
        }
        await addIncomeSource(payload)
      }
    } else {
      // Direct mode: Always create one-time ledger entries
      const directLedgerPayload: CreateDirectLedgerEntryPayload = {
        income_type: formData.type,
        amount: formData.amount,
        date_time: formData.dateTime,
        description: `One-time ${formData.type} income`
      }
      await addDirectLedgerEntry(directLedgerPayload)
    }

    closeIncomeForm()
  } catch (error) {
    console.error("Failed to save income:", error)
    alert("Failed to save income. Please try again.")
    throw error
  }
}

const deleteIncomeSourceHandler = async (source: IncomeSourceRecord) => {
  if (
    confirm(
      `Are you sure you want to delete the ${source.type} income source (₹${source.income.toLocaleString("en-IN")})?`,
    )
  ) {
    try {
      const mainIncomeRecord = incomes.value[0]
      if (!mainIncomeRecord) {
        throw new Error("No income record found for household")
      }

      const payload: DeleteIncomeSourcePayload = {
        income_source: [],
        income_name: mainIncomeRecord.name,
        action: "delete",
        source_name: source.name || '',
      }
      await deleteIncomeSource(payload)
    } catch (error) {
      console.error("Failed to delete income source:", error)
      alert("Failed to delete income source. Please try again.")
    }
  }
}

// Watch for view changes to clear selections
watch(currentView, () => {
  selectedItems.value = []
  selectedLedgerItems.value = []
})

// Initialize using new architecture
onMounted(async () => {
  try {
    // Initialize with analytics and default period - use cache for better performance
    await initialize({ 
      withAnalytics: true, 
      forceRefresh: false,
      period: "this_month"
    })
    
    // Fetch dashboard metrics in parallel - also use cache
    await fetchDashboardMetrics("this_month", { useCache: true })
  } catch (error) {
    console.error("Failed to initialize income page:", error)
  }
})
</script>

<style scoped>
.income-management {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8;
}
</style>