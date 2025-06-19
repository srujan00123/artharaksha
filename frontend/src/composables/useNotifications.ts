/**
 * Notifications Composable
 * Handles realtime notifications using custom socket.io integration
 */

import { computed, reactive, ref } from "vue";
import { session } from "../data/session";
import { socketClient } from "../services/socket-service";
import { cacheService, CACHE_KEYS } from "../services/cache-service";

// Notification interface
interface Notification {
  id: string;
  title: string;
  message: string;
  type:
    | "success"
    | "error"
    | "warning"
    | "info"
    | "health"
    | "income"
    | "expense"
    | "support";
  timestamp: Date;
  read: boolean;
  data?: any;
}

// Global notification state (singleton)
const globalNotificationState = reactive({
  notifications: [] as Notification[],
  isConnected: false,
  connectionError: null as string | null,
  initialized: false,
});

export function useNotifications() {
  const notifications = computed(() => globalNotificationState.notifications);
  const isConnected = computed(() => globalNotificationState.isConnected);
  const connectionError = computed(
    () => globalNotificationState.connectionError,
  );

  // Helper function to get user-specific cache key
  const getUserNotificationKey = () => {
    const userId = session.user || "anonymous";
    return `${CACHE_KEYS.USER_NOTIFICATIONS}_${userId}`;
  };

  // Helper function to get recent activity cache key
  const getRecentActivityKey = () => {
    const userId = session.user || "anonymous";
    return `${CACHE_KEYS.RECENT_ACTIVITY}_${userId}`;
  };

  // Initialize realtime connection (singleton)
  const initialize = async () => {
    if (globalNotificationState.initialized) {
      return;
    }
    globalNotificationState.initialized = true;

    try {
      // Always load notifications from cache first
      loadNotificationsFromCache();

      // Initialize custom socket client
      const socket = await socketClient.init({
        port: 9000,
        lazy_connect: false,
        reconnectionAttempts: 5,
        withCredentials: true,
      });

      if (socket) {
        setupRealtimeListeners();
      } else {
        console.warn("Socket initialization failed, using fallback");
        setupFallbackNotifications();
      }
    } catch (error: any) {
      console.error("Failed to initialize notifications:", error);
      globalNotificationState.connectionError = error.message;
      setupFallbackNotifications();
    }

    // Setup fallback system (without adding dummy notifications)
    setupFallbackNotifications();
  };

  // Setup socket realtime listeners
  const setupRealtimeListeners = () => {
    // Listen to general notifications
    socketClient.on("artha_notification", handleRealtimeNotification);

    // Listen to health condition updates
    socketClient.on("health_condition_updated", (data: any) => {
      addNotification({
        title: "Health Profile Updated",
        message:
          data.message ||
          "Your health conditions and medical information have been updated",
        type: "health",
        data,
      });
    });

    // Listen to income updates
    socketClient.on("income_updated", (data: any) => {
      addNotification({
        title: "Income Profile Updated",
        message:
          data.message ||
          "Your income sources and financial information have been updated",
        type: "income",
        data,
      });
    });

    // Listen to income saved events
    socketClient.on("income_saved", (data: any) => {
      addNotification({
        title: "Income Sources Saved",
        message:
          data.message || "Your income sources have been successfully saved",
        type: "success",
        data,
      });
    });

    // Listen to income ledger events (legacy - without artha: prefix)
    socketClient.on("income_ledger_created", (data: any) => {
      const amount = data.amount || 0;
      const incomeType = data.income_type || data.source_type || "income";

      addNotification({
        title: "Income Entry Added",
        message:
          data.message ||
          `₹${amount.toLocaleString()} ${incomeType} income recorded`,
        type: "success",
        data,
      });
    });

    socketClient.on("income_ledger_updated", (data: any) => {
      const amount = data.amount || 0;
      const incomeType = data.income_type || data.source_type || "income";

      addNotification({
        title: "Income Entry Updated",
        message:
          data.message ||
          `${incomeType} income updated to ₹${amount.toLocaleString()}`,
        type: "info",
        data,
      });
    });

    socketClient.on("income_ledger_deleted", (data: any) => {
      const incomeType = data.income_type || data.source_type || "income";

      addNotification({
        title: "Income Entry Removed",
        message: data.message || `${incomeType} income entry was deleted`,
        type: "warning",
        data,
      });
    });

    // Listen to bulk operations
    socketClient.on("bulk_ledger_updated", (data: any) => {
      const count = data.count || 0;

      addNotification({
        title: "Bulk Update Complete",
        message: data.message || `${count} income entries updated successfully`,
        type: "success",
        data,
      });
    });

    // Listen to expense updates
    socketClient.on("expense_updated", (data: any) => {
      addNotification({
        title: "Expense Profile Updated",
        message:
          data.message ||
          "Your expense categories and spending information have been updated",
        type: "expense",
        data,
      });
    });

    // Listen to support scheme updates
    socketClient.on("support_scheme_updated", (data: any) => {
      addNotification({
        title: "Support Available",
        message:
          data.message ||
          "New government support schemes are available for your household",
        type: "support",
        data,
      });
    });

    // Listen to CHE alerts
    socketClient.on("che_alert", (data: any) => {
      addNotification({
        title: "Health Spending Alert",
        message:
          data.message ||
          "High health expenses detected - financial support may be available",
        type: "warning",
        data,
      });
    });

    // Listen to test events (for debugging and testing purposes)
    socketClient.on("artha:test_event", (data: any) => {
      const testData = data.data || {};
      const eventType = data.event_type || "test_event";
      const timestamp = testData.timestamp || data.timestamp;

      // Clean up event type for display
      const cleanEventType = eventType.replace("artha:", "").replace("_", " ");

      addNotification({
        title: data.title || testData.title || "Test Notification",
        message:
          data.message ||
          testData.message ||
          `${cleanEventType} test completed successfully`,
        type: data.type || testData.type || "info",
        data: testData,
      });
    });

    // Listen to artha-prefixed income events (from decorators)
    socketClient.on("artha:income_ledger_created", (data: any) => {
      // Extract detailed information from decorator data structure
      const ledgerData = data.data || {};
      const amount = ledgerData.amount || 0;
      const incomeType =
        ledgerData.income_type || ledgerData.source_type || "income";
      const description = ledgerData.description || `${incomeType} income`;

      addNotification({
        title: "Income Entry Added",
        message: `₹${amount.toLocaleString()} from ${incomeType} - ${description}`,
        type: "success",
        data: ledgerData,
      });
    });

    socketClient.on("artha:income_ledger_updated", (data: any) => {
      const ledgerData = data.data || {};
      const amount = ledgerData.amount || 0;
      const incomeType =
        ledgerData.income_type || ledgerData.source_type || "income";

      addNotification({
        title: "Income Entry Updated",
        message: `${incomeType} income updated to ₹${amount.toLocaleString()}`,
        type: "info",
        data: ledgerData,
      });
    });

    socketClient.on("artha:income_ledger_deleted", (data: any) => {
      const ledgerData = data.data || {};
      const incomeType =
        ledgerData.income_type || ledgerData.source_type || "income";
      const amount = ledgerData.amount || 0;

      addNotification({
        title: "Income Entry Removed",
        message: `${incomeType} income entry of ₹${amount.toLocaleString()} was deleted`,
        type: "warning",
        data: ledgerData,
      });
    });

    socketClient.on("artha:expense_created", (data: any) => {
      const expenseData = data.data || {};
      const amount = expenseData.amount || 0;
      const category = expenseData.category || expenseData.type || "general";

      addNotification({
        title: "Expense Added",
        message: `₹${amount.toLocaleString()} spent on ${category} expenses`,
        type: "warning",
        data: expenseData,
      });
    });

    socketClient.on("artha:expense_updated", (data: any) => {
      const expenseData = data.data || {};
      const amount = expenseData.amount || 0;
      const category = expenseData.category || expenseData.type || "general";

      addNotification({
        title: "Expense Updated",
        message: `${category} expense updated to ₹${amount.toLocaleString()}`,
        type: "info",
        data: expenseData,
      });
    });

    socketClient.on("artha:expense_deleted", (data: any) => {
      const expenseData = data.data || {};
      const category = expenseData.category || expenseData.type || "general";
      const amount = expenseData.amount || 0;

      addNotification({
        title: "Expense Removed",
        message: `${category} expense of ₹${amount.toLocaleString()} was deleted`,
        type: "warning",
        data: expenseData,
      });
    });

    // Connection status listeners
    socketClient.on("connect", () => {
      console.log("🔌 Socket connected");
      globalNotificationState.isConnected = true;
      globalNotificationState.connectionError = null;

      // Send a test notification when connected
      setTimeout(() => {
        addNotification({
          title: "WebSocket Connected",
          message: "Real-time notifications are now active",
          type: "success",
        });
      }, 1000);
    });

    // Listen for custom Artha handlers ready event
    socketClient.on("artha:handlers_ready", (data: any) => {
      console.log("🎯 Artha handlers ready:", data);
      addNotification({
        title: "Artha Handlers Ready",
        message: "Custom realtime handlers are active",
        type: "info",
      });
    });

    // Listen for test response events
    socketClient.on("artha:test_response", (data: any) => {
      console.log("🧪 Test response received:", data);
      addNotification({
        title: "Test Response",
        message: `Server test successful: ${data.message}`,
        type: "success",
      });
    });

    // Listen for pong events
    socketClient.on("artha:pong", (data: any) => {
      console.log("🏓 Pong received:", data);
      addNotification({
        title: "Server Ping",
        message: "Server is responding to ping requests",
        type: "info",
      });
    });

    socketClient.on("disconnect", () => {
      console.log("🔌 Socket disconnected");
      globalNotificationState.isConnected = false;
    });

    socketClient.on("connect_error", (error: any) => {
      console.log("🔌 Socket connection error:", error);
      globalNotificationState.connectionError =
        error.message || "Connection error";
      console.error("Socket connection error:", error);
    });

    // Update connection state from socket status
    const updateConnectionState = () => {
      const status = socketClient.getConnectionStatus();
      globalNotificationState.isConnected = status.isConnected;
      globalNotificationState.connectionError = status.connectionError;
    };

    // Check connection status periodically
    setInterval(updateConnectionState, 5000);
    updateConnectionState(); // Initial check
  };

  // Handle realtime notification
  const handleRealtimeNotification = (data: any) => {
    addNotification({
      title: data.title || "Notification",
      message: data.message || "You have a new notification",
      type: data.type || "info",
      data: data.data,
    });
  };

  // Fallback for when realtime is not available
  const setupFallbackNotifications = () => {
    // Fallback is ready but no dummy notifications added
  };

  // Add notification
  const addNotification = (
    notification: Omit<Notification, "id" | "timestamp" | "read">,
  ) => {
    console.log("🔔 Adding notification:", notification);

    const newNotification: Notification = {
      id: generateId(),
      timestamp: new Date(),
      read: false,
      ...notification,
    };

    console.log("🔔 Created notification object:", newNotification);

    globalNotificationState.notifications.unshift(newNotification);
    console.log(
      "🔔 Total notifications after add:",
      globalNotificationState.notifications.length,
    );

    // Keep only last 50 notifications
    if (globalNotificationState.notifications.length > 50) {
      globalNotificationState.notifications =
        globalNotificationState.notifications.slice(0, 50);
    }

    // Store in cache for persistence
    try {
      saveNotificationsToCache();
      console.log("✅ Notification saved to cache");
    } catch (error) {
      console.error("❌ Failed to save notification to cache:", error);
    }

    // Update recent activity cache
    try {
      updateRecentActivityCache();
      console.log("✅ Recent activity cache updated");
    } catch (error) {
      console.error("❌ Failed to update recent activity cache:", error);
    }

    // Show browser notification if permission granted
    try {
      showBrowserNotification(newNotification);
      console.log("✅ Browser notification shown");
    } catch (error) {
      console.error("❌ Failed to show browser notification:", error);
    }

    console.log("🔔 Notification processing complete");
    return newNotification;
  };

  // Mark notification as read
  const markAsRead = (id: string) => {
    const notification = globalNotificationState.notifications.find(
      (n) => n.id === id,
    );
    if (notification) {
      notification.read = true;
      saveNotificationsToCache();
    }
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    globalNotificationState.notifications.forEach((n) => (n.read = true));
    saveNotificationsToCache();
  };

  // Clear all notifications
  const clearAll = () => {
    globalNotificationState.notifications = [];
    saveNotificationsToCache();
    cacheService.delete(getRecentActivityKey());
  };

  // Generate unique ID
  const generateId = (): string => {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Save notifications to cache service
  const saveNotificationsToCache = () => {
    try {
      const cacheKey = getUserNotificationKey();
      cacheService.set(cacheKey, globalNotificationState.notifications, {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
    } catch (error) {
      console.warn("Failed to save notifications to cache:", error);
    }
  };

  // Load notifications from cache service
  const loadNotificationsFromCache = () => {
    try {
      const cacheKey = getUserNotificationKey();
      const cached = cacheService.get(cacheKey);
      if (cached && Array.isArray(cached)) {
        globalNotificationState.notifications = cached.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
      }
    } catch (error) {
      console.warn("Failed to load notifications from cache:", error);
    }
  };

  // Update recent activity cache (for dashboard)
  const updateRecentActivityCache = () => {
    try {
      const recentActivity = globalNotificationState.notifications
        .slice(0, 10) // Get last 10 notifications
        .map((notification) => ({
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          timestamp: notification.timestamp,
          read: notification.read,
          data: notification.data,
        }));

      const cacheKey = getRecentActivityKey();
      cacheService.set(cacheKey, recentActivity, {
        maxAge: 60 * 60 * 1000, // 1 hour
      });
    } catch (error) {
      console.warn("Failed to update recent activity cache:", error);
    }
  };

  // Get recent activity from cache
  const getRecentActivity = () => {
    try {
      const cacheKey = getRecentActivityKey();
      return cacheService.get(cacheKey) || [];
    } catch (error) {
      console.warn("Failed to get recent activity from cache:", error);
      return [];
    }
  };

  // Show browser notification
  const showBrowserNotification = (notification: Notification) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(notification.title, {
        body: notification.message,
        icon: "/logo.svg",
        tag: notification.id,
      });
    }
  };

  // Cleanup function
  const cleanup = () => {
    socketClient.off("artha_notification");
    socketClient.off("health_condition_updated");
    socketClient.off("income_updated");
    socketClient.off("income_saved");
    socketClient.off("income_ledger_created");
    socketClient.off("income_ledger_updated");
    socketClient.off("income_ledger_deleted");
    socketClient.off("bulk_ledger_updated");
    socketClient.off("expense_updated");
    socketClient.off("support_scheme_updated");
    socketClient.off("che_alert");
    socketClient.off("artha:test_event");
    socketClient.off("artha:income_ledger_created");
    socketClient.off("artha:income_ledger_updated");
    socketClient.off("artha:income_ledger_deleted");
    socketClient.off("artha:expense_created");
    socketClient.off("artha:expense_updated");
    socketClient.off("artha:expense_deleted");
    socketClient.off("connect");
    socketClient.off("disconnect");
    socketClient.off("connect_error");
  };

  // Manual test function (for debugging)
  const addTestNotification = () => {
    console.log("🧪 Adding test notification manually...");
    return addNotification({
      title: "Test Notification",
      message: "This is a test notification to verify the system is working",
      type: "info",
    });
  };

  // Debug function to show current state
  const getDebugInfo = () => {
    const socketStatus = socketClient.getConnectionStatus?.() || {
      isConnected: false,
      connectionError: "Socket unavailable",
      hasSocket: false,
    };

    // Try to get socket URL in a safe way
    let socketUrl = "Not available";
    try {
      if (socketClient.socket && socketClient.socket.connected) {
        // Construct URL from current location if socket is connected
        const siteName =
          socketClient.getSiteName?.() || "development.localhost";
        socketUrl = `${window.location.origin}/${siteName}`;
      }
    } catch (error) {
      console.warn("Could not determine socket URL:", error);
    }

    return {
      notifications: globalNotificationState.notifications,
      isConnected: globalNotificationState.isConnected,
      connectionError: globalNotificationState.connectionError,
      initialized: globalNotificationState.initialized,
      notificationCount: globalNotificationState.notifications.length,
      notificationsCount: globalNotificationState.notifications.length, // Alias for AdminNotificationCenter
      socketConnected: socketStatus.isConnected, // This is what AdminNotificationCenter expects
      socketStatus: socketStatus,
      socketUrl: socketUrl,
    };
  };

  // Test backend notification function
  const testBackendNotification = async (
    title?: string,
    message?: string,
    type?: string,
  ) => {
    try {
      console.log("🧪 Testing backend notification...");
      const response = await fetch(
        "/api/method/artha.api.notifications.send_test_notification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          credentials: "include",
          body: JSON.stringify({
            title: title || "Backend Test",
            message: message || "This is a test from the backend",
            notification_type: type || "info",
          }),
        },
      );

      const result = await response.json();
      console.log("🧪 Backend test response:", result);
      return result;
    } catch (error) {
      console.error("❌ Backend test failed:", error);
      return { status: "error", message: error.message };
    }
  };

  // Test income notification via backend
  const testIncomeNotification = async () => {
    try {
      console.log("🧪 Testing income notification...");
      const response = await fetch(
        "/api/method/artha.api.notifications.trigger_income_test_notification",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          credentials: "include",
        },
      );

      const result = await response.json();
      console.log("🧪 Income test response:", result);
      return result;
    } catch (error) {
      console.error("❌ Income test failed:", error);
      return { status: "error", message: error.message };
    }
  };

  // Load notifications on initialization
  loadNotificationsFromCache();

  // Test socket handlers function
  const testSocketHandlers = () => {
    console.log("🧪 Testing socket handlers...");

    // Test ping
    socketClient.emit("artha:ping", {
      message: "Test ping from client",
      timestamp: new Date().toISOString(),
    });

    // Test client test event
    socketClient.emit("artha:client_test", {
      message: "Test client event",
      data: { test: true, timestamp: new Date().toISOString() },
    });
  };

  // Make debug functions available globally for console testing
  if (typeof window !== "undefined") {
    (window as any).arthaNotifsDebug = {
      addTest: addTestNotification,
      getInfo: getDebugInfo,
      clearAll: clearAll,
      notifications: () => globalNotificationState.notifications,
      testBackend: testBackendNotification,
      testIncome: testIncomeNotification,
      testSocket: testSocketHandlers,
    };
    console.log("🧪 Debug functions available: window.arthaNotifsDebug");
    console.log("🧪 Usage examples:");
    console.log(
      "  - window.arthaNotifsDebug.addTest() // Add local test notification",
    );
    console.log(
      "  - window.arthaNotifsDebug.testBackend() // Test backend notification",
    );
    console.log(
      "  - window.arthaNotifsDebug.testIncome() // Test income notification",
    );
    console.log(
      "  - window.arthaNotifsDebug.testSocket() // Test socket handlers",
    );
    console.log("  - window.arthaNotifsDebug.getInfo() // Get debug info");
    console.log(
      "  - window.arthaNotifsDebug.clearAll() // Clear all notifications",
    );
  }

  return {
    // State
    notifications,
    isConnected,
    connectionError,

    // Actions
    initialize,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    cleanup,

    // Cache utilities
    getRecentActivity,
    updateRecentActivityCache,

    // Debug utilities
    addTestNotification,
    getDebugInfo,
    testBackendNotification,
    testIncomeNotification,
    testSocketHandlers,
  };
}
