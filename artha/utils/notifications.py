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
                             additional_data: Dict[str, Any] = None,
                             document_type: str = None, document_name: str = None,
                             use_notification_log: bool = True):
    """
    Enhanced notification function that uses Frappe's Notification Log system
    This creates persistent notifications that appear in the user's notification center

    Args:
        title: Notification title
        message: Notification message  
        notification_type: Type of notification ('info', 'success', 'warning', 'error')
        target_user: Specific user to notify (optional)
        rooms: Rooms to broadcast to (optional)
        additional_data: Extra data to include in notification (optional)
        document_type: Related document type (optional)
        document_name: Related document name (optional)
        use_notification_log: Whether to create persistent notification (default: True)
    """
    try:
        # If target_user is specified, create a Notification Log entry for persistent notification
        if target_user and use_notification_log:
            _create_notification_log_entry(
                title=title,
                message=message,
                notification_type=notification_type,
                target_user=target_user,
                document_type=document_type,
                document_name=document_name
            )

        # Also send real-time notification for immediate display
        notification_data = {
            'title': title,
            'message': message,
            'type': notification_type,
            'timestamp': frappe.utils.now(),
            'user': frappe.session.user,
            'source': 'enhanced_notification_system'
        }

        # Add any additional data
        if additional_data:
            notification_data.update(additional_data)

        # Send real-time notification
        _send_realtime_notification(
            event_type="artha_notification",
            data=notification_data,
            target_user=target_user,
            broadcast=not target_user and not rooms,
            rooms=rooms or []
        )

        # Log successful notification
        target_info = f"user: {target_user}" if target_user else f"rooms: {rooms}" if rooms else "broadcast"
        frappe.logger().info(
            f"Enhanced notification sent - Title: '{title}', Target: {target_info}, Persistent: {use_notification_log}")

    except Exception as e:
        frappe.logger().error(
            f"Failed to send enhanced notification: {str(e)}")
        frappe.log_error(
            f"Enhanced notification error: {str(e)}", "Notification System")


def _create_notification_log_entry(title: str, message: str, notification_type: str,
                                   target_user: str, document_type: str = None,
                                   document_name: str = None):
    """
    Create a persistent notification using Frappe's Notification Log system
    This creates notifications that persist in the user's notification center
    """
    try:
        # Map our notification types to Frappe's notification types
        frappe_type_map = {
            'info': 'Alert',
            'success': 'Alert',
            'warning': 'Alert',
            'error': 'Alert',
            'income': 'Alert',
            'expense': 'Alert'
        }

        frappe_type = frappe_type_map.get(notification_type, 'Alert')

        # Create notification log entry
        notification = frappe.new_doc("Notification Log")
        notification.for_user = target_user
        notification.from_user = frappe.session.user or "Administrator"
        notification.subject = title
        notification.email_content = message
        notification.type = frappe_type

        # Link to document if provided
        if document_type and document_name:
            notification.document_type = document_type
            notification.document_name = document_name
            # Create link for easy access
            notification.link = f"/app/{document_type.lower().replace(' ', '-')}/{document_name}"

        # Save notification (this automatically triggers real-time notification via after_insert)
        notification.insert(ignore_permissions=True)
        frappe.db.commit()

        frappe.logger().info(
            f"Created Notification Log entry: {notification.name} for user: {target_user}")

        return notification.name

    except Exception as e:
        frappe.logger().error(
            f"Failed to create Notification Log entry: {str(e)}")
        frappe.log_error(
            f"Notification Log creation error: {str(e)}", "Notification System")
        return None


