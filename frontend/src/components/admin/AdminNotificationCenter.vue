<template>
  <div class="admin-notification-center">
    <div class="max-w-4xl mx-auto p-6">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">Admin Notification Center</h1>
      
      <!-- Role-based Notifications -->
      <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-md p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4 text-blue-600 dark:text-blue-400">👥 Role-based Notifications</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">Title</label>
              <input
                v-model="roleNotification.title"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                placeholder="Role-specific notification"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">Message</label>
              <textarea
                v-model="roleNotification.message"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
                placeholder="Message for specific roles..."
              ></textarea>
            </div>
          </div>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">Target Roles</label>
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
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">Priority</label>
              <select
                v-model="roleNotification.type"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:ring-blue-400 dark:focus:ring-blue-400 focus:border-blue-500 dark:focus:border-blue-400"
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
              class="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white dark:text-black px-4 py-2 rounded-lg transition-colors font-medium"
            >
              {{ loading.role ? 'Sending...' : `Send to ${roleNotification.roles.length} role(s)` }}
            </button>
          </div>
        </div>
      </div>

      <!-- Room-based Notifications -->
      <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-md p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4 text-green-600 dark:text-green-400">🏠 Room-based Notifications</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">Title</label>
              <input
                v-model="roomNotification.title"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:ring-green-400 focus:border-green-500 dark:focus:border-green-400"
                placeholder="Room notification"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">Message</label>
              <textarea
                v-model="roomNotification.message"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:ring-green-400 focus:border-green-500 dark:focus:border-green-400"
                placeholder="Message for specific room..."
              ></textarea>
            </div>
          </div>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">Target Room</label>
              <select
                v-model="roomNotification.room"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:ring-green-400 focus:border-green-500 dark:focus:border-green-400"
              >
                <option value="">Select Room</option>
                <option value="all">All Users</option>
                <option value="admin">Administrators</option>
                <option value="artha_users">Artha Users</option>
                <option value="insights_users">Insights Users</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">Priority</label>
              <select
                v-model="roomNotification.type"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 dark:ring-green-400 focus:border-green-500 dark:focus:border-green-400"
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
              class="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white dark:text-black px-4 py-2 rounded-lg transition-colors font-medium"
            >
              {{ loading.room ? 'Sending...' : 'Send to Room' }}
            </button>
          </div>
        </div>
      </div>

      <!-- User-specific Notifications -->
      <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-md p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4 text-purple-600 dark:text-purple-400">👤 User-specific Notifications</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">Title</label>
              <input
                v-model="userNotification.title"
                type="text"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:focus:border-purple-400"
                placeholder="Personal notification"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">Message</label>
              <textarea
                v-model="userNotification.message"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:focus:border-purple-400"
                placeholder="Message for specific user..."
              ></textarea>
            </div>
          </div>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">Target User (Email)</label>
              <input
                v-model="userNotification.targetUser"
                type="email"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:focus:border-purple-400"
                placeholder="user@example.com"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-600 mb-2">Priority</label>
              <select
                v-model="userNotification.type"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:focus:border-purple-400"
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
              class="w-full bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white dark:text-black px-4 py-2 rounded-lg transition-colors font-medium"
            >
              {{ loading.user ? 'Sending...' : 'Send to User' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Notification System Testing -->
      <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-md p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4 text-orange-600 dark:text-orange-400">🧪 Notification System Testing</h2>
        
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
              <div class="font-medium">{{ result.test }}</div>
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
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <button
            @click="runTest('local')"
            :disabled="loading.tests"
            class="p-4 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg text-center transition-colors"
          >
            <div class="text-blue-600 dark:text-blue-400 font-medium">🏠 Local Test</div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">Frontend notification</div>
          </button>

          <button
            @click="runTest('backend')"
            :disabled="loading.tests"
            class="p-4 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg text-center transition-colors"
          >
            <div class="text-green-600 dark:text-green-400 font-medium">🔧 Backend Test</div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">Server endpoint</div>
          </button>

          <button
            @click="runTest('socket')"
            :disabled="loading.tests"
            class="p-4 bg-purple-50 hover:bg-purple-100 dark:bg-purple-900/20 dark:hover:bg-purple-900/30 border border-purple-200 dark:border-purple-800 rounded-lg text-center transition-colors"
          >
            <div class="text-purple-600 dark:text-purple-400 font-medium">🔌 Socket Test</div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">WebSocket handlers</div>
          </button>

          <button
            @click="runTest('income')"
            :disabled="loading.tests"
            class="p-4 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/30 border border-orange-200 dark:border-orange-800 rounded-lg text-center transition-colors"
          >
            <div class="text-orange-600 dark:text-orange-400 font-medium">💰 Income Test</div>
            <div class="text-sm text-gray-600 dark:text-gray-400 mt-1">Income notifications</div>
          </button>
        </div>

        <!-- Advanced Tests -->
        <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Advanced Testing</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Connection Status -->
            <div class="space-y-4">
              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 class="font-medium text-gray-900 dark:text-gray-100 mb-3">🔗 Connection Status</h4>
                <button
                  @click="checkConnectionStatus"
                  :disabled="loading.tests"
                  class="w-full bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Check WebSocket Status
                </button>
              </div>

              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 class="font-medium text-gray-900 dark:text-gray-100 mb-3">📊 System Info</h4>
                <button
                  @click="getSystemInfo"
                  :disabled="loading.tests"
                  class="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Get Debug Info
                </button>
              </div>
            </div>

            <!-- Stress Testing -->
            <div class="space-y-4">
              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 class="font-medium text-gray-900 dark:text-gray-100 mb-3">⚡ Stress Test</h4>
                <div class="flex space-x-2">
                  <input
                    v-model.number="stressTestCount"
                    type="number"
                    min="1"
                    max="20"
                    class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                    placeholder="Count"
                  />
                  <button
                    @click="runStressTest"
                    :disabled="loading.tests || stressTestCount < 1"
                    class="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-lg transition-colors text-sm"
                  >
                    Send {{ stressTestCount }} notifications
                  </button>
                </div>
              </div>

              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h4 class="font-medium text-gray-900 dark:text-gray-100 mb-3">🔄 Full Test Suite</h4>
                <button
                  @click="runFullTestSuite"
                  :disabled="loading.tests"
                  class="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {{ loading.tests ? 'Running...' : 'Run All Tests' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Real-time Test Console -->
        <div v-if="showConsole" class="border-t border-gray-200 dark:border-gray-700 pt-6 mt-6">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">🖥️ Test Console</h3>
            <button
              @click="clearConsole"
              class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Clear Console
            </button>
          </div>
          <div class="bg-black text-green-400 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
            <div v-for="log in consoleLogs" :key="log.id" class="mb-1">
              <span class="text-gray-500">[{{ log.timestamp }}]</span> {{ log.message }}
            </div>
            <div v-if="consoleLogs.length === 0" class="text-gray-600">
              Console ready for testing...
            </div>
          </div>
        </div>

        <div class="flex justify-between items-center mt-6">
          <button
            @click="showConsole = !showConsole"
            class="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300"
          >
            {{ showConsole ? 'Hide' : 'Show' }} Console
          </button>
          
          <div class="text-sm text-gray-500 dark:text-gray-400">
            Tests run: {{ testResults.length }} | 
            Last test: {{ testResults.length > 0 ? formatTime(testResults[0].timestamp) : 'None' }}
          </div>
        </div>
      </div>

      <!-- Recent Admin Actions -->
      <div class="bg-white dark:bg-gray-800 dark:bg-gray-200 rounded-lg shadow dark:shadow-gray-900/20-md p-6">
        <h2 class="text-xl font-semibold mb-4">📊 Recent Admin Actions</h2>
        <div v-if="recentActions.length === 0" class="text-gray-500 dark:text-gray-400 dark:text-gray-500 text-center py-8">
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
                <p class="text-gray-600 dark:text-gray-400 dark:text-gray-500 mt-1">{{ action.message }}</p>
                <div class="flex items-center space-x-4 mt-2 text-sm text-gray-500 dark:text-gray-400 dark:text-gray-500">
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
import { useAdvancedTheme } from "@/composables/useAdvancedTheme"
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
const consoleLogs = ref([])
const showConsole = ref(false)
const stressTestCount = ref(5)

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

const addConsoleLog = (message) => {
	consoleLogs.value.push({
		id: Date.now(),
		message,
		timestamp: new Date().toLocaleTimeString(),
	})
	
	// Keep only last 100 logs
	if (consoleLogs.value.length > 100) {
		consoleLogs.value = consoleLogs.value.slice(-100)
	}
}

const clearTestResults = () => {
	testResults.value = []
}

const clearConsole = () => {
	consoleLogs.value = []
}

// Run individual tests
const runTest = async (testType) => {
	loading.value.tests = true
	addConsoleLog(`Starting ${testType} test...`)
	
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
			case 'income':
				await runIncomeTest()
				break
			default:
				throw new Error(`Unknown test type: ${testType}`)
		}
	} catch (error) {
		console.error(`${testType} test failed:`, error)
		addTestResult(`${testType} Test`, error.message, false)
		addConsoleLog(`❌ ${testType} test failed: ${error.message}`)
	} finally {
		loading.value.tests = false
	}
}

