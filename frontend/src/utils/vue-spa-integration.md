# Vue SPA Socket Integration Guide

This guide explains how to integrate the Artha socket system with your Vue SPA application.

## 🚀 Quick Start

### 1. Import Socket System in your main Vue app

```javascript
// In your main.js or App.vue
import "../utils/session-events.js"; // Starts session monitoring
import "../utils/socket-init.js"; // Handles socket initialization
```

### 2. Use Notifications in Components

```vue
<template>
  <div>
    <!-- Notification Center Component -->
    <NotificationCenter />
  </div>
</template>

<script setup>
import { useNotifications } from "@/composables/useNotifications";
import NotificationCenter from "@/components/common/NotificationCenter.vue";

// Initialize notifications
const notifications = useNotifications();
notifications.initialize();
</script>
```

### 3. Manual Socket Control (Optional)

```javascript
import { socketClient } from "@/services/socket-service";

// Check connection status
console.log(socketClient.isConnected());

// Manually reconnect
socketClient.disconnect();
socketClient.init();

// Join specific rooms
socketClient.joinRoom("artha_users");
```

## 📡 How It Works

### Session Detection

- `session-events.js` monitors for user login
- Dispatches `artha:session_ready` event when user is authenticated
- Socket initialization waits for this event

### Socket Connection

- `socket-init.js` listens for session ready event
- Connects to websocket server with proper authentication
- Auto-joins user to appropriate rooms based on roles

### Real-time Events

- All socket events are converted to custom DOM events
- Vue components can listen using `window.addEventListener`
- Notifications composable handles this automatically

## 🛠️ Configuration

### Socket Port Configuration

Socket service automatically detects configuration:

```javascript
// Priority order:
1. window.socketio_port (if set by backend)
2. Default: 9000

// Site name detection:
1. window.site_name (if set by backend)
2. Extract from hostname
3. Default: 'development.localhost'
```

### Development vs Production

```javascript
// Development (localhost):
// ws://localhost:9000/development.localhost

// Production:
// wss://yourdomain.com:9000/yourdomain.com
```

## 🔧 Debugging

### Debug Interface

Access debug tools in browser console:

```javascript
// Get system info
window.arthaNotifsDebug.getInfo();

// Test local notification
window.arthaNotifsDebug.addTest();

// Test backend connectivity
await window.arthaNotifsDebug.testBackend();

// Reconnect socket
window.arthaNotifsDebug.reconnect();
```

### Console Logs

Monitor browser console for:

- `👤 Initializing session event monitoring...`
- `✅ Session ready for user: user@example.com`
- `🔌 Connecting to socket: ws://localhost:9000/development.localhost`
- `✅ Connected to Artha realtime server`

## 🎯 Event System

### Available Events

```javascript
// Socket connection
"socket_connected";
"socket_disconnected";
"socket_error";

// Session
"artha:session_ready";
"artha:sockets_initialized";

// Notifications
"artha:admin_notification";
"artha:income_ledger_created";
"artha:expense_created";
// ... etc
```

### Custom Event Handling

```javascript
// Listen for specific events
window.addEventListener("artha:admin_notification", (event) => {
  console.log("Admin notification:", event.detail);
});

// Session state changes
window.addEventListener("artha:session_ready", (event) => {
  console.log("Session ready:", event.detail.user);
});
```

## 🏠 Room Structure

### Auto-joined Rooms

Users are automatically joined to rooms based on their roles:

- `user:{email}` - Personal room
- `role:{role}` - Role-based rooms
- `authenticated_users` - All logged-in users
- `artha_users` - Artha app users
- `artha_admin` - System administrators

### Room Permissions

Rooms have role-based access control:

- System Manager → All rooms
- Artha User → artha_users, authenticated_users
- Guest → website only

## 📱 Components

### NotificationCenter.vue

Shows real-time notifications with connection status

### AdminNotificationCenter.vue

Admin interface for sending notifications and testing

## 🐛 Troubleshooting

### Socket Not Connecting

1. Check browser console for errors
2. Verify session is ready: `window.arthaNotifsDebug.getInfo()`
3. Check socket URL is correct
4. Verify backend socket server is running

### No Notifications Received

1. Check user roles and room permissions
2. Test with: `window.arthaNotifsDebug.addTest()`
3. Verify socket connection: `window.arthaNotifsDebug.getSocket()`

### Session Issues

1. Clear browser cookies and localStorage
2. Re-login to get fresh session
3. Check session data: `console.log(session)`

## 📋 Required Backend Setup

Ensure your backend has:

- Socket.io server running on port 9000
- Artha realtime handlers loaded
- CORS configured for your frontend domain
- Session authentication working

That's it! The socket system should now work seamlessly with your Vue SPA. 🎉
