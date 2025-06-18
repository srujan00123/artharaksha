<template>
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" @click="closeModal">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow dark:shadow-gray-900/20-lg rounded-md bg-white dark:bg-gray-800 dark:bg-gray-200" @click.stop>
      <div class="mt-3">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
            {{ isEditing ? 'Edit Application' : 'Apply for Scheme' }}
          </h3>
          <button @click="closeModal" class="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400 dark:text-gray-500">
            <X class="w-6 h-6" />
          </button>
        </div>

        <!-- Form -->
        <form @submit.prevent="submitApplication" class="space-y-6">
          <!-- Scheme Selection -->
          <div v-if="!isEditing">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
              Select Scheme Type
            </label>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label class="relative">
                <input
                  v-model="formData.isCustom"
                  type="radio"
                  :value="false"
                  class="sr-only"
                />
                <div
                  class="border-2 rounded-lg p-4 cursor-pointer transition-colors"
                  :class="!formData.isCustom ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'"
                >
                  <div class="flex items-center space-x-3">
                    <Building class="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    <div>
                      <h4 class="font-medium text-gray-900 dark:text-gray-100">Existing Scheme</h4>
                      <p class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Apply for a welfare or insurance scheme</p>
                    </div>
                  </div>
                </div>
              </label>

              <label class="relative">
                <input
                  v-model="formData.isCustom"
                  type="radio"
                  :value="true"
                  class="sr-only"
                />
                <div
                  class="border-2 rounded-lg p-4 cursor-pointer transition-colors"
                  :class="formData.isCustom ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'"
                >
                  <div class="flex items-center space-x-3">
                    <Plus class="w-6 h-6 text-green-600 dark:text-green-400" />
                    <div>
                      <h4 class="font-medium text-gray-900 dark:text-gray-100">Custom Scheme</h4>
                      <p class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Add a scheme not in our database</p>
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          <!-- Existing Scheme Selection -->
          <div v-if="!formData.isCustom">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
              Select Scheme
            </label>
            <select
              v-model="formData.schemeReference"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400"
              required
            >
              <option value="">Choose a scheme...</option>
              <optgroup label="Welfare Schemes">
                <option
                  v-for="scheme in welfareSchemes"
                  :key="scheme.name"
                  :value="scheme.name"
                >
                  {{ scheme.scheme_name }}
                </option>
              </optgroup>
              <optgroup label="Insurance Schemes">
                <option
                  v-for="scheme in insuranceSchemes"
                  :key="scheme.name"
                  :value="scheme.name"
                >
                  {{ scheme.scheme_name }}
                </option>
              </optgroup>
            </select>
          </div>

          <!-- Custom Scheme Fields -->
          <div v-if="formData.isCustom" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
                Scheme Name *
              </label>
              <input
                v-model="formData.customSchemeName"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400"
                placeholder="Enter scheme name"
                required
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
                Scheme Type
              </label>
              <select
                v-model="formData.customSchemeType"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400"
              >
                <option value="Insurance Scheme">Insurance Scheme</option>
                <option value="Welfare Scheme">Welfare Scheme</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
                Coverage Amount
              </label>
              <input
                v-model.number="formData.customCoverageAmount"
                type="number"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400"
                placeholder="Enter coverage amount"
                min="0"
              />
            </div>
          </div>

          <!-- Application Date -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
              Application Date
            </label>
            <input
              v-model="formData.applicationDate"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400"
            />
          </div>

          <!-- Status (for editing) -->
          <div v-if="isEditing">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
              Status
            </label>
            <select
              v-model="formData.status"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400"
            >
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <!-- Approval Date (for editing when approved) -->
          <div v-if="isEditing && formData.status === 'approved'">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
              Approval Date
            </label>
            <input
              v-model="formData.approvalDate"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400"
            />
          </div>

          <!-- Rejection Reason (for editing when rejected) -->
          <div v-if="isEditing && formData.status === 'rejected'">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
              Rejection Reason
            </label>
            <textarea
              v-model="formData.rejectionReason"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400"
              placeholder="Enter reason for rejection"
            ></textarea>
          </div>

          <!-- Certificate URL (for editing when approved) -->
          <div v-if="isEditing && formData.status === 'approved'">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
              Certificate URL
            </label>
            <input
              v-model="formData.certificateUrl"
              type="url"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400"
              placeholder="Enter certificate download URL"
            />
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
              Description / Notes
            </label>
            <textarea
              v-model="formData.description"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400"
              placeholder="Add any additional notes or details about your application"
            ></textarea>
          </div>

          <!-- Documents -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">
              Required Documents
            </label>
            <div class="space-y-2">
              <div
                v-for="(document, index) in formData.documents"
                :key="index"
                class="flex items-center space-x-2"
              >
                <input
                  v-model="document.description"
                  type="text"
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400"
                  placeholder="Document name"
                />
                <input
                  v-model="document.url"
                  type="url"
                  class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400"
                  placeholder="Document URL (optional)"
                />
                <button
                  type="button"
                  @click="removeDocument(index)"
                  class="text-red-600 dark:text-red-400 hover:text-red-800 dark:text-red-200"
                >
                  <Trash2 class="w-4 h-4" />
                </button>
              </div>
              <button
                type="button"
                @click="addDocument"
                class="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:text-blue-200"
              >
                <Plus class="w-4 h-4" />
                <span>Add Document</span>
              </button>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-between pt-6 border-t">
            <!-- Delete button (only for editing) -->
            <div>
              <Button 
                v-if="isEditing" 
                @click="confirmDelete" 
                variant="outline" 
                class="text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 hover:bg-red-50 dark:bg-red-900/20"
                :loading="deleting"
              >
                <Trash2 class="w-4 h-4 mr-2" />
                Delete Application
              </Button>
            </div>

            <!-- Save/Cancel buttons -->
            <div class="flex space-x-3">
              <Button @click="closeModal" variant="outline">
                Cancel
              </Button>
              <Button type="submit" variant="solid" :loading="loading">
                {{ isEditing ? 'Update Application' : 'Submit Application' }}
              </Button>
            </div>
          </div>
        </form>

        <!-- Delete Confirmation Modal -->
        <div v-if="showDeleteConfirm" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-60" @click="cancelDelete">
          <div class="relative top-1/2 transform -translate-y-1/2 mx-auto p-5 border w-96 shadow dark:shadow-gray-900/20-lg rounded-md bg-white dark:bg-gray-800 dark:bg-gray-200" @click.stop>
            <div class="mt-3 text-center">
              <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30">
                <AlertTriangle class="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mt-4">Delete Application</h3>
              <div class="mt-2 px-7 py-3">
                <p class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
                  Are you sure you want to delete this application? This action cannot be undone.
                </p>
              </div>
              <div class="flex justify-center space-x-3 mt-4">
                <Button @click="cancelDelete" variant="outline">
                  Cancel
                </Button>
                <Button @click="deleteApplication" variant="solid" class="bg-red-600 hover:bg-red-700" :loading="deleting">
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAdvancedTheme } from "@/composables/useAdvancedTheme"
import { useSupport } from "@/composables/useSupport"
import { useHousehold } from "@/composables/useHousehold"
import { Button } from "frappe-ui"
import { AlertTriangle, Building, Plus, Trash2, X } from "lucide-vue-next"
import { computed, onMounted, ref, watch } from "vue"
import { DOCUMENT_TYPES } from "../../types/support"

