/**
 * Simple Session Utility for Vue SPA
 * No longer needed with simplified socket approach, but kept for compatibility
 */

import { session } from '../data/session.js'

// Simple session check
export function isSessionReady() {
  return session.user && session.user !== 'Guest'
}

// No-op functions for compatibility
export function initSessionEvents() {
  console.log('👤 Session events - using simplified approach')
}

export function cleanupSessionEvents() {
  // No cleanup needed
}

export function triggerSessionReady() {
  // No longer needed
}

export default {
  isSessionReady,
  initSessionEvents,
  cleanupSessionEvents,
  triggerSessionReady
} 