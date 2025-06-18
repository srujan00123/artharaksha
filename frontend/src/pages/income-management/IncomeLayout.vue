<template>
  <div class="income-layout">
    <!-- Header Section Banner -->
    <div class="header-section mb-6">
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
    </div>

    <!-- Child Route Content -->
    <div class="income-content">
      <router-view 
        :loading="loading"
        :error="error"
        @add-income="handleAddIncome"
        @refresh="handleRefresh"
      />
    </div>

    <!-- Income Form Modal -->
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
import { TrendingUp } from "lucide-vue-next"
import { onMounted, provide, ref } from "vue"

// Components
import { IncomeForm, LedgerEntryModal } from "../../components/income"

// Composables
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

// Initialize the income composable
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

// Local state for form management
const showIncomeForm = ref(false)
const incomeFormMode = ref<'source' | 'direct'>('source')
const editingSource = ref<IncomeSourceRecord | null>(null)
const showLedgerModal = ref(false)
const editingLedgerEntry = ref<FlattenedLedgerEntry | null>(null)

// Provide state and actions to child components
provide("incomeState", {
  incomes,
  incomeTypes,
  analytics,
  dashboardMetrics,
  loading,
  error,
  totalSources,
  recurringIncome,
  oneTimeIncome,
  filteredSources,
  filteredLedgerEntries,
  hasData,
  showIncomeForm,
  incomeFormMode,
  editingSource,
  showLedgerModal,
  editingLedgerEntry,
})

provide("incomeActions", {
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
  openIncomeSourceForm: () => {
    editingSource.value = null
    incomeFormMode.value = 'source'
    showIncomeForm.value = true
  },
  openDirectIncomeForm: () => {
    editingSource.value = null
    incomeFormMode.value = 'direct'
    showIncomeForm.value = true
  },
  closeIncomeForm: () => {
    showIncomeForm.value = false
    editingSource.value = null
  },
  editIncomeSource: (source: IncomeSourceRecord) => {
    editingSource.value = source
    incomeFormMode.value = 'source'
    showIncomeForm.value = true
  },
  editLedgerEntry: (entry: FlattenedLedgerEntry) => {
    editingLedgerEntry.value = entry
    showLedgerModal.value = true
  },
  closeLedgerModal: () => {
    showLedgerModal.value = false
    editingLedgerEntry.value = null
  },
})

// Event Handlers
const handleRefresh = async () => {
  try {
    // Force refresh bypassing cache
    await refreshData({ 
      withAnalytics: true, 
      withDashboard: true, 
      useCache: false 
    })
  } catch (error) {
    console.error("Failed to refresh income data:", error)
  }
}

const handleAddIncome = () => {
  editingSource.value = null
  incomeFormMode.value = 'source'
  showIncomeForm.value = true
}

const closeIncomeForm = () => {
  showIncomeForm.value = false
  editingSource.value = null
}

const closeLedgerModal = () => {
  showLedgerModal.value = false
  editingLedgerEntry.value = null
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

// Lifecycle
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
    console.error("Failed to initialize income layout:", error)
  }
})
</script>

<style scoped>
.income-layout {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8;
}
</style> 