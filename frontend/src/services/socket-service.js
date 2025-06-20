// @ts-nocheck
/**
 * Socket Service for Artha Raksha
 * Frappe-compliant realtime client following official documentation
 */

import { io } from "socket.io-client"
import { session } from "../data/session"

class ArthaSpaSocketClient {
	constructor() {
		this.socket = null
		this.open_tasks = {}
		this.open_docs = new Set()
		this.isConnected = false
		this.connectionError = null
		this.eventListeners = new Map()
	}

	// Add event listener
	on(event, callback) {
		if (!this.eventListeners.has(event)) {
			this.eventListeners.set(event, [])
		}
		this.eventListeners.get(event)?.push(callback)
		if (this.socket) {
			this.socket.on(event, callback)
		}
	}

	// Remove event listener
	off(event, callback) {
		if (callback) {
			const listeners = this.eventListeners.get(event)
			if (listeners) {
				const index = listeners.indexOf(callback)
				if (index > -1) {
					listeners.splice(index, 1)
				}
			}
		} else {
			this.eventListeners.delete(event)
		}
		if (this.socket) {
			this.socket.off(event, callback)
		}
	}

	// Emit event to server
	emit(event, ...args) {
		if (this.socket && this.isConnected) {
			this.socket.emit(event, ...args)
		}
	}

	// Handle user authentication changes (login/logout)
	handleAuthenticationChange(newUser) {
		if (!this.socket || !this.isConnected) return
		
		console.log('🔐 Authentication change detected:', newUser)
		
		// If user logged in, join user-specific rooms
		if (newUser && newUser !== "Guest" && newUser.includes('@')) {
			this.socket.emit("join_room", `user:${newUser}`)
			console.log(`✅ Joined user room after login: user:${newUser}`)
			
			// Join role-based rooms if available
			const userRoles = session?.user_roles || []
			userRoles.forEach(role => {
				this.socket.emit("join_room", `role:${role}`)
			})
		}
		// If user logged out, leave user-specific rooms
		else if (!newUser || newUser === "Guest") {
			// Note: Frappe socket server will automatically handle room cleanup on user change
			console.log('🚪 User logged out, server will handle room cleanup')
		}
	}

