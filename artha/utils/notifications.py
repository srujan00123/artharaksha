"""
Notification decorators and utilities for Artha APIs
Core notification system following Frappe's realtime patterns
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


# Specialized notification functions following Frappe patterns
def send_income_notification(title: str, message: str, target_user: str = None,
                             income_name: str = None, amount: float = None, **kwargs):
    """Send income-related notifications with financial data."""
    try:
        if not target_user:
            target_user = frappe.session.user

        if amount:
            formatted_amount = f"₹{amount:,.0f}"
            if formatted_amount not in message:
                message = f"{message} - {formatted_amount}"

        send_notification(
            title=title,
            message=message,
            notification_type="success",
            target_user=target_user,
            document_type="Income" if income_name else None,
            document_name=income_name
        )

        # Also send realtime event for income-specific listeners
        if income_name:
            frappe.publish_realtime(
                event="artha:income_updated",
                message={
                    'title': title,
                    'message': message,
                    'amount': amount,
                    'income_name': income_name,
                    'timestamp': frappe.utils.now(),
                    **kwargs
                },
                user=target_user
            )

    except Exception as e:
        frappe.logger().error(f"Failed to send income notification: {str(e)}")


def send_role_notification(title: str, message: str, roles: List[str],
                           notification_type: str = 'info'):
    """Send notifications to users with specific roles using Frappe patterns."""
    try:
        send_notification(
            title=title,
            message=message,
            notification_type=notification_type,
            target_roles=roles
        )

        # Also send to role-based rooms for realtime updates
        for role in roles:
            frappe.publish_realtime(
                event="artha_notification",
                message={
                    'title': title,
                    'message': message,
                    'type': notification_type,
                    'timestamp': frappe.utils.now(),
                    'role': role
                },
                room=f"role:{role}"
            )

    except Exception as e:
        frappe.logger().error(f"Failed to send role notification: {str(e)}")


# Convenience decorators for common operations
def income_notification(operation: str, **kwargs):
    """Specialized decorator for income operations."""
    event_type = f"artha:income_{operation}"
    return realtime_notification(event_type, **kwargs)


def expense_notification(operation: str, **kwargs):
    """Specialized decorator for expense operations."""
    event_type = f"artha:expense_{operation}"
    return realtime_notification(event_type, **kwargs)


# Predefined decorators following Frappe event naming
income_created = income_notification(
    'ledger_created', data_field='ledger_entry')
income_updated = income_notification(
    'ledger_updated', data_field='ledger_entry')
income_deleted = income_notification(
    'ledger_deleted', data_field='deleted_entry')

expense_created = expense_notification('created', data_field='expense_data')
expense_updated = expense_notification('updated', data_field='expense_data')
expense_deleted = expense_notification('deleted')


# Progress notification using Frappe's standard progress system
def send_progress_notification(percent: int, title: str = "Processing",
                               description: str = "", user: str = None):
    """Send progress notification using Frappe's publish_progress."""
    try:
        frappe.publish_progress(
            percent=percent,
            title=title,
            description=description,
            user=user or frappe.session.user
        )
    except Exception as e:
        frappe.logger().error(
            f"Failed to send progress notification: {str(e)}")


# Document-specific notifications using Frappe's DocType events
def send_document_notification(doctype: str, docname: str, event: str,
                               message: str = None, user: str = None):
    """Send document-specific notifications using Frappe's document rooms."""
    try:
        notification_data = {
            'doctype': doctype,
            'docname': docname,
            'event': event,
            'message': message or f"{doctype} {docname} {event}",
            'timestamp': frappe.utils.now()
        }

        # Send to document-specific room
        frappe.publish_realtime(
            event=f"doc_update",
            message=notification_data,
            room=f"doc:{doctype}/{docname}"
        )

        # Send to DocType room
        frappe.publish_realtime(
            event=f"doctype_update",
            message=notification_data,
            room=f"doctype:{doctype}"
        )

        # Send to specific user if provided
        if user:
            frappe.publish_realtime(
                event="artha_notification",
                message={
                    'title': f"{doctype} Updated",
                    'message': notification_data['message'],
                    'type': 'info',
                    'document_type': doctype,
                    'document_name': docname
                },
                user=user
            )

    except Exception as e:
        frappe.logger().error(
            f"Failed to send document notification: {str(e)}")
