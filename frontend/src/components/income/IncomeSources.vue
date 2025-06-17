<template>
  <div class="income-sources">
    <!-- Empty State -->
    <div v-if="!hasData" class="empty-state">
      <div class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
        <DollarSign class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          {{ totalCount === 0 ? 'No income sources found' : 'No income sources match your filters' }}
        </h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ totalCount === 0 ? 'Get started by adding your first income source.' : 'Try adjusting your filters or add a new income source.' }}
        </p>
        <div class="mt-6">
          <button 
            v-if="totalCount === 0"
            @click="$emit('add-source')"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Plus class="w-4 h-4 mr-2" />
            Add Income Source
          </button>
          <button 
            v-else
            @click="$emit('clear-filters')"
            class="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>

    <!-- Income Sources List -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
      <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-base font-medium text-gray-900 dark:text-gray-100">Income Sources</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Showing {{ sources.length }} of {{ totalCount }} source{{ totalCount !== 1 ? 's' : '' }}
              • ₹{{ monthlyTotal.toLocaleString('en-IN') }} monthly
            </p>
          </div>
          <div class="flex items-center space-x-2">
            <input 
              type="checkbox" 
              :checked="selectedItems.length === sources.length && sources.length > 0"
              :indeterminate="selectedItems.length > 0 && selectedItems.length < sources.length"
              @change="$emit('toggle-select-all', $event.target.checked)"
              class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            >
            <span class="text-sm text-gray-600 dark:text-gray-400">Select all</span>
          </div>
        </div>
      </div>
      
      <!-- Table Header (Desktop) -->
      <div class="hidden md:grid grid-cols-12 gap-4 px-4 py-2 bg-gray-50 dark:bg-gray-900 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b">
        <div class="col-span-1"></div>
        <div class="col-span-3">Income Type</div>
        <div class="col-span-2">Amount</div>
        <div class="col-span-2">Frequency</div>
        <div class="col-span-2">Status</div>
        <div class="col-span-1">Date Added</div>
        <div class="col-span-1 text-right">Actions</div>
      </div>
      
      <!-- Table Rows -->
      <div class="divide-y divide-gray-100 dark:divide-gray-700">
        <div 
          v-for="source in sources" 
          :key="source.name || source.type"
          class="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          :class="{ 'bg-blue-50 dark:bg-blue-900/20': selectedItems.includes(source.name || source.type) }"
        >
          <!-- Mobile Layout -->
          <div class="md:hidden space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <input 
                  type="checkbox" 
                  :checked="selectedItems.includes(source.name || source.type)"
                  @change="$emit('source-selection', source, $event.target.checked)"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                >
                <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ source.type }}</h4>
              </div>
              <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">₹{{ source.income.toLocaleString('en-IN') }}</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <span 
                  v-if="source.recur"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                >
                  {{ formatFrequency(source.recur_frequency) }}
                  <span v-if="source.stop_date" class="ml-2 text-xs text-gray-500">(ends {{ formatDate(source.stop_date) }})</span>
                </span>
                <span 
                  v-else
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                >
                  One-time
                </span>
                <span 
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  :class="source.recur ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'"
                >
                  {{ source.recur ? 'Active' : 'Completed' }}
                </span>
              </div>
              <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(source.date_time) }}</span>
            </div>
            <div class="flex items-center justify-end space-x-1">
              <button 
                @click="$emit('edit-source', source)"
                class="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                title="Edit income source"
              >
                <Edit2 class="w-3 h-3" />
              </button>
              <button 
                @click="$emit('delete-source', source)"
                class="p-1.5 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                title="Delete income source"
              >
                <Trash2 class="w-3 h-3" />
              </button>
            </div>
          </div>

          <!-- Desktop Layout -->
          <div class="hidden md:contents">
            <div class="col-span-1 flex items-center">
              <input 
                type="checkbox" 
                :checked="selectedItems.includes(source.name || source.type)"
                @change="$emit('source-selection', source, $event.target.checked)"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              >
            </div>
            <div class="col-span-3 flex items-center">
              <div class="flex items-center">
                <div class="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-3">
                  <DollarSign class="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ source.type }}</span>
              </div>
            </div>
            <div class="col-span-2 flex items-center">
              <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">₹{{ source.income.toLocaleString('en-IN') }}</span>
            </div>
            <div class="col-span-2 flex items-center">
              <span 
                v-if="source.recur"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
              >
                {{ formatFrequency(source.recur_frequency) }}
                <span v-if="source.stop_date" class="ml-2 text-xs text-gray-500">(ends {{ formatDate(source.stop_date) }})</span>
              </span>
              <span 
                v-else
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
              >
                One-time
              </span>
            </div>
            <div class="col-span-2 flex items-center">
              <span 
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="source.recur ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'"
              >
                {{ source.recur ? 'Active' : 'Completed' }}
              </span>
            </div>
            <div class="col-span-1 flex items-center">
              <span class="text-sm text-gray-500 dark:text-gray-400">{{ formatDate(source.date_time) }}</span>
            </div>
            <div class="col-span-1 flex items-center justify-end space-x-1">
              <button 
                @click="$emit('edit-source', source)"
                class="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                title="Edit income source"
              >
                <Edit2 class="w-3 h-3" />
              </button>
              <button 
                @click="$emit('delete-source', source)"
                class="p-1.5 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
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
</template>

<script setup lang="ts">
import { DollarSign, Edit2, Plus, Trash2 } from "lucide-vue-next"
import type { IncomeSourceRecord } from "../../types/income"

interface Props {
  sources: IncomeSourceRecord[]
  totalCount: number
  monthlyTotal: number
  selectedItems: string[]
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  sources: () => [],
  totalCount: 0,
  monthlyTotal: 0,
  selectedItems: () => [],
  loading: false
})

// Emits
const emit = defineEmits<{
  'add-source': []
  'edit-source': [source: IncomeSourceRecord]
  'delete-source': [source: IncomeSourceRecord]
  'source-selection': [source: IncomeSourceRecord, selected: boolean]
  'toggle-select-all': [selected: boolean]
  'clear-filters': []
}>()

// Local state
const hasData = props.sources.length > 0

// Utility functions
const formatDate = (dateString: string) => {
  if (!dateString) return "N/A"
  try {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch {
    return "N/A"
  }
}

const formatFrequency = (frequency?: string) => {
  if (!frequency) return "Monthly"

  const frequencyMap: Record<string, string> = {
    daily: "Daily",
    weekly: "Weekly",
    "bi-weekly": "Bi-weekly",
    monthly: "Monthly",
    quarterly: "Quarterly",
    "semi-annually": "Semi-annually",
    annually: "Annually",
    yearly: "Yearly",
  }

  return (
    frequencyMap[frequency] ||
    frequency.charAt(0).toUpperCase() + frequency.slice(1)
  )
}
</script>

<style scoped>
.income-sources {
  @apply w-full;
}
</style> 