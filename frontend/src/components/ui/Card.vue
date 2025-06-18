<template>
    <div :class="[
        'bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm',
        'transition-all duration-200',
        {
            'hover:shadow-lg': hoverable,
            'cursor-pointer': clickable,
            'ring-2 ring-blue-500 ring-opacity-50': focused,
        },
        customClass
    ]" :tabindex="clickable ? 0 : undefined" @click="handleClick" @keydown.enter="handleClick"
        @keydown.space="handleClick" @focus="focused = true" @blur="focused = false" v-bind="$attrs">
        <div v-if="$slots.header" class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <slot name="header" />
        </div>

        <div :class="[
            bodyPadding,
            { 'flex-1': !$slots.header && !$slots.footer }
        ]">
            <slot />
        </div>

        <div v-if="$slots.footer"
            class="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-900/50 rounded-b-lg">
            <slot name="footer" />
        </div>
    </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
    /**
     * Whether the card should have hover effects
     */
    hoverable: {
        type: Boolean,
        default: false
    },

    /**
     * Whether the card is clickable
     */
    clickable: {
        type: Boolean,
        default: false
    },

    /**
     * Custom CSS classes to apply
     */
    customClass: {
        type: String,
        default: ''
    },

    /**
     * Padding for the card body
     */
    padding: {
        type: String,
        default: 'default',
        validator: (value) => ['none', 'sm', 'default', 'lg', 'xl'].includes(value)
    },

    /**
     * Card variant
     */
    variant: {
        type: String,
        default: 'default',
        validator: (value) => ['default', 'outlined', 'elevated', 'flat'].includes(value)
    }
})

const emit = defineEmits(['click'])

const focused = ref(false)

const bodyPadding = computed(() => {
    const paddingMap = {
        none: 'p-0',
        sm: 'p-2',
        default: 'p-4',
        lg: 'p-6',
        xl: 'p-8'
    }
    return paddingMap[props.padding] || paddingMap.default
})

const handleClick = (event) => {
    if (props.clickable) {
        emit('click', event)
    }
}
</script>

<style scoped>
/* Additional styles for better focus handling */
.cursor-pointer:focus {
    outline: none;
}

/* Ensure smooth transitions */
.transition-all {
    transition-property: all;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 200ms;
}
</style>