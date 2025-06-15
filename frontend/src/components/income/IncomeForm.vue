<template>
  <div class="income-form">
    <!-- Modal Overlay -->
    <div 
      v-if="isOpen" 
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click="handleOverlayClick"
    >
      <!-- Modal Content -->
      <div 
        class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        @click.stop
      >
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">
            {{ isEditing ? 'Edit Income Source' : 'Add Income Source' }}
          </h2>
          <Button 
            variant="ghost" 
            size="sm"
            @click="closeForm"
            class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:text-gray-500"
          >
            <X class="w-5 h-5" />
          </Button>
        </div>

        <!-- Form Content -->
        <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
          <!-- Income Type -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
              Income Type <span class="text-red-500">*</span>
            </label>
            <select
              v-model="formData.type"
              :class="[
                'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                validationErrors.type ? 'border-red-300' : 'border-gray-300'
              ]"
              required
            >
              <option value="">Select income type</option>
              <option v-for="type in incomeTypes" :key="type.name" :value="type.type">
                {{ type.type }}
              </option>
            </select>
            <p v-if="validationErrors.type" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ validationErrors.type }}</p>
          </div>

          <!-- Amount -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
              Amount (₹) <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span class="text-gray-500 dark:text-gray-400 dark:text-gray-500 sm:text-sm">₹</span>
              </div>
              <input
                v-model.number="formData.amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                :class="[
                  'w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                  validationErrors.amount ? 'border-red-300' : 'border-gray-300'
                ]"
                required
              />
            </div>
            <p v-if="validationErrors.amount" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ validationErrors.amount }}</p>
          </div>

          <!-- Recurring Toggle -->
          <div>
            <label class="flex items-center space-x-3 cursor-pointer">
              <input
                v-model="formData.isRecurring"
                type="checkbox"
                class="w-4 h-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400"
              />
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600">This is recurring income</span>
            </label>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
              Check this if this income repeats regularly (salary, rent, etc.)
            </p>
          </div>

          <!-- Frequency (only if recurring) -->
          <div v-if="formData.isRecurring" class="transition-all duration-200">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
              Frequency <span class="text-red-500">*</span>
            </label>
            <select
              v-model="formData.frequency"
              :class="[
                'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                validationErrors.frequency ? 'border-red-300' : 'border-gray-300'
              ]"
              :required="formData.isRecurring"
            >
              <option value="">Select frequency</option>
              <option v-for="option in frequencyOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <p v-if="validationErrors.frequency" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ validationErrors.frequency }}</p>
          </div>

          <!-- Date -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
              {{ formData.isRecurring ? 'Start Date' : 'Date Received' }}
              <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.dateTime"
              type="date"
              :max="today"
              :class="[
                'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                validationErrors.dateTime ? 'border-red-300' : 'border-gray-300'
              ]"
              required
            />
            <p v-if="validationErrors.dateTime" class="mt-1 text-sm text-red-600 dark:text-red-400">{{ validationErrors.dateTime }}</p>
          </div>

          <!-- Monthly Equivalent (for non-monthly recurring income) -->
          <div v-if="formData.isRecurring && formData.frequency && formData.frequency !== 'every month'" class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div class="flex items-center space-x-2">
              <Calculator class="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span class="text-sm font-medium text-blue-900">Monthly Equivalent</span>
            </div>
            <p class="text-lg font-semibold text-blue-900 mt-1">
              ₹{{ monthlyEquivalent.toLocaleString() }}
            </p>
            <p class="text-sm text-blue-700 dark:text-blue-300 mt-1">
              This {{ formData.frequency.replace('every ', '') }} income equals approximately ₹{{ monthlyEquivalent.toLocaleString() }} per month
            </p>
          </div>

          <!-- Form Actions -->
          <div class="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button 
              type="button"
              variant="outline"
              @click="closeForm"
              :disabled="loading"
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              :loading="loading"
              :disabled="!isFormValid"
            >
              <Save class="w-4 h-4 mr-2" />
              {{ isEditing ? 'Update Income' : 'Add Income' }}
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { X, Save, Calculator } from 'lucide-vue-next'
import { Button } from 'frappe-ui'
import { useIncome } from '../../composables/useIncome'
import type { 
  IncomeSourceFormData, 
  IncomeValidationResult,
  IncomeType,
  ProcessedIncomeItem,
  RECUR_FREQUENCY_OPTIONS
} from '../../types/income'

