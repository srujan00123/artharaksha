<template>
    <div class="p-3 sm:p-4 lg:p-6 space-y-4 lg:space-y-6">
        <!-- Header Section -->
        <div class="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-4 sm:p-6 lg:p-8 text-white">
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">
                        Profile Settings
                    </h1>
                    <p class="text-blue-100 text-sm sm:text-base lg:text-lg mb-4 max-w-3xl leading-relaxed">
                        Manage your account information, preferences, and security settings
                    </p>
                </div>
                <div class="hidden sm:block">
                    <div class="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                        <User class="w-8 h-8 text-white" />
                    </div>
                </div>
            </div>
        </div>

            <!-- Loading State -->
            <div v-if="userStore.loading" class="flex items-center justify-center py-12">
                <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span class="ml-3 text-gray-600 dark:text-gray-400">Loading profile...</span>
            </div>

            <!-- Error State -->
        <div v-else-if="userStore.error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div class="flex">
                        <AlertCircle class="h-5 w-5 text-red-400" />
                        <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Error loading profile</h3>
                    <p class="mt-1 text-sm text-red-700 dark:text-red-300">{{ userStore.error }}</p>
                            <div class="mt-3">
                                <Button variant="outline" size="sm" @click="loadProfile">
                                    <RefreshCw class="w-4 h-4 mr-2" />
                                    Retry
                                </Button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Profile Content -->
        <div v-else class="space-y-4 lg:space-y-6">
                <!-- User Info Card -->
            <Card class="p-4 sm:p-5 lg:p-6 bg-white dark:bg-slate-800">
                <div class="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
                    <div class="relative mx-auto sm:mx-0">
                        <div v-if="userStore.currentUser?.user_image" class="w-16 sm:w-20 h-16 sm:h-20 rounded-full overflow-hidden">
                                    <img :src="userStore.currentUser.user_image" :alt="userStore.userDisplayName" class="w-full h-full object-cover" />
                                </div>
                        <div v-else class="w-16 sm:w-20 h-16 sm:h-20 bg-blue-500 rounded-full flex items-center justify-center">
                            <span class="text-lg sm:text-2xl font-bold text-white">{{ userStore.userInitials }}</span>
                                </div>
                                <button 
                                    @click="$refs.imageInput.click()"
                            class="absolute bottom-0 right-0 bg-white dark:bg-slate-800 rounded-full p-1 sm:p-1.5 shadow-md border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-slate-700"
                                >
                            <Camera class="w-3 h-3 sm:w-4 sm:h-4 text-gray-600 dark:text-gray-400" />
                                </button>
                                <input 
                                    ref="imageInput" 
                                    type="file" 
                                    accept="image/*" 
                                    class="hidden" 
                                    @change="handleImageUpload"
                                />
                            </div>
                    <div class="flex-1 text-center sm:text-left">
                        <h3 class="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">{{ userStore.userDisplayName }}</h3>
                        <p class="text-gray-600 dark:text-gray-400 text-sm sm:text-base">{{ userStore.currentUser?.email }}</p>
                        <div class="mt-2 flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm text-gray-500 dark:text-gray-400 space-y-1 sm:space-y-0 sm:space-x-4">
                            <div class="flex items-center justify-center sm:justify-start">
                                <User class="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                    <span>{{ userStore.currentUser?.user_type || 'User' }}</span>
                                </div>
                            <div v-if="userStore.currentUser?.last_active" class="flex items-center justify-center sm:justify-start">
                                <Clock class="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                                <span>Last active: {{ formatDate(userStore.currentUser.last_active) }}</span>
                            </div>
                        </div>
                    </div>
                    <div class="w-full sm:w-auto">
                        <Button variant="outline" size="sm" @click="refreshProfile" class="w-full sm:w-auto">
                                <RefreshCw class="w-4 h-4 mr-2" />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </Card>

                <!-- Account Information -->
            <Card class="p-4 sm:p-5 lg:p-6 bg-white dark:bg-slate-800">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 lg:mb-6">Account Information</h3>
                        <form @submit.prevent="updateProfile">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
                                <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">First Name</label>
                                    <Input 
                                        v-model="profileForm.first_name" 
                                        placeholder="Enter your first name" 
                                        :disabled="updating"
                                    />
                                </div>
                                <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Name</label>
                                    <Input 
                                        v-model="profileForm.last_name" 
                                        placeholder="Enter your last name" 
                                        :disabled="updating"
                                    />
                                </div>
                                <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                                    <Input 
                                        v-model="profileForm.full_name" 
                                        placeholder="Enter your full name" 
                                        :disabled="updating"
                                    />
                                </div>
                                <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                                    <Input :value="userStore.currentUser?.email" disabled />
                                </div>
                                <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                                    <Input 
                                        v-model="profileForm.phone" 
                                        placeholder="Enter your phone number" 
                                        :disabled="updating"
                                    />
                                </div>
                                <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Mobile</label>
                                    <Input 
                                        v-model="profileForm.mobile_no" 
                                        placeholder="Enter your mobile number" 
                                        :disabled="updating"
                                    />
                                </div>
                        <div class="sm:col-span-2">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Location</label>
                                    <Input 
                                        v-model="profileForm.location" 
                                        placeholder="Enter your location" 
                                        :disabled="updating"
                                    />
                                </div>
                        <div class="sm:col-span-2">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Bio</label>
                                    <textarea 
                                        v-model="profileForm.bio"
                                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                                        rows="3"
                                        placeholder="Tell us about yourself"
                                        :disabled="updating"
                                    ></textarea>
                                </div>
                            </div>
                    <div class="mt-4 lg:mt-6 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                                <Button 
                                    type="submit" 
                                    variant="solid" 
                                    :disabled="updating || !hasChanges"
                                    :loading="updating"
                            class="w-full sm:w-auto"
                                >
                                    <Save class="w-4 h-4 mr-2" />
                                    {{ updating ? 'Saving...' : 'Save Changes' }}
                                </Button>
                                <Button 
                                    type="button" 
                                    variant="outline" 
                                    @click="resetForm"
                                    :disabled="updating"
                            class="w-full sm:w-auto"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                </Card>

                <!-- Household Profile Management -->
                <Card class="p-4 sm:p-5 lg:p-6 bg-white dark:bg-slate-800">
                    <div class="flex items-center justify-between mb-4 lg:mb-6">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100">Household Profile</h3>
                        <Button 
                            v-if="!householdProfile && !loadingHouseholdProfile" 
                            variant="solid" 
                            size="sm" 
                            @click="showHouseholdProfileCreator = true"
                        >
                            <User class="w-4 h-4 mr-2" />
                            Create Profile
                        </Button>
                    </div>

                    <!-- Loading State -->
                    <div v-if="loadingHouseholdProfile" class="flex items-center justify-center py-8">
                        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span class="ml-3 text-gray-600 dark:text-gray-400">Loading household profile...</span>
                    </div>

                    <!-- No Profile State -->
                    <div v-else-if="!householdProfile" class="text-center py-8">
                        <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                            <User class="w-8 h-8 text-gray-400" />
                        </div>
                        <h4 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Household Profile</h4>
                        <p class="text-gray-600 dark:text-gray-400 mb-4">
                            Create a household profile to manage your family's income and expenses effectively.
                        </p>
                        <Button variant="solid" @click="showHouseholdProfileCreator = true">
                            <User class="w-4 h-4 mr-2" />
                            Create Household Profile
                        </Button>
                    </div>

                    <!-- Profile Exists -->
                    <div v-else class="space-y-4">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                                <h5 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Address</h5>
                                <p class="text-gray-600 dark:text-gray-400">{{ householdProfile.address || 'Not specified' }}</p>
                            </div>
                            <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                                <h5 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">District</h5>
                                <p class="text-gray-600 dark:text-gray-400">{{ householdProfile.district || 'Not specified' }}</p>
                            </div>
                            <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                                <h5 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Family Members</h5>
                                <p class="text-gray-600 dark:text-gray-400">{{ householdProfile.family_member_count || 0 }}</p>
                            </div>
                            <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                                <h5 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Annual Income</h5>
                                <p class="text-gray-600 dark:text-gray-400">
                                    {{ householdProfile.annual_income ? formatCurrency(householdProfile.annual_income) : 'Not specified' }}
                                </p>
                            </div>
                        </div>

                        <!-- Status Indicators -->
                        <div class="flex flex-wrap gap-2 pt-2">
                            <span v-if="householdProfile.vulnerability_status" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                Vulnerable Status
                            </span>
                            <span v-if="householdProfile.ration_card_holder" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                Ration Card Holder
                            </span>
                            <span v-if="householdProfile.che_10" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                CHE 10%
                            </span>
                            <span v-if="householdProfile.che_25" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                CHE 25%
                            </span>
                        </div>

                        <!-- Health Conditions -->
                        <div v-if="householdProfile.health_conditions && householdProfile.health_conditions.length > 0" class="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h5 class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Health Conditions</h5>
                            <div class="flex flex-wrap gap-2">
                                <span 
                                    v-for="condition in householdProfile.health_conditions" 
                                    :key="condition.condition"
                                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                                >
                                    {{ condition.condition }}
                                </span>
                            </div>
                        </div>

                        <!-- Action Buttons -->
                        <div class="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-4">
                            <Button variant="outline" size="sm" @click="editHouseholdProfile" class="w-full sm:w-auto">
                                <User class="w-4 h-4 mr-2" />
                                Edit Profile
                            </Button>
                            <Button variant="outline" size="sm" @click="refreshHouseholdProfile" class="w-full sm:w-auto">
                                <RefreshCw class="w-4 h-4 mr-2" />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </Card>

                <!-- Preferences -->
            <Card class="p-4 sm:p-5 lg:p-6 bg-white dark:bg-slate-800">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 lg:mb-6">Preferences</h3>
                <div class="space-y-4 lg:space-y-6">
                            <!-- Theme Selection -->
                            <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Theme</label>
                                <select 
                                    v-model="preferencesForm.theme"
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                                    @change="updatePreferences"
                                >
                                    <option value="Light">Light</option>
                                    <option value="Dark">Dark</option>
                                    <option value="Automatic">Automatic</option>
                                </select>
                            </div>

                            <!-- Language Selection -->
                            <div>
                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Language</label>
                                <select 
                                    v-model="preferencesForm.language"
                            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
                                    @change="updatePreferences"
                                >
                                    <option value="en">English</option>
                                    <option value="hi">Hindi</option>
                                    <option value="bn">Bengali</option>
                                    <option value="te">Telugu</option>
                                    <option value="ta">Tamil</option>
                                </select>
                            </div>

                            <!-- Notification Preferences -->
                            <div class="space-y-4">
                                <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100">Notifications</h4>
                                <div class="flex items-center justify-between">
                                    <div>
                                        <h5 class="text-sm font-medium text-gray-900 dark:text-gray-100">Email Notifications</h5>
                                        <p class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Receive email updates about your health expenses</p>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        v-model="preferencesForm.emailNotifications"
                                        class="toggle toggle-blue" 
                                        @change="updatePreferences"
                                    />
                                </div>
                                <div class="flex items-center justify-between">
                                    <div>
                                        <h5 class="text-sm font-medium text-gray-900 dark:text-gray-100">CHE Alerts</h5>
                                        <p class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Get notified when approaching catastrophic health expenditure</p>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        v-model="preferencesForm.cheAlerts"
                                        class="toggle toggle-blue" 
                                        @change="updatePreferences"
                                    />
                                </div>
                                <div class="flex items-center justify-between">
                                    <div>
                                        <h5 class="text-sm font-medium text-gray-900 dark:text-gray-100">Monthly Reports</h5>
                                        <p class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Automatically generate monthly expense reports</p>
                                    </div>
                                    <input 
                                        type="checkbox" 
                                        v-model="preferencesForm.monthlyReports"
                                        class="toggle toggle-blue" 
                                        @change="updatePreferences"
                                    />
                            </div>
                        </div>
                    </div>
                </Card>

                <!-- Admin Section (only for System Manager/Administrator) -->
            <Card v-if="hasAdminRole" class="p-4 sm:p-5 lg:p-6 bg-white dark:bg-slate-800">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 lg:mb-6">Administration</h3>
                        <div class="space-y-4">
                            <router-link 
                                to="/admin/notifications" 
                                class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 dark:bg-gray-100 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 dark:bg-gray-800 dark:bg-gray-200 transition-colors"
                            >
                                <div class="flex items-center space-x-3">
                                    <div class="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                                        <Bell class="w-5 h-5 text-white dark:text-black" />
                                    </div>
                                    <div>
                                        <h4 class="text-sm font-medium text-gray-900 dark:text-gray-100">Admin Notification Center</h4>
                                        <p class="text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">Manage role-based and broadcast notifications</p>
                                    </div>
                                </div>
                                <ChevronRight class="w-5 h-5 text-gray-400 dark:text-gray-500" />
                            </router-link>
                    </div>
                </Card>

                <!-- Password Change -->
            <Card class="p-4 sm:p-5 lg:p-6 bg-white dark:bg-slate-800">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 lg:mb-6">Change Password</h3>
                        <form @submit.prevent="changePassword">
                            <div class="space-y-4">
                                <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
                                    <Input 
                                        type="password" 
                                        v-model="passwordForm.oldPassword" 
                                        placeholder="Enter current password"
                                        :disabled="changingPassword"
                                    />
                                </div>
                                <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                                    <Input 
                                        type="password" 
                                        v-model="passwordForm.newPassword" 
                                        placeholder="Enter new password"
                                        :disabled="changingPassword"
                                    />
                                </div>
                                <div>
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm New Password</label>
                                    <Input 
                                        type="password" 
                                        v-model="passwordForm.confirmPassword" 
                                        placeholder="Confirm new password"
                                        :disabled="changingPassword"
                                    />
                                </div>
                            </div>
                            <div class="mt-6">
                                <Button 
                                    type="submit" 
                                    variant="solid" 
                                    :disabled="changingPassword || !canChangePassword"
                                    :loading="changingPassword"
                            class="w-full sm:w-auto"
                                >
                                    <Lock class="w-4 h-4 mr-2" />
                                    {{ changingPassword ? 'Changing...' : 'Change Password' }}
                                </Button>
                            </div>
                        </form>
                </Card>
        </div>
    </div>

    <!-- Household Profile Creator Modal -->
    <HouseholdProfileCreator
        v-if="showHouseholdProfileCreator"
        :is-open="showHouseholdProfileCreator"
        :existing-profile="householdProfile"
        @close="closeHouseholdProfileCreator"
        @success="handleProfileCreated"
    />
