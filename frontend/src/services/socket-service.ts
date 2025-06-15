/**
 * Socket Service for Artha Raksha
 * Custom realtime client based on Frappe's socket.io implementation
 * Adapted for Vue SPA following Frappe's official documentation
 */

import { io, Socket } from 'socket.io-client'
import { session } from '../data/session'

interface SocketConfig {
    port?: number
    lazy_connect?: boolean
    reconnectionAttempts?: number
    withCredentials?: boolean
}

interface TaskOptions {
    success?: (data: any) => void
    error?: (data: any) => void
    progress?: (data: any) => void
    always?: (data: any) => void
    callback?: (data: any) => void
}

class ArthaSpaSocketClient {
    private socket: Socket | null = null
    private open_tasks: Record<string, TaskOptions> = {}
    private open_docs: Set<string> = new Set()
    private lazy_connect: boolean = false
    private isConnected: boolean = false
    private connectionError: string | null = null
    private eventListeners: Map<string, Function[]> = new Map()

    constructor() {
        this.open_tasks = {}
        this.open_docs = new Set()
    }

    /**
     * Add event listener
     */
    on(event: string, callback: Function) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, [])
        }
        this.eventListeners.get(event)?.push(callback)

        if (this.socket) {
            this.socket.on(event, callback as any)
        }
    }

    /**
     * Remove event listener
     */
    off(event: string, callback?: Function) {
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
            this.socket.off(event, callback as any)
        }
    }

    /**
     * Connect to socket if lazy connection is enabled
     */
    connect() {
        if (this.lazy_connect && this.socket) {
            this.socket.connect()
            this.lazy_connect = false
        }
    }

    /**
     * Emit event to server
     */
    emit(event: string, ...args: any[]) {
        this.connect()
        if (this.socket) {
            this.socket.emit(event, ...args)
        }
    }

    /**
     * Initialize socket connection
     */
    async init(config: SocketConfig = {}) {
        const {
            port = 9000,
            lazy_connect = false,
            reconnectionAttempts = 3,
            withCredentials = true
        } = config

        if (this.socket) {
            return this.socket
        }

        this.lazy_connect = lazy_connect

        try {
            // Try to get site info from backend first
            const siteInfo = await this.fetchSiteInfo()
            const actualPort = siteInfo?.socketio_port || port

            const socketUrl = this.getSocketUrl(actualPort, siteInfo?.site_name)

            const socketOptions = {
                withCredentials,
                reconnectionAttempts,
                autoConnect: !lazy_connect,
                transports: ['websocket', 'polling'],
                timeout: 20000,
                forceNew: true
            }

            // Add secure option for HTTPS
            if (window.location.protocol === 'https:') {
                (socketOptions as any).secure = true
            }

            this.socket = io(socketUrl, socketOptions)

            if (!this.socket) {
                console.error('Unable to connect to', socketUrl)
                return null
            }

            this.setupSocketListeners()
            this.setupConnectionHandlers()

            // Force connection if not lazy
            if (!lazy_connect) {
                this.socket.connect()
            }

            return this.socket

        } catch (error) {
            console.error('Failed to initialize socket:', error)
            this.connectionError = error instanceof Error ? error.message : 'Unknown error'
            return null
        }
    }

    /**
     * Get socket URL based on environment
     * Following Frappe's namespace pattern: /{sitename}
     * Handles both multi-tenant and single-tenant setups
     */
    private getSocketUrl(port: number, siteName?: string): string {
        const host = window.location.hostname
        const protocol = window.location.protocol === 'https:' ? 'https' : 'http'
        const actualSiteName = siteName || this.getSiteName()

        // In single-tenancy mode (bench use site), socket.io still uses namespace
        // but the web interface is accessible directly without site name in URL
        const socketUrl = `${protocol}://${host}:${port}/${actualSiteName}`

        return socketUrl
    }

    /**
     * Get site name from various sources
     * Following Frappe's site detection logic
     * Handles single-tenancy mode properly
     */
    private getSiteName(): string {
        // Try to get site name from window object (set by Frappe)
        if ((window as any).site_name) {
            return (window as any).site_name
        }

        // Try to get from session or other sources
        if (session && (session as any).site_name) {
            return (session as any).site_name
        }

        // Try to get from frappe object if available
        if ((window as any).frappe && (window as any).frappe.boot && (window as any).frappe.boot.sitename) {
            return (window as any).frappe.boot.sitename
        }

        // For single-tenancy development mode
        // Even though site is accessible at localhost:8000, socket.io still uses namespace
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            return 'artha.localhost'
        }

        // Extract from hostname or use default
        const hostname = window.location.hostname
        if (hostname.includes('.')) {
            const extracted = hostname.split('.')[0]
            return extracted
        }

        return 'artha.localhost'
    }

    /**
     * Fetch site name from backend API
     */
    private async fetchSiteNameFromAPI(): Promise<string | null> {
        try {
            const response = await fetch('/api/method/frappe.utils.get_site_name', {
                method: 'GET',
                credentials: 'include'
            })

            if (response.ok) {
                const data = await response.json()
                if (data.message) {
                    return data.message
                }
            }
        } catch (error) {
            console.warn('Failed to fetch site name from API:', error)
        }

        return null
    }

    /**
     * Fetch site information from backend API
     */
    private async fetchSiteInfo(): Promise<{ site_name: string, user: string, socketio_port: number } | null> {
        try {
            const response = await fetch('/api/method/artha.api.notifications.get_site_info', {
                method: 'GET',
                credentials: 'include'
            })

            if (response.ok) {
                const data = await response.json()
                if (data.message) {
                    return data.message
                }
            }
        } catch (error) {
            console.warn('Failed to fetch site info from API:', error)
        }

        return null
    }

    /**
     * Setup socket event listeners
     */
    private setupSocketListeners() {
        if (!this.socket) return

        // Handle task status changes
        this.socket.on('task_status_change', (data: any) => {
            this.processTaskResponse(data, data.status?.toLowerCase())
        })

        // Handle task progress
        this.socket.on('task_progress', (data: any) => {
            this.processTaskResponse(data, 'progress')
        })

        // Handle progress updates
        this.socket.on('progress', (data: any) => {
            this.processTaskResponse(data, 'progress')
        })

        // Re-register all event listeners after connection
        this.eventListeners.forEach((callbacks, event) => {
            callbacks.forEach(callback => {
                this.socket?.on(event, callback as any)
            })
        })
    }

    /**
     * Setup connection status handlers
     */
    private setupConnectionHandlers() {
        if (!this.socket) return

        this.socket.on('connect', () => {
            this.isConnected = true
            this.connectionError = null

            // Join default rooms after connection
            this.joinDefaultRooms()
        })

        this.socket.on('disconnect', (reason: string) => {
            this.isConnected = false
        })

        this.socket.on('connect_error', (error: Error) => {
            this.isConnected = false
            this.connectionError = error.message
            console.error('Socket connection error:', error)
        })

        this.socket.on('reconnect', (attemptNumber: number) => {
            this.isConnected = true
            this.connectionError = null

            // Rejoin rooms after reconnection
            this.joinDefaultRooms()
        })

        this.socket.on('reconnect_error', (error: Error) => {
            console.error('Socket reconnection error:', error)
        })

        this.socket.on('reconnect_attempt', (attemptNumber: number) => {
            // Reconnection attempt in progress
        })

        this.socket.on('reconnect_failed', () => {
            console.error('Socket reconnection failed - all attempts exhausted')
        })
    }

    /**
     * Join default rooms after connection
     * Following Frappe's room structure with role-based access
     */
    private async joinDefaultRooms() {
        if (!this.socket || !this.isConnected) return

        try {
            // Fetch user's rooms from backend based on roles
            const userRoomsInfo = await this.fetchUserRooms()

            if (userRoomsInfo && userRoomsInfo.rooms) {
                // Join all assigned rooms
                for (const room of userRoomsInfo.rooms) {
                    this.socket.emit('join_room', room)
                }
            } else {
                // Fallback to basic rooms
                this.joinBasicRooms()
            }
        } catch (error) {
            console.warn('Failed to fetch user rooms, using fallback:', error)
            this.joinBasicRooms()
        }
    }

    /**
     * Join basic rooms (fallback)
     */
    private joinBasicRooms() {
        if (!this.socket || !this.isConnected) return

        // Join 'all' room (accessible to all System Users)
        this.socket.emit('join_room', 'all')

        // Join user-specific room if we have user info
        const user = session?.user || (window as any).frappe?.session?.user
        if (user && user !== 'Guest') {
            const userRoom = `user:${user}`
            this.socket.emit('join_room', userRoom)
        }

        // Join website room (accessible to all users including guests)
        this.socket.emit('join_room', 'website')
    }

    /**
     * Fetch user rooms from backend API
     */
    private async fetchUserRooms(): Promise<{ rooms: string[], user: string, roles: string[] } | null> {
        try {
            const response = await fetch('/api/method/artha.api.notifications.get_user_rooms', {
                method: 'GET',
                credentials: 'include'
            })

            if (response.ok) {
                const data = await response.json()
                if (data.message) {
                    return data.message
                }
            }
        } catch (error) {
            console.warn('Failed to fetch user rooms from API:', error)
        }

        return null
    }

    /**
     * Join specific room (for dynamic room joining)
     */
    joinRoom(room: string) {
        if (this.socket && this.isConnected) {
            this.socket.emit('join_room', room)
        }
    }

    /**
     * Leave specific room
     */
    leaveRoom(room: string) {
        if (this.socket && this.isConnected) {
            this.socket.emit('leave_room', room)
        }
    }

    /**
     * Process task response
     */
    private processTaskResponse(data: any, method: string) {
        if (!data || !data.task_id) return

        const opts = this.open_tasks[data.task_id]
        if (!opts) return

        // Call specific method handler
        if (opts[method as keyof TaskOptions]) {
            (opts[method as keyof TaskOptions] as Function)?.(data)
        }

        // Handle success callback
        if (method === 'success' && opts.callback) {
            opts.callback(data)
        }

        // Always callback
        if (opts.always) {
            opts.always(data)
        }

        // Handle errors
        if (data.status_code && data.status_code > 400 && opts.error) {
            opts.error(data)
        }

        // Clean up completed tasks
        if (method === 'success' || method === 'error') {
            delete this.open_tasks[data.task_id]
        }
    }

    /**
     * Subscribe to task updates
     */
    subscribe(task_id: string, opts: TaskOptions) {
        this.emit('task_subscribe', task_id)
        this.emit('progress_subscribe', task_id)
        this.open_tasks[task_id] = opts
    }

    /**
     * Subscribe to task
     */
    taskSubscribe(task_id: string) {
        this.emit('task_subscribe', task_id)
    }

    /**
     * Unsubscribe from task
     */
    taskUnsubscribe(task_id: string) {
        this.emit('task_unsubscribe', task_id)
        delete this.open_tasks[task_id]
    }

    /**
     * Subscribe to doctype updates
     */
    doctypeSubscribe(doctype: string) {
        this.emit('doctype_subscribe', doctype)
    }

    /**
     * Unsubscribe from doctype updates
     */
    doctypeUnsubscribe(doctype: string) {
        this.emit('doctype_unsubscribe', doctype)
    }

    /**
     * Subscribe to document updates
     */
    docSubscribe(doctype: string, docname: string) {
        const docKey = `${doctype}:${docname}`
        if (this.open_docs.has(docKey)) {
            return
        }

        this.emit('doc_subscribe', doctype, docname)
        this.open_docs.add(docKey)
    }

    /**
     * Unsubscribe from document updates
     */
    docUnsubscribe(doctype: string, docname: string) {
        const docKey = `${doctype}:${docname}`
        this.emit('doc_unsubscribe', doctype, docname)
        return this.open_docs.delete(docKey)
    }

    /**
     * Notify document open
     */
    docOpen(doctype: string, docname: string) {
        this.emit('doc_open', doctype, docname)
    }

    /**
     * Notify document close
     */
    docClose(doctype: string, docname: string) {
        this.emit('doc_close', doctype, docname)
    }

    /**
     * Publish event (alias for emit)
     */
    publish(event: string, message: any) {
        this.emit(event, message)
    }

    /**
     * Get connection status
     */
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            connectionError: this.connectionError,
            hasSocket: !!this.socket
        }
    }

    /**
     * Disconnect socket
     */
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

    /**
     * Reconnect socket
     */
    reconnect() {
        if (this.socket) {
            this.socket.connect()
        }
    }
}

// Create singleton instance
export const socketClient = new ArthaSpaSocketClient()

// Initialize socket on import (with lazy connection)
export const initSocket = (config?: SocketConfig) => {
    return socketClient.init({
        lazy_connect: true,
        ...config
    })
}

// Export for backward compatibility and convenience
export default socketClient 