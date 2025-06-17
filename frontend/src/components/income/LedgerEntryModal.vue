<template>
  <div v-if="isOpen" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full mx-4">
      <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
          Edit {{ entry?.income_type === 'recurring' ? 'Recurring' : 'One-time' }} Income Entry
        </h3>
      </div>
      
      <div class="p-6" v-if="entry">
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <!-- Source Type (Read-only) -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Income Source
            </label>
            <div class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
              {{ entry.source_type }}
            </div>
          </div>

          <!-- Amount -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Amount (₹)
            </label>
            <input 
              v-model.number="formData.amount" 
              type="number" 
              step="0.01" 
              min="0"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              required
            >
          </div>

          <!-- Date -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date
            </label>
            <input 
              v-model="formData.date" 
              type="date"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
              required
            >
          </div>

          <!-- Income Type -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Entry Type
            </label>
            <select 
              v-model="formData.income_type"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
            >
              <option value="one-time">One-time</option>
              <option value="recurring">Recurring</option>
            </select>
          </div>

          <!-- Info Section -->
          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <p class="text-sm text-blue-800 dark:text-blue-200">
              <span class="font-medium">Note:</span>
              {{ entry.income_type === 'recurring' 
                ? 'Editing a recurring entry will update the source amount for future entries. This specific entry will be modified independently.'
                : 'Editing a one-time entry will only affect this specific ledger entry and may also update the underlying source.'
              }}
            </p>
          </div>
        </form>
      </div>
      
      <div class="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-2">
        <button 
          @click="$emit('close')"
          type="button"
          class="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        >
          Cancel
        </button>
        <button 
          @click="handleSubmit" 
          :disabled="!isFormValid || loading"
          class="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <span v-if="loading" class="flex items-center">
            <div class="animate-spin rounded-full h-3 w-3 border-b border-white mr-2"></div>
            Saving...
          </span>
          <span v-else>Save Changes</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from "vue"
import type { FlattenedLedgerEntry, LedgerEntryFormData } from "../../types/income"

interface Props {
  isOpen: boolean
  entry: FlattenedLedgerEntry | null
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  entry: null,
  loading: false
})

// Emits
const emit = defineEmits<{
  'close': []
  'submit': [formData: LedgerEntryFormData, entryName: string]
}>()

// Form data
const formData = reactive<LedgerEntryFormData>({
  amount: 0,
  date: '',
  income_type: 'one-time',
  source_type: ''
})

// Form validation
const isFormValid = computed(() => {
  return formData.amount > 0 && 
         formData.date !== '' && 
         formData.income_type !== ''
})

// Utility function to format date for input
const formatDateForInput = (dateString: string) => {
  if (!dateString) return ""
  try {
    const date = new Date(dateString)
    return date.toISOString().split('T')[0]
  } catch {
    return ""
  }
}

// Watch for entry changes to populate form
watch(() => props.entry, (newEntry) => {
  if (newEntry) {
    formData.amount = Number(newEntry.amount) || 0
    formData.date = formatDateForInput(newEntry.date_time)
    formData.income_type = newEntry.income_type || 'one-time'
    formData.source_type = newEntry.source_type || ''
  }
}, { immediate: true })

// Handle form submission
const handleSubmit = () => {
  if (isFormValid.value && props.entry) {
    emit('submit', { ...formData }, props.entry.name)
  }
}
</script>

<style scoped>
/* Custom styles if needed */
</style> 