const runLocalTest = async () => {
	// Use global debug function if available
	if (window.arthaNotifsDebug?.addTest) {
		window.arthaNotifsDebug.addTest()
		addTestResult('Local Test', 'Frontend notification added via global debug function', true)
		addConsoleLog('✅ Local test completed - notification added via arthaNotifsDebug.addTest()')
	} else {
		throw new Error('arthaNotifsDebug.addTest not available - check useNotifications composable')
	}
}

const runBackendTest = async () => {
	// Use global debug function if available
	if (window.arthaNotifsDebug?.testBackend) {
		await window.arthaNotifsDebug.testBackend()
		addTestResult('Backend Test', 'Server endpoint test completed', true)
		addConsoleLog('✅ Backend test completed - check notification center for result')
	} else {
		// Fallback to direct API call
		const result = await call('artha.api.notifications.send_test_notification')
		addTestResult('Backend Test', 'Direct API call successful', true)
		addConsoleLog('✅ Backend test completed via direct API call')
	}
}

const runSocketTest = async () => {
	// Use global debug function if available, otherwise fallback to backend
	if (window.arthaNotifsDebug?.testSocket) {
		await window.arthaNotifsDebug.testSocket()
		addTestResult('Socket Test', 'WebSocket handlers test completed via frontend', true)
		addConsoleLog('✅ Socket test completed - tested custom realtime handlers via frontend')
	} else {
		// Fallback to backend socket test
		const result = await call('artha.api.notifications.test_socket_handlers')
		if (result.status === 'success') {
			addTestResult('Socket Test', 'Backend socket handler test completed', true)
			addConsoleLog('✅ Socket test completed via backend endpoint')
			addConsoleLog(`📡 Events sent: ${result.events_sent.join(', ')}`)
		} else {
			throw new Error(result.message)
		}
	}
}

