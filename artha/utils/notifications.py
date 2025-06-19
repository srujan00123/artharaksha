"""
Notification decorators and utilities for Artha APIs
Core notification system following Frappe's realtime patterns

Main Functions:
- @realtime_notification() decorator for automatic API notifications  
- send_notification() for manual user/role/room notifications
- invalidate_resource_cache() for frontend cache invalidation
"""

import frappe
import functools
from typing import Dict, Any, Optional, Union, List
import json


def realtime_notification(event_type: str, data_field: str = None, user_field: str = None,
                          broadcast: bool = False, rooms: List[str] = None):
    """
    Decorator to automatically send real-time notifications for API operations.
    Follows Frappe's publish_realtime patterns for security and consistency.

    Security: broadcast=False by default prevents data leaks to other users.
    Financial data is included for user-specific notifications (secure).
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            try:
                result = func(*args, **kwargs)

                if isinstance(result, dict) and result.get('status') == 'success':
                    notification_data = _sanitize_notification_data(
                        result, data_field)

                    event_data = {
                        'event_type': event_type,
                        'data': notification_data,
                        'user': frappe.session.user,
                        'timestamp': frappe.utils.now(),
                        'function': func.__name__
                    }

                    target_user = frappe.session.user
                    if user_field:
                        if user_field in result:
                            target_user = result[user_field]
                        elif isinstance(notification_data, dict) and user_field in notification_data:
                            target_user = notification_data[user_field]

                    _send_realtime_notification(
                        event_type=event_type,
                        data=event_data,
                        target_user=target_user,
                        broadcast=broadcast,
                        rooms=rooms or []
                    )

                return result

            except Exception as e:
                frappe.logger().error(
                    f"Error sending realtime notification for {func.__name__}: {str(e)}")
                return result

        return wrapper
    return decorator


def _sanitize_notification_data(result: Dict[str, Any], data_field: str = None) -> Dict[str, Any]:
    """Prepare notification data for user-specific notifications."""
    try:
        if not data_field:
            return {
                'status': result.get('status', 'success'),
                'message': result.get('message', 'Operation completed'),
                'timestamp': frappe.utils.now()
            }

        notification_data = result.get(data_field, {})

        if isinstance(notification_data, dict):
            safe_data = {}
            sensitive_fields = ['password', 'token', 'api_key', 'secret']

            for field, value in notification_data.items():
                if field.lower() not in sensitive_fields:
                    safe_data[field] = value

            if 'timestamp' not in safe_data:
                safe_data['timestamp'] = frappe.utils.now()

            return safe_data

        return notification_data

    except Exception as e:
        frappe.logger().error(f"Error preparing notification data: {str(e)}")
        return {
            'status': 'success',
            'message': 'Operation completed',
            'timestamp': frappe.utils.now()
        }


def _send_realtime_notification(event_type: str, data: Dict[str, Any],
                                target_user: str = None, broadcast: bool = False,
                                rooms: List[str] = None):
    """
    Internal function to send realtime notifications following Frappe patterns.
    Uses frappe.publish_realtime with proper room/user targeting.
    """
    try:
        notifications_sent = 0

        # Send to specific user (most secure)
        if target_user and target_user != "Guest":
            frappe.publish_realtime(
                event=event_type,
                message=data,
                user=target_user
            )
            notifications_sent += 1

        # Send to all users (use with caution)
        if broadcast:
            frappe.publish_realtime(
                event=event_type,
                message=data,
                room="all"
            )
            notifications_sent += 1

        # Send to specific rooms
        if rooms:
            for room in rooms:
                frappe.publish_realtime(
                    event=event_type,
                    message=data,
                    room=room
                )
                notifications_sent += 1

        frappe.logger().info(
            f"Sent {notifications_sent} realtime notifications for {event_type}")

    except Exception as e:
        frappe.logger().error(
            f"Failed to send realtime notification: {str(e)}")


def send_notification(title: str, message: str, notification_type: str = 'info',
                      target_user: str = None, target_roles: List[str] = None,
                      rooms: List[str] = None, document_type: str = None,
                      document_name: str = None):
    """
    Core notification function for user-specific and role-based notifications.
    Creates both realtime and persistent notifications following Frappe patterns.
    """
    try:
        notification_data = {
            'title': title,
            'message': message,
            'type': notification_type,
            'timestamp': frappe.utils.now(),
            'user': frappe.session.user
        }

        # Send to specific user
        if target_user and target_user != "Guest":
            # Create persistent notification
            _create_notification_log_entry(
                title=title,
                message=message,
                notification_type=notification_type,
                target_user=target_user,
                document_type=document_type,
                document_name=document_name
            )

            # Send realtime notification using Frappe's standard event
            frappe.publish_realtime(
                event="artha_notification",
                message=notification_data,
                user=target_user
            )

        # Send to users with specific roles
        if target_roles:
            for role in target_roles:
                users = frappe.get_all('Has Role',
                                       filters={'role': role,
                                                'parent': ['!=', 'Guest']},
                                       fields=['parent'],
                                       distinct=True)

                for user_doc in users:
                    user = user_doc.parent
                    if user != "Guest":
                        _create_notification_log_entry(
                            title=title,
                            message=message,
                            notification_type=notification_type,
                            target_user=user,
                            document_type=document_type,
                            document_name=document_name
                        )

                        frappe.publish_realtime(
                            event="artha_notification",
                            message=notification_data,
                            user=user
                        )

        # Send to specific rooms using Frappe's room system
        if rooms:
            for room in rooms:
                frappe.publish_realtime(
                    event="artha_notification",
                    message=notification_data,
                    room=room
                )

        frappe.logger().info(f"Notification sent: {title}")

    except Exception as e:
        frappe.logger().error(f"Failed to send notification: {str(e)}")


def _create_notification_log_entry(title: str, message: str, notification_type: str,
                                   target_user: str, document_type: str = None,
                                   document_name: str = None):
    """Create a persistent notification using Frappe's Notification Log system."""
    try:
        notification = frappe.new_doc("Notification Log")
        notification.for_user = target_user
        notification.from_user = frappe.session.user or "Administrator"
        notification.subject = title
        notification.email_content = message
        notification.type = "Alert"

        if document_type and document_name:
            notification.document_type = document_type
            notification.document_name = document_name

        notification.insert(ignore_permissions=True)
        frappe.db.commit()

        return notification.name

    except Exception as e:
        frappe.logger().error(
            f"Failed to create Notification Log entry: {str(e)}")
        return None


# Note: Removed specialized notification functions - use send_notification() directly
# with appropriate parameters for role-based, user-specific notifications


# Note: Removed convenience decorators in favor of direct @realtime_notification usage
# This ensures consistent event naming and better maintainability


# Note: For progress notifications, use frappe.publish_progress() directly


def invalidate_resource_cache(cache_key: str, user: str = None) -> Dict[str, Any]:
    """Invalidate frontend resource cache (CRM-style approach)."""
    try:
        if not cache_key:
            raise ValueError("Cache key is required")

        # Send cache invalidation event
        frappe.publish_realtime(
            event="refetch_resource",
            message={"cache_key": cache_key},
            user=user or frappe.session.user
        )

        return {
            "status": "success",
            "message": f"Cache invalidated for key: {cache_key}"
        }

    except Exception as e:
        frappe.logger().error(f"Failed to invalidate resource cache: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to invalidate cache: {str(e)}"
        }


# Note: Removed document-specific notification function
# Use @realtime_notification decorator on API functions instead
