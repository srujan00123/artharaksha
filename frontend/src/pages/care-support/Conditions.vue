<template>
    <div class="p-4 lg:p-6">
        <!-- Header -->
        <div class="mb-4 sm:mb-6">
            <h1 class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">Health Conditions</h1>
            <p class="text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-2 text-sm sm:text-base">Manage your health conditions and track their impact</p>
        </div>

        <!-- Loading State -->
        <div v-if="support.loading.value.healthConditions || support.loading.value.householdProfile" 
             class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span class="ml-3 text-gray-600 dark:text-gray-400 dark:text-gray-500">Loading health conditions...</span>
        </div>

        <!-- Error State -->
        <div v-else-if="support.errors.value.healthConditions || support.errors.value.householdProfile" 
             class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div class="flex">
                <AlertCircle class="h-5 w-5 text-red-400" />
                <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error Loading Data</h3>
                    <p class="mt-1 text-sm text-red-700 dark:text-red-300">
                        {{ support.errors.value.healthConditions || support.errors.value.householdProfile }}
                    </p>
                </div>
            </div>
        </div>

        <!-- Main Content -->
        <div v-else class="space-y-4 sm:space-y-6">
            <!-- Summary Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <Activity class="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Active Conditions</p>
                            <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ userHealthConditions.length }}</p>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <AlertTriangle class="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Risk Level</p>
                            <p class="text-2xl font-bold" :class="getRiskLevelColor(riskLevel)">
                                {{ riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1) }}
                            </p>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <Heart class="h-8 w-8 text-red-600 dark:text-red-400" />
                        </div>
                        <div class="ml-4">
                            <p class="text-sm font-medium text-gray-500 dark:text-gray-400 dark:text-gray-500">Severe Conditions</p>
                            <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ severeConditionsCount }}</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Search Health Conditions -->
            <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg border border-gray-200 dark:border-gray-700">
                <div class="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <div class="flex items-center justify-between">
                        <div>
                            <h2 class="text-lg font-medium text-gray-900 dark:text-gray-100">Health Conditions</h2>
                            <p class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">Search to view and manage your health conditions</p>
                        </div>
                        <button
                            @click="showAddConditionModal = true"
                            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white dark:text-black bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400"
                        >
                            <Plus class="h-4 w-4 mr-2" />
                            Add Condition
                        </button>
                    </div>
                </div>

                <div class="p-6">
                    <!-- Search and Filter -->
                    <div class="mb-6 space-y-4">
                        <div class="relative">
                            <Search class="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                            <input
                                v-model="searchQuery"
                                type="text"
                                placeholder="Search health conditions..."
                                class="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                            />
                        </div>

                        <div class="flex flex-wrap gap-2">
                            <button
                                v-for="type in CONDITION_TYPES"
                                :key="type.value"
                                @click="selectedType = selectedType === type.value ? null : type.value"
                                class="inline-flex items-center px-3 py-1 text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400"
                                :class="selectedType === type.value 
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200' 
                                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'"
                            >
                                <span class="mr-1">{{ type.icon }}</span>
                                {{ type.label }}
                            </button>
                        </div>
                    </div>

                    <!-- Search Results -->
                    <div v-if="searchQuery.trim()">
                        <!-- User's Current Conditions (matching search) -->
                        <div v-if="filteredUserConditions.length > 0" class="mb-6">
                            <h3 class="text-md font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                                <Heart class="h-4 w-4 mr-2 text-red-500" />
                                Your Conditions
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div
                                    v-for="condition in filteredUserConditions"
                                    :key="'user-' + condition.name"
                                    class="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg p-4 relative"
                                >
                                    <div class="flex items-start justify-between">
                                        <div class="flex items-start space-x-3 flex-1">
                                            <span class="text-2xl">{{ getConditionTypeIcon(condition.condition_details?.condition_type) }}</span>
                                            <div class="flex-1">
                                                <h4 class="font-medium text-gray-900 dark:text-gray-100">
                                                    {{ condition.condition_details?.condition_name || condition.condition }}
                                                </h4>
                                                <p class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">
                                                    {{ condition.condition_details?.condition_type }}
                                                </p>
                                                <div class="mt-2 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                                                    <span
                                                        class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                                                        :class="getSeverityBadgeClass(condition.severity || condition.condition_details?.default_severity)"
                                                    >
                                                        {{ condition.severity || condition.condition_details?.default_severity }}
                                                    </span>
                                                    <span>{{ condition.duration_override || condition.condition_details?.default_duration }}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="flex items-center space-x-1">
                                            <button
                                                @click="editCondition(condition)"
                                                class="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:text-gray-500 transition-colors"
                                            >
                                                <Edit2 class="h-3 w-3" />
                                            </button>
                                            <button
                                                @click="removeCondition(condition)"
                                                class="p-1 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 dark:text-red-400 transition-colors"
                                            >
                                                <Trash2 class="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Available Conditions (matching search) -->
                        <div v-if="filteredAvailableConditions.length > 0">
                            <h3 class="text-md font-medium text-gray-900 dark:text-gray-100 mb-3 flex items-center">
                                <Plus class="h-4 w-4 mr-2 text-blue-500" />
                                Available to Add
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div
                                    v-for="condition in filteredAvailableConditions"
                                    :key="'available-' + condition.name"
                                    class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:bg-blue-900/20 transition-all cursor-pointer"
                                    @click="selectConditionToAdd(condition)"
                                >
                                    <div class="flex items-start space-x-3">
                                        <span class="text-2xl">{{ getConditionTypeIcon(condition.condition_type) }}</span>
                                        <div class="flex-1">
                                            <h4 class="font-medium text-gray-900 dark:text-gray-100">{{ condition.condition_name }}</h4>
                                            <p class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">{{ condition.condition_type }}</p>
                                            <div class="mt-2 flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">
                                                <span>{{ condition.default_severity }}</span>
                                                <span>{{ condition.default_duration }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- No Results -->
                        <div v-if="filteredUserConditions.length === 0 && filteredAvailableConditions.length === 0" class="text-center py-8">
                            <Search class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Conditions Found</h3>
                            <p class="text-gray-500 dark:text-gray-400 dark:text-gray-500">Try adjusting your search or filter criteria.</p>
                        </div>
                    </div>

                    <!-- No Search State -->
                    <div v-else class="text-center py-12">
                        <Search class="w-16 h-16 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
                        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Search Health Conditions</h3>
                        <p class="text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-4">
                            Enter a condition name or type to view your current conditions and discover new ones to add.
                        </p>
                        <div class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                            <p>You currently have <strong>{{ userHealthConditions.length }}</strong> health condition{{ userHealthConditions.length !== 1 ? 's' : '' }} recorded.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Add/Edit Condition Modal -->
        <ConditionModal
            v-if="showAddConditionModal || editingCondition"
            :condition="editingCondition"
            :available-conditions="support.healthConditions.value"
            @close="closeConditionModal"
            @save="saveCondition"
        />
    </div>
</template>

<script setup>
import { useAdvancedTheme } from "@/composables/useAdvancedTheme"
import {
	Activity,
	AlertCircle,
	AlertTriangle,
	Edit2,
	Heart,
	Plus,
	Search,
	Trash2,
} from "lucide-vue-next"
import { computed, onMounted, ref } from "vue"
import ConditionModal from "../../components/support/ConditionModal.vue"
import { useSupport } from "../../composables/useSupport"
import {
	CONDITION_TYPES,
	calculateRiskLevel,
	getConditionTypeIcon,
	getSeverityColor,
} from "../../types/support"
import { toast } from "../../utils/toast"

// Support composable
const support = useSupport({ autoInitialize: true })

// Reactive data
const searchQuery = ref("")
const selectedType = ref(null)
const showAddConditionModal = ref(false)
const editingCondition = ref(null)

// Computed properties
const userHealthConditions = computed(() => {
	return support.householdProfile.value?.health_conditions || []
})

const riskLevel = computed(() => {
	if (!support.householdProfile.value) return "medium"
	return calculateRiskLevel(support.householdProfile.value)
})

const severeConditionsCount = computed(() => {
	return userHealthConditions.value.filter(
		(condition) =>
			(condition.severity || condition.condition_details?.default_severity) ===
			"Severe",
	).length
})

const filteredUserConditions = computed(() => {
	if (!searchQuery.value.trim()) return []
	
	let conditions = userHealthConditions.value

	// Filter by search query
	const query = searchQuery.value.toLowerCase()
	conditions = conditions.filter(
		(condition) =>
			(condition.condition_details?.condition_name || condition.condition).toLowerCase().includes(query) ||
			(condition.condition_details?.condition_type || '').toLowerCase().includes(query),
	)

	// Filter by type
	if (selectedType.value) {
		conditions = conditions.filter(
			(condition) => condition.condition_details?.condition_type === selectedType.value,
		)
	}

	return conditions
})

const filteredAvailableConditions = computed(() => {
	if (!searchQuery.value.trim()) return []
	
	let conditions = support.healthConditions.value

	// Filter by search query
	const query = searchQuery.value.toLowerCase()
	conditions = conditions.filter(
		(condition) =>
			condition.condition_name.toLowerCase().includes(query) ||
			condition.condition_type.toLowerCase().includes(query),
	)

	// Filter by type
	if (selectedType.value) {
		conditions = conditions.filter(
			(condition) => condition.condition_type === selectedType.value,
		)
	}

	// Exclude already added conditions
	const userConditionNames = userHealthConditions.value.map(
		(uc) => uc.condition,
	)
	conditions = conditions.filter(
		(condition) => !userConditionNames.includes(condition.name),
	)

	return conditions
})

// Methods
const getRiskLevelColor = (level) => {
	switch (level) {
		case "low":
			return "text-green-600"
		case "medium":
			return "text-yellow-600"
		case "high":
			return "text-red-600"
		default:
			return "text-gray-600"
	}
}

const getSeverityBadgeClass = (severity) => {
	switch (severity) {
		case "Mild":
			return "bg-green-100 text-green-800"
		case "Moderate":
			return "bg-yellow-100 text-yellow-800"
		case "Severe":
			return "bg-red-100 text-red-800"
		default:
			return "bg-gray-100 text-gray-800"
	}
}

const selectConditionToAdd = (condition) => {
	editingCondition.value = {
		condition: condition.name,
		severity: condition.default_severity,
		duration_override: condition.default_duration,
		notes: "",
	}
	showAddConditionModal.value = true
}

const editCondition = (condition) => {
	editingCondition.value = { ...condition }
	showAddConditionModal.value = true
}

const removeCondition = async (condition) => {
	if (confirm("Are you sure you want to remove this health condition?")) {
		try {
			const updatedConditions = userHealthConditions.value.filter(
				(c) => c.name !== condition.name,
			)
			await support.updateHealthConditions(updatedConditions)

			// Force refresh the household profile and clear all related caches
			await support.refreshHouseholdProfile()
			await support.refreshEligibleSchemes()

			toast.success("Health condition removed successfully")
		} catch (error) {
			console.error("Error removing condition:", error)
			toast.error("Failed to remove condition. Please try again.")
		}
	}
}

const closeConditionModal = () => {
	showAddConditionModal.value = false
	editingCondition.value = null
}

const saveCondition = async (conditionData) => {
	try {
		const updatedConditions = [...userHealthConditions.value]
		const isEditing = editingCondition.value && editingCondition.value.name

		if (isEditing) {
			// Update existing condition
			const index = updatedConditions.findIndex(
				(c) => c.name === editingCondition.value.name,
			)
			if (index !== -1) {
				updatedConditions[index] = {
					...updatedConditions[index],
					...conditionData,
				}
			}
		} else {
			// Add new condition
			updatedConditions.push(conditionData)
		}

		await support.updateHealthConditions(updatedConditions)

		// Force refresh the household profile and clear all related caches
		await support.refreshHouseholdProfile()
		await support.refreshEligibleSchemes()

		toast.success(
			isEditing
				? "Health condition updated successfully"
				: "Health condition added successfully",
		)

		closeConditionModal()
	} catch (error) {
		console.error("Error saving condition:", error)
		toast.error("Failed to save condition. Please try again.")
	}
}

// Lifecycle
onMounted(async () => {
	try {
		// Initialize support system if not already done
		if (!support.state.value.isInitialized) {
			await support.initialize()
		}

		// Load health conditions and household profile
		await Promise.all([
			support.loadHealthConditions(),
			support.loadHouseholdProfile(),
		])
	} catch (error) {
		console.error("Error loading data:", error)
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