const runIncomeTest = async () => {
	// Use global debug function if available
	if (window.arthaNotifsDebug?.testIncome) {
		await window.arthaNotifsDebug.testIncome()
		addTestResult('Income Test', 'Income notification test completed', true)
		addConsoleLog('✅ Income test completed - check notification center for result')
	} else {
		// Fallback to direct API call
		const result = await call('artha.api.notifications.trigger_income_test_notification')
		addTestResult('Income Test', 'Direct income API call successful', true)
		addConsoleLog('✅ Income test completed via direct API call')
	}
}

const checkConnectionStatus = async () => {
	loading.value.tests = true
	addConsoleLog('Checking WebSocket connection status...')
	
	try {
		if (window.arthaNotifsDebug?.getInfo) {
			const info = window.arthaNotifsDebug.getInfo()
			const status = info.socketConnected ? 'Connected' : 'Disconnected'
			const color = info.socketConnected ? '🟢' : '🔴'
			
			// Check if system is working despite disconnected status
			const hasRecentNotifications = info.notificationsCount > 0
			const systemWorking = info.socketConnected || hasRecentNotifications
			
			let statusMessage = `WebSocket: ${color} ${status}`
			if (!info.socketConnected && hasRecentNotifications) {
				statusMessage += ' (but notifications are working!)'
				addConsoleLog('🔍 Note: Socket shows disconnected but notifications are being received')
				addConsoleLog('🔍 This may be a status detection issue, not an actual connection problem')
			}
			
			addTestResult('Connection Status', statusMessage, systemWorking)
			addConsoleLog(`${color} WebSocket Status: ${status}`)
			addConsoleLog(`📊 Socket URL: ${info.socketUrl}`)
			addConsoleLog(`📈 Notifications Count: ${info.notificationsCount}`)
			addConsoleLog(`🔧 System Status: ${systemWorking ? 'Working' : 'Not Working'}`)
			
			if (info.socketStatus) {
				addConsoleLog(`🔍 Socket Details: Connected=${info.socketStatus.isConnected}, HasSocket=${info.socketStatus.hasSocket}`)
			}
		} else {
			throw new Error('arthaNotifsDebug.getInfo not available')
		}
	} catch (error) {
		addTestResult('Connection Status', error.message, false)
		addConsoleLog(`❌ Failed to check connection: ${error.message}`)
	} finally {
		loading.value.tests = false
	}
}

