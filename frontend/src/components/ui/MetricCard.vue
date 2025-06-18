<template>
    <Card :clickable="clickable" :hoverable="hoverable" padding="sm" :custom-class="cardClasses" @click="handleClick">
        <div class="flex items-center justify-between">
            <!-- Content Section -->
            <div class="min-w-0 flex-1">
                <!-- Title -->
                <p class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {{ title }}
                </p>

                <!-- Value -->
                <p class="text-lg font-bold text-gray-900 dark:text-gray-100 truncate">
                    {{ formattedValue }}
                </p>

                <!-- Subtitle/Details -->
                <div v-if="subtitle || $slots.subtitle" class="flex items-center space-x-2 mt-1">
                    <slot name="subtitle">
                        <span v-if="subtitle" class="text-xs text-gray-500 dark:text-gray-400">
                            {{ subtitle }}
                        </span>
                    </slot>
                </div>
            </div>

            <!-- Icon Section -->
            <div v-if="icon || $slots.icon" :class="iconClasses">
                <slot name="icon">
                    <component v-if="icon" :is="icon" :class="iconSizeClasses" />
                </slot>
            </div>
        </div>

        <!-- Progress Bar -->
        <div v-if="showProgress" class="mt-2">
            <div class="h-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                <div class="h-2 rounded-full transition-all duration-300" :class="progressColorClasses"
                    :style="{ width: `${Math.min(progressPercentage, 100)}%` }" />
            </div>
        </div>

        <!-- Footer -->
        <div v-if="footer || $slots.footer" class="mt-1">
            <slot name="footer">
                <p v-if="footer" class="text-xs text-gray-500 dark:text-gray-400">
                    {{ footer }}
                </p>
            </slot>
        </div>

        <!-- Action Indicator -->
        <div v-if="clickable" class="flex items-center justify-end mt-2">
            <ChevronRight class="w-4 h-4 text-gray-400 dark:text-gray-500" />
        </div>
    </Card>
</template>

<script setup>
import { computed } from 'vue'
import { ChevronRight } from 'lucide-vue-next'
import Card from './Card.vue'

const props = defineProps({
    /**
     * Card title
     */
    title: {
        type: String,
        required: true
    },

    /**
     * Main value to display
     */
    value: {
        type: [String, Number],
        required: true
    },

    /**
     * Optional subtitle text
     */
    subtitle: {
        type: String,
        default: ''
    },

    /**
     * Optional footer text
     */
    footer: {
        type: String,
        default: ''
    },

    /**
     * Icon component to display
     */
    icon: {
        type: [String, Object],
        default: null
    },

    /**
     * Color theme for the card
     */
    color: {
        type: String,
        default: 'blue',
        validator: (value) => ['blue', 'green', 'orange', 'purple', 'red', 'indigo', 'pink', 'gray'].includes(value)
    },

    /**
     * Whether to show a progress bar
     */
    showProgress: {
        type: Boolean,
        default: false
    },

    /**
     * Progress percentage (0-100)
     */
    progressPercentage: {
        type: Number,
        default: 0
    },

    /**
     * Whether the card is clickable
     */
    clickable: {
        type: Boolean,
        default: false
    },

    /**
     * Whether to show hover effects
     */
    hoverable: {
        type: Boolean,
        default: true
    },

    /**
     * Currency formatting
     */
    currency: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['click'])

const formattedValue = computed(() => {
    if (props.currency && typeof props.value === 'number') {
        return `₹${props.value.toLocaleString()}`
    }
    return props.value
})

const cardClasses = computed(() => {
    return `p-3 sm:p-4 cursor-pointer hover:shadow-lg transition-shadow duration-200`
})

const iconClasses = computed(() => {
    const colorMap = {
        blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
        green: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
        orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
        purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
        red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
        indigo: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
        pink: 'bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
        gray: 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400'
    }

    return `w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ml-3 ${colorMap[props.color]}`
})

const iconSizeClasses = computed(() => {
    return 'w-5 h-5'
})

const progressColorClasses = computed(() => {
    const colorMap = {
        blue: 'bg-blue-600',
        green: 'bg-green-600',
        orange: 'bg-orange-600',
        purple: 'bg-purple-600',
        red: 'bg-red-600',
        indigo: 'bg-indigo-600',
        pink: 'bg-pink-600',
        gray: 'bg-gray-600'
    }

    return colorMap[props.color]
})

const handleClick = (event) => {
    if (props.clickable) {
        emit('click', event)
    }
}
</script>