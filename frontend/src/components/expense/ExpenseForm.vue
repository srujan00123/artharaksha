<template>
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50"
        @click.self="handleClickOutside">
        <div
            class="bg-white dark:bg-gray-800 rounded-t-xl sm:rounded-lg p-4 sm:p-6 w-full max-w-2xl mx-0 sm:mx-4 max-h-[90vh] sm:max-h-[80vh] overflow-y-auto transform transition-all duration-300 ease-out">
            <!-- Header -->
            <div class="flex items-center justify-between mb-4 sm:mb-6 border-b border-gray-200 dark:border-gray-700 pb-3">
                <div>
                    <h3 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
                        {{ isEditing ? 'Edit Expense' : 'Add New Expense' }}
                    </h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {{ isEditing ? 'Update your expense details' : 'Track your healthcare and living expenses' }}
                    </p>
                </div>
                <button @click="handleClose"
                    class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors touch-manipulation"
                    :disabled="submitting">
                    <X class="w-5 h-5" />
                </button>
            </div>

            <!-- Loading State -->
            <div v-if="initialLoading" class="flex items-center justify-center py-12">
                <div class="text-center">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                    <p class="text-gray-600 dark:text-gray-400 text-sm">{{ isEditing ? 'Loading expense...' : 'Initializing form...' }}</p>
                </div>
            </div>

            <!-- Form -->
            <form @submit.prevent="handleSubmit" class="space-y-6" novalidate>
                <!-- Expense Type Selection -->
                <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                        Expense Type <span class="text-red-500">*</span>
                    </label>
                    <div class="grid grid-cols-2 gap-3">
                        <button type="button" @click="formData.type = 'medical'" :disabled="submitting" :class="[
                            'p-4 border-2 rounded-lg text-center transition-all duration-200 touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                            formData.type === 'medical'
                                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                            submitting && 'opacity-50 cursor-not-allowed'
                        ]">
                            <Stethoscope class="w-6 h-6 mx-auto mb-2" />
                            <div class="text-sm font-medium">Medical</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400">Healthcare related expenses</div>
                        </button>
                        <button type="button" @click="formData.type = 'other'" :disabled="submitting" :class="[
                            'p-4 border-2 rounded-lg text-center transition-all duration-200 touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                            formData.type === 'other'
                                ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                            submitting && 'opacity-50 cursor-not-allowed'
                        ]">
                            <ShoppingBag class="w-6 h-6 mx-auto mb-2" />
                            <div class="text-sm font-medium">Other</div>
                            <div class="text-xs text-gray-500 dark:text-gray-400">Living & other expenses</div>
                        </button>
                    </div>
                </div>

                <!-- Category Selection -->
                <div>
                    <label for="category" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Category <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                        <select v-model="formData.category" id="category" :disabled="submitting" :class="[
                            'w-full p-3 border rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                            validationErrors.category ? 'border-red-300 bg-red-50' : 'border-gray-300',
                            submitting && 'opacity-50 cursor-not-allowed'
                        ]" required>
                            <option value="">Select a category</option>
                            <option v-for="category in availableCategories" :key="category.value"
                                :value="category.value">
                                {{ category.label }}
                            </option>
                        </select>
                        <div v-if="validationErrors.category" class="mt-1 text-sm text-red-600 dark:text-red-400">
                            {{ validationErrors.category }}
                        </div>
                    </div>
                </div>

                <!-- Is Direct Medical Expense (for medical expenses only) -->
                <div v-if="formData.type === 'medical'">
                    <label class="flex items-center space-x-3 cursor-pointer">
                        <input
                            v-model="formData.is_direct"
                            type="checkbox"
                            class="w-4 h-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:ring-blue-400"
                            :disabled="submitting"
                        />
                        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">This is a direct medical expense</span>
                    </label>
                    <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        Direct expenses are payments made directly to healthcare providers (consultations, medicines, tests, etc.)
                    </p>
                </div>

                <!-- Description -->
                <div>
                    <label for="description" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description <span class="text-gray-400 dark:text-gray-500">(Optional)</span>
                    </label>
                    <TextInput v-model="formData.description" id="description" size="sm" variant="subtle"
                        :disabled="submitting" placeholder="Add details about your expense"
                        class="w-full" />
                </div>

                <!-- Amount -->
                <div>
                    <label for="amount" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Amount (₹) <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <span class="text-gray-500 dark:text-gray-400 text-sm">₹</span>
                        </div>
                        <TextInput v-model="formData.amount" id="amount" type="number" step="0.01" min="0" size="sm"
                            variant="subtle" :disabled="submitting" :class="[
                                'pl-8',
                                validationErrors.amount && 'border-red-300 bg-red-50'
                            ]" placeholder="0.00" required />
                        <div v-if="validationErrors.amount" class="mt-1 text-sm text-red-600 dark:text-red-400">
                            {{ validationErrors.amount }}
                        </div>
                    </div>
                </div>

                <!-- Date & Time -->
                <div>
                    <label for="date_time" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Date & Time <span class="text-red-500">*</span>
                    </label>
                    <div class="relative">
                        <TextInput v-model="formData.date_time" id="date_time" type="datetime-local" size="sm"
                            variant="subtle" :disabled="submitting" :class="[
                                validationErrors.date_time && 'border-red-300 bg-red-50'
                            ]" :max="maxDateTime" required />
                        <div v-if="validationErrors.date_time" class="mt-1 text-sm text-red-600 dark:text-red-400">
                            {{ validationErrors.date_time }}
                        </div>
                    </div>
                </div>

                <!-- Receipt Upload (for medical expenses) -->
                <div v-if="formData.type === 'medical'">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Receipt/Proof <span class="text-gray-400 dark:text-gray-500">(Optional)</span>
                    </label>
                    <div
                        class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 transition-colors hover:border-gray-400 dark:hover:border-gray-500">
                        <div class="text-center">
                            <div class="text-sm text-gray-600 dark:text-gray-400">
                                <p>Upload receipt or proof of payment</p>
                                <p class="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                    Supported formats: Images, PDF (Max 5MB)
                                </p>
                            </div>
                            <input
                                type="file"
                                accept="image/*,application/pdf"
                                @change="handleReceiptUpload"
                                :disabled="submitting"
                                class="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            />
                        </div>
                        <div v-if="formData.proof_of_payment" class="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <div class="flex items-center text-sm text-green-700 dark:text-green-300">
                                <Check class="w-4 h-4 mr-2" />
                                Receipt uploaded successfully
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Error Display -->
                <div v-if="submitError" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div class="flex items-start">
                        <AlertCircle class="w-5 h-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                        <div>
                            <h4 class="text-sm font-medium text-red-800 dark:text-red-200 mb-1">Failed to save expense</h4>
                            <p class="text-sm text-red-700 dark:text-red-300">{{ submitError }}</p>
                        </div>
                    </div>
                </div>

                <!-- Form Actions -->
                <div class="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <Button variant="outline" @click="handleClose" :disabled="submitting"
                        class="w-full sm:w-auto touch-manipulation">
                        Cancel
                    </Button>
                    <Button variant="solid" type="submit" :loading="submitting" :disabled="!isFormValid || submitting"
                        class="w-full sm:w-auto touch-manipulation">
                            {{ isEditing ? 'Update Expense' : 'Add Expense' }}
                    </Button>
                </div>
            </form>
        </div>
    </div>