def send_income_notification(title: str, message: str, target_user: str = None,
                             income_name: str = None, amount: float = None,
                             entry_type: str = None):
    """
    Specialized function for sending income-related notifications
    Uses Notification Log for persistence and includes income-specific data
    """
    try:
        # Default to current user if not specified
        if not target_user:
            target_user = frappe.session.user

        # Enhance message with amount if provided
        if amount:
            formatted_amount = f"₹{amount:,.0f}"
            if formatted_amount not in message:
                message = f"{message} - {formatted_amount}"

        # Create notification with income document link if available
        document_type = "Income" if income_name else None

        # Send enhanced notification
        send_custom_notification(
            title=title,
            message=message,
            notification_type="success",
            target_user=target_user,
            document_type=document_type,
            document_name=income_name,
            additional_data={
                "amount": amount,
                "entry_type": entry_type,
                "category": "income",
                "formatted_amount": f"₹{amount:,.0f}" if amount else None
            }
        )

        frappe.logger().info(
            f"Income notification sent: {title} to {target_user}")

    except Exception as e:
        frappe.logger().error(f"Failed to send income notification: {str(e)}")


def send_expense_notification(title: str, message: str, target_user: str = None,
                              expense_name: str = None, amount: float = None,
                              category: str = None):
    """
    Specialized function for sending expense-related notifications
    Uses Notification Log for persistence and includes expense-specific data
    """
    try:
        # Default to current user if not specified
        if not target_user:
            target_user = frappe.session.user

        # Enhance message with amount if provided
        if amount:
            formatted_amount = f"₹{amount:,.0f}"
            if formatted_amount not in message:
                message = f"{message} - {formatted_amount}"

        # Create notification with expense document link if available
        document_type = "Expense" if expense_name else None

        # Send enhanced notification
        send_custom_notification(
            title=title,
            message=message,
            notification_type="info",
            target_user=target_user,
            document_type=document_type,
            document_name=expense_name,
            additional_data={
                "amount": amount,
                "category": category,
                "type": "expense",
                "formatted_amount": f"₹{amount:,.0f}" if amount else None
            }
        )

        frappe.logger().info(
            f"Expense notification sent: {title} to {target_user}")

    except Exception as e:
        frappe.logger().error(f"Failed to send expense notification: {str(e)}")


def get_user_notifications(limit: int = 20, include_read: bool = False):
    """
    Get notifications for the current user using Frappe's Notification Log
    This integrates with the standard Frappe notification system
    """
    try:
        user = frappe.session.user
        if user == "Guest":
            return []

        filters = {"for_user": user}
        if not include_read:
            filters["read"] = 0

        notifications = frappe.get_all(
            "Notification Log",
            filters=filters,
            fields=[
                "name", "subject", "email_content", "creation",
                "document_type", "document_name", "type", "read",
                "from_user", "link"
            ],
            order_by="creation desc",
            limit=limit
        )

        # Enhance with user info
        for notification in notifications:
            if notification.from_user:
                notification.from_user_fullname = frappe.get_value(
                    "User", notification.from_user, "full_name"
                ) or notification.from_user

        return notifications

    except Exception as e:
        frappe.logger().error(f"Failed to get user notifications: {str(e)}")
        return []


def mark_notification_as_read(notification_id: str):
    """
    Mark a notification as read using Frappe's standard system
    """
    try:
        user = frappe.session.user
        if user == "Guest":
            return False

        # Verify notification belongs to user
        notification = frappe.get_doc("Notification Log", notification_id)
        if notification.for_user != user:
            frappe.logger().warning(
                f"User {user} attempted to mark notification {notification_id} as read, but it belongs to {notification.for_user}")
            return False

        # Mark as read
        notification.read = 1
        notification.save(ignore_permissions=True)
        frappe.db.commit()

        return True

    except Exception as e:
        frappe.logger().error(f"Failed to mark notification as read: {str(e)}")
        return False


def mark_all_notifications_as_read():
    """
    Mark all notifications as read for the current user
    """
    try:
        user = frappe.session.user
        if user == "Guest":
            return False

        # Use Frappe's built-in method
        frappe.call(
            "frappe.desk.doctype.notification_log.notification_log.mark_all_as_read")

        return True

    except Exception as e:
        frappe.logger().error(
            f"Failed to mark all notifications as read: {str(e)}")
        return False


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
