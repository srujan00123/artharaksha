<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
    <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
      <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" @click="closeModal"></div>
      
      <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
      
      <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
          <div class="sm:flex sm:items-start">
            <div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 sm:mx-0 sm:h-10 sm:w-10">
              <Home class="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100" id="modal-title">
                Create Household Profile
              </h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Set up your household profile to start managing income and expenses.
                </p>
              </div>
              
              <!-- Form -->
              <div class="mt-4 space-y-4">
                <div>
                  <label for="address" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Address <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="formData.address"
                    type="text"
                    id="address"
                    required
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter your address"
                  />
                </div>
                
                <div>
                  <label for="district" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    District <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model="formData.district"
                    type="text"
                    id="district"
                    required
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter your district"
                  />
                </div>
                
                <div>
                  <label for="family_count" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Family Member Count <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model.number="formData.family_member_count"
                    type="number"
                    id="family_count"
                    :min="HOUSEHOLD_PROFILE_CONSTANTS.MIN_FAMILY_MEMBERS"
                    :max="HOUSEHOLD_PROFILE_CONSTANTS.MAX_FAMILY_MEMBERS"
                    required
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Number of family members"
                  />
                </div>
                
                <div>
                  <label for="annual_income" class="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Annual Income (₹) <span class="text-red-500">*</span>
                  </label>
                  <input
                    v-model.number="formData.annual_income"
                    type="number"
                    id="annual_income"
                    :min="HOUSEHOLD_PROFILE_CONSTANTS.MIN_ANNUAL_INCOME"
                    :max="HOUSEHOLD_PROFILE_CONSTANTS.MAX_ANNUAL_INCOME"
                    required
                    class="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Annual household income"
                  />
                </div>
                
                <!-- Optional fields -->
                <div class="flex items-center space-x-4">
                  <label class="flex items-center">
                    <input
                      v-model="formData.ration_card_holder"
                      type="checkbox"
                      class="rounded border-gray-300 dark:border-gray-600 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 dark:bg-gray-700"
                    />
                    <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Ration Card Holder</span>
                  </label>
                  
                  <label class="flex items-center">
                    <input
                      v-model="formData.vulnerability_status"
                      type="checkbox"
                      class="rounded border-gray-300 dark:border-gray-600 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 dark:bg-gray-700"
                    />
                    <span class="ml-2 text-sm text-gray-700 dark:text-gray-300">Vulnerable Status</span>
                  </label>
                </div>
                
                <div v-if="error" class="text-red-600 dark:text-red-400 text-sm">
                  {{ error }}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <button
            @click="createProfile"
            :disabled="loading || !isFormValid"
            type="button"
            class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="loading" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
            {{ loading ? 'Creating...' : 'Create Profile' }}
          </button>
          <button
            @click="closeModal"
            :disabled="loading"
            type="button"
            class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Home } from "lucide-vue-next"
import { computed, ref } from "vue"
import type { HouseholdProfileFormData } from "../../types/household"
import { HOUSEHOLD_PROFILE_CONSTANTS } from "../../types/household"

interface Props {
	isOpen: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
	close: []
	success: [profile: HouseholdProfileFormData]
}>()

// Form state
const loading = ref(false)
const error = ref("")

const formData = ref<HouseholdProfileFormData>({
	address: "",
	district: "",
	family_member_count: 1,
	annual_income: 0,
	ration_card_holder: false,
	vulnerability_status: false,
})

// Computed
const isFormValid = computed(() => {
	return (
		formData.value.address.trim() &&
		formData.value.district.trim() &&
		formData.value.family_member_count >=
			HOUSEHOLD_PROFILE_CONSTANTS.MIN_FAMILY_MEMBERS &&
		formData.value.family_member_count <=
			HOUSEHOLD_PROFILE_CONSTANTS.MAX_FAMILY_MEMBERS &&
		formData.value.annual_income >=
			HOUSEHOLD_PROFILE_CONSTANTS.MIN_ANNUAL_INCOME &&
		formData.value.annual_income <=
			HOUSEHOLD_PROFILE_CONSTANTS.MAX_ANNUAL_INCOME
	)
})

// Methods
const createProfile = async () => {
	if (!isFormValid.value) return

	loading.value = true
	error.value = ""

	try {
		const response = await fetch(
			"/api/method/artha.api.profile.create_household_profile",
			{
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(formData.value),
			},
		)

		const result = await response.json()

		if (result.message?.status === "success") {
			emit("success", formData.value)
			closeModal()
		} else {
			error.value = result.message || "Failed to create household profile"
		}
	} catch (err: any) {
		error.value = err.message || "Failed to create household profile"
	} finally {
		loading.value = false
	}
}

const closeModal = () => {
	// Reset form
	formData.value = {
		address: "",
		district: "",
		family_member_count: 1,
		annual_income: 0,
		ration_card_holder: false,
		vulnerability_status: false,
	}
	error.value = ""
	emit("close")
}
</script> 