	// Initialize socket connection using CRM's simple approach + our advanced features
	async init(config = {}) {
		const {
			port = 9000,
			reconnectionAttempts = 5,
			withCredentials = true,
		} = config

		if (this.socket) {
			return this.socket
		}

		try {
			// Use CRM's simple connection approach
			const siteName = this.getSiteName()
			const socketUrl = this.getSocketUrl(port, siteName)
			
			console.log(`🔌 Connecting to Frappe realtime: ${socketUrl}`)
			
			// DETAILED COOKIE DEBUGGING
			const allCookies = document.cookie
			const cookieArray = allCookies.split(';').map(c => c.trim())
			const sidCookie = cookieArray.find(c => c.startsWith('sid='))
			const userIdCookie = cookieArray.find(c => c.startsWith('user_id='))
			const fullNameCookie = cookieArray.find(c => c.startsWith('full_name='))
			
			console.log('🔧 DETAILED AUTH STATE BEFORE SOCKET CONNECTION:')
			console.log('  Frontend Auth:', {
				currentUser: this.getCurrentUser(),
				isAuthenticated: this.isUserAuthenticated(),
				sessionUser: session?.user
			})
			console.log('  Critical Cookies:', {
				sidCookie: sidCookie || 'MISSING',
				userIdCookie: userIdCookie || 'MISSING', 
				fullNameCookie: fullNameCookie || 'MISSING',
				totalCookies: cookieArray.length
			})
			console.log('  All Cookie Names:', cookieArray.map(c => c.split('=')[0]))
			
			// Ensure cookies are properly set before connecting
			await this.ensureAuthentication()
			
			// POST-AUTHENTICATION COOKIE CHECK
			const postAuthCookies = document.cookie
			const postSidCookie = postAuthCookies.split(';').find(c => c.trim().startsWith('sid='))
			console.log('🔐 POST-AUTH COOKIE CHECK:', {
				sidAfterAuth: postSidCookie || 'STILL MISSING',
				cookiesChanged: allCookies !== postAuthCookies
			})
			
			// Enhanced socket options for proper authentication
			const socketOptions = {
				withCredentials: true,  // Critical for cookie transmission
				reconnectionAttempts,
				transports: ["websocket", "polling"],
				timeout: 20000,
				reconnection: true,
				reconnectionDelay: 1000,
				reconnectionDelayMax: 5000,
				upgrade: true,
				// Force cookie sending
				extraHeaders: {
					'Origin': window.location.origin,
					'Referer': window.location.href,
					'X-Frappe-Site-Name': siteName,
					// Manually include cookies in headers as backup
					'Cookie': document.cookie
				}
			}
			
			// Add secure flag for HTTPS
			if (window.location.protocol === "https:") {
				socketOptions.secure = true
			}
			
			console.log('🔧 Socket Options:', {
				url: socketUrl,
				withCredentials: socketOptions.withCredentials,
				secure: socketOptions.secure,
				hasExtraHeaders: !!socketOptions.extraHeaders,
				cookieHeaderLength: socketOptions.extraHeaders.Cookie?.length || 0
			})
			
			this.socket = io(socketUrl, socketOptions)
			
			if (!this.socket) {
				throw new Error(`Unable to connect to ${socketUrl}`)
			}

			this.setupConnectionHandlers()
			this.setupSocketListeners()
			
			return this.socket
		} catch (error) {
			console.error("Failed to initialize socket:", error)
			
			// If authentication error, try CRM's exact approach as fallback
			if (error.message?.includes("Unauthorized") || error.message?.includes("Invalid namespace")) {
				console.log('🔄 Trying CRM\'s exact socket approach as fallback...')
				return this.initFallbackSocket(port, reconnectionAttempts)
			}
			
			this.connectionError = error instanceof Error ? error.message : "Unknown error"
			return null
		}
	}

	// Ensure proper authentication before socket connection
	async ensureAuthentication() {
		console.log('🔐 Ensuring authentication before socket connection...')
		
		// Check if we have required cookies
		const cookies = document.cookie
		const hasSid = cookies.includes('sid=')
		const hasUserId = cookies.includes('user_id=')
		
		console.log('🍪 Cookie check:', {
			hasSid,
			hasUserId,
			cookies: cookies.substring(0, 100) + '...' // Truncated for security
		})
		
		// TEST: Verify if the same API endpoint that socket middleware uses works
		console.log('🧪 Testing socket middleware API endpoint...')
		try {
			const response = await fetch('/api/method/frappe.realtime.get_user_info', {
				method: 'GET',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json'
				}
			})
			
			if (response.ok) {
				const data = await response.json()
				console.log('✅ Socket middleware API test successful:', {
					status: response.status,
					user: data.message?.user || 'unknown',
					user_type: data.message?.user_type || 'unknown'
				})
				
				// If this works but socket doesn't, it's a cookie transmission issue
				if (data.message?.user && data.message.user !== 'Guest') {
					console.log('✅ Backend recognizes user correctly via HTTP')
					console.log('📋 Issue is likely cookie transmission to socket server')
				}
			} else {
				console.warn('⚠️ Socket middleware API test failed:', response.status)
			}
		} catch (error) {
			console.error('❌ Socket middleware API test error:', error)
		}
		
