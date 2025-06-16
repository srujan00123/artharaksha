<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-full max-w-md shadow dark:shadow-gray-900/20-lg rounded-md bg-white dark:bg-gray-800 dark:bg-gray-200">
      <!-- Modal Header -->
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
          {{ condition ? 'Edit Health Condition' : 'Add Health Condition' }}
        </h3>
        <button
          @click="$emit('close')"
          class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:text-gray-500 transition-colors"
        >
          <X class="h-5 w-5" />
        </button>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="space-y-4">
        <!-- Condition Selection -->
        <div v-if="!condition">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
            Select Condition
          </label>
          <select
            v-model="formData.condition"
            required
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
          >
            <option value="">Choose a condition...</option>
            <option
              v-for="availableCondition in availableConditions"
              :key="availableCondition.name"
              :value="availableCondition.name"
            >
              {{ availableCondition.condition_name }} ({{ availableCondition.condition_type }})
            </option>
          </select>
        </div>

        <!-- Condition Display (for editing) -->
        <div v-else class="bg-gray-50 dark:bg-gray-900 dark:bg-gray-100 rounded-lg p-3">
          <div class="flex items-center space-x-3">
            <span class="text-2xl">{{ getConditionTypeIcon(selectedConditionDetails?.condition_type) }}</span>
            <div>
              <h4 class="font-medium text-gray-900 dark:text-gray-100">
                {{ selectedConditionDetails?.condition_name }}
              </h4>
              <p class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                {{ selectedConditionDetails?.condition_type }}
              </p>
            </div>
          </div>
        </div>

        <!-- Severity -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
            Severity
          </label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="severity in SEVERITY_LEVELS"
              :key="severity.value"
              type="button"
              @click="formData.severity = severity.value"
              class="px-3 py-2 text-sm font-medium rounded-md border transition-colors"
              :class="formData.severity === severity.value
                ? `bg-${severity.color}-100 text-${severity.color}-800 border-${severity.color}-200`
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
            >
              {{ severity.label }}
            </button>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">
            {{ SEVERITY_LEVELS.find(s => s.value === formData.severity)?.description }}
          </p>
        </div>

        <!-- Duration -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
            Duration
          </label>
          <div class="grid grid-cols-2 gap-2">
            <button
              v-for="duration in DURATION_TYPES"
              :key="duration.value"
              type="button"
              @click="formData.duration_override = duration.value"
              class="px-3 py-2 text-sm font-medium rounded-md border transition-colors"
              :class="formData.duration_override === duration.value
                ? 'bg-blue-100 text-blue-800 border-blue-200'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'"
            >
              {{ duration.label }}
            </button>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">
            {{ DURATION_TYPES.find(d => d.value === formData.duration_override)?.description }}
          </p>
        </div>

        <!-- Notes -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
            Notes (Optional)
          </label>
          <textarea
            v-model="formData.notes"
            rows="3"
            placeholder="Add any additional notes about this condition..."
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
          ></textarea>
        </div>

        <!-- Form Actions -->
        <div class="flex items-center justify-end space-x-3 pt-4">
          <button
            type="button"
            @click="$emit('close')"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 bg-white dark:bg-gray-800 dark:bg-gray-200 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-900 dark:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="!isFormValid"
            class="px-4 py-2 text-sm font-medium text-white dark:text-black bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ condition ? 'Update' : 'Add' }} Condition
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { useAdvancedTheme } from "@/composables/useAdvancedTheme"
import { X } from "lucide-vue-next"
import { computed, onMounted, ref } from "vue"

import {
	DURATION_TYPES,
	SEVERITY_LEVELS,
	getConditionTypeIcon,
} from "../../types/support"

// Props
const props = defineProps({
	condition: {
		type: Object,
		default: null,
	},
	availableConditions: {
		type: Array,
		default: () => [],
	},
})

// Emits
const emit = defineEmits(["close", "save"])

// Form data
const formData = ref({
	condition: "",
	severity: "Mild",
	duration_override: "Temporary",
	notes: "",
})

// Computed properties
const selectedConditionDetails = computed(() => {
	if (!formData.value.condition) return null
	return props.availableConditions.find(
		(c) => c.name === formData.value.condition,
	)
})

const isFormValid = computed(() => {
	return (
		formData.value.condition &&
		formData.value.severity &&
		formData.value.duration_override
	)
})

// Methods
const handleSubmit = () => {
	if (isFormValid.value) {
		emit("save", { ...formData.value })
	}
}

// Initialize form data
onMounted(() => {
	if (props.condition) {
		formData.value = {
			condition: props.condition.condition || "",
			severity: props.condition.severity || "Mild",
			duration_override: props.condition.duration_override || "Temporary",
			notes: props.condition.notes || "",
		}
	}
})

// Advanced theme management
const { currentTheme, isDark, setTheme, themes } = useAdvancedTheme()

// Theme utility methods
const getFinancialStatusClass = (type, intensity = "600") => {
	const baseClasses = {
		income: `text-green-${intensity} dark:text-green-400`,
		expense: `text-red-${intensity} dark:text-red-400`,
		medical: `text-blue-${intensity} dark:text-blue-400`,
		warning: `text-yellow-${intensity} dark:text-yellow-400`,
		alert: `text-orange-${intensity} dark:text-orange-400`,
		neutral: `text-gray-${intensity} dark:text-gray-400`,
	}
	return baseClasses[type] || baseClasses.neutral
}

const getThemeSurfaceClass = (variant = "primary") => {
	const variants = {
		primary: "bg-white dark:bg-gray-800",
		secondary: "bg-gray-50 dark:bg-gray-900",
		tertiary: "bg-gray-100 dark:bg-gray-800",
	}
	return variants[variant] || variants.primary
}

const getThemeTextClass = (intensity = "600") => {
	const intensityMap = {
		900: "text-gray-900 dark:text-gray-100",
		800: "text-gray-800 dark:text-gray-200",
		700: "text-gray-700 dark:text-gray-300",
		600: "text-gray-600 dark:text-gray-400",
		500: "text-gray-500 dark:text-gray-400",
		400: "text-gray-400 dark:text-gray-500",
	}
	return intensityMap[intensity] || intensityMap["600"]
}
</script> 