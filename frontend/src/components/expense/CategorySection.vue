<template>
  <div class="category-section bg-white dark:bg-gray-800 rounded-lg shadow-sm border">
    <!-- Section Header -->
    <div class="p-6 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <div 
            :class="iconBackgroundClass"
            class="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
          >
            <component 
              :is="iconComponent" 
              :class="iconColorClass"
              class="w-5 h-5" 
            />
          </div>
          <div>
            <h3 :class="titleColorClass" class="text-lg font-semibold">
              {{ title }}
            </h3>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ description }}
            </p>
          </div>
        </div>
        <div class="text-right">
          <p class="text-lg font-semibold text-gray-900 dark:text-gray-100">
            ₹{{ totalAmount.toLocaleString() }}
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            {{ categories.length }} {{ categories.length === 1 ? 'category' : 'categories' }}
          </p>
        </div>
      </div>
    </div>
    
    <!-- Categories List -->
    <div class="p-6">
      <div class="space-y-3">
        <div 
          v-for="category in categories" 
          :key="category.category"
          :class="categoryItemClass"
          class="flex items-center justify-between p-3 rounded-lg transition-colors cursor-pointer"
          @click="selectCategory(category)"
        >
          <div class="flex items-center">
            <div 
              :class="iconBackgroundClass"
              class="w-8 h-8 rounded-lg flex items-center justify-center mr-3"
            >
              <component 
                :is="getCategoryIcon(category.category)" 
                :class="iconColorClass"
                class="w-4 h-4" 
              />
            </div>
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
                {{ category.category }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                {{ category.count }} {{ category.count === 1 ? 'transaction' : 'transactions' }}
              </p>
            </div>
          </div>
          <div class="text-right">
            <p class="text-sm font-semibold text-gray-900 dark:text-gray-100">
              ₹{{ category.totalAmount.toLocaleString() }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ category.percentage.toFixed(1) }}%
            </p>
          </div>
        </div>
        
        <!-- Empty State -->
        <div 
          v-if="categories.length === 0" 
          class="text-center py-8 text-gray-500 dark:text-gray-400"
        >
          <component 
            :is="iconComponent" 
            class="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" 
          />
          <p class="text-sm">No {{ title.toLowerCase() }} found</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
	Bed,
	Building2,
	Car,
	Heart,
	Home,
	Phone,
	Pill,
	Plane,
	ShoppingBag,
	Stethoscope,
	Syringe,
	Utensils,
} from "lucide-vue-next"
import { computed } from "vue"

// Props
interface Props {
	title: string
	description: string
	categories: CategoryBreakdown[]
	totalAmount: number
	colorScheme: "blue" | "purple" | "orange" | "green"
	icon: "stethoscope" | "car" | "shopping-bag" | "heart"
}

interface CategoryBreakdown {
	category: string
	type: string
	count: number
	totalAmount: number
	averageAmount: number
	percentage: number
	expenses: Array<{
		id?: string
		name?: string
		category: string
		amount: number
		date_time: string
		description?: string
	}>
}

const props = defineProps<Props>()

// Emits
const emit = defineEmits<{
	categorySelected: [category: CategoryBreakdown]
}>()

// Computed classes based on color scheme
const colorClasses = computed(() => {
	const schemes = {
		blue: {
			iconBackground: "bg-blue-100 dark:bg-blue-900/30",
			iconColor: "text-blue-600 dark:text-blue-400",
			titleColor: "text-blue-900",
			categoryItem:
				"bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30",
		},
		purple: {
			iconBackground: "bg-purple-100 dark:bg-purple-900/30",
			iconColor: "text-purple-600 dark:text-purple-400",
			titleColor: "text-purple-900",
			categoryItem:
				"bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30",
		},
		orange: {
			iconBackground: "bg-orange-100 dark:bg-orange-900/30",
			iconColor: "text-orange-600 dark:text-orange-400",
			titleColor: "text-orange-900",
			categoryItem:
				"bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30",
		},
		green: {
			iconBackground: "bg-green-100 dark:bg-green-900/30",
			iconColor: "text-green-600 dark:text-green-400",
			titleColor: "text-green-900",
			categoryItem:
				"bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30",
		},
	}
	return schemes[props.colorScheme] || schemes.blue
})

const iconBackgroundClass = computed(() => colorClasses.value.iconBackground)
const iconColorClass = computed(() => colorClasses.value.iconColor)
const titleColorClass = computed(() => colorClasses.value.titleColor)
const categoryItemClass = computed(() => colorClasses.value.categoryItem)

// Icon mapping
const iconComponent = computed(() => {
	const icons = {
		stethoscope: Stethoscope,
		car: Car,
		"shopping-bag": ShoppingBag,
		heart: Heart,
	}
	return icons[props.icon] || Heart
})

// Methods
const selectCategory = (category: CategoryBreakdown) => {
	emit("categorySelected", category)
}

const getCategoryIcon = (category: string) => {
	const categoryLower = category.toLowerCase()

	if (
		categoryLower.includes("medicine") ||
		categoryLower.includes("drug") ||
		categoryLower.includes("pharmacy")
	) {
		return Pill
	}
	if (categoryLower.includes("hospital") || categoryLower.includes("clinic")) {
		return Building2
	}
	if (categoryLower.includes("bed") || categoryLower.includes("admission")) {
		return Bed
	}
	if (
		categoryLower.includes("injection") ||
		categoryLower.includes("vaccine")
	) {
		return Syringe
	}
	if (
		categoryLower.includes("transport") ||
		categoryLower.includes("travel") ||
		categoryLower.includes("flight")
	) {
		return categoryLower.includes("flight") ? Plane : Car
	}
	if (
		categoryLower.includes("accommodation") ||
		categoryLower.includes("hotel")
	) {
		return Home
	}
	if (categoryLower.includes("food") || categoryLower.includes("meal")) {
		return Utensils
	}
	if (
		categoryLower.includes("phone") ||
		categoryLower.includes("communication")
	) {
		return Phone
	}

	return Heart
}
</script>

<style scoped>
.category-section {
  @apply transition-all duration-200;
}
</style> 