</template>

<script setup>
import { useAdvancedTheme } from "@/composables/useAdvancedTheme"
import { useUserStore } from "@/stores/user"
import { toast } from "@/utils/toast"
import { createResource } from "frappe-ui"
import {
	AlertCircle,
	Bell,
	Camera,
	ChevronRight,
	Clock,
	Lock,
	RefreshCw,
	Save,
	User,
} from "lucide-vue-next"
import { computed, onMounted, ref, watch } from "vue"
import HouseholdProfileCreator from "../components/profile/HouseholdProfileCreator.vue"
// Import household profile constants for validation
import { HOUSEHOLD_PROFILE_CONSTANTS } from "../types/household"
// Import household profile utilities
import {
	convertFromBackend,
	formatCurrency,
	getStatusSummary,
} from "../utils/household-profile"

// Store
const userStore = useUserStore()

// Add household profile state
const householdProfile = ref(null)
const loadingHouseholdProfile = ref(false)
const showHouseholdProfileCreator = ref(false)

// Form states
const profileForm = ref({
	first_name: "",
	last_name: "",
	full_name: "",
	phone: "",
	mobile_no: "",
	location: "",
	bio: "",
})

const preferencesForm = ref({
	theme: "Light",
	language: "en",
	emailNotifications: true,
	cheAlerts: true,
	monthlyReports: false,
})

