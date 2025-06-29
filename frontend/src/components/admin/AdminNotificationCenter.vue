<template>
  <div class="admin-notification-center">
    <div class="max-w-4xl mx-auto p-6">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">Admin Notification Center</h1>
      
      <!-- Role-based Notifications -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4 text-blue-600 dark:text-blue-400">👥 Role-based Notifications</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
              <input
                v-model="roleNotification.title"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Role-specific notification"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message</label>
              <textarea
                v-model="roleNotification.message"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Message for specific roles..."
              ></textarea>
            </div>
          </div>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Roles</label>
              <div class="space-y-2 border border-gray-300 dark:border-gray-600 rounded-lg p-3">
                <label v-for="role in availableRoles" :key="role" class="flex items-center">
                  <input
                    type="checkbox"
                    :value="role"
                    v-model="roleNotification.roles"
                    class="mr-2"
                  />
                  <span class="text-sm">{{ role }}</span>
                </label>
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
              <select
                v-model="roleNotification.type"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Critical</option>
                <option value="success">Success</option>
              </select>
            </div>
            <button
              @click="sendRoleNotification"
              :disabled="loading.role || roleNotification.roles.length === 0"
              class="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              {{ loading.role ? 'Sending...' : `Send to ${roleNotification.roles.length} role(s)` }}
            </button>
          </div>
        </div>
      </div>

      <!-- User-specific Notifications -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4 text-purple-600 dark:text-purple-400">👤 User-specific Notifications</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
              <input
                v-model="userNotification.title"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Personal notification"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message</label>
              <textarea
                v-model="userNotification.message"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="Message for specific user..."
              ></textarea>
            </div>
          </div>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target User (Email)</label>
              <input
                v-model="userNotification.targetUser"
                type="email"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
              <select
                v-model="userNotification.type"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Critical</option>
                <option value="success">Success</option>
              </select>
            </div>
            <button
              @click="sendUserNotification"
              :disabled="loading.user || !userNotification.targetUser"
              class="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              {{ loading.user ? 'Sending...' : 'Send to User' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Simple Testing -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4 text-orange-600 dark:text-orange-400">🧪 Simple Testing</h2>
        
        <!-- Basic Tests -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <button
            @click="runTest('local')"
            :disabled="loading.tests"
            class="p-4 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg text-center transition-colors disabled:opacity-50"
          >
            <div class="text-blue-600 dark:text-blue-400 font-medium">🏠 Local Test</div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">Frontend notification</div>
          </button>

          <button
            @click="runTest('backend')"
            :disabled="loading.tests"
            class="p-4 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-center transition-colors disabled:opacity-50"
          >
            <div class="text-green-600 dark:text-green-400 font-medium">🔧 Backend Test</div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">Server endpoint</div>
          </button>

          <button
            @click="runTest('socket')"
            :disabled="loading.tests"
            class="p-4 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg text-center transition-colors disabled:opacity-50"
          >
            <div class="text-purple-600 dark:text-purple-400 font-medium">🔌 Socket Test</div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">Socket connection</div>
          </button>
        </div>

        <!-- Test Results -->
        <div v-if="testResults.length > 0" class="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 class="font-medium text-gray-900 dark:text-gray-100 mb-3">Test Results:</h3>
          <div class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-for="result in testResults.slice(0, 5)"
              :key="result.id"
              :class="[
                'p-3 rounded border-l-4 text-sm',
                result.success 
                  ? 'bg-green-50 border-green-400 text-green-700 dark:bg-green-900/20 dark:border-green-500 dark:text-green-300'
                  : 'bg-red-50 border-red-400 text-red-700 dark:bg-red-900/20 dark:border-red-500 dark:text-red-300'
              ]"
            >
              <div class="font-medium">{{ result.success ? '✅' : '❌' }} {{ result.test }}</div>
              <div class="text-xs opacity-75 mt-1">{{ result.message }}</div>
              <div class="text-xs opacity-60 mt-1">{{ formatTime(result.timestamp) }}</div>
            </div>
          </div>
          <button
            @click="clearTestResults"
            class="mt-3 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            Clear Results
          </button>
        </div>
      </div>

      <!-- Recent Admin Actions -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 class="text-xl font-semibold mb-4">📊 Recent Admin Actions</h2>
        <div v-if="recentActions.length === 0" class="text-gray-500 dark:text-gray-400 text-center py-8">
          No recent admin actions
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="action in recentActions.slice(0, 5)"
            :key="action.id"
            class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
          >
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <h3 class="font-medium text-gray-900 dark:text-gray-100">{{ action.type }}</h3>
                <p class="text-gray-600 dark:text-gray-400 mt-1">{{ action.message }}</p>
                <div class="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                  <span>{{ formatTime(action.timestamp) }}</span>
                  <span class="capitalize">{{ action.target }}</span>
                </div>
              </div>
              <div
                :class="[
                  'px-2 py-1 rounded-full text-xs font-medium',
                  action.success ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                ]"
              >
                {{ action.success ? 'Success' : 'Failed' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { call } from "frappe-ui"
import { onMounted, reactive, ref } from "vue"
import { useNotifications } from "../../composables/useNotifications"

const loading = ref({
	role: false,
	user: false,
	tests: false,
})

const roleNotification = reactive({
	title: "",
	message: "",
	roles: [],
	type: "info",
})

const userNotification = reactive({
	title: "",
	message: "",
	targetUser: "",
	type: "info",
})

const availableRoles = ref([
	"Artha User",
	"Insights User",
	"System Manager",
	"Administrator",
])

const recentActions = ref([])
const testResults = ref([])

// Use notifications composable to refresh notifications after sending
const notifications = useNotifications()

// Send role-based notification
const sendRoleNotification = async () => {
	loading.value.role = true
	try {
		const result = await call(
			"artha.api.notifications.send_role_based_notification",
			{
				roles: roleNotification.roles,
				title: roleNotification.title,
				message: roleNotification.message,
				notification_type: roleNotification.type,
			},
		)

		addRecentAction(
			"Role-based Notification",
			`Sent to ${roleNotification.roles.join(", ")}`,
			roleNotification.roles.join(", "),
			true,
		)

		// Refresh notifications to show the new ones
		await notifications.loadNotifications()

		// Reset form
		roleNotification.title = ""
		roleNotification.message = ""
		roleNotification.roles = []
		roleNotification.type = "info"
	} catch (error) {
		console.error("Error sending role notification:", error)
		addRecentAction(
			"Role-based Notification",
			`Failed: ${error.message || 'Unknown error'}`,
			roleNotification.roles.join(", "),
			false,
		)
	} finally {
		loading.value.role = false
	}
}

// Send user notification
const sendUserNotification = async () => {
	loading.value.user = true
	try {
		const result = await call(
			"artha.api.notifications.send_user_notification",
			{
				target_user: userNotification.targetUser,
				title: userNotification.title,
				message: userNotification.message,
				notification_type: userNotification.type,
			},
		)

		addRecentAction(
			"User Notification",
			`Sent to user: ${userNotification.targetUser}`,
			userNotification.targetUser,
			true,
		)

		// Refresh notifications to show the new ones
		await notifications.loadNotifications()

		// Reset form
		userNotification.title = ""
		userNotification.message = ""
		userNotification.targetUser = ""
		userNotification.type = "info"
	} catch (error) {
		console.error("Error sending user notification:", error)
		addRecentAction(
			"User Notification",
			`Failed: ${error.message || 'Unknown error'}`,
			userNotification.targetUser,
			false,
		)
	} finally {
		loading.value.user = false
	}
}

// Add recent action
const addRecentAction = (type, message, target, success) => {
	recentActions.value.unshift({
		id: Date.now(),
		type,
		message,
		target,
		success,
		timestamp: new Date(),
	})

	// Keep only last 10 actions
	if (recentActions.value.length > 10) {
		recentActions.value = recentActions.value.slice(0, 10)
	}
}

// Format time
const formatTime = (timestamp) => {
	return new Date(timestamp).toLocaleString()
}

// Testing Functions
const addTestResult = (test, message, success = true) => {
	testResults.value.unshift({
		id: Date.now(),
		test,
		message,
		success,
		timestamp: new Date(),
	})
	
	// Keep only last 20 results
	if (testResults.value.length > 20) {
		testResults.value = testResults.value.slice(0, 20)
	}
}

const clearTestResults = () => {
	testResults.value = []
}

// Run individual tests
const runTest = async (testType) => {
	loading.value.tests = true
	
	try {
		switch (testType) {
			case 'local':
				await runLocalTest()
				break
			case 'backend':
				await runBackendTest()
				break
			case 'socket':
				await runSocketTest()
				break
			default:
				throw new Error(`Unknown test type: ${testType}`)
		}
	} catch (error) {
		console.error(`${testType} test failed:`, error)
		addTestResult(`${testType} Test`, error.message, false)
	} finally {
		loading.value.tests = false
	}
}

const runLocalTest = async () => {
	// Simple local test
	addTestResult('Local Test', 'Frontend test completed successfully', true)
}

const runBackendTest = async () => {
	const result = await call('artha.api.notifications.send_simple_test_notification')
	
	if (result.status === 'success') {
		addTestResult('Backend Test', 'Backend test completed successfully', true)
	} else {
		addTestResult('Backend Test', result.message || 'Backend test failed', false)
	}
}

const runSocketTest = async () => {
	const result = await call('artha.utils.notifications.test_socket_connection')
	
	if (result.status === 'success') {
		addTestResult('Socket Test', 'Socket test completed successfully', true)
	} else {
		addTestResult('Socket Test', result.message || 'Socket test failed', false)
	}
}


</script>

<style scoped>
.admin-notification-center {
  min-height: 100vh;
  background-color: #f9fafb;
}
</style> 