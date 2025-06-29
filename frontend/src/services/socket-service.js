// @ts-nocheck
/**
 * Simplified Socket Service for Artha Vue SPA
 * This service now manages the connection and provides a simple event bus.
 * It no longer dispatches global window events.
 */
import { io } from "socket.io-client"
import { session } from "../data/session.js"

let socket = null
let isInitialized = false

// Internal event bus using a simple object
const eventHandlers = {}

// Refactored to use a single, standard connection URL, mirroring Frappe's default client.
async function initSocket() {
	if (isInitialized) {
		return socket
	}
	isInitialized = true

	if (!session.user || session.user === 'Guest') {
		console.log('⏳ No user session, skipping socket connection')
		return null
	}

	let host = window.location.origin; // e.g., https://artha.commitx.in
	const siteName = window.site_name || window.location.hostname;
	const is_dev = window.location.hostname === 'localhost' || window.location.hostname.endsWith('.localhost');

	// In development, the socket.io server is on a different port.
	if (is_dev) {
		let parts = host.split(':');
		let port = "9000";
		if (parts.length > 2) {
			host = parts[0] + ":" + parts[1];
		}
		host = host + ":" + port;
	}

	const socketUrl = `${host}/${siteName}`;

	console.log(`🔌 Attempting to connect to: ${socketUrl}`)

	try {
		socket = io(socketUrl, {
			withCredentials: true,
			transports: ['websocket', 'polling'],
		})

		setupSocketEvents()
		return socket
		
	} catch (error) {
		console.warn(`❌ Socket creation failed for ${socketUrl}:`, error.message)
		isInitialized = false // Reset on failure
		return null
	}
}

function setupSocketEvents() {
	if (!socket) return
	
	socket.on('connect', () => {
		console.log('✅ Connected to Artha socket server')
		// Fire internal event
		emitInternal('connect')
	})

	socket.on('disconnect', (reason) => {
		console.log('🔌 Socket disconnected:', reason)
		// Fire internal event
		emitInternal('disconnect', reason)
	})

	socket.on('connect_error', (error) => {
		console.warn('❌ Socket connection error:', error.message)
		// Fire internal event
		emitInternal('connect_error', error.message)
	})

	// Listen for all events and pass them to our internal bus
	socket.onAny((eventName, ...args) => {
		console.log(`🔧 Socket received event: ${eventName}`, args)
		emitInternal(eventName, ...args)
	})
}

// Internal emit function
function emitInternal(event, ...args) {
	console.log(`[Socket Internal] Emitting '${event}'. Available handlers:`, Object.keys(eventHandlers))
	if (eventHandlers[event]) {
		eventHandlers[event].forEach(callback => callback(...args))
	}
}

// Public API for the socket client
export const socketClient = {
	init: initSocket,
	socket: () => socket,
	isConnected: () => socket && socket.connected,
	disconnect: () => {
		if (socket) {
			console.log('🔌 Disconnecting socket')
			socket.disconnect()
			socket = null
			isInitialized = false
		}
	},
	// Subscribe to an event from our internal bus
	on: (event, callback) => {
		if (!eventHandlers[event]) {
			eventHandlers[event] = []
		}
		eventHandlers[event].push(callback)
	},
	// Unsubscribe from an event
	off: (event, callback) => {
		if (eventHandlers[event]) {
			eventHandlers[event] = eventHandlers[event].filter(cb => cb !== callback)
		}
	},
	// Emit an event to the server
	emit: (event, ...args) => socket?.emit(event, ...args)
}

export default socketClient