const passwordForm = ref({
	oldPassword: "",
	newPassword: "",
	confirmPassword: "",
})

// Loading states
const updating = ref(false)
const changingPassword = ref(false)

// Admin role checking
const hasAdminRole = ref(false)

// Resource to check admin role
const adminRoleResource = createResource({
	url: "artha.api.auth.has_admin_role",
	auto: true,
	onSuccess(data) {
		hasAdminRole.value = data
	},
	onError(error) {
		console.error("Failed to check admin role:", error)
		hasAdminRole.value = false
	},
})

// Computed properties
const hasChanges = computed(() => {
	if (!userStore.currentUser) return false

	return Object.keys(profileForm.value).some((key) => {
		return profileForm.value[key] !== (userStore.currentUser[key] || "")
	})
})

const canChangePassword = computed(() => {
	return (
		passwordForm.value.oldPassword &&
		passwordForm.value.newPassword &&
		passwordForm.value.confirmPassword &&
		passwordForm.value.newPassword === passwordForm.value.confirmPassword &&
		passwordForm.value.newPassword.length >= 6
	)
})

// Methods
const loadProfile = async () => {
	try {
		await userStore.loadUserProfile(true)
		await userStore.loadUserPreferences()
		populateForm()
	} catch (error) {
		console.error("Failed to load profile:", error)
	}
}