		// If we don't have essential cookies, try to refresh them
		if (!hasSid || cookies.includes('sid=Guest')) {
			console.log('⚠️ Missing or Guest sid cookie - this will cause socket authentication to fail')
			console.log('🔧 Attempting to establish proper session...')
			
			try {
				// Multiple approaches to establish session with sid cookie
				const attempts = [
					// 1. Try standard Frappe session API
					() => fetch('/api/method/frappe.auth.get_logged_user', {
						method: 'GET',
						credentials: 'include',
						headers: {
							'Content-Type': 'application/json',
							'Accept': 'application/json'
						}
					}),
					
					// 2. Try session validation
					() => fetch('/api/method/frappe.sessions.get', {
						method: 'GET',
						credentials: 'include',
						headers: {
							'Content-Type': 'application/json'
						}
					}),
					
					// 3. Try getting user info which triggers session validation
					() => fetch('/api/method/frappe.desk.desktop.get_desktop_settings', {
						method: 'GET',
						credentials: 'include',
						headers: {
							'Content-Type': 'application/json'
						}
					})
				]
				
				for (let i = 0; i < attempts.length; i++) {
					try {
						const response = await attempts[i]()
						
						if (response.ok) {
							// Check if sid cookie is now present
							const newCookies = document.cookie
							const nowHasSid = newCookies.includes('sid=') && !newCookies.includes('sid=Guest')
							
							console.log(`✅ Session attempt ${i + 1} successful:`, {
								status: response.status,
								nowHasSid,
								cookies: newCookies.split(';').map(c => c.trim().split('=')[0])
							})
							
							if (nowHasSid) {
								console.log('✅ Valid sid cookie established')
								return true
							}
						} else {
							console.warn(`⚠️ Session attempt ${i + 1} failed:`, response.status)
						}
					} catch (error) {
						console.warn(`⚠️ Session attempt ${i + 1} error:`, error.message)
					}
				}
				
				// If still no sid after all attempts, this is a serious issue
				const finalCookies = document.cookie
				if (!finalCookies.includes('sid=') || finalCookies.includes('sid=Guest')) {
					console.error('❌ Critical: Unable to establish valid session with sid cookie')
					console.error('📋 This will cause socket authentication to fail on server side')
					console.error('🔧 Available cookies:', finalCookies.split(';').map(c => c.trim()))
					
					// Still proceed but warn user
					console.warn('⚠️ Proceeding with socket connection anyway - expect authentication errors')
				}
				
			} catch (error) {
				console.error('❌ Session establishment failed:', error)
			}
		} else {
			console.log('✅ Valid sid cookie already present')
		}
		