</template>

<script setup lang="ts">
import { Button, TextInput } from "frappe-ui"
import {
	AlertCircle,
	Check,
	ShoppingBag,
	Stethoscope,
	X,
} from "lucide-vue-next"
import { computed, onMounted, ref, watch } from "vue"
import { useExpense } from "../../composables/useExpense"
import type {
	ExpenseFormData,
	ExpenseValidationErrors,
	FlattenedExpenseEntry,
} from "../../types/expense"
import {
	MEDICAL_EXPENSE_CATEGORIES,
	OTHER_EXPENSE_CATEGORIES,
} from "../../types/expense"
import {
	getClientDateTimeString,
	getClientTime,
} from "../../utils/date"

// Props
interface Props {
	expense?: FlattenedExpenseEntry | null
}

const props = withDefaults(defineProps<Props>(), {
	expense: null,
})

// Emits
const emit = defineEmits<{
	close: []
	success: []
}>()

// Use the expense composable
const {
	createExpense,
	updateExpense,
	loading,
	error,
	clearError,
} = useExpense()

// Form state
const initialLoading = ref(false)
const submitting = ref(false)
const submitError = ref("")
const validationErrors = ref<ExpenseValidationErrors>({})

// Form data matching ExpenseFormData interface
const formData = ref<ExpenseFormData>({
	type: "medical",
	category: "",
	description: "",
	amount: "",
	date_time: getClientDateTimeString(),
	proof_of_payment: "",
	is_direct: true,
})