// Props
const props = defineProps({
	application: {
		type: Object,
		default: null,
	},
	schemes: {
		type: Array,
		default: () => [],
	},
})

// Emits
const emit = defineEmits(["close", "save"])

// Composables
const support = useSupport()
const household = useHousehold()

// Reactive data
const loading = ref(false)
const deleting = ref(false)
const showDeleteConfirm = ref(false)
const formData = ref({
	isCustom: false,
	schemeReference: "",
	schemeType: "Welfare Scheme",
	customSchemeName: "",
	customSchemeType: "Welfare Scheme",
	customCoverageAmount: null,
	description: "",
	documents: [],
	applicationDate: "",
	status: "pending",
	approvalDate: "",
	rejectionReason: "",
	certificateUrl: "",
})

// Computed properties
const isEditing = computed(() => !!props.application)

const welfareSchemes = computed(() =>
	props.schemes.filter((scheme) => scheme.scheme_source === "welfare"),
)

const insuranceSchemes = computed(() =>
	props.schemes.filter((scheme) => scheme.scheme_source === "insurance"),
)

// Methods
function closeModal() {
	emit("close")
}

function addDocument() {
	formData.value.documents.push({ description: "", url: "" })
}

function removeDocument(index) {
	formData.value.documents.splice(index, 1)
}

