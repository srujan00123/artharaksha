<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <div class="flex items-center justify-center mb-6">
          <div class="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
            <Heart class="w-6 h-6 text-white dark:text-black" />
          </div>
        </div>
        <h2 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Welcome to Artha Raksha</h2>
        <p class="text-gray-600 dark:text-gray-400 dark:text-gray-500">Your Healthcare Financial Companion</p>
      </div>

      <!-- Login Form -->
      <Card class="mt-8">
        <form class="space-y-6" @submit.prevent="submit">
          <div>
            <Input required name="email" type="text" placeholder="Enter your email or username" label="Email / Username"
              class="w-full" autocomplete="username" />
          </div>
          <div>
            <Input required name="password" type="password" placeholder="Enter your password" label="Password"
              class="w-full" autocomplete="current-password" />
          </div>

          <div v-if="session.login.error"
            class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
            <p class=" dark:text-red-300 text-sm" :class="getFinancialStatusClass('expense', '700')">{{
              session.login.error }}</p>
          </div>

          <Button :loading="session.login.loading" variant="solid" class="w-full">
            Sign In
          </Button>
        </form>
      </Card>

      <!-- Registration Link -->
      <div class="text-center text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-4">
        <span>Don't have an account?</span>
        <button @click="showRegister = true" class=" dark:text-blue-400 hover:underline ml-1"
          :class="getFinancialStatusClass('medical', '600')">Register</button>
      </div>

      <!-- Registration Modal -->
      <div v-if="showRegister" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 w-full max-w-md">
          <h3 class="text-lg font-bold mb-4">Create Account</h3>
          <form @submit.prevent="register">
            <div class="mb-4">
              <Input v-model="registerEmail" required name="registerEmail" type="text" placeholder="Email or Username"
                label="Email / Username" class="w-full" autocomplete="username" />
            </div>
            <div class="mb-4">
              <Input v-model="registerPassword" required name="registerPassword" type="password" placeholder="Password"
                label="Password" class="w-full" autocomplete="new-password" />
            </div>
            <div v-if="registerError"
              class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-2">
              <p class=" dark:text-red-300 text-sm" :class="getFinancialStatusClass('expense', '700')">{{ registerError
              }}</p>
            </div>
            <Button :loading="registerLoading" type="submit" variant="solid" class="w-full mb-2">Register</Button>
            <Button type="button" variant="outline" class="w-full" @click="showRegister = false">Cancel</Button>
          </form>
        </div>
      </div>

      <!-- Footer -->
      <div class="text-center text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
        <p>Secure healthcare expense management platform</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAdvancedTheme } from "@/composables/useAdvancedTheme"
import { session } from "@/data/session"
import { call } from "frappe-ui"
import { Heart } from "lucide-vue-next"
import { ref } from "vue"

const showRegister = ref(false)
const registerEmail = ref("")
const registerPassword = ref("")
const registerError = ref("")
const registerLoading = ref(false)

function submit(e) {
	const formData = new FormData(e.target)
	session.login.submit({
		email: formData.get("email"),
		password: formData.get("password"),
	})
}

async function register() {
	registerError.value = ""
	registerLoading.value = true
	try {
		const result = await call("artha.api.auth.register_account", {
			email: registerEmail.value,
			password: registerPassword.value,
		})
		// On success, log the user in
		session.login.submit({
			email: registerEmail.value,
			password: registerPassword.value,
		})
		showRegister.value = false
	} catch (err) {
		registerError.value = err.message || "Registration failed."
	} finally {
		registerLoading.value = false
	}
}

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
</script>
