/**
 * Simple Socket Initialization for Artha Vue SPA
 * Auto-initializes when user session is available
 */

import { socketClient } from '../services/socket-service.js'
import { session } from '../data/session.js'

let initialized = false
let initAttempted = false

export async function initializeArthaSockets() {
  if (initialized || initAttempted) {
    return
  }

  initAttempted = true
  console.log('🚀 Initializing Artha sockets...')

  // Wait for session to be available
  const tryInitialize = async () => {
    if (session.user && session.user !== 'Guest') {
      console.log(`👤 Session ready for user: ${session.user}`)
      
      try {
        // Try to initialize socket (will fail gracefully if server not available)
        const socket = await socketClient.init()
        
        if (socket) {
          initialized = true
          console.log('✅ Artha sockets initialized successfully')
          
          // Dispatch success event
          window.dispatchEvent(new CustomEvent('artha:sockets_initialized', {
            detail: { user: session.user, timestamp: Date.now() }
          }))
        } else {
          console.log('⚠️ Socket server not available - continuing without real-time features')
        }
      } catch (error) {
        console.warn('⚠️ Socket initialization failed:', error.message)
      }
      
    } else {
      // Retry after delay if no session yet
      setTimeout(tryInitialize, 2000)
    }
  }

  await tryInitialize()
}

// Auto-initialize after a short delay
if (typeof window !== 'undefined') {
  setTimeout(async () => {
    await initializeArthaSockets()
  }, 1000)
}

export default {
  initialize: initializeArthaSockets,
  isInitialized: () => initialized
} 