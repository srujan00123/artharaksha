/**
 * Simplified Notifications Composable
 * Clean, simple notification management with socket integration
 */

import { computed, reactive } from "vue";
import { call } from "frappe-ui";
import { session } from "../data/session";
import { socketClient } from "../services/socket-service";

// Notification interface
interface Notification {
  id: string;
  title: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  timestamp: Date;
  read: boolean;
  data?: any;
}

// Global notification state
const globalNotificationState = reactive({
  notifications: [] as Notification[],
  initialized: false,
  isConnected: false,
  connectionError: null as string | null,
});

export function useNotifications() {
  const notifications = computed(() => globalNotificationState.notifications);
  const isConnected = computed(() => globalNotificationState.isConnected);
  const connectionError = computed(
    () => globalNotificationState.connectionError,
  );

  // Load notifications from backend
  const loadNotifications = async () => {
    try {
      if (session.user === "Guest" || !session.user) {
        console.log("🔔 Skipping notification fetch for guest user");
        return;
      }

      const response = await call(
        "artha.api.notifications.get_user_notifications",
        {
          limit: 20,
          include_read: false,
        },
      );

      if (response?.status === "success" && response.notifications) {
        // Convert backend notifications to frontend format
        const backendNotifications = response.notifications.map((n: any) => ({
          id: n.name || generateId(),
          title: n.subject || "Notification",
          message: n.email_content || "You have a notification",
          type: "info",
          timestamp: new Date(n.creation),
          read: n.read === 1,
          data: n,
        }));

        // Merge with existing notifications (avoiding duplicates)
        const existingIds = new Set(
          globalNotificationState.notifications.map((n) => n.id),
        );
        const newNotifications = backendNotifications.filter(
          (n: Notification) => !existingIds.has(n.id),
        );

        globalNotificationState.notifications = [
          ...newNotifications,
          ...globalNotificationState.notifications,
        ].slice(0, 50); // Keep only latest 50

        console.log(
          `🔔 Loaded ${newNotifications.length} new notifications from backend`,
        );
      }
    } catch (error) {
      console.warn("Failed to load notifications from backend:", error);
    }
  };

  // Initialize notifications
  const initialize = async () => {
    if (globalNotificationState.initialized) {
      return;
    }
    globalNotificationState.initialized = true;

    try {
      // Load cached notifications first (immediate display)
      loadNotificationsFromCache();

      // Setup event listeners
      setupEventListeners();

      // Check connection status
      globalNotificationState.isConnected = socketClient.isConnected();
      globalNotificationState.connectionError = null;

      // Load notifications from backend
      await loadNotifications();

      console.log("🔔 Notification system initialized");
    } catch (error: any) {
      console.error("Failed to initialize notifications:", error);
      globalNotificationState.isConnected = false;
      globalNotificationState.connectionError =
        error.message || "Initialization failed";
    }
  };

  // Setup simple event listeners
  const setupEventListeners = () => {
    // Socket connection events
    window.addEventListener("socket_connected", () => {
      globalNotificationState.isConnected = true;
      globalNotificationState.connectionError = null;
      console.log("🟢 Socket connected - notifications active");
    });

    window.addEventListener("socket_disconnected", (event: any) => {
      globalNotificationState.isConnected = false;
      globalNotificationState.connectionError =
        event.detail?.reason || "Connection lost";
      console.log("🔴 Socket disconnected");
    });

    window.addEventListener("socket_error", (event: any) => {
      globalNotificationState.isConnected = false;
      globalNotificationState.connectionError =
        event.detail?.error || "Connection error";
      console.log("❌ Socket error");
    });

    // Simple notification events
    window.addEventListener("artha:notification", (event: any) => {
      const data = event.detail;
      addNotification({
        title: data.title || "Notification",
        message: data.message || "You have a new notification",
        type: data.type || "info",
        data: data,
      });
    });

    // Income events
    window.addEventListener("artha:income_ledger_created", (event: any) => {
      const data = event.detail.data || {};
      addNotification({
        title: "Income Added",
        message: `New income entry: ₹${(data.amount || 0).toLocaleString()}`,
        type: "success",
        data: data,
      });
    });

    window.addEventListener("artha:income_ledger_updated", (event: any) => {
      const data = event.detail.data || {};
      addNotification({
        title: "Income Updated",
        message: `Income entry updated: ₹${(data.amount || 0).toLocaleString()}`,
        type: "info",
        data: data,
      });
    });

    // Expense events
    window.addEventListener("artha:expense_created", (event: any) => {
      const data = event.detail.data || {};
      addNotification({
        title: "Expense Added",
        message: `New expense: ₹${(data.amount || 0).toLocaleString()}`,
        type: "warning",
        data: data,
      });
    });

    window.addEventListener("artha:expense_updated", (event: any) => {
      const data = event.detail.data || {};
      addNotification({
        title: "Expense Updated",
        message: `Expense updated: ₹${(data.amount || 0).toLocaleString()}`,
        type: "info",
        data: data,
      });
    });

    // Test connection event
    window.addEventListener("artha:test_connection", (event: any) => {
      const data = event.detail;
      addNotification({
        title: "Connection Test",
        message: data.message || "Socket connection test successful",
        type: "info",
        data: data,
      });
    });
  };

  // Add notification with deduplication
  const addNotification = (
    notification: Omit<Notification, "id" | "timestamp" | "read">,
  ) => {
    try {
      // Simple deduplication: check if same title/message exists in last 5 seconds
      const now = new Date();
      const recentDuplicate = globalNotificationState.notifications.find(
        (n) =>
          n.title === notification.title &&
          n.message === notification.message &&
          now.getTime() - n.timestamp.getTime() < 5000, // 5 seconds
      );

      if (recentDuplicate) {
        console.log("🔄 Duplicate notification prevented:", notification.title);
        return; // Skip this notification
      }

      const newNotification: Notification = {
        id: generateId(),
        timestamp: new Date(),
        read: false,
        ...notification,
      };

      globalNotificationState.notifications.unshift(newNotification);

      // Keep only latest 50 notifications
      if (globalNotificationState.notifications.length > 50) {
        globalNotificationState.notifications =
          globalNotificationState.notifications.slice(0, 50);
      }

      // Save to cache
      saveNotificationsToCache();

      // Show browser notification if supported
      showBrowserNotification(newNotification);

      console.log("🔔 Added notification:", newNotification);
    } catch (error) {
      console.error("Failed to add notification:", error);
    }
  };

  // Mark notification as read
  const markAsRead = async (id: string) => {
    const notification = globalNotificationState.notifications.find(
      (n) => n.id === id,
    );
    if (notification) {
      notification.read = true;
      saveNotificationsToCache();

      // Sync with backend if this is a backend notification
      try {
        if (notification.data?.name) {
          const response = await call(
            "artha.api.notifications.mark_notification_as_read",
            {
              notification_id: notification.data.name,
            },
          );

          if (response.status === "success") {
            console.log("🔔 Marked notification as read in backend:", id);
          } else {
            console.warn("Backend mark as read failed:", response.message);
          }
        }
      } catch (error) {
        console.warn("Failed to mark notification as read in backend:", error);
      }
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    const unreadCount = globalNotificationState.notifications.filter(
      (n) => !n.read,
    ).length;

    if (unreadCount === 0) {
      console.log("🔔 No unread notifications to mark");
      return;
    }

    globalNotificationState.notifications.forEach((n) => (n.read = true));
    saveNotificationsToCache();

    // Sync with backend
    try {
      const response = await call(
        "artha.api.notifications.mark_all_notifications_as_read",
      );

      if (response.status === "success") {
        console.log(
          "🔔 Marked all notifications as read in backend:",
          response.message,
        );
      } else {
        console.warn("Backend mark all as read failed:", response.message);
      }
    } catch (error) {
      console.warn(
        "Failed to mark all notifications as read in backend:",
        error,
      );
    }
  };

  // Clear all notifications
  const clearAll = async () => {
    const notificationCount = globalNotificationState.notifications.length;

    // If no notifications to clear, do nothing
    if (notificationCount === 0) {
      console.log("🔔 No notifications to clear");
      return;
    }

    // Clear frontend notifications
    globalNotificationState.notifications = [];
    saveNotificationsToCache();

    // Sync with backend
    try {
      const response = await call(
        "artha.api.notifications.clear_all_notifications",
      );

      if (response.status === "success") {
        console.log(
          "🔔 Cleared all notifications in backend:",
          response.message,
        );

        // Only show success notification if there were notifications to clear
        if (response.cleared_count > 0) {
          addNotification({
            title: "Notifications Cleared",
            message: `Cleared ${response.cleared_count} notifications`,
            type: "success",
          });
        }
      } else {
        console.warn("Backend clear failed:", response.message);

        if (notificationCount > 0) {
          addNotification({
            title: "Clear Failed",
            message: response.message || "Failed to clear from backend",
            type: "warning",
          });
        }
      }
    } catch (error) {
      console.warn("Failed to clear notifications in backend:", error);

      // Show error notification but don't clutter the UI
      console.error("Backend clear failed:", error.message || error);

      // Only show error notification if it's a real error, not just no notifications
      if (notificationCount > 0) {
        addNotification({
          title: "Clear Failed",
          message: "Failed to clear from backend. May reappear on reload.",
          type: "warning",
        });
      }
    }
  };

  // Generate unique ID
  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  // Save notifications to localStorage
  const saveNotificationsToCache = () => {
    try {
      const userId = session.user || "anonymous";
      const key = `artha_notifications_${userId}`;
      localStorage.setItem(
        key,
        JSON.stringify(globalNotificationState.notifications),
      );
    } catch (error) {
      console.warn("Failed to save notifications to cache:", error);
    }
  };

  // Load notifications from localStorage
  const loadNotificationsFromCache = () => {
    try {
      const userId = session.user || "anonymous";
      const key = `artha_notifications_${userId}`;
      const cached = localStorage.getItem(key);

      if (cached) {
        const parsed = JSON.parse(cached);
        globalNotificationState.notifications = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
      }
    } catch (error) {
      console.warn("Failed to load notifications from cache:", error);
    }
  };

  // Show browser notification
  const showBrowserNotification = (notification: Notification) => {
    if (!("Notification" in window) || Notification.permission !== "granted") {
      return;
    }

    try {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: "/assets/artha/frontend/favicon.png",
        tag: notification.id,
      });

      // Auto close after 5 seconds
      setTimeout(() => browserNotification.close(), 5000);
    } catch (error) {
      console.warn("Failed to show browser notification:", error);
    }
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === "granted";
  };

  // Test notification
  const addTestNotification = () => {
    addNotification({
      title: "Test Notification",
      message: "This is a test notification to verify the system is working",
      type: "info",
    });
  };

  // Test backend notification
  const testBackendNotification = async () => {
    try {
      const response = await call(
        "artha.api.notifications.send_simple_test_notification",
      );
      console.log("Test notification response:", response);
    } catch (error) {
      console.error("Failed to send test notification:", error);
    }
  };

  // Test clear functionality
  const testClearFunctionality = async () => {
    console.log("🧪 Testing clear functionality...");

    // Add a test notification first
    addNotification({
      title: "Test Notification for Clear",
      message:
        "This notification will be cleared to test the clear functionality",
      type: "info",
    });

    console.log(
      `Before clear: ${globalNotificationState.notifications.length} notifications`,
    );

    // Wait a moment then clear
    setTimeout(async () => {
      await clearAll();
      console.log(
        `After clear: ${globalNotificationState.notifications.length} notifications`,
      );
      console.log("🧪 Clear test completed");
    }, 1000);
  };

  // Test socket connection
  const testSocketConnection = async () => {
    try {
      await call("artha.utils.notifications.test_socket_connection");
    } catch (error) {
      console.error("Failed to test socket connection:", error);
    }
  };

  // Refresh notifications from backend (replaces all frontend notifications)
  const refreshNotifications = async () => {
    try {
      if (session.user === "Guest" || !session.user) {
        console.log("🔔 Skipping notification refresh for guest user");
        return;
      }

      const response = await call(
        "artha.api.notifications.get_user_notifications",
        {
          limit: 50,
          include_read: true,
        },
      );

      if (response?.status === "success" && response.notifications) {
        // Replace all notifications with backend data
        globalNotificationState.notifications = response.notifications.map(
          (n: any) => ({
            id: n.name || generateId(),
            title: n.subject || "Notification",
            message: n.email_content || "You have a notification",
            type: "info",
            timestamp: new Date(n.creation),
            read: n.read === 1,
            data: n,
          }),
        );

        // Save to cache
        saveNotificationsToCache();

        console.log(
          `🔄 Refreshed ${globalNotificationState.notifications.length} notifications from backend`,
        );
      }
    } catch (error) {
      console.warn("Failed to refresh notifications from backend:", error);
    }
  };

  // Debug function to show notification system status
  const getDebugInfo = () => {
    return {
      initialized: globalNotificationState.initialized,
      isConnected: globalNotificationState.isConnected,
      connectionError: globalNotificationState.connectionError,
      notificationCount: globalNotificationState.notifications.length,
      unreadCount: globalNotificationState.notifications.filter((n) => !n.read)
        .length,
      notifications: globalNotificationState.notifications,
      userId: session.user,
      socketConnected: socketClient.isConnected?.(),
    };
  };

  return {
    notifications,
    isConnected,
    connectionError,
    initialize,
    loadNotifications,
    refreshNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    requestNotificationPermission,
    addTestNotification,
    testBackendNotification,
    testSocketConnection,
    testClearFunctionality,
    getDebugInfo,
  };
}

// Create global debug interface
declare global {
  interface Window {
    arthaNotificationsDebug: any;
  }
}

// Export debug interface to window for testing
if (typeof window !== "undefined") {
  const debugInterface = useNotifications();

  window.arthaNotificationsDebug = {
    status: () => debugInterface.getDebugInfo(),
    reload: () => debugInterface.loadNotifications(),
    refresh: () => debugInterface.refreshNotifications(),
    test: () => debugInterface.addTestNotification(),
    testBackend: () => debugInterface.testBackendNotification(),
    testSocket: () => debugInterface.testSocketConnection(),
    testClear: () => debugInterface.testClearFunctionality(),
    clear: () => debugInterface.clearAll(),
    initialize: () => debugInterface.initialize(),
  };

  console.log(
    "🔧 Artha notifications debug interface available at window.arthaNotificationsDebug",
  );
}