const refreshProfile = async () => {
	await loadProfile()
	toast.success("Profile refreshed successfully")
}

const populateForm = () => {
	if (userStore.currentUser) {
		profileForm.value = {
			first_name: userStore.currentUser.first_name || "",
			last_name: userStore.currentUser.last_name || "",
			full_name: userStore.currentUser.full_name || "",
			phone: userStore.currentUser.phone || "",
			mobile_no: userStore.currentUser.mobile_no || "",
			location: userStore.currentUser.location || "",
			bio: userStore.currentUser.bio || "",
		}
	}

	if (userStore.preferences) {
		preferencesForm.value = { ...userStore.preferences }
	}
}

const resetForm = () => {
	populateForm()
}

const updateProfile = async () => {
	try {
		updating.value = true

		// Filter out empty values
		const updates = {}
		Object.keys(profileForm.value).forEach((key) => {
			if (profileForm.value[key] !== (userStore.currentUser[key] || "")) {
				updates[key] = profileForm.value[key]
			}
		})

		if (Object.keys(updates).length === 0) {
			toast.info("No changes to save")
			return
		}

		await userStore.updateUserProfile(updates)

		// Force refresh the profile data to ensure UI is updated
		await userStore.loadUserProfile(true)
		populateForm()

		toast.success("Profile updated successfully")
	} catch (error) {
		console.error("Failed to update profile:", error)
		toast.error("Failed to update profile: " + error.message)
	} finally {
		updating.value = false
	}
}

