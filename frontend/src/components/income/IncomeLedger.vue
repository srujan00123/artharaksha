<template>
  <div class="income-ledger">
    <!-- Empty State -->
    <div v-if="!hasData" class="empty-state">
      <div class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
        <Hash class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
        <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
          {{ totalCount === 0 ? 'No ledger entries found' : 'No ledger entries match your filters' }}
        </h3>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {{ totalCount === 0 ? 'Ledger entries are created automatically from your income sources.' : 'Try adjusting your filters to see more entries.' }}
        </p>
        <div class="mt-6" v-if="totalCount === 0">
          <button 
            @click="$emit('add-source')"
            class="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
          >
            <Plus class="w-4 h-4 mr-2" />
            Add Income Source
          </button>
        </div>
      </div>
    </div>

    <!-- Ledger Entries Table -->
    <div v-else class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
      <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-base font-medium text-gray-900 dark:text-gray-100">Income Ledger</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Showing {{ entries.length }} of {{ totalCount }} entries • Total: ₹{{ totalAmount.toLocaleString('en-IN') }}
            </p>
          </div>
          <div class="flex items-center space-x-2">
            <input 
              type="checkbox"
              :checked="selectedItems.length === entries.length && entries.length > 0"
              :indeterminate="selectedItems.length > 0 && selectedItems.length < entries.length"
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
        <div class="col-span-2">Date</div>
        <div class="col-span-2">Source</div>
        <div class="col-span-2">Type</div>
        <div class="col-span-2">Amount</div>
        <div class="col-span-2">Entry Type</div>
        <div class="col-span-1 text-right">Actions</div>
      </div>

      <!-- Table Rows -->
      <div class="divide-y divide-gray-100 dark:divide-gray-700">
        <div 
          v-for="entry in entries" 
          :key="entry.name"
          class="grid grid-cols-1 md:grid-cols-12 gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          :class="{ 'bg-blue-50 dark:bg-blue-900/20': selectedItems.includes(entry.name) }"
        >
          <!-- Mobile Layout -->
          <div class="md:hidden space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <input 
                  type="checkbox"
                  :checked="selectedItems.includes(entry.name)"
                  @change="$emit('ledger-selection', entry, $event.target.checked)"
                  class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                >
                <div>
                  <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ entry.income_source }}</h4>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ entry.source_type }}</p>
                </div>
              </div>
              <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">₹{{ entry.amount.toLocaleString('en-IN') }}</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <span class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(entry.date_time) }}</span>
                <span 
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  :class="entry.income_type === 'recurring' 
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'"
                >
                  {{ entry.income_type === 'recurring' ? 'Recurring' : 'One-time' }}
                </span>
              </div>
              <div class="flex items-center space-x-1">
                <button 
                  @click="$emit('edit-entry', entry)"
                  class="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                  title="Edit ledger entry"
                >
                  <Edit2 class="w-3 h-3" />
                </button>
                <button 
                  @click="$emit('delete-entry', entry)"
                  class="p-1.5 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  title="Delete ledger entry"
                >
                  <Trash2 class="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <!-- Desktop Layout -->
          <div class="hidden md:contents">
            <div class="col-span-1 flex items-center">
              <input 
                type="checkbox"
                :checked="selectedItems.includes(entry.name)"
                @change="$emit('ledger-selection', entry, $event.target.checked)"
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              >
            </div>
            <div class="col-span-2 flex items-center">
              <span class="text-sm text-gray-900 dark:text-gray-100">{{ formatDate(entry.date_time) }}</span>
            </div>
            <div class="col-span-2 flex items-center">
              <div class="flex items-center">
                <div class="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mr-3">
                  <DollarSign class="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <span class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ entry.income_source }}</span>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ entry.source_type }}</p>
                </div>
              </div>
            </div>
            <div class="col-span-2 flex items-center">
              <div>
                <span class="text-sm text-gray-900 dark:text-gray-100">{{ entry.source_type }}</span>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ entry.source_recur ? formatFrequency(entry.source_recur_frequency) : 'One-time' }}
                </p>
              </div>
            </div>
            <div class="col-span-2 flex items-center">
              <span class="text-sm font-semibold text-gray-900 dark:text-gray-100">₹{{ entry.amount.toLocaleString('en-IN') }}</span>
            </div>
            <div class="col-span-2 flex items-center">
              <span 
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="entry.income_type === 'recurring'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                  : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'"
              >
                {{ entry.income_type === 'recurring' ? 'Recurring' : 'One-time' }}
              </span>
            </div>
            <div class="col-span-1 flex items-center justify-end">
              <div class="flex items-center space-x-1">
                <button 
                  @click="$emit('edit-entry', entry)"
                  class="p-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                  title="Edit ledger entry"
                >
                  <Edit2 class="w-3 h-3" />
                </button>
                <button 
                  @click="$emit('delete-entry', entry)"
                  class="p-1.5 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  title="Delete ledger entry"
                >
                  <Trash2 class="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Info Footer -->
      <div class="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <p class="text-xs text-gray-500 dark:text-gray-400">
          <span class="font-medium">Note:</span> All ledger entries can now be edited or deleted.
          Recurring entries will be managed independently, and one-time entries will also remove their source.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { DollarSign, Edit2, Hash, Plus, Trash2 } from "lucide-vue-next"
import type { FlattenedLedgerEntry } from "../../types/income"

interface Props {
	entries: FlattenedLedgerEntry[]
	totalCount: number
	totalAmount: number
	selectedItems: string[]
	loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
	entries: () => [],
	totalCount: 0,
	totalAmount: 0,
	selectedItems: () => [],
	loading: false,
})

// Emits
const emit = defineEmits<{
	"add-source": []
	"edit-entry": [entry: FlattenedLedgerEntry]
	"delete-entry": [entry: FlattenedLedgerEntry]
	"ledger-selection": [entry: FlattenedLedgerEntry, selected: boolean]
	"toggle-select-all": [selected: boolean]
}>()

// Local state
const hasData = props.entries.length > 0

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
.income-ledger {
  @apply w-full;
}
</style> 