async function submitApplication() {
	try {
		loading.value = true

		const applicationData = {
			custom_scheme: formData.value.isCustom ? 1 : 0,
			description: formData.value.description,
			documents_submitted: formData.value.documents
				.filter((doc) => doc.description.trim())
				.map((doc) => ({ ...doc, url: doc.url || "" })),
			application_date:
				formData.value.applicationDate ||
				new Date().toISOString().split("T")[0],
		}

		if (formData.value.isCustom) {
			applicationData.custom_scheme_name = formData.value.customSchemeName
			applicationData.custom_scheme_type = formData.value.customSchemeType
			applicationData.custom_coverage_amount =
				formData.value.customCoverageAmount
		} else {
			applicationData.scheme_reference = formData.value.schemeReference
			// Determine scheme type based on selected scheme
			const selectedScheme = props.schemes.find(
				(s) => s.name === formData.value.schemeReference,
			)
			applicationData.scheme_type =
				selectedScheme?.scheme_source === "welfare"
					? "Welfare Scheme"
					: "Insurance Scheme"
		}

		// Add editing-specific fields
		if (isEditing.value) {
			applicationData.status = formData.value.status
			if (formData.value.approvalDate) {
				applicationData.approval_date = formData.value.approvalDate
			}
			if (formData.value.rejectionReason) {
				applicationData.rejection_reason = formData.value.rejectionReason
			}
			if (formData.value.certificateUrl) {
				applicationData.certificate_url = formData.value.certificateUrl
			}
		}

		let response
		if (isEditing.value) {
			response = await support.updateApplication(
				props.application.name,
				applicationData,
			)
		} else {
			response = await support.createApplication(applicationData)
		}

		emit("save", response)
		closeModal()
	} catch (error) {
		console.error("Error submitting application:", error)
		// Handle error (show toast, etc.)
	} finally {
		loading.value = false
	}
}

function confirmDelete() {
	showDeleteConfirm.value = true
}

function cancelDelete() {
	showDeleteConfirm.value = false
}

async function deleteApplication() {
	try {
		deleting.value = true
		await support.deleteApplication(props.application.name)
		emit("save", null)
		closeModal()
	} catch (error) {
		console.error("Error deleting application:", error)
		// Handle error (show toast, etc.)
	} finally {
		deleting.value = false
	}
}

// Initialize form data
function initializeForm() {
	if (props.application) {
		formData.value = {
			isCustom: !!props.application.custom_scheme,
			schemeReference: props.application.scheme_reference || "",
			schemeType: props.application.scheme_type || "Welfare Scheme",
			customSchemeName: props.application.custom_scheme_name || "",
			customSchemeType:
				props.application.custom_scheme_type || "Welfare Scheme",
			customCoverageAmount: props.application.custom_coverage_amount || null,
			description: props.application.description || "",
			documents: props.application.documents_submitted || [],
			applicationDate: props.application.application_date || "",
			status: props.application.status || "pending",
			approvalDate: props.application.approval_date || "",
			rejectionReason: props.application.rejection_reason || "",
			certificateUrl: props.application.certificate_url || "",
		}
	} else {
		formData.value = {
			isCustom: false,
			schemeReference: "",
			schemeType: "Welfare Scheme",
			customSchemeName: "",
			customSchemeType: "Welfare Scheme",
			customCoverageAmount: null,
			description: "",
			documents: [],
			applicationDate: new Date().toISOString().split("T")[0],
			status: "pending",
			approvalDate: "",
			rejectionReason: "",
			certificateUrl: "",
		}
	}
}

// Lifecycle
onMounted(() => {
	initializeForm()
})

// Watch for prop changes
watch(
	() => props.application,
	() => {
		initializeForm()
	},
	{ immediate: true },
)

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