const updatePreferences = async () => {
	try {
		await userStore.updateUserPreferences(preferencesForm.value)

		// Force refresh preferences to ensure UI is updated
		await userStore.loadUserPreferences(true)
		populateForm()

		toast.success("Preferences updated successfully")
	} catch (error) {
		console.error("Failed to update preferences:", error)
		toast.error("Failed to update preferences: " + error.message)
	}
}

const changePassword = async () => {
	try {
		changingPassword.value = true

		if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
			toast.error("New passwords do not match")
			return
		}

		if (passwordForm.value.newPassword.length < 6) {
			toast.error("Password must be at least 6 characters long")
			return
		}

		await userStore.changePassword(
			passwordForm.value.oldPassword,
			passwordForm.value.newPassword,
		)

		// Reset form
		passwordForm.value = {
			oldPassword: "",
			newPassword: "",
			confirmPassword: "",
		}

		toast.success("Password changed successfully")
	} catch (error) {
		console.error("Failed to change password:", error)
		toast.error("Failed to change password: " + error.message)
	} finally {
		changingPassword.value = false
	}
}

const handleImageUpload = async (event) => {
	const file = event.target.files[0]
	if (!file) return

	// Validate file
	if (!file.type.startsWith("image/")) {
		toast.error("Please select an image file")
		return
	}

	if (file.size > 5 * 1024 * 1024) {
		// 5MB
		toast.error("Image size must be less than 5MB")
		return
	}

	try {
		await userStore.uploadUserImage(file)

		// Force refresh the profile data to show updated image
		await userStore.loadUserProfile(true)
		populateForm()

		toast.success("Profile image updated successfully")
	} catch (error) {
		console.error("Failed to upload image:", error)
		toast.error("Failed to upload image: " + error.message)
	}
}

const formatDate = (dateString) => {
	if (!dateString) return ""
	return new Date(dateString).toLocaleDateString("en-US", {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	})
}

// Household Profile Methods
const loadHouseholdProfile = async () => {
	try {
		loadingHouseholdProfile.value = true

		// Use the correct profile API endpoint
		const response = await fetch(
			"/api/method/artha.api.profile.get_household_profile",
		)
		const data = await response.json()

		if (data.message && Object.keys(data.message).length > 0) {
			householdProfile.value = data.message
		} else {
			householdProfile.value = null
		}
	} catch (error) {
		console.error("Failed to load household profile:", error)
		householdProfile.value = null
	} finally {
		loadingHouseholdProfile.value = false
	}
}

const refreshHouseholdProfile = async () => {
	await loadHouseholdProfile()
	toast.success("Household profile refreshed successfully")
}

const editHouseholdProfile = () => {
	// Open the profile creator in edit mode with existing data
	showHouseholdProfileCreator.value = true
}

const closeHouseholdProfileCreator = () => {
	showHouseholdProfileCreator.value = false
}

const handleProfileCreated = async (profileData) => {
	showHouseholdProfileCreator.value = false
	// Refresh the household profile data
	await loadHouseholdProfile()
	const message = householdProfile.value ? "Household profile updated successfully" : "Household profile created successfully"
	toast.success(message)
}

// Watch for user data changes
watch(() => userStore.currentUser, populateForm, { deep: true })
watch(
	() => userStore.preferences,
	() => {
		if (userStore.preferences) {
			preferencesForm.value = { ...userStore.preferences }
		}
	},
	{ deep: true },
)

// Initialize
onMounted(async () => {
	await userStore.initialize()
	populateForm()
	await loadHouseholdProfile()
})

// Advanced theme management
const { currentTheme, isDark, setTheme, themes } = useAdvancedTheme()
</script>