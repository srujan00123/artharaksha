"""
Notification decorators and utilities for Artha APIs
Provides decorators to automatically send real-time notifications for API operations
"""

import frappe
import functools
from typing import Dict, Any, Optional, Union, List
import json


def realtime_notification(event_type: str, data_field: str = None, user_field: str = None,
                          broadcast: bool = False, rooms: List[str] = None):
    """
    Decorator to automatically send real-time notifications for API operations.

    SECURITY: broadcast=False by default prevents data leaks to other users.
    Financial data is included for user-specific notifications (secure).

    Args:
        event_type: Type of event (e.g., 'income_created', 'expense_updated')
        data_field: Field name in the result to extract data from (optional)
        user_field: Field name to extract user for targeted notification (optional)
        broadcast: Whether to broadcast to 'all' room (default: False for security)
        rooms: Additional rooms to notify (optional)

    Usage:
        @realtime_notification('income_created', data_field='income_data')
        def create_income(data):
            # Your API logic here
            return {"status": "success", "income_data": {...}}
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            try:
                # Execute the original function
                result = func(*args, **kwargs)

                # Only send notifications for successful operations
                if isinstance(result, dict) and result.get('status') == 'success':
                    # Extract notification data (sanitized)
                    notification_data = _sanitize_notification_data(
                        result, data_field)

                    # Add metadata (without sensitive data)
                    event_data = {
                        'event_type': event_type,
                        'data': notification_data,
                        'user': frappe.session.user,
                        'timestamp': frappe.utils.now(),
                        'function': func.__name__
                    }

                    # Extract target user if specified
                    target_user = frappe.session.user  # Default to current user
                    if user_field:
                        if user_field in result:
                            target_user = result[user_field]
                        elif isinstance(notification_data, dict) and user_field in notification_data:
                            target_user = notification_data[user_field]

                    # Send notifications (user-specific by default)
                    _send_realtime_notification(
                        event_type=event_type,
                        data=event_data,
                        target_user=target_user,
                        broadcast=broadcast,  # Now defaults to False
                        rooms=rooms or []
                    )

                    # Log the notification with more details
                    frappe.logger().info(
                        f"Sent realtime notification: {event_type} for {func.__name__} to user: {target_user} (includes user's financial data)")
                    frappe.logger().debug(f"Notification data: {event_data}")

                return result

            except Exception as e:
                # Log error but don't break the original function
                frappe.logger().error(
                    f"Error sending realtime notification for {func.__name__}: {str(e)}")
                frappe.log_error(
                    f"Realtime notification decorator error: {str(e)}", "Notification System")
                # Return the original result, don't re-execute
                return result

        return wrapper
    return decorator


def _sanitize_notification_data(result: Dict[str, Any], data_field: str = None) -> Dict[str, Any]:
    """
    Prepare notification data for user-specific notifications.
    Since notifications are now user-specific by default, we can include 
    the user's own financial data safely.
    """
    try:
        # If no data_field specified, return basic result data
        if not data_field:
            return {
                'status': result.get('status', 'success'),
                'message': result.get('message', 'Operation completed'),
                'timestamp': frappe.utils.now()
            }

        # Extract specified data field
        notification_data = result.get(data_field, {})

        # For user-specific notifications, we can include financial data
        if isinstance(notification_data, dict):
            # Include all relevant fields for the user's own notifications
            safe_data = {}

            # Include all non-password/non-token fields
            sensitive_fields = ['password', 'token', 'api_key', 'secret']

            for field, value in notification_data.items():
                # Skip truly sensitive authentication fields
                if field.lower() not in sensitive_fields:
                    safe_data[field] = value

            # Ensure we have basic metadata
            if 'timestamp' not in safe_data:
                safe_data['timestamp'] = frappe.utils.now()

            return safe_data

        # If not a dict, return the data as-is (could be a simple value)
        return notification_data

    except Exception as e:
        frappe.logger().error(f"Error preparing notification data: {str(e)}")
        return {
            'status': 'success',
            'message': 'Operation completed',
            'timestamp': frappe.utils.now()
        }


def income_notification(operation: str, **notification_kwargs):
    """
    Specialized decorator for income operations.

    Args:
        operation: Operation type ('created', 'updated', 'deleted', 'ledger_updated')
        **notification_kwargs: Additional arguments for realtime_notification decorator
    """
    event_type = f"artha:income_{operation}"
    return realtime_notification(event_type, **notification_kwargs)


def expense_notification(operation: str, **notification_kwargs):
    """
    Specialized decorator for expense operations.

    Args:
        operation: Operation type ('created', 'updated', 'deleted')
        **notification_kwargs: Additional arguments for realtime_notification decorator
    """
    event_type = f"artha:expense_{operation}"
    return realtime_notification(event_type, **notification_kwargs)


def analytics_notification(**notification_kwargs):
    """
    Specialized decorator for analytics refresh operations.
    """
    return realtime_notification("artha:refresh_analytics", **notification_kwargs)


def task_notification(operation: str, **notification_kwargs):
    """
    Specialized decorator for task operations.

    Args:
        operation: Operation type ('progress', 'completed', 'failed')
    """
    event_type = f"artha:task_{operation}"
    return realtime_notification(event_type, **notification_kwargs)


def _send_realtime_notification(event_type: str, data: Dict[str, Any],
                                target_user: str = None, broadcast: bool = False,
                                rooms: List[str] = None):
    """
    Internal function to send realtime notifications.
    Updated default broadcast=False for security.
    """
    try:
        # Enhanced debug logging
        frappe.logger().info(f"🔔 Sending realtime notification: {event_type}")
        frappe.logger().info(
            f"📬 Target user: {target_user}, Broadcast: {broadcast}, Rooms: {rooms}")
        frappe.logger().debug(
            f"📊 Data: {json.dumps(data, default=str, indent=2)}")

        notifications_sent = 0

        # Send to specific user if specified
        if target_user:
            frappe.publish_realtime(
                event=event_type,
                message=data,
                user=target_user
            )
            notifications_sent += 1
            frappe.logger().info(f"✅ Sent to user: {target_user}")

        # Broadcast to all if enabled (security: now False by default)
        if broadcast:
            frappe.publish_realtime(
                event=event_type,
                message=data,
                room="all"
            )
            notifications_sent += 1
            frappe.logger().info(f"📢 Broadcasted to all users")

        # Send to additional rooms
        if rooms:
            for room in rooms:
                frappe.publish_realtime(
                    event=event_type,
                    message=data,
                    room=room
                )
                notifications_sent += 1
                frappe.logger().info(f"🏠 Sent to room: {room}")

        frappe.logger().info(
            f"🎯 Total notifications sent: {notifications_sent}")

    except Exception as e:
        frappe.logger().error(
            f"❌ Failed to send realtime notification: {str(e)}")
        frappe.log_error(
            f"Notification error details: {str(e)}", "Notification System")


def send_custom_notification(title: str, message: str, notification_type: str = 'info',
                             target_user: str = None, rooms: List[str] = None,
                             additional_data: Dict[str, Any] = None):
    """
    Utility function to send custom notifications programmatically.
    Enhanced for better testing and debugging.

    Args:
        title: Notification title
        message: Notification message
        notification_type: Type of notification ('info', 'success', 'warning', 'error')
        target_user: Specific user to notify (optional)
        rooms: Rooms to broadcast to (optional)
        additional_data: Extra data to include in notification (optional)
    """
    try:
        notification_data = {
            'title': title,
            'message': message,
            'type': notification_type,
            'timestamp': frappe.utils.now(),
            'user': frappe.session.user,
            'source': 'send_custom_notification'
        }

        # Add any additional data
        if additional_data:
            notification_data.update(additional_data)

        _send_realtime_notification(
            event_type="artha_notification",
            data=notification_data,
            target_user=target_user,
            # Only broadcast if no specific targets
            broadcast=not target_user and not rooms,
            rooms=rooms or []
        )

        # Log successful notification
        target_info = f"user: {target_user}" if target_user else f"rooms: {rooms}" if rooms else "broadcast"
        frappe.logger().info(
            f"Custom notification sent - Title: '{title}', Target: {target_info}")

    except Exception as e:
        frappe.logger().error(f"Failed to send custom notification: {str(e)}")
        frappe.log_error(
            f"Custom notification error: {str(e)}", "Notification System")


def bulk_notification(operation: str, entity_type: str, count: int, **notification_kwargs):
    """
    Decorator for bulk operations that affect multiple records.

    Args:
        operation: Operation type ('updated', 'processed', 'synced')
        entity_type: Type of entity ('income', 'expense', 'ledger')
        count: Number of records affected
    """
    event_type = f"artha:bulk_{entity_type}_{operation}"

    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            result = func(*args, **kwargs)

            if isinstance(result, dict) and result.get('status') == 'success':
                # Extract actual count from result if available
                actual_count = result.get(
                    'count', result.get('entries_added', count))

                notification_data = {
                    'operation': operation,
                    'entity_type': entity_type,
                    'count': actual_count,
                    'user': frappe.session.user,
                    'timestamp': frappe.utils.now()
                }

                _send_realtime_notification(
                    event_type=event_type,
                    data=notification_data,
                    broadcast=True
                )

                # Send custom notification message
                send_custom_notification(
                    title=f"Bulk {operation.title()} Complete",
                    message=f"{actual_count} {entity_type} records {operation}",
                    notification_type='success'
                )

            return result
        return wrapper
    return decorator


# Convenience decorators for common operations - SECURED
income_created = income_notification(
    'created', data_field='income_data')  # No broadcast
income_updated = income_notification(
    'updated', data_field='income_data')  # No broadcast
income_deleted = income_notification('deleted')  # No broadcast
ledger_updated = income_notification(
    'ledger_updated', data_field='ledger_data')  # No broadcast

expense_created = expense_notification(
    'created', data_field='expense_data')  # No broadcast
expense_updated = expense_notification(
    'updated', data_field='expense_data')  # No broadcast
expense_deleted = expense_notification('deleted')  # No broadcast

# Only analytics can be broadcast (non-sensitive)
analytics_refreshed = analytics_notification(broadcast=True)
