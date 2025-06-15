<template>
    <div class="rounded-lg border p-4 flex items-start space-x-3" :class="alertClasses">
        <div class="flex-shrink-0">
            <component :is="alertIcon" class="w-5 h-5" />
        </div>
        <div class="flex-1">
            <h4 class="font-medium">{{ alertTitle }}</h4>
            <p class="text-sm mt-1">{{ alertMessage }}</p>
            <div v-if="showActions" class="mt-3 flex space-x-3">
                <Button size="sm" variant="outline">View Details</Button>
                <Button size="sm" variant="outline">Get Support</Button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { AlertTriangle, AlertCircle, CheckCircle } from 'lucide-vue-next'
import { Button } from 'frappe-ui'
import { useAdvancedTheme } from '@/composables/useAdvancedTheme'


const props = defineProps({
    percentage: {
        type: Number,
        required: true
    },
    showActions: {
        type: Boolean,
        default: true
    }
})

const alertLevel = computed(() => {
    if (props.percentage > 25) return 'critical'
    if (props.percentage > 10) return 'warning'
    return 'safe'
})

const alertClasses = computed(() => {
    switch (alertLevel.value) {
        case 'critical':
            return 'bg-red-50 border-red-200 text-red-800'
        case 'warning':
            return 'bg-yellow-50 border-yellow-200 text-yellow-800'
        default:
            return 'bg-green-50 border-green-200 text-green-800'
    }
})

const alertIcon = computed(() => {
    switch (alertLevel.value) {
        case 'critical':
            return AlertTriangle
        case 'warning':
            return AlertCircle
        default:
            return CheckCircle
    }
})

const alertTitle = computed(() => {
    switch (alertLevel.value) {
        case 'critical':
            return 'Critical Health Expenditure Alert'
        case 'warning':
            return 'High Health Expenditure Warning'
        default:
            return 'Healthy Spending Pattern'
    }
})

const alertMessage = computed(() => {
    switch (alertLevel.value) {
        case 'critical':
            return `Your healthcare expenses (${props.percentage}%) exceed 25% of your annual income, indicating catastrophic health expenditure. Consider seeking financial assistance or insurance coverage.`
        case 'warning':
            return `Your healthcare expenses (${props.percentage}%) exceed 10% of your annual income. Monitor your spending and consider insurance options.`
        default:
            return `Your healthcare expenses (${props.percentage}%) are within healthy limits. Keep up the good financial management!`
    }
})

// Advanced theme management
const { currentTheme, isDark, setTheme, themes } = useAdvancedTheme()

// Theme utility methods
const getFinancialStatusClass = (type, intensity = '600') => {
  const baseClasses = {
    income: `text-green-${intensity} dark:text-green-400`,
    expense: `text-red-${intensity} dark:text-red-400`,
    medical: `text-blue-${intensity} dark:text-blue-400`,
    warning: `text-yellow-${intensity} dark:text-yellow-400`,
    alert: `text-orange-${intensity} dark:text-orange-400`,
    neutral: `text-gray-${intensity} dark:text-gray-400`
  }
  return baseClasses[type] || baseClasses.neutral
}

const getThemeSurfaceClass = (variant = 'primary') => {
  const variants = {
    primary: 'bg-white dark:bg-gray-800',
    secondary: 'bg-gray-50 dark:bg-gray-900',
    tertiary: 'bg-gray-100 dark:bg-gray-800'
  }
  return variants[variant] || variants.primary
}

const getThemeTextClass = (intensity = '600') => {
  const intensityMap = {
    '900': 'text-gray-900 dark:text-gray-100',
    '800': 'text-gray-800 dark:text-gray-200',
    '700': 'text-gray-700 dark:text-gray-300',
    '600': 'text-gray-600 dark:text-gray-400',
    '500': 'text-gray-500 dark:text-gray-400',
    '400': 'text-gray-400 dark:text-gray-500'
  }
  return intensityMap[intensity] || intensityMap['600']
}
</script>