// Props
interface Props {
  isOpen: boolean
  editingSource?: ProcessedIncomeItem | null
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  editingSource: null
})

// Emits
const emit = defineEmits<{
  close: []
  submit: [data: IncomeSourceFormData]
}>()

// Composables
const incomeComposable = useIncome()

// State
const loading = ref(false)
const incomeTypes = ref<IncomeType[]>([])

// Form data with proper typing
const formData = ref<IncomeSourceFormData>({
  type: '',
  amount: 0,
  isRecurring: false,
  dateTime: '',
  frequency: undefined
})

// Validation errors
const validationErrors = ref<Record<string, string>>({})

// Constants from types
const frequencyOptions = [
  { value: 'every day', label: 'Daily' },
  { value: 'every week', label: 'Weekly' },
  { value: 'every month', label: 'Monthly' },
  { value: 'every year', label: 'Yearly' }
] as const

// Computed
const isEditing = computed(() => !!props.editingSource)

const today = computed(() => {
  return new Date().toISOString().split('T')[0]
})

const monthlyEquivalent = computed(() => {
  if (!formData.value.isRecurring || !formData.value.frequency || !formData.value.amount) {
    return 0
  }

  const amount = formData.value.amount
  switch (formData.value.frequency) {
    case 'every day':
      return amount * 30 // Approximate monthly
    case 'every week':
      return amount * 4.33 // Approximate monthly
    case 'every month':
      return amount
    case 'every year':
      return amount / 12
    default:
      return amount
  }
})

const isFormValid = computed(() => {
  return formData.value.type && 
         formData.value.amount > 0 && 
         formData.value.dateTime &&
         (!formData.value.isRecurring || formData.value.frequency) &&
         Object.keys(validationErrors.value).length === 0
})

// Methods
const validateForm = (): IncomeValidationResult => {
  const errors: Record<string, string> = {}

  if (!formData.value.type) {
    errors.type = 'Income type is required'
  }

  if (!formData.value.amount || formData.value.amount <= 0) {
    errors.amount = 'Amount must be greater than 0'
  }

  if (!formData.value.dateTime) {
    errors.dateTime = 'Date is required'
  }

  if (formData.value.isRecurring && !formData.value.frequency) {
    errors.frequency = 'Frequency is required for recurring income'
  }

  validationErrors.value = errors
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

const resetForm = () => {
  formData.value = {
    type: '',
    amount: 0,
    isRecurring: false,
    dateTime: '',
    frequency: undefined
  }
  validationErrors.value = {}
}

const populateForm = (source: ProcessedIncomeItem) => {
  if (source.sources && source.sources.length > 0) {
    const firstSource = source.sources[0]
    formData.value = {
      type: firstSource.type,
      amount: firstSource.amount,
      isRecurring: firstSource.isRecurring,
      dateTime: firstSource.dateTime.split('T')[0], // Extract date part
      frequency: firstSource.frequency
    }
  }
}

const handleSubmit = async () => {
  const validation = validateForm()
  if (!validation.isValid) {
    return
  }

  try {
    loading.value = true
    emit('submit', { ...formData.value })
    closeForm()
  } catch (error) {
    console.error('Failed to submit income form:', error)
  } finally {
    loading.value = false
  }
}

const closeForm = () => {
  resetForm()
  emit('close')
}

const handleOverlayClick = () => {
  closeForm()
}

const loadIncomeTypes = async () => {
  try {
    incomeTypes.value = await incomeComposable.loadIncomeTypes()
  } catch (error) {
    console.error('Failed to load income types:', error)
  }
}

// Watchers
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    if (props.editingSource) {
      populateForm(props.editingSource)
    } else {
      resetForm()
    }
  }
})

watch(() => formData.value.isRecurring, (isRecurring) => {
  if (!isRecurring) {
    formData.value.frequency = undefined
    delete validationErrors.value.frequency
  }
})

// Initialize
onMounted(() => {
  loadIncomeTypes()
})
</script>

<style scoped>
.income-form {
  /* Custom styles if needed */
}

/* Smooth transitions for conditional fields */
.transition-all {
  transition: all 0.2s ease-in-out;
}

/* Focus styles for better accessibility */
input:focus,
select:focus,
textarea:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>