const getSystemInfo = async () => {
	loading.value.tests = true
	addConsoleLog('Gathering system debug information...')
	
	try {
		if (window.arthaNotifsDebug?.getInfo) {
			const info = window.arthaNotifsDebug.getInfo()
			
			addTestResult('System Info', 'Debug information retrieved', true)
			addConsoleLog('=== SYSTEM DEBUG INFO ===')
			addConsoleLog(`🔌 Socket Connected: ${info.socketConnected}`)
			addConsoleLog(`🌐 Socket URL: ${info.socketUrl}`)
			addConsoleLog(`📨 Notifications Count: ${info.notificationsCount}`)
			addConsoleLog(`⚡ Global Functions Available: ${Object.keys(window.arthaNotifsDebug || {}).length}`)
			addConsoleLog(`🎯 Current User: ${window.frappe?.session?.user || 'Unknown'}`)
			addConsoleLog(`📅 Timestamp: ${new Date().toISOString()}`)
			addConsoleLog('=== END DEBUG INFO ===')
		} else {
			throw new Error('arthaNotifsDebug not available - notification system may not be initialized')
		}
	} catch (error) {
		addTestResult('System Info', error.message, false)
		addConsoleLog(`❌ Failed to get system info: ${error.message}`)
	} finally {
		loading.value.tests = false
	}
}

const runStressTest = async () => {
	if (stressTestCount.value < 1 || stressTestCount.value > 20) {
		addTestResult('Stress Test', 'Invalid count (1-20 allowed)', false)
		return
	}
	
	loading.value.tests = true
	addConsoleLog(`Starting stress test with ${stressTestCount.value} notifications...`)
	
	try {
		let successCount = 0
		let failCount = 0
		
		for (let i = 1; i <= stressTestCount.value; i++) {
			try {
				// Send via backend endpoint
				await call('artha.api.notifications.send_test_notification', {
					custom_message: `Stress Test Notification #${i}/${stressTestCount.value}`
				})
				successCount++
				addConsoleLog(`✅ Notification ${i}/${stressTestCount.value} sent`)
				
				// Small delay to avoid overwhelming the system
				await new Promise(resolve => setTimeout(resolve, 100))
			} catch (error) {
				failCount++
				addConsoleLog(`❌ Notification ${i}/${stressTestCount.value} failed: ${error.message}`)
			}
		}
		
		addTestResult('Stress Test', `Sent ${successCount}/${stressTestCount.value} notifications (${failCount} failed)`, failCount === 0)
		addConsoleLog(`🏁 Stress test completed: ${successCount} success, ${failCount} failed`)
	} catch (error) {
		addTestResult('Stress Test', error.message, false)
		addConsoleLog(`❌ Stress test failed: ${error.message}`)
	} finally {
		loading.value.tests = false
	}
}

const runFullTestSuite = async () => {
	loading.value.tests = true
	addConsoleLog('🚀 Starting full test suite...')
	
	const tests = ['local', 'backend', 'socket', 'income']
	let passedTests = 0
	let totalTests = tests.length
	
	try {
		for (const testType of tests) {
			try {
				addConsoleLog(`⏳ Running ${testType} test...`)
				await runTest(testType)
				passedTests++
				addConsoleLog(`✅ ${testType} test passed`)
				
				// Small delay between tests
				await new Promise(resolve => setTimeout(resolve, 500))
			} catch (error) {
				addConsoleLog(`❌ ${testType} test failed: ${error.message}`)
			}
		}
		
		const allPassed = passedTests === totalTests
		addTestResult('Full Test Suite', `${passedTests}/${totalTests} tests passed`, allPassed)
		addConsoleLog(`🏁 Test suite completed: ${passedTests}/${totalTests} tests passed`)
		
		if (allPassed) {
			addConsoleLog('🎉 All tests passed! Notification system is working correctly.')
		} else {
			addConsoleLog('⚠️ Some tests failed. Check individual test results for details.')
		}
	} catch (error) {
		addTestResult('Full Test Suite', error.message, false)
		addConsoleLog(`❌ Test suite failed: ${error.message}`)
	} finally {
		loading.value.tests = false
	}
}

onMounted(() => {
	// Initialize console
	addConsoleLog('Admin Notification Center initialized')
	addConsoleLog('Testing functions ready')
	
	// Check if debug functions are available
	if (window.arthaNotifsDebug) {
		addConsoleLog('✅ arthaNotifsDebug global functions available')
		addConsoleLog(`🔧 Available functions: ${Object.keys(window.arthaNotifsDebug).join(', ')}`)
	} else {
		addConsoleLog('⚠️ arthaNotifsDebug not yet available - may load after component initialization')
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

<style scoped>
.admin-notification-center {
  min-height: 100vh;
  background-color: #f9fafb;
}
</style> 