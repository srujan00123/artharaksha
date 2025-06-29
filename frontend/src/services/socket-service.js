// @ts-nocheck
/**
 * Simple Socket Service for Artha Vue SPA
 * Simplified approach following Gameplan's pattern
 */

import { io } from "socket.io-client"
import { session } from "../data/session.js"

let socket = null
let isInitialized = false

// Simplified socket initialization
export async function initSocket() {
	if (socket && socket.connected) {
		console.log('🔌 Socket already connected')
		return socket
	}

	// Don't try to connect if no user session
	if (!session.user || session.user === 'Guest') {
		console.log('⏳ No user session, skipping socket connection')
		return null
	}

	// Simple URL construction - fix the hostname and site name issues
	let host = window.location.hostname
	const is_dev = host === 'localhost' || host === '127.0.0.1' || host.endsWith('.localhost');
	const port = is_dev ? 9000 : ''; // Use 9000 for dev, standard port for prod
	
	// Fix site name detection - avoid template variables
	let siteName = host
	if (window.site_name && 
		typeof window.site_name === 'string' && 
		!window.site_name.includes('{{') && 
		!window.site_name.includes('frappe.local.site')) {
		siteName = window.site_name
	}
	
	// For development, handle localhost variations properly
	if (host === 'localhost' || host === '127.0.0.1') {
		// Only convert plain localhost/127.0.0.1, not subdomains like development.localhost
		host = 'localhost'
		siteName = 'localhost'
	} else if (host.endsWith('.localhost')) {
		// Keep development.localhost as is for proper site detection
		siteName = host
	}
	
	let protocol = window.location.protocol === 'https:' ? 'https' : 'http'
	const port_string = port ? `:${port}` : ''
	let url = `${protocol}://${host}${port_string}/${siteName}`

	console.log(`🔧 Socket connection details:`)
	console.log(`   Host: ${host}`)
	console.log(`   Site name: ${siteName}`)
	console.log(`   window.site_name: ${window.site_name}`)
	console.log(`   Full URL: ${url}`)
	console.log(`🔌 Attempting to connect to: ${url}`)

	// Try different namespace approaches
	const urlsToTry = [
		url, // Original URL with site namespace
		`${protocol}://${host}${port_string}`, // Default namespace (no path)
		`${protocol}://${host}${port_string}/all`, // Common Frappe namespace
	]

	for (let i = 0; i < urlsToTry.length; i++) {
		const attemptUrl = urlsToTry[i]
		console.log(`🔌 Attempt ${i + 1}/${urlsToTry.length}: ${attemptUrl}`)
		
		try {
			socket = io(attemptUrl, {
				withCredentials: true,
				transports: ['websocket', 'polling'],
				timeout: 5000, // Shorter timeout for attempts
				reconnectionAttempts: 1, // Only 1 attempt per URL
				reconnectionDelay: 1000,
			})

			// Wait briefly to see if connection succeeds
			const connectResult = await new Promise((resolve) => {
				const timeout = setTimeout(() => resolve('timeout'), 3000)
				
				socket.once('connect', () => {
					clearTimeout(timeout)
					resolve('connected')
				})
				
				socket.once('connect_error', (error) => {
					clearTimeout(timeout)
					resolve(error.message)
				})
			})

			if (connectResult === 'connected') {
				console.log(`✅ Connected successfully to: ${attemptUrl}`)
				isInitialized = true
				setupSocketEvents()
				return socket
			} else {
				console.warn(`❌ Connection failed to ${attemptUrl}: ${connectResult}`)
				socket.disconnect()
				socket = null
			}
			
		} catch (error) {
			console.warn(`❌ Socket creation failed for ${attemptUrl}:`, error.message)
			if (socket) {
				socket.disconnect()
				socket = null
			}
		}
	}

	console.warn('🔌 All socket connection attempts failed')
	return null
}

// Setup socket event handlers
function setupSocketEvents() {
	if (!socket) return
	
	// Connection events
	socket.on('connect', () => {
		console.log('✅ Connected to Artha socket server')
		window.dispatchEvent(new CustomEvent('socket_connected', { 
			detail: { user: session.user, timestamp: Date.now() } 
		}))
	})

	socket.on('disconnect', (reason) => {
		console.log('🔌 Socket disconnected:', reason)
		window.dispatchEvent(new CustomEvent('socket_disconnected', { 
			detail: { reason, timestamp: Date.now() } 
		}))
	})

	socket.on('connect_error', (error) => {
		console.warn('❌ Socket connection error:', error.message)
		window.dispatchEvent(new CustomEvent('socket_error', { 
			detail: { error: error.message || 'Connection failed' } 
		}))
	})

	// Artha event handlers - convert to DOM events
	const eventMappings = {
		'artha:notification': '🔔 General notification',
		'artha:income_ledger_created': '💰 Income ledger created',
		'artha:income_ledger_updated': '💰 Income ledger updated', 
		'artha:income_saved': '💰 Income saved',
		'artha:expense_created': '💸 Expense created',
		'artha:expense_updated': '💸 Expense updated',
		'artha:expense_deleted': '💸 Expense deleted',
		'artha:admin_notification': '👨‍💼 Admin notification',
		'artha:test_connection': '🧪 Test connection',
		'refetch_resource': '🔄 Refetch resource'
	}

	// Register all event handlers
	Object.keys(eventMappings).forEach(event => {
		socket.on(event, (data) => {
			console.log(`🔔 ${eventMappings[event]}:`, data)
			window.dispatchEvent(new CustomEvent(event, { detail: data }))
		})
	})

	// Debug: Log all socket events for debugging
	socket.onAny((eventName, ...args) => {
		console.log(`🔧 Socket received event: ${eventName}`, args)
	})
}

// Simple exports following Gameplan's pattern
export function useSocket() {
	return socket
}

export function isSocketConnected() {
	return socket && socket.connected
}

export function disconnectSocket() {
	if (socket) {
		console.log('🔌 Disconnecting socket')
		socket.disconnect()
		socket = null
		isInitialized = false
	}
}

// Test if socket server is available
export async function testConnection() {
	if (!socket || !socket.connected) {
		console.log('🧪 Socket not connected, cannot test')
		return false
	}
	
	try {
		socket.emit('ping')
		return true
	} catch (error) {
		console.warn('🧪 Socket test failed:', error)
		return false
	}
}

// Simple socket client export
export const socketClient = {
	init: initSocket,
	socket: () => socket,
	isConnected: isSocketConnected,
	disconnect: disconnectSocket,
	test: testConnection,
	on: (event, callback) => socket?.on(event, callback),
	emit: (event, ...args) => socket?.emit(event, ...args)
}

export default socketClient
