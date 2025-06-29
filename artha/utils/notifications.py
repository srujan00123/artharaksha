"""
Simplified Notification utilities for Artha APIs
Core notification system with clean, simple API
"""

import frappe
import functools
from typing import Dict, Any, Optional, List
import json


def realtime_notification(event_type: str, data_field: str = None):
    """
    Simple decorator to send real-time notifications for API operations.
    """
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            try:
                result = func(*args, **kwargs)

                if isinstance(result, dict) and result.get('status') == 'success':
                    # Send simple realtime event
                    data = result.get(data_field, {}) if data_field else result

                    frappe.publish_realtime(
                        event=event_type,
                        message={
                            'data': data,
                            'user': frappe.session.user,
                            'timestamp': frappe.utils.now()
                        },
                        user=frappe.session.user
                    )

                return result

            except Exception as e:
                frappe.logger().error(f"Error in {func.__name__}: {str(e)}")
                return result

        return wrapper
    return decorator


def send_notification(title: str, message: str, notification_type: str = 'info',
                      target_user: str = None, target_roles: List[str] = None,
                      realtime_only: bool = True):
    """
    Send simple notification to user(s) or role(s)

    Args:
        realtime_only: If True, only sends realtime event without creating Notification Log
                      This prevents duplicate notifications from Frappe core events
    """
    try:
        # Send to specific user
        if target_user and target_user != "Guest":
            # Only create notification log if not realtime-only
            if not realtime_only:
                notification = frappe.new_doc("Notification Log")
                notification.for_user = target_user
                notification.from_user = frappe.session.user or "Administrator"
                notification.subject = title
                notification.email_content = message
                notification.type = "Alert"
                notification.insert(ignore_permissions=True)

            # Always send realtime notification
            frappe.publish_realtime(
                event="artha:notification",
                message={
                    'title': title,
                    'message': message,
                    'type': notification_type,
                    'timestamp': frappe.utils.now()
                },
                user=target_user
            )
            print(
                f"🔔 [DEBUG] Sent realtime notification to user {target_user}: {title}")

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
                        # Only create notification log if not realtime-only
                        if not realtime_only:
                            notification = frappe.new_doc("Notification Log")
                            notification.for_user = user
                            notification.from_user = frappe.session.user or "Administrator"
                            notification.subject = title
                            notification.email_content = message
                            notification.type = "Alert"
                            notification.insert(ignore_permissions=True)

                        # Always send realtime notification
                        frappe.publish_realtime(
                            event="artha:notification",
                            message={
                                'title': title,
                                'message': message,
                                'type': notification_type,
                                'timestamp': frappe.utils.now()
                            },
                            user=user
                        )
                        print(
                            f"🔔 [DEBUG] Sent realtime notification to user {user} (role {role}): {title}")

        if not realtime_only:
            frappe.db.commit()

    except Exception as e:
        frappe.logger().error(f"Failed to send notification: {str(e)}")


@frappe.whitelist()
def send_test_notification(title: str = "Test Notification",
                           message: str = "This is a test notification",
                           notification_type: str = "info"):
    """
    Send a test notification to the current user
    """
    try:
        if frappe.session.user == "Guest":
            frappe.throw("Please login to test notifications")

        send_notification(
            title=title,
            message=message,
            notification_type=notification_type,
            target_user=frappe.session.user
        )

        return {
            "status": "success",
            "message": "Test notification sent successfully"
        }

    except Exception as e:
        frappe.logger().error(f"Failed to send test notification: {str(e)}")
        frappe.throw(f"Failed to send test notification: {str(e)}")


@frappe.whitelist()
def test_socket_connection():
    """
    Test socket connection by sending a simple event
    """
    try:
        if frappe.session.user == "Guest":
            frappe.throw("Please login to test socket connection")

        frappe.publish_realtime(
            event="artha:test_connection",
            message={
                "message": "Socket connection test successful",
                "timestamp": frappe.utils.now(),
                "user": frappe.session.user
            },
            user=frappe.session.user
        )

        return {
            "status": "success",
            "message": "Socket test event sent successfully"
        }

    except Exception as e:
        frappe.logger().error(f"Failed to test socket connection: {str(e)}")
        frappe.throw(f"Failed to test socket connection: {str(e)}")
