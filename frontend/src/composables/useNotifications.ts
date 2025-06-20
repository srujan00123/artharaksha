/**
 * Notifications Composable
 * Core realtime notifications with user-specific and role-based targeting
 * Updated for full Frappe compliance and improved socket integration
 */

import { computed, reactive, ref } from "vue";
import { call } from "frappe-ui";
import { session } from "../data/session";
import { socketClient } from "../services/socket-service";
import { cacheService, CACHE_KEYS } from "../services/cache-service";
import { apiService } from "../services/api-service";

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
  authWatcherInterval: null as number | null,
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

  // Initialize realtime connection (singleton) with improved Frappe compliance
  const initialize = async () => {
    if (globalNotificationState.initialized) {
      return;
    }
    globalNotificationState.initialized = true;

    try {
      loadNotificationsFromCache();

      // Setup authentication change watcher
      setupAuthenticationWatcher();

      // Initialize socket with Frappe-compliant configuration
      const socket = await socketClient.init({
        port: 9000,
        lazy_connect: false,
        reconnectionAttempts: 5,
        withCredentials: true,
      });

      if (socket) {
        setupRealtimeListeners();
        console.log(
          "🔔 Notification system initialized with Frappe-compliant socket",
        );
      } else {
        console.warn("Socket initialization failed, using fallback mode");
        globalNotificationState.connectionError =
          "Socket initialization failed";
      }
    } catch (error: any) {
      console.error("Failed to initialize notifications:", error);
      globalNotificationState.connectionError = error.message;
    }
  };

  // Setup authentication change watcher
  const setupAuthenticationWatcher = () => {
    // Watch for session changes and update socket rooms accordingly
    let previousUser = session?.user;

    // Check for authentication changes periodically
    const checkAuthChanges = () => {
      const currentUser = session?.user;

      if (previousUser !== currentUser) {
        console.log("🔐 User authentication changed:", {
          from: previousUser,
          to: currentUser,
        });

        // Notify socket service about authentication change
        if (socketClient.handleAuthenticationChange) {
          socketClient.handleAuthenticationChange(currentUser);
        }

        // Clear notifications if user logged out
        if (!currentUser || currentUser === "Guest") {
          clearAll();
        }

        previousUser = currentUser;
      }
    };

    // Check every 2 seconds for auth changes
    globalNotificationState.authWatcherInterval = window.setInterval(
      checkAuthChanges,
      2000,
    );

    // Also check immediately
    checkAuthChanges();
  };

  // Setup socket realtime listeners with enhanced error handling
  const setupRealtimeListeners = () => {
    // Listen to general notifications
    socketClient.on("artha_notification", handleRealtimeNotification);

    // Listen to income/expense events from decorators
    socketClient.on("artha:income_ledger_created", (data: any) => {
      const eventData = data.data || data;
      const entriesData =
        eventData.entries_added || eventData.ledger_entry || {};

      if (typeof eventData.entries_added === "number") {
        // Bulk entry creation
        addNotification({
          title: "Income Entries Added",
          message: `Added ${eventData.entries_added} recurring income entries`,
          type: "success",
          data: eventData,
        });
      } else {
        // Single entry creation
        const amount = entriesData.amount || 0;
        const incomeType =
          entriesData.income_type || entriesData.source_type || "income";

        addNotification({
          title: "Income Entry Added",
          message: `₹${amount.toLocaleString()} from ${incomeType}`,
          type: "success",
          data: entriesData,
        });
      }
    });

    socketClient.on("artha:income_ledger_updated", (data: any) => {
      const ledgerData = data.data?.ledger_entry || data.data || {};
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
      const deletedData = data.data?.deleted_entry || data.data || {};
      const incomeType = deletedData.income_type || "income";

      addNotification({
        title: "Income Entry Removed",
        message: `${incomeType} income entry was deleted`,
        type: "warning",
        data: deletedData,
      });
    });

    socketClient.on("artha:income_saved", (data: any) => {
      const incomeData = data.data?.income_data || data.data || {};
      const action = incomeData.action || "saved";

      addNotification({
        title: "Income Record Updated",
        message: `Income record ${action} with ${incomeData.total_sources || 0} sources`,
        type: "success",
        data: incomeData,
      });
    });

    // Listen to expense events from decorators
    socketClient.on("artha:expense_created", (data: any) => {
      const expenseData = data.data?.expense_data || data.data || {};
      const amount = expenseData.amount || 0;
      const category = expenseData.category || "expense";
      const type = expenseData.type || "other";

      addNotification({
        title: "Expense Added",
        message: `₹${amount.toLocaleString()} ${type} expense: ${category}`,
        type: "info",
        data: expenseData,
      });
    });

    socketClient.on("artha:expense_updated", (data: any) => {
      const expenseData = data.data?.expense_data || data.data || {};
      const amount = expenseData.amount || 0;
      const category = expenseData.category || "expense";
      const type = expenseData.type || "other";

      addNotification({
        title: "Expense Updated",
        message: `${category} expense updated to ₹${amount.toLocaleString()}`,
        type: "info",
        data: expenseData,
      });
    });

    socketClient.on("artha:expense_deleted", (data: any) => {
      const deletedData = data.data?.deleted_expense || data.data || {};
      const type = deletedData.type || "expense";

      addNotification({
        title: "Expense Removed",
        message: `${type} expense entry was deleted`,
        type: "warning",
        data: deletedData,
      });
    });

    // Listen to resource cache invalidation (CRM-style)
    socketClient.on("refetch_resource", (data: any) => {
      try {
        console.log("🔄 Resource cache invalidation received:", data);
        // Here you could integrate with your resource caching system
        // For now, just log it for debugging
        if (data.cache_key) {
          console.log(`Cache key to invalidate: ${data.cache_key}`);
        }
      } catch (error) {
        console.error("Failed to handle resource cache invalidation:", error);
      }
    });

    // Enhanced connection status listeners
    socketClient.on("connect", () => {
      console.log("🔌 Socket connected");
      globalNotificationState.isConnected = true;
      globalNotificationState.connectionError = null;

      setTimeout(() => {
        addNotification({
          title: "WebSocket Connected",
          message: "Real-time notifications are now active",
          type: "success",
        });
      }, 1000);
    });

    socketClient.on("disconnect", (reason: string) => {
      console.log("🔌 Socket disconnected:", reason);
      globalNotificationState.isConnected = false;

      // Only show disconnect notification for unexpected disconnections
      if (reason !== "io client disconnect") {
        addNotification({
          title: "Connection Lost",
          message: "Attempting to reconnect...",
          type: "warning",
        });
      }
    });

    socketClient.on("connect_error", (error: any) => {
      console.log("🔌 Socket connection error:", error);
      globalNotificationState.connectionError =
        error.message || "Connection error";
      console.error("Socket connection error:", error);
    });

    socketClient.on("reconnect", (attemptNumber: number) => {
      console.log("🔌 Socket reconnected after", attemptNumber, "attempts");
      globalNotificationState.isConnected = true;
      globalNotificationState.connectionError = null;

      addNotification({
        title: "Connection Restored",
        message: "Real-time notifications are active again",
        type: "success",
      });
    });

    // Update connection state from socket status with improved monitoring
    const updateConnectionState = () => {
      try {
        const status = socketClient.getConnectionStatus();
        globalNotificationState.isConnected = status.isConnected;
        globalNotificationState.connectionError = status.connectionError;
      } catch (error) {
        console.warn("Failed to update connection state:", error);
      }
    };

    // Check connection status every 5 seconds
    setInterval(updateConnectionState, 5000);
    updateConnectionState();
  };

  // Handle realtime notification with enhanced data validation
  const handleRealtimeNotification = (data: any) => {
    try {
      addNotification({
        title: data.title || "Notification",
        message: data.message || "You have a new notification",
        type: data.type || "info",
        data: data.data,
      });
    } catch (error) {
      console.error("Failed to handle realtime notification:", error);
    }
  };

  // Add notification with enhanced validation
  const addNotification = (
    notification: Omit<Notification, "id" | "timestamp" | "read">,
  ) => {
    try {
      console.log("🔔 Adding notification:", notification);

      const newNotification: Notification = {
        id: generateId(),
        timestamp: new Date(),
        read: false,
        ...notification,
      };

      globalNotificationState.notifications.unshift(newNotification);

      // Keep only last 50 notifications
      if (globalNotificationState.notifications.length > 50) {
        globalNotificationState.notifications =
          globalNotificationState.notifications.slice(0, 50);
      }

      saveNotificationsToCache();
      showBrowserNotification(newNotification);

      return newNotification;
    } catch (error) {
      console.error("Failed to add notification:", error);
      return null;
    }
  };

  // Mark notification as read
  const markAsRead = (id: string) => {
    try {
      const notification = globalNotificationState.notifications.find(
        (n) => n.id === id,
      );
      if (notification) {
        notification.read = true;
        saveNotificationsToCache();
      }
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    try {
      globalNotificationState.notifications.forEach((n) => (n.read = true));
      saveNotificationsToCache();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  // Clear all notifications
  const clearAll = () => {
    try {
      globalNotificationState.notifications = [];
      saveNotificationsToCache();
    } catch (error) {
      console.error("Failed to clear notifications:", error);
    }
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

  // Get recent activity
  const getRecentActivity = () => {
    try {
      return globalNotificationState.notifications
        .slice(0, 10)
        .map((notification) => ({
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          timestamp: notification.timestamp,
          read: notification.read,
          data: notification.data,
        }));
    } catch (error) {
      console.warn("Failed to get recent activity:", error);
      return [];
    }
  };

  // Show browser notification with permission check
  const showBrowserNotification = (notification: Notification) => {
    try {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(notification.title, {
          body: notification.message,
          icon: "/logo.svg",
          tag: notification.id,
        });
      } else if (
        "Notification" in window &&
        Notification.permission === "default"
      ) {
        // Request permission if not already granted or denied
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification(notification.title, {
              body: notification.message,
              icon: "/logo.svg",
              tag: notification.id,
            });
          }
        });
      }
    } catch (error) {
      console.warn("Failed to show browser notification:", error);
    }
  };

  // Enhanced cleanup function
  const cleanup = () => {
    try {
      // Clear authentication watcher
      if (globalNotificationState.authWatcherInterval) {
        clearInterval(globalNotificationState.authWatcherInterval);
        globalNotificationState.authWatcherInterval = null;
      }

      // Clear socket listeners
      socketClient.off("artha_notification");
      socketClient.off("artha:income_ledger_created");
      socketClient.off("artha:income_ledger_updated");
      socketClient.off("artha:income_ledger_deleted");
      socketClient.off("artha:income_saved");
      socketClient.off("artha:expense_created");
      socketClient.off("artha:expense_updated");
      socketClient.off("artha:expense_deleted");
      socketClient.off("refetch_resource");
      socketClient.off("connect");
      socketClient.off("disconnect");
      socketClient.off("connect_error");
      socketClient.off("reconnect");

      console.log("🧹 Notification listeners and auth watcher cleaned up");
    } catch (error) {
      console.error("Failed to cleanup notification listeners:", error);
    }
  };

  // Load notifications on initialization
  loadNotificationsFromCache();

  // Enhanced debug function for admin interface
  const getDebugInfo = () => {
    try {
      const socketStatus = socketClient.getConnectionStatus?.() || {
        isConnected: false,
        connectionError: "Socket unavailable",
        hasSocket: false,
      };

      let socketUrl = "Not available";
      let siteName = "Unknown";

      try {
        siteName = socketClient.getSiteName?.() || "development.localhost";
        if (socketClient.socket && socketClient.isConnected) {
          const port = socketClient.isDevelopment?.()
            ? 9000
            : window.location.port;
          const protocol = window.location.protocol;
          const hostname = window.location.hostname;
          socketUrl = `${protocol}//${hostname}${port ? ":" + port : ""}/${siteName}`;
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
        socketConnected: socketStatus.isConnected,
        socketStatus: socketStatus,
        socketUrl: socketUrl,
        siteName: siteName,
        frappe_compliance: true,
        version: "2.0.0",
      };
    } catch (error) {
      console.error("Failed to get debug info:", error);
      return {
        error: "Failed to get debug info",
        notifications: [],
        isConnected: false,
        initialized: false,
      };
    }
  };

  // Enhanced test functions for admin interface
  const addTestNotification = () => {
    console.log("🧪 Adding test notification manually...");
    return addNotification({
      title: "Test Notification",
      message: "This is a test notification to verify the system is working",
      type: "info",
    });
  };

  const testBackendNotification = async (
    title?: string,
    message?: string,
    type?: string,
  ) => {
    try {
      console.log("🧪 Testing backend notification...");

      // Try CSRF-exempt endpoint first
      try {
        const fallbackResult = await apiService.execute(
          call("artha.api.notifications.send_simple_test_notification"),
        );

        return {
          status: "success",
          message: "Backend test completed (CSRF-exempt)",
          backend_result: fallbackResult,
        };
      } catch (exemptError) {
        console.warn("🔶 CSRF-exempt endpoint failed:", exemptError);
      }

      // Try regular endpoint with proper CSRF handling
      try {
        const result = await apiService.execute(
          call("artha.api.notifications.send_test_notification", {
            title: title || "Backend Test",
            message: message || "This is a test from the backend",
            notification_type: type || "info",
          }),
        );

        return {
          status: "success",
          message: "Backend test completed (apiService)",
          backend_result: result,
        };
      } catch (apiServiceError) {
        return {
          status: "error",
          message: `Backend test failed: ${apiServiceError.message}`,
          api_service_error: apiServiceError.message,
        };
      }
    } catch (error) {
      return {
        status: "error",
        message: `Backend test failed: ${error.message}`,
        error: error.message,
      };
    }
  };

  // Make debug functions available globally for admin interface testing
  if (typeof window !== "undefined") {
    (window as any).arthaNotifsDebug = {
      addTest: addTestNotification,
      getInfo: getDebugInfo,
      clearAll: clearAll,
      notifications: () => globalNotificationState.notifications,
      testBackend: testBackendNotification,
      socket: () => socketClient,
      version: "2.0.0",
    };
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

    // Utilities
    getRecentActivity,
    getDebugInfo,
    addTestNotification,
    testBackendNotification,
  };
}
