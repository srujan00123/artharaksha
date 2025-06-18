<template>
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4">
    <div class="flex items-center">
      <div class="flex-shrink-0">
        <div 
          :class="iconClass"
          class="w-8 h-8 rounded-full flex items-center justify-center"
        >
          <component :is="iconComponent" class="w-4 h-4" />
        </div>
      </div>
      <div class="ml-3">
        <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
          {{ title }}
        </p>
        <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">
          {{ isCount ? amount : `₹${amount.toLocaleString()}` }}
        </p>
        <p v-if="subtitle" class="text-xs text-gray-500 dark:text-gray-400">
          {{ subtitle }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Calculator, Hash, Heart, ShoppingBag } from "lucide-vue-next"
import { computed } from "vue"

// Props
interface Props {
	title: string
	amount: number
	subtitle?: string
	icon: "calculator" | "heart" | "shopping-bag" | "hash"
	color: "blue" | "red" | "green" | "purple"
	isCount?: boolean
}

const props = withDefaults(defineProps<Props>(), {
	isCount: false,
})

// Computed properties
const iconComponent = computed(() => {
	const iconMap = {
		calculator: Calculator,
		heart: Heart,
		"shopping-bag": ShoppingBag,
		hash: Hash,
	}
	return iconMap[props.icon] || Calculator
})

const iconClass = computed(() => {
	const colorMap = {
		blue: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
		red: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
		green:
			"bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
		purple:
			"bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400",
	}
	return colorMap[props.color] || colorMap.blue
})
</script>

<style scoped>
/* Component-specific styles if needed */
</style> 