<template>
  <div class="support-filter bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-sm dark:shadow dark:shadow-gray-900/20-gray-900/20 border border-gray-200 dark:border-gray-700 p-4">
    <div class="flex flex-wrap items-center gap-4">
      <!-- Scheme Source Filter -->
      <div class="flex-1 min-w-[200px]">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-1">
          Scheme Source
        </label>
        <select
          v-model="localFilters.scheme_source"
          @change="applyFilters"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
        >
          <option value="">All Sources</option>
          <option value="welfare">Welfare Schemes</option>
          <option value="insurance">Insurance Schemes</option>
        </select>
      </div>

      <!-- Type Filter -->
      <div class="flex-1 min-w-[200px]">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-1">
          Filter by Type
        </label>
        <select
          v-model="localFilters.type"
          @change="applyFilters"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
        >
          <option value="">All Types</option>
          <option v-for="type in availableTypes" :key="type" :value="type">
            {{ type }}
          </option>
        </select>
      </div>

      <!-- Search Filter -->
      <div class="flex-1 min-w-[200px]">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-1">
          Search
        </label>
        <input
          v-model="localFilters.search"
          type="text"
          @input="applyFilters"
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
          placeholder="Search schemes..."
        />
      </div>

      <!-- Clear Filters Button -->
      <div class="flex items-end">
        <Button 
          variant="outline" 
          @click="clearFilters"
          :disabled="!hasActiveFilters"
          class="whitespace-nowrap"
        >
          Clear Filters
        </Button>
      </div>
    </div>

    <!-- Active Filters Display -->
    <div v-if="hasActiveFilters" class="mt-4 flex flex-wrap gap-2">
      <span class="text-sm text-gray-600 dark:text-gray-400 dark:text-gray-500">Active filters:</span>
      
      <span
        v-if="localFilters.scheme_source"
        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30  dark:text-blue-200" :class="getFinancialStatusClass('medical', '800')"
      >
        Source: {{ formatSchemeSource(localFilters.scheme_source) }}
        <button @click="clearFilter('scheme_source')" class="ml-1 text-blue-600 dark:text-blue-400 hover: dark:text-blue-200" :class="getFinancialStatusClass('medical', '800')">
          <X class="w-3 h-3" />
        </button>
      </span>
      
      <span
        v-if="localFilters.type"
        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30  dark:text-green-200" :class="getFinancialStatusClass('income', '800')"
      >
        Type: {{ localFilters.type }}
        <button @click="clearFilter('type')" class="ml-1 text-green-600 dark:text-green-400 hover: dark:text-green-200" :class="getFinancialStatusClass('income', '800')">
          <X class="w-3 h-3" />
        </button>
      </span>
      
      <span
        v-if="localFilters.search"
        class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 dark:bg-gray-200 text-gray-800 dark:text-gray-200"
      >
        Search: "{{ localFilters.search }}"
        <button @click="clearFilter('search')" class="ml-1 text-gray-600 dark:text-gray-400 dark:text-gray-500 hover:text-gray-800 dark:text-gray-200">
          <X class="w-3 h-3" />
        </button>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Button } from "frappe-ui"
import { X } from "lucide-vue-next"
import { computed, onMounted, ref, watch } from "vue"
import { useSupport } from "../../composables/useSupport"
import type { SupportFilters } from "../../types/support"

// Props
interface Props {
	modelValue?: SupportFilters
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: () => ({
		type: "",
		scheme_source: "",
		search: "",
	}),
})

// Emits
const emit = defineEmits<{
	"update:modelValue": [filters: SupportFilters]
	"filter-change": [filters: SupportFilters]
	"cache-invalidated": []
}>()

// Composables
const supportComposable = useSupport()

// State
const availableTypes = ref<string[]>([])

// Local filters with proper typing
const localFilters = ref<SupportFilters>({
	type: "",
	scheme_source: "",
	search: "",
})

// Computed
const hasActiveFilters = computed(() => {
	return (
		localFilters.value.type !== "" ||
		localFilters.value.scheme_source !== "" ||
		localFilters.value.search !== ""
	)
})

// Methods
const applyFilters = () => {
	const filters = { ...localFilters.value }

	// Emit cache invalidation event for parent to handle
	emit("cache-invalidated")
	emit("update:modelValue", filters)
	emit("filter-change", filters)
}

const clearFilters = () => {
	localFilters.value = {
		type: "",
		scheme_source: "",
		search: "",
	}
	applyFilters()
}

const clearFilter = (filterKey: keyof SupportFilters) => {
	;(localFilters.value[filterKey] as string) = ""
	applyFilters()
}

const formatSchemeSource = (source: string) => {
	switch (source) {
		case "welfare":
			return "Welfare Schemes"
		case "insurance":
			return "Insurance Schemes"
		default:
			return source
	}
}

const loadAvailableTypes = async () => {
	try {
		// Load available types from both welfare and insurance schemes
		const [welfareSchemes, insuranceSchemes] = await Promise.all([
			supportComposable.loadWelfareSchemes(),
			supportComposable.loadInsuranceSchemes(),
		])

		const types = new Set<string>()

		welfareSchemes.forEach((scheme) => {
			if (scheme.type) types.add(scheme.type)
		})

		insuranceSchemes.forEach((scheme) => {
			if (scheme.type) types.add(scheme.type)
		})

		availableTypes.value = Array.from(types).sort()
	} catch (error) {
		console.error("Failed to load available types:", error)
	}
}

// Watchers
watch(
	() => props.modelValue,
	(newFilters) => {
		if (newFilters) {
			localFilters.value = { ...newFilters }
		}
	},
	{ immediate: true, deep: true },
)

// Initialize
onMounted(() => {
	loadAvailableTypes()
})
</script>

<style scoped>
.support-filter {
  /* Custom styles if needed */
}
</style> 