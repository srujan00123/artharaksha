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

      <!-- Room-based Notifications -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4 text-green-600 dark:text-green-400">🏠 Room-based Notifications</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title</label>
              <input
                v-model="roomNotification.title"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Room notification"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Message</label>
              <textarea
                v-model="roomNotification.message"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Message for specific room..."
              ></textarea>
            </div>
          </div>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Target Room</label>
              <select
                v-model="roomNotification.room"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="">Select Room</option>
                <option value="all">All Users</option>
                <option value="admin">Administrators</option>
                <option value="artha_users">Artha Users</option>
                <option value="insights_users">Insights Users</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Priority</label>
              <select
                v-model="roomNotification.type"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Critical</option>
                <option value="success">Success</option>
              </select>
            </div>
            <button
              @click="sendRoomNotification"
              :disabled="loading.room || !roomNotification.room"
              class="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white px-4 py-2 rounded-lg transition-colors font-medium"
            >
              {{ loading.room ? 'Sending...' : 'Send to Room' }}
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
        
        <!-- Debug Information -->
        <div v-if="debugInfo" class="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 class="font-medium text-gray-900 dark:text-gray-100 mb-3">System Status:</h3>
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div class="flex flex-col">
              <span class="text-gray-500 dark:text-gray-400">Connection</span>
              <span :class="debugInfo.isConnected ? 'text-green-600 font-medium' : 'text-red-600 font-medium'">
                {{ debugInfo.isConnected ? '🟢 Connected' : '🔴 Disconnected' }}
              </span>
            </div>
            <div class="flex flex-col">
              <span class="text-gray-500 dark:text-gray-400">Notifications</span>
              <span class="text-gray-900 dark:text-gray-100 font-medium">{{ debugInfo.notificationCount || 0 }}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-gray-500 dark:text-gray-400">Site</span>
              <span class="text-gray-900 dark:text-gray-100 font-medium">{{ debugInfo.siteName || 'Unknown' }}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-gray-500 dark:text-gray-400">Version</span>
              <span class="text-gray-900 dark:text-gray-100 font-medium">{{ debugInfo.version || '1.0.0' }}</span>
            </div>
          </div>
          <div v-if="debugInfo.connectionError" class="mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
            <span class="text-red-700 dark:text-red-300 text-sm">⚠️ {{ debugInfo.connectionError }}</span>
          </div>
        </div>
        
        <!-- Test Status -->
        <div v-if="testResults.length > 0" class="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h3 class="font-medium text-gray-900 dark:text-gray-100 mb-3">Test Results:</h3>
          <div class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-for="result in testResults"
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

        <!-- Basic Tests -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
            @click="runTest('stats')"
            :disabled="loading.tests"
            class="p-4 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg text-center transition-colors disabled:opacity-50"
          >
            <div class="text-purple-600 dark:text-purple-400 font-medium">📊 Get Stats</div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">Notification statistics</div>
          </button>
        </div>

        <div class="flex justify-between items-center mt-6">
          <div class="text-sm text-gray-500 dark:text-gray-400">
            Tests run: {{ testResults.length }} | 
            Last test: {{ testResults.length > 0 ? formatTime(testResults[0].timestamp) : 'None' }}
          </div>
          <button
            @click="refreshDebugInfo"
            :disabled="loading.tests"
            class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 disabled:opacity-50"
          >
            🔄 Refresh Status
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
            v-for="action in recentActions.slice(0, 10)"
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

const loading = ref({
	role: false,
	room: false,
	user: false,
	tests: false,
})

const roleNotification = reactive({
	title: "",
	message: "",
	roles: [],
	type: "info",
})

const roomNotification = reactive({
	title: "",
	message: "",
	room: "",
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

// Testing functionality
const testResults = ref([])

// Debug information
const debugInfo = ref(null)

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

		// Reset form
		roleNotification.title = ""
		roleNotification.message = ""
		roleNotification.roles = []
		roleNotification.type = "info"
	} catch (error) {
		console.error("Error sending role notification:", error)
		addRecentAction(
			"Role-based Notification",
			"Failed to send",
			roleNotification.roles.join(", "),
			false,
		)
	} finally {
		loading.value.role = false
	}
}

// Send room notification
const sendRoomNotification = async () => {
	loading.value.room = true
	try {
		const result = await call(
			"artha.api.notifications.send_room_notification",
			{
				room: roomNotification.room,
				title: roomNotification.title,
				message: roomNotification.message,
				notification_type: roomNotification.type,
			},
		)

		addRecentAction(
			"Room Notification",
			`Sent to room: ${roomNotification.room}`,
			roomNotification.room,
			true,
		)

		// Reset form
		roomNotification.title = ""
		roomNotification.message = ""
		roomNotification.room = ""
		roomNotification.type = "info"
	} catch (error) {
		console.error("Error sending room notification:", error)
		addRecentAction(
			"Room Notification",
			"Failed to send",
			roomNotification.room,
			false,
		)
	} finally {
		loading.value.room = false
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

		// Reset form
		userNotification.title = ""
		userNotification.message = ""
		userNotification.targetUser = ""
		userNotification.type = "info"
	} catch (error) {
		console.error("Error sending user notification:", error)
		addRecentAction(
			"User Notification",
			"Failed to send",
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

	// Keep only last 20 actions
	if (recentActions.value.length > 20) {
		recentActions.value = recentActions.value.slice(0, 20)
	}
}

// Format time
const formatTime = (timestamp) => {
	return new Date(timestamp).toLocaleString()
}

// Enhanced refresh debug info function
const refreshDebugInfo = async () => {
	try {
		loading.value.tests = true
		
		// Get debug info from the notification system
		if (window.arthaNotifsDebug?.getInfo) {
			debugInfo.value = window.arthaNotifsDebug.getInfo()
		} else {
			// Fallback: try to get basic info from API
			try {
				const result = await call('artha.api.notifications.get_site_info')
				debugInfo.value = {
					isConnected: false,
					notificationCount: 0,
					siteName: result.site_name || 'Unknown',
					version: '2.0.0',
					connectionError: 'Debug interface not available - useNotifications may not be initialized'
				}
			} catch (apiError) {
				debugInfo.value = {
					isConnected: false,
					notificationCount: 0,
					siteName: 'Unknown',
					version: '2.0.0',
					connectionError: `Unable to connect to backend: ${apiError.message || 'Unknown error'}`
				}
			}
		}
		
		addTestResult('System Status', 'Debug information refreshed', true)
	} catch (error) {
		console.error('Error refreshing debug info:', error)
		addTestResult('System Status', `Failed to refresh: ${error.message}`, false)
	} finally {
		loading.value.tests = false
	}
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
	
	// Keep only last 50 results
	if (testResults.value.length > 50) {
		testResults.value = testResults.value.slice(0, 50)
	}
}

const clearTestResults = () => {
	testResults.value = []
}

// Run individual tests with enhanced error handling
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
			case 'stats':
				await runStatsTest()
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
	if (window.arthaNotifsDebug?.addTest) {
		const result = window.arthaNotifsDebug.addTest()
		if (result) {
			addTestResult('Local Test', 'Frontend notification added successfully', true)
		} else {
			throw new Error('Failed to add local notification')
		}
	} else {
		throw new Error('arthaNotifsDebug.addTest not available')
	}
}

const runBackendTest = async () => {
	if (window.arthaNotifsDebug?.testBackend) {
		const result = await window.arthaNotifsDebug.testBackend()
		
		if (result.status === 'success') {
			addTestResult('Backend Test', result.message || 'Server endpoint test completed', true)
		} else {
			addTestResult('Backend Test', result.message || 'Backend test failed', false)
		}
	} else {
		try {
			const result = await call('artha.api.notifications.send_simple_test_notification')
			
			if (result.status === 'success') {
				addTestResult('Backend Test', 'CSRF-exempt backend test successful', true)
			} else {
				addTestResult('Backend Test', result.message || 'API call failed', false)
			}
		} catch (apiError) {
			addTestResult('Backend Test', 'Direct API call failed', false)
		}
	}
}

const runStatsTest = async () => {
	const result = await call('artha.api.notifications.get_notification_stats')
	
	if (result.status === 'success') {
		const stats = result.stats
		addTestResult('Notification Stats', `Total: ${stats.total}, Unread: ${stats.unread}`, true)
	} else {
		throw new Error(result.message || 'Failed to get notification stats')
	}
}

onMounted(() => {
	// Initialize debug info on mount
	refreshDebugInfo()
})
</script>

<style scoped>
.admin-notification-center {
  min-height: 100vh;
  background-color: #f9fafb;
}
</style> 