// Computed properties
const isEditing = computed(() => !!props.expense)

const availableCategories = computed(() =>
	formData.value.type === "medical"
		? MEDICAL_EXPENSE_CATEGORIES
		: OTHER_EXPENSE_CATEGORIES,
)

const maxDateTime = computed(() => {
	return getClientDateTimeString()
})

const isFormValid = computed(() => {
	return (
		formData.value.category &&
		formData.value.amount &&
		Number.parseFloat(formData.value.amount) > 0 &&
		formData.value.date_time &&
		Object.keys(validationErrors.value).length === 0
	)
})

// Validation functions
function validateField(field: keyof ExpenseFormData, value: any) {
	switch (field) {
		case "category":
			if (!value?.trim()) {
				validationErrors.value.category = "Please select a category"
			} else {
				delete validationErrors.value.category
			}
			break
		case "amount":
			if (!value || value === "") {
				validationErrors.value.amount = "Please enter an amount"
			} else {
				const numValue = Number.parseFloat(value)
				if (isNaN(numValue) || numValue <= 0) {
					validationErrors.value.amount = "Amount must be greater than 0"
				} else if (numValue > 10000000) {
					validationErrors.value.amount = "Amount seems too large"
				} else {
					delete validationErrors.value.amount
				}
			}
			break
		case "date_time":
			if (!value) {
				validationErrors.value.date_time = "Please select date and time"
			} else {
				const selectedDate = new Date(value)
				const now = getClientTime()
				if (selectedDate > now) {
					validationErrors.value.date_time = "Date cannot be in the future"
				} else {
					delete validationErrors.value.date_time
				}
			}
			break
	}
}

function validateForm(): boolean {
	validateField("category", formData.value.category)
	validateField("amount", formData.value.amount)
	validateField("date_time", formData.value.date_time)
	return Object.keys(validationErrors.value).length === 0
}

// Event handlers
function handleReceiptUpload(event: Event) {
	const target = event.target as HTMLInputElement
	const file = target.files?.[0]
	if (file) {
		// For now, just store the file name
		// In a real implementation, you'd upload the file and get a URL
		formData.value.proof_of_payment = file.name
}
}

function handleClickOutside() {
	if (submitting.value) return
	handleClose()
}

function handleClose() {
	if (submitting.value) return
	resetForm()
	emit("close")
}

async function handleSubmit() {
	submitError.value = ""
	clearError()

	if (!validateForm()) {
		return
	}

	submitting.value = true

	try {
		if (isEditing.value && props.expense) {
			// Update existing expense
			await updateExpense(props.expense.name, formData.value)
		} else {
			// Create new expense
			await createExpense(formData.value)
		}

		// Reset form after successful submission
		resetForm()

		emit("success")
		emit("close")
	} catch (err: any) {
		console.error("Error saving expense:", err)
		submitError.value =
			err.message || "Failed to save expense. Please try again."
	} finally {
		submitting.value = false
	}
}

// Form reset function
function resetForm() {
	formData.value = {
		type: "medical",
		category: "",
		description: "",
		amount: "",
		date_time: getClientDateTimeString(),
		proof_of_payment: "",
		is_direct: true,
	}
	validationErrors.value = {}
	submitError.value = ""
}

// Watchers for validation
watch(
	() => formData.value.category,
	(newValue) => {
		validateField("category", newValue)
	},
)

watch(
	() => formData.value.amount,
	(newValue) => {
		validateField("amount", newValue)
	},
)

watch(
	() => formData.value.date_time,
	(newValue) => {
		validateField("date_time", newValue)
	},
)

// Reset category when type changes
watch(
	() => formData.value.type,
	(newType) => {
		formData.value.category = ""
		formData.value.is_direct = newType === "medical"
	},
)

// Load expense data for editing
watch(
	() => props.expense,
	(newExpense) => {
		if (newExpense) {
			formData.value = {
				type: newExpense.type || "medical",
				category: newExpense.category || "",
				description: newExpense.description || "",
				amount: newExpense.amount?.toString() || "",
				date_time: newExpense.date_time?.slice(0, 16) || getClientDateTimeString(),
				proof_of_payment: newExpense.proof_of_payment || "",
				is_direct: newExpense.type === "medical" 
					? (newExpense.is_direct !== undefined ? newExpense.is_direct : true)
						: false,
			}
		}
	},
	{ immediate: true },
)
</script>

<style scoped>
/* Custom styles if needed */
</style>