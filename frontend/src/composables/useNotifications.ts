/**
 * Notifications Composable
 * Handles realtime notifications using custom socket.io integration
 */

import { computed, reactive, ref } from "vue";
import { session } from "../data/session";
import { socketClient } from "../services/socket-service";

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

  // Initialize realtime connection (singleton)
  const initialize = async () => {
    if (globalNotificationState.initialized) {
      return;
    }
    globalNotificationState.initialized = true;

    try {
      // Always load notifications from storage first
      loadNotificationsFromStorage();

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
      globalNotificationState.isConnected = true;
      globalNotificationState.connectionError = null;
    });

    socketClient.on("disconnect", () => {
      globalNotificationState.isConnected = false;
    });

    socketClient.on("connect_error", (error: any) => {
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

    // Store in localStorage for persistence
    saveNotificationsToStorage();

    // Show browser notification if permission granted
    showBrowserNotification(newNotification);

    return newNotification;
  };

  // Mark notification as read
  const markAsRead = (id: string) => {
    const notification = globalNotificationState.notifications.find(
      (n) => n.id === id,
    );
    if (notification) {
      notification.read = true;
      saveNotificationsToStorage();
    }
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    globalNotificationState.notifications.forEach((n) => (n.read = true));
    saveNotificationsToStorage();
  };

  // Clear all notifications
  const clearAll = () => {
    globalNotificationState.notifications = [];
    saveNotificationsToStorage();
  };

  // Generate unique ID
  const generateId = (): string => {
    return `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // Save notifications to localStorage
  const saveNotificationsToStorage = () => {
    try {
      const userId = session.user || "anonymous";
      localStorage.setItem(
        `artha_notifications_${userId}`,
        JSON.stringify(globalNotificationState.notifications),
      );
    } catch (error) {
      console.warn("Failed to save notifications to localStorage:", error);
    }
  };

  // Load notifications from localStorage
  const loadNotificationsFromStorage = () => {
    try {
      const userId = session.user || "anonymous";
      const stored = localStorage.getItem(`artha_notifications_${userId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        globalNotificationState.notifications = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
      }
    } catch (error) {
      console.warn("Failed to load notifications from localStorage:", error);
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

  // Load notifications on initialization
  loadNotificationsFromStorage();

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
  };
}
