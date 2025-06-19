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
			
			// Simplified socket options inspired by CRM
			const socketOptions = {
				withCredentials,
				reconnectionAttempts,
				transports: ["websocket", "polling"],
				timeout: 20000,
				reconnection: true,
				reconnectionDelay: 1000,
				reconnectionDelayMax: 5000,
				upgrade: true,
			}
			
			// Add secure flag for HTTPS
			if (window.location.protocol === "https:") {
				socketOptions.secure = true
			}
			
			this.socket = io(socketUrl, socketOptions)
			
			if (!this.socket) {
				throw new Error(`Unable to connect to ${socketUrl}`)
			}

			this.setupConnectionHandlers()
			this.setupSocketListeners()
			
			return this.socket
		} catch (error) {
			console.error("Failed to initialize socket:", error)
			this.connectionError = error instanceof Error ? error.message : "Unknown error"
			return null
		}
	}

	// Get socket URL using CRM's simple approach
	getSocketUrl(port, siteName) {
		let host = window.location.hostname
		let portStr = window.location.port ? `:${port}` : ''
		let protocol = portStr ? 'http' : 'https'
		let url = `${protocol}://${host}${portStr}/${siteName}`
		
		return url
	}

	// Simple development check (kept for backward compatibility)
	isDevelopment() {
		return window.location.port !== ''
	}

	// Get site name using CRM approach first, then fallbacks
	getSiteName() {
		// Use window.site_name first (CRM approach)
		if (window.site_name) {
			return window.site_name
		}
		
		// Fallback to session data
		if (session?.site_name) {
			return session.site_name
		}
		
		// Last resort fallback
		return "development.localhost"
	}

	// Fetch site info from backend
	async fetchSiteInfo() {
		try {
			const response = await fetch("/api/method/artha.api.notifications.get_site_info", {
				method: "GET",
				credentials: "include",
			})
			
			if (response.ok) {
				const data = await response.json()
				return data.message
			}
		} catch (error) {
			console.warn("Failed to fetch site info:", error)
		}
		return null
	}

	// Setup connection event handlers
	setupConnectionHandlers() {
		if (!this.socket) return

		this.socket.on("connect", () => {
			console.log("🔌 Socket connected")
			this.isConnected = true
			this.connectionError = null
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
		})

		this.socket.on("reconnect", (attemptNumber) => {
			console.log("🔌 Socket reconnected after", attemptNumber, "attempts")
			this.isConnected = true
			this.connectionError = null
			this.joinDefaultRooms()
		})
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
			// Join standard Frappe rooms
			this.socket.emit("join_room", "all")
			this.socket.emit("join_room", "website")

			// Join user-specific room
			const user = session?.user
			if (user && user !== "Guest") {
				this.socket.emit("join_room", `user:${user}`)
			}

			// Join role-based rooms if available in session
			const userRoles = session?.user_roles || []
			userRoles.forEach(role => {
				this.socket.emit("join_room", `role:${role}`)
			})

			console.log("🏠 Joined default rooms")
		} catch (error) {
			console.warn("Failed to join default rooms:", error)
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
}

export const socketClient = new ArthaSpaSocketClient()
export const initSocket = (config) => {
	return socketClient.init(config)
}
export default socketClient