		return true
	}

	// Get socket URL using CRM's simple approach
	getSocketUrl(port, siteName) {
		let host = window.location.hostname
		let portStr = window.location.port ? `:${port}` : ''
		let protocol = portStr ? 'http' : 'https'
		
		// Debug logging for production troubleshooting
		console.log('🔧 Socket URL Debug Info:', {
			host,
			port,
			portStr,
			protocol,
			siteName,
			'window.site_name': window.site_name,
			'session.site_name': session?.site_name,
			location: window.location.href
		})
		
		// Validate siteName to prevent namespace errors
		if (!siteName || siteName === 'undefined' || siteName === 'null') {
			console.error('❌ Invalid site name detected:', siteName)
			throw new Error(`Invalid site name: ${siteName}. Cannot create socket namespace.`)
		}
		
		// Ensure siteName doesn't start with / (Socket.IO will add it)
		const cleanSiteName = siteName.startsWith('/') ? siteName.slice(1) : siteName
		
		let url = `${protocol}://${host}${portStr}/${cleanSiteName}`
		
		console.log('🔌 Final socket URL:', url)
		return url
	}

	// Simple development check (kept for backward compatibility)
	isDevelopment() {
		return window.location.port !== ''
	}

	// Get site name using multiple fallback strategies for production robustness
	getSiteName() {
		console.log('🔧 Site name detection:', {
			'window.site_name': window.site_name,
			'session?.site_name': session?.site_name,
			hostname: window.location.hostname,
			href: window.location.href
		})
		
		// Strategy 1: Use window.site_name (set by template)
		if (window.site_name && window.site_name !== 'undefined' && window.site_name !== '') {
			console.log('✅ Using window.site_name:', window.site_name)
			return window.site_name
		}
		
		// Strategy 2: Use session data
		if (session?.site_name && session.site_name !== 'undefined') {
			console.log('✅ Using session.site_name:', session.site_name)
			return session.site_name
		}
		
		// Strategy 3: Extract from hostname (production fallback)
		const hostname = window.location.hostname
		if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
			console.log('✅ Using hostname as site name:', hostname)
			return hostname
		}
		
		// Strategy 4: Extract from URL path (if using subdirectory)
		const pathParts = window.location.pathname.split('/')
		if (pathParts.length > 1 && pathParts[1] && pathParts[1] !== 'frontend') {
			console.log('✅ Using path-based site name:', pathParts[1])
			return pathParts[1]
		}
		
		// Strategy 5: Last resort fallback
		console.warn('⚠️ Using fallback site name: development.localhost')
		return "development.localhost"
	}

	// Get current user from multiple sources
	getCurrentUser() {
		// Try session first
		if (session?.user && session.user !== "Guest") {
			return session.user
		}
		
		// Try cookies directly
		const cookies = new URLSearchParams(document.cookie.split("; ").join("&"))
		const cookieUser = cookies.get("user_id")
		if (cookieUser && cookieUser !== "Guest") {
			return cookieUser
		}
		
		// Try window.user (if set by backend)
		if (window.user && window.user !== "Guest") {
			return window.user
		}
		
		return null
	}

	// Wait for user authentication with timeout
	async waitForAuthentication(timeout = 3000) {
		return new Promise((resolve) => {
			const startTime = Date.now()
			
			const checkAuth = () => {
				const user = this.getCurrentUser()
				
				if (user && user !== "Guest" && user !== null) {
					console.log('✅ Authentication detected for user:', user)
					resolve(user)
					return
				}
				
				if (Date.now() - startTime > timeout) {
					console.warn('⚠️ Authentication timeout - proceeding as Guest')
					resolve(null)
					return
				}
				
				setTimeout(checkAuth, 100)
			}
			
			checkAuth()
		})
	}

	// Check if user is properly authenticated
	isUserAuthenticated() {
		const user = this.getCurrentUser()
		return user && user !== "Guest" && user !== null && user.includes('@')
	}

	// Enhanced site info fetching with better error handling
	async fetchSiteInfo() {
		try {
			const response = await fetch("/api/method/artha.api.notifications.get_site_info", {
				method: "GET",
				credentials: "include",
				headers: {
					'Content-Type': 'application/json'
				}
			})
			
			if (response.ok) {
				const data = await response.json()
				if (data.message && data.message.site_name) {
					console.log('✅ Site info fetched from API:', data.message)
					return data.message
				}
			} else {
				console.warn('⚠️ Site info API response not OK:', response.status)
			}
		} catch (error) {
			console.warn("⚠️ Failed to fetch site info from API:", error)
		}
		
		// Return fallback site info
		return {
			site_name: this.getSiteName(),
			socketio_port: 9000,
			environment: "production",
			user: session?.user || null
		}
	}

	// Setup connection event handlers
	setupConnectionHandlers() {
		if (!this.socket) return

		this.socket.on("connect", () => {
			console.log("🔌 Socket connected")
			this.isConnected = true
			this.connectionError = null
			
			// Enhanced authentication debug on connect
			const cookies = document.cookie
			const sidCookie = cookies.match(/sid=([^;]*)/)?.[1]
			const userIdCookie = cookies.match(/user_id=([^;]*)/)?.[1]
			
			console.log('🔧 Auth Debug on connect:', {
				sessionUser: session?.user,
				cookieUser: this.getCurrentUser(),
				isLoggedIn: session?.isLoggedIn?.value,
				sidPresent: !!sidCookie,
				userIdPresent: !!userIdCookie,
				userIdValue: userIdCookie ? decodeURIComponent(userIdCookie) : null,
				socketId: this.socket?.id
			})
			
			this.joinDefaultRooms()
		})

		this.socket.on("disconnect", (reason) => {
			console.log("🔌 Socket disconnected:", reason)
			this.isConnected = false
		})

		this.socket.on("connect_error", (error) => {
			console.error("🔌 Socket connection error:", error)
			this.isConnected = false
			this.connectionError = error.message
			
			// Enhanced error logging for authentication issues
			if (error.message?.includes("Unauthorized") || error.message?.includes("Invalid namespace")) {
				console.error("🚨 Authentication Error Details:", {
					error: error.message,
					cookies: document.cookie.split(';').map(c => c.trim().split('=')[0]),
					currentUser: this.getCurrentUser(),
					siteName: this.getSiteName(),
					url: window.location.href
				})
			}
		})

		this.socket.on("reconnect", (attemptNumber) => {
			console.log("🔌 Socket reconnected after", attemptNumber, "attempts")
			this.isConnected = true
			this.connectionError = null
			this.joinDefaultRooms()
		})

		// Listen for socket errors (including authorization errors)
		this.socket.on("error", (error) => {
			console.error("🔌 Socket error:", error)
			if (error.message?.includes("Unauthorized")) {
				console.log('❌ Socket authorization issue detected:', error)
				
				// Try to refresh authentication
				this.handleAuthenticationError()
			}
		})
	}

	// Handle authentication errors by refreshing session
	async handleAuthenticationError() {
		console.log('🔧 Handling authentication error...')
		try {
			// Refresh session
			await this.ensureAuthentication()
			
			// If socket is still connected, try reconnecting
			if (this.socket && this.socket.connected) {
				console.log('🔄 Attempting socket reconnection after auth refresh...')
				this.socket.disconnect()
				setTimeout(() => {
					if (this.socket) {
						this.socket.connect()
					}
				}, 1000)
			}
		} catch (error) {
			console.error('❌ Failed to handle authentication error:', error)
		}
	}

	// Setup socket listeners for Frappe events
	setupSocketListeners() {
		if (!this.socket) return

		// Standard Frappe task events
		this.socket.on("task_status_change", (data) => {
			this.processTaskResponse(data, data.status?.toLowerCase())
		})

		this.socket.on("task_progress", (data) => {
			this.processTaskResponse(data, "progress")
		})

		this.socket.on("progress", (data) => {
			this.processTaskResponse(data, "progress")
		})

		// CRM-style resource cache invalidation (IMPORTANT ADDITION)
		this.socket.on('refetch_resource', (data) => {
			if (data.cache_key) {
				// Emit custom event for resource management
				this.emit('resource_invalidated', data)
				console.log('🔄 Resource cache invalidated:', data.cache_key)
			}
		})

		// Re-register all event listeners after connection
		this.eventListeners.forEach((callbacks, event) => {
			callbacks.forEach((callback) => {
				if (this.socket) {
					this.socket.on(event, callback)
				}
			})
		})
	}

	// Join default rooms following Frappe patterns
	async joinDefaultRooms() {
		if (!this.socket || !this.isConnected) return

		try {
			console.log('🏠 Starting to join default rooms...')
			
			// Always join public rooms
			this.socket.emit("join_room", "all")
			this.socket.emit("join_room", "website")
			console.log('✅ Joined public rooms: all, website')

			// Wait for authentication before joining user-specific rooms
			const authenticatedUser = await this.waitForAuthentication()
			
			// Only join user-specific rooms if properly authenticated
			if (this.isUserAuthenticated()) {
				const user = authenticatedUser || this.getCurrentUser()
				console.log('🔐 Attempting to join user-specific rooms for:', user)
				
				// Validate user email format to prevent typos
				if (user && user.includes('@') && !user.includes('coom')) {
					this.socket.emit("join_room", `user:${user}`)
					console.log(`✅ Joined user room: user:${user}`)
					
					// Join role-based rooms if available
					const userRoles = session?.user_roles || []
					if (userRoles.length > 0) {
						userRoles.forEach(role => {
							this.socket.emit("join_room", `role:${role}`)
						})
						console.log(`✅ Joined role rooms:`, userRoles)
					}
				} else {
					console.warn('⚠️ Invalid user email format, skipping user rooms:', user)
				}
			} else {
				console.log('⚠️ User not authenticated, skipping user-specific rooms')
			}

			console.log('🏠 Finished joining default rooms')
		} catch (error) {
			console.warn('❌ Failed to join default rooms:', error)
		}
	}

	// Standard Frappe room management
	joinRoom(room) {
		if (this.socket && this.isConnected) {
			this.socket.emit("join_room", room)
		}
	}

	leaveRoom(room) {
		if (this.socket && this.isConnected) {
			this.socket.emit("leave_room", room)
		}
	}

	// Process task responses (Frappe standard)
	processTaskResponse(data, method) {
		if (!data || !data.task_id) return
		
		const opts = this.open_tasks[data.task_id]
		if (!opts) return

		if (opts[method]) {
			opts[method](data)
		}

		if (method === "success" && opts.callback) {
			opts.callback(data)
		}

		if (opts.always) {
			opts.always(data)
		}

		if (data.status_code && data.status_code > 400 && opts.error) {
			opts.error(data)
		}

		if (method === "success" || method === "error") {
			delete this.open_tasks[data.task_id]
		}
	}

	// Frappe task subscription methods
	subscribe(task_id, opts) {
		this.emit("task_subscribe", task_id)
		this.emit("progress_subscribe", task_id)
		this.open_tasks[task_id] = opts
	}

	taskSubscribe(task_id) {
		this.emit("task_subscribe", task_id)
	}

	taskUnsubscribe(task_id) {
		this.emit("task_unsubscribe", task_id)
		delete this.open_tasks[task_id]
	}

	// Frappe DocType subscription methods
	doctypeSubscribe(doctype) {
		this.emit("doctype_subscribe", doctype)
	}

	doctypeUnsubscribe(doctype) {
		this.emit("doctype_unsubscribe", doctype)
	}

	// Frappe document subscription methods
	docSubscribe(doctype, docname) {
		const docKey = `${doctype}:${docname}`
		if (this.open_docs.has(docKey)) {
			return
		}
		this.emit("doc_subscribe", doctype, docname)
		this.open_docs.add(docKey)
	}

	docUnsubscribe(doctype, docname) {
		const docKey = `${doctype}:${docname}`
		this.emit("doc_unsubscribe", doctype, docname)
		return this.open_docs.delete(docKey)
	}

	docOpen(doctype, docname) {
		this.emit("doc_open", doctype, docname)
	}

	docClose(doctype, docname) {
		this.emit("doc_close", doctype, docname)
	}

	// Publish event (client-side)
	publish(event, message) {
		this.emit(event, message)
	}

	// Get connection status
	getConnectionStatus() {
		return {
			isConnected: this.isConnected,
			connectionError: this.connectionError,
			hasSocket: !!this.socket,
		}
	}

	// Disconnect
	disconnect() {
		if (this.socket) {
			this.socket.disconnect()
			this.socket = null
			this.isConnected = false
			this.open_tasks = {}
			this.open_docs.clear()
			this.eventListeners.clear()
		}
	}

	// Reconnect
	reconnect() {
		if (this.socket) {
			this.socket.connect()
		}
	}

	// Fallback: Use CRM's exact socket initialization approach
	async initFallbackSocket(port = 9000, reconnectionAttempts = 5) {
		try {
			console.log('🔄 Initializing fallback socket using CRM approach...')
			
			// CRM's exact approach
			let host = window.location.hostname
			let siteName = window.site_name
			let portStr = window.location.port ? `:${port}` : ''
			let protocol = portStr ? 'http' : 'https'
			let url = `${protocol}://${host}${portStr}/${siteName}`
			
			console.log('🔧 CRM Fallback Socket:', {
				host,
				siteName, 
				portStr,
				protocol,
				url
			})
			
			this.socket = io(url, {
				withCredentials: true,
				reconnectionAttempts: reconnectionAttempts,
			})
			
			if (this.socket) {
				console.log('✅ Fallback socket created successfully')
				this.setupConnectionHandlers()
				this.setupSocketListeners()
				return this.socket
			}
			
		} catch (fallbackError) {
			console.error('❌ Fallback socket also failed:', fallbackError)
			this.connectionError = fallbackError instanceof Error ? fallbackError.message : "Fallback failed"
			return null
		}
	}
}

export const socketClient = new ArthaSpaSocketClient()
export const initSocket = (config) => {
	return socketClient.init(config)
}
export default socketClient
