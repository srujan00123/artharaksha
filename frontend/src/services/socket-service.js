// @ts-nocheck
/**
 * Socket Service for Artha Raksha
 * Custom realtime client based on Frappe's socket.io implementation
 * Adapted for Vue SPA following Frappe's official documentation
 */

import { io } from "socket.io-client"
import { session } from "../data/session"

class ArthaSpaSocketClient {
	constructor() {
		this.socket = null
		this.open_tasks = {}
		this.open_docs = new Set()
		this.lazy_connect = false
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
			// @ts-ignore
			this.socket["on"](event, callback)
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
			// @ts-ignore
			this.socket["off"](event, callback)
		}
	}

	// Connect to socket if lazy connection is enabled
	connect() {
		if (this.lazy_connect && this.socket) {
			this.socket.connect()
			this.lazy_connect = false
		}
	}

	// Emit event to server
	emit(event, ...args) {
		this.connect()
		if (this.socket) {
			this.socket.emit(event, ...args)
		}
	}

	// Initialize socket connection
	async init(config = {}) {
		const {
			port = 9000, // Use standard Frappe port
			lazy_connect = false,
			reconnectionAttempts = 3,
			withCredentials = true,
		} = config

		if (this.socket) {
			return this.socket
		}

		this.lazy_connect = lazy_connect

		try {
			const siteInfo = await this.fetchSiteInfo()
			// Use standard socketio_port
			const actualPort = siteInfo?.socketio_port || port
			const socketUrl = this.getSocketUrl(actualPort, siteInfo?.site_name)
			
			console.log(`Artha Socket: Connecting to ${socketUrl}`)
			console.log('Site info:', siteInfo)
			console.log('Location details:', {
				hostname: window.location.hostname,
				protocol: window.location.protocol,
				origin: window.location.origin,
				dev_server: window.dev_server
			})
			
			const socketOptions = {
				withCredentials,
				reconnectionAttempts,
				autoConnect: !lazy_connect,
				transports: ["websocket", "polling"],
				timeout: 30000, // Increased timeout for production
				forceNew: true,
				// Add upgrade option for better production compatibility
				upgrade: true,
				// Enable polling for fallback in production
				forceBase64: false,
				// Add more production-friendly settings
				reconnection: true,
				reconnectionDelay: 1000,
				reconnectionDelayMax: 5000,
				maxReconnectionAttempts: 5,
			}
			
			if (window.location.protocol === "https:") {
				socketOptions.secure = true
			}
			
			console.log('Socket options:', socketOptions)
			
			this.socket = io(socketUrl, socketOptions)
			if (!this.socket) {
				console.error("Unable to connect to", socketUrl)
				return null
			}
			this.setupSocketListeners()
			this.setupConnectionHandlers()
			if (!lazy_connect) {
				this.socket.connect()
			}
			return this.socket
		} catch (error) {
			console.error("Failed to initialize socket:", error)
			this.connectionError =
				error instanceof Error ? error.message : "Unknown error"
			return null
		}
	}

	getSocketUrl(port, siteName) {
		// Use site name from backend API (which gives us frappe.local.site)
		// This is the actual site folder name that Frappe uses for namespacing
		const actualSiteName = siteName || this.getSiteName()
		
		// Follow Frappe's standard approach
		let host = window.location.origin
		
		console.log('DEBUG: Socket URL construction:', {
			providedSiteName: siteName,
			detectedSiteName: this.getSiteName(),
			finalSiteName: actualSiteName,
			host: host,
			dev_server: window.dev_server,
			hostname: window.location.hostname
		})
		
		// Check if we're in development (similar to Frappe's logic)
		if (window.dev_server || window.location.hostname.includes("localhost") || window.location.hostname.includes("127.0.0.1")) {
			// Development case - use port
			let parts = host.split(":")
			const actualPort = port.toString() || "9000"
			if (parts.length > 2) {
				host = parts[0] + ":" + parts[1]
			}
			host = host + ":" + actualPort
			console.log('DEBUG: Development mode, using host with port:', host)
		} else {
			console.log('DEBUG: Production mode, using host without port:', host)
		}
		
		// Frappe namespacing: /{sitename} where sitename is the site folder name
		const finalUrl = `${host}/${actualSiteName}`
		console.log('DEBUG: Final socket URL (Frappe namespace format):', finalUrl)
		return finalUrl
	}

	getSiteName() {
		// Priority order for site name detection:
		// 1. window.site_name (set by backend)
		// 2. session.site_name 
		// 3. frappe.boot.sitename
		// 4. Default fallback
		
		if (window.site_name) {
			return window.site_name
		}
		if (session && session.site_name) {
			return session.site_name
		}
		if (window.frappe && window.frappe.boot && window.frappe.boot.sitename) {
			return window.frappe.boot.sitename
		}
		
		// Default fallback
		return "development.localhost"
	}

	async fetchSiteNameFromAPI() {
		try {
			const response = await fetch("/api/method/frappe.utils.get_site_name", {
				method: "GET",
				credentials: "include",
			})
			if (response.ok) {
				const data = await response.json()
				if (data.message) {
					return data.message
				}
			}
		} catch (error) {
			console.warn("Failed to fetch site name from API:", error)
		}
		return null
	}

	async fetchSiteInfo() {
		try {
			const response = await fetch(
				"/api/method/artha.api.notifications.get_site_info",
				{
					method: "GET",
					credentials: "include",
				},
			)
			if (response.ok) {
				const data = await response.json()
				if (data.message) {
					return data.message
				}
			}
		} catch (error) {
			console.warn("Failed to fetch site info from API:", error)
		}
		return null
	}

	setupSocketListeners() {
		if (!this.socket) return
		// Handle task status changes
		// @ts-ignore
		this.socket["on"]("task_status_change", (data) => {
			this.processTaskResponse(data, data.status?.toLowerCase())
		})
		// Handle task progress
		// @ts-ignore
		this.socket["on"]("task_progress", (data) => {
			this.processTaskResponse(data, "progress")
		})
		// Handle progress updates
		// @ts-ignore
		this.socket["on"]("progress", (data) => {
			this.processTaskResponse(data, "progress")
		})
		// Re-register all event listeners after connection
		this.eventListeners.forEach((callbacks, event) => {
			callbacks.forEach((callback) => {
				if (this.socket) {
					// @ts-ignore
					this.socket["on"](event, callback)
				}
			})
		})
	}

	setupConnectionHandlers() {
		if (!this.socket) return
		// @ts-ignore
		this.socket["on"]("connect", () => {
			this.isConnected = true
			this.connectionError = null
			this.joinDefaultRooms()
		})
		// @ts-ignore
		this.socket["on"]("disconnect", (reason) => {
			this.isConnected = false
		})
		// @ts-ignore
		this.socket["on"]("connect_error", (error) => {
			this.isConnected = false
			this.connectionError = error.message
			console.error("Socket connection error:", error)
		})
		// @ts-ignore
		this.socket["on"]("reconnect", (attemptNumber) => {
			this.isConnected = true
			this.connectionError = null
			this.joinDefaultRooms()
		})
		// @ts-ignore
		this.socket["on"]("reconnect_error", (error) => {
			console.error("Socket reconnection error:", error)
		})
		// @ts-ignore
		this.socket["on"]("reconnect_attempt", (attemptNumber) => {
			// Reconnection attempt in progress
		})
		// @ts-ignore
		this.socket["on"]("reconnect_failed", () => {
			console.error("Socket reconnection failed - all attempts exhausted")
		})
	}

	async joinDefaultRooms() {
		if (!this.socket || !this.isConnected) return
		try {
			const userRoomsInfo = await this.fetchUserRooms()
			if (userRoomsInfo && userRoomsInfo.rooms) {
				for (const room of userRoomsInfo.rooms) {
					this.socket.emit("join_room", room)
				}
			} else {
				this.joinBasicRooms()
			}
		} catch (error) {
			console.warn("Failed to fetch user rooms, using fallback:", error)
			this.joinBasicRooms()
		}
	}

	joinBasicRooms() {
		if (!this.socket || !this.isConnected) return
		this.socket.emit("join_room", "all")
		const user = session?.user || window.frappe?.session?.user
		if (user && user !== "Guest") {
			const userRoom = `user:${user}`
			this.socket.emit("join_room", userRoom)
		}
		this.socket.emit("join_room", "website")
	}

	async fetchUserRooms() {
		try {
			const response = await fetch(
				"/api/method/artha.api.notifications.get_user_rooms",
				{
					method: "GET",
					credentials: "include",
				},
			)
			if (response.ok) {
				const data = await response.json()
				if (data.message) {
					return data.message
				}
			}
		} catch (error) {
			console.warn("Failed to fetch user rooms from API:", error)
		}
		return null
	}

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
	doctypeSubscribe(doctype) {
		this.emit("doctype_subscribe", doctype)
	}
	doctypeUnsubscribe(doctype) {
		this.emit("doctype_unsubscribe", doctype)
	}
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
	publish(event, message) {
		this.emit(event, message)
	}
	getConnectionStatus() {
		return {
			isConnected: this.isConnected,
			connectionError: this.connectionError,
			hasSocket: !!this.socket,
		}
	}
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
	reconnect() {
		if (this.socket) {
			this.socket.connect()
		}
	}
}

export const socketClient = new ArthaSpaSocketClient()
export const initSocket = (config) => {
	return socketClient.init({
		lazy_connect: true,
		...config,
	})
}
export default socketClient
