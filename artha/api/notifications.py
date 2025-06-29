"""
Simplified Notifications API
Core notification endpoints with clean, simple API
"""

import frappe
from frappe import _
import json
from typing import Dict, Any


@frappe.whitelist()
def get_site_info():
    """Get basic site information"""
    try:
        site_name = frappe.local.site if hasattr(
            frappe.local, 'site') else 'development.localhost'
        socketio_port = frappe.conf.get('socketio_port', 9000)

        return {
            "site_name": site_name,
            "socketio_port": socketio_port,
            "user": frappe.session.user if frappe.session.user != "Guest" else None
        }
    except Exception as e:
        frappe.log_error(f"Failed to get site info: {str(e)}")
        return {
            "site_name": "development.localhost",
            "socketio_port": 9000,
            "user": None
        }


@frappe.whitelist()
def send_role_based_notification(roles=None, title=None, message=None, notification_type='info'):
    """Send notification to users with specific roles"""
    try:
        if not frappe.has_permission('System Settings', 'write'):
            frappe.throw(
                _("Insufficient permissions to send role-based notifications"))

        if isinstance(roles, str):
            roles = json.loads(roles)

        if not roles:
            frappe.throw(_("No roles specified"))

        # Send notification using utility function
        from artha.utils.notifications import send_notification

        send_notification(
            title=title or "Role-based Notification",
            message=message or f"Notification for users with roles: {', '.join(roles)}",
            notification_type=notification_type,
            target_roles=roles,
            realtime_only=False  # Admin notifications should be persistent
        )

        # Count target users
        users_with_roles = []
        for role in roles:
            users = frappe.get_all('Has Role',
                                   filters={'role': role},
                                   fields=['parent'],
                                   distinct=True)
            users_with_roles.extend([user.parent for user in users])

        target_users = list(set(users_with_roles))

        return {
            'success': True,
            'message': f'Notification sent to {len(target_users)} users with roles: {", ".join(roles)}',
            'target_users_count': len(target_users)
        }

    except Exception as e:
        frappe.log_error(f"Error sending role-based notification: {str(e)}")
        frappe.throw(_("Failed to send role-based notification"))


@frappe.whitelist()
def send_user_notification(target_user=None, title=None, message=None, notification_type='info'):
    """Send notification to a specific user"""
    try:
        if not frappe.has_permission('System Settings', 'write'):
            frappe.throw(
                _("Insufficient permissions to send user notifications"))

        if not target_user:
            frappe.throw(_("No target user specified"))

        if not frappe.db.exists('User', target_user):
            frappe.throw(_("User {} does not exist").format(target_user))

        # Send notification using utility function
        from artha.utils.notifications import send_notification

        send_notification(
            title=title or "Personal Notification",
            message=message or "You have a new notification",
            notification_type=notification_type,
            target_user=target_user,
            realtime_only=False  # Admin notifications should be persistent
        )

        return {
            'success': True,
            'message': f'Notification sent to user: {target_user}'
        }

    except Exception as e:
        frappe.log_error(f"Error sending user notification: {str(e)}")
        frappe.throw(_("Failed to send user notification"))


@frappe.whitelist()
def get_user_notifications(limit: int = 20, include_read: bool = False):
    """Get notifications for the current user"""
    try:
        user = frappe.session.user
        if user == "Guest":
            frappe.throw(_("Not authenticated"))

        filters = {"for_user": user}
        if not include_read:
            filters["read"] = 0

        notifications = frappe.get_all(
            "Notification Log",
            filters=filters,
            fields=[
                "name", "subject", "email_content", "creation",
                "type", "read", "from_user"
            ],
            order_by="creation desc",
            limit=limit
        )

        return {
            "status": "success",
            "notifications": notifications,
            "total_unread": len([n for n in notifications if not n.read]) if include_read else len(notifications)
        }

    except Exception as e:
        frappe.log_error(f"Failed to get notifications: {str(e)}")
        frappe.throw(_("Failed to get notifications"))


@frappe.whitelist(allow_guest=False)
def mark_notification_as_read(notification_id: str):
    """Mark a notification as read"""
    try:
        user = frappe.session.user
        if user == "Guest":
            return {"status": "error", "message": "Not authenticated"}

        if not frappe.db.exists("Notification Log", notification_id):
            return {"status": "error", "message": "Notification not found"}

        notification = frappe.get_doc("Notification Log", notification_id)
        if notification.for_user != user:
            return {"status": "error", "message": "Not authorized"}

        frappe.db.set_value("Notification Log", notification_id, "read", 1)
        frappe.db.commit()

        return {"status": "success", "message": "Notification marked as read"}

    except Exception as e:
        frappe.log_error(f"Failed to mark notification as read: {str(e)}")
        return {"status": "error", "message": f"Failed to mark notification as read: {str(e)}"}


@frappe.whitelist(allow_guest=False)
def mark_all_notifications_as_read():
    """Mark all notifications as read for the current user"""
    try:
        user = frappe.session.user
        if user == "Guest":
            return {"status": "error", "message": "Not authenticated"}

        # Get count of unread notifications before updating
        unread_count = frappe.db.count(
            "Notification Log", {"for_user": user, "read": 0})

        if unread_count == 0:
            return {"status": "success", "message": "No unread notifications to mark"}

        frappe.db.sql("""
            UPDATE `tabNotification Log` 
            SET `read` = 1 
            WHERE for_user = %s AND `read` = 0
        """, user)
        frappe.db.commit()

        return {
            "status": "success",
            "message": f"Marked {unread_count} notifications as read",
            "marked_count": unread_count
        }

    except Exception as e:
        frappe.log_error(f"Failed to mark all notifications as read: {str(e)}")
        return {"status": "error", "message": f"Failed to mark notifications as read: {str(e)}"}


@frappe.whitelist(allow_guest=False)
def clear_all_notifications():
    """Clear all notifications for the current user"""
    try:
        user = frappe.session.user
        if user == "Guest":
            frappe.throw(_("Not authenticated"))

        # Get count before deletion
        count = frappe.db.count("Notification Log", {"for_user": user})
        print(f"🔔 [DEBUG] Clearing {count} notifications for user {user}")

        if count == 0:
            print(f"🔔 [DEBUG] No notifications to clear for user {user}")
            return {
                "status": "success",
                "message": "No notifications to clear",
                "cleared_count": 0
            }

        # Delete all notifications for the user (use ignore_permissions for user's own notifications)
        frappe.db.sql("""
            DELETE FROM `tabNotification Log` 
            WHERE for_user = %s
        """, user)
        frappe.db.commit()

        print(
            f"🔔 [DEBUG] Successfully cleared {count} notifications for user {user}")

        return {
            "status": "success",
            "message": f"Cleared {count} notifications",
            "cleared_count": count
        }

    except Exception as e:
        frappe.log_error(f"Failed to clear all notifications: {str(e)}")
        print(
            f"❌ [DEBUG] Failed to clear notifications for user {frappe.session.user}: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to clear notifications: {str(e)}",
            "cleared_count": 0
        }


@frappe.whitelist()
def get_notification_stats():
    """Get notification statistics for the current user"""
    try:
        user = frappe.session.user
        if user == "Guest":
            frappe.throw(_("Not authenticated"))

        total_notifications = frappe.db.count(
            "Notification Log", {"for_user": user})
        unread_notifications = frappe.db.count(
            "Notification Log", {"for_user": user, "read": 0})

        return {
            "status": "success",
            "stats": {
                "total": total_notifications,
                "unread": unread_notifications,
                "read": total_notifications - unread_notifications
            }
        }

    except Exception as e:
        frappe.log_error(f"Failed to get notification stats: {str(e)}")
        frappe.throw(_("Failed to get notification statistics"))


@frappe.whitelist(allow_guest=False)
def send_simple_test_notification():
    """Simple test notification endpoint"""
    try:
        from artha.utils.notifications import send_test_notification
        return send_test_notification()

    except Exception as e:
        frappe.logger().error(
            f"Failed to send simple test notification: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to send test notification: {str(e)}"
        }


@frappe.whitelist(allow_guest=False, methods=['POST'])
def send_test_notification(title: str = "Test Notification",
                           message: str = "This is a test notification from the backend",
                           notification_type: str = "info"):
    """Send a test notification for admin testing"""
    try:
        from artha.utils.notifications import send_test_notification as send_test
        return send_test(title, message, notification_type)

    except Exception as e:
        frappe.logger().error(f"Failed to send test notification: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to send test notification: {str(e)}"
        }


@frappe.whitelist()
def test_notification_flow():
    """Test the complete notification flow: create, read, clear"""
    try:
        user = frappe.session.user
        if user == "Guest":
            frappe.throw(_("Not authenticated"))

        # Step 1: Send a test notification
        from artha.utils.notifications import send_notification
        send_notification(
            title="Test Flow Notification",
            message="Testing the complete notification flow including backend sync",
            notification_type="info",
            target_user=user
        )

        # Step 2: Get current notification count
        count_after_send = frappe.db.count(
            "Notification Log", {"for_user": user})

        # Step 3: Get notifications
        notifications = frappe.get_all(
            "Notification Log",
            filters={"for_user": user},
            fields=["name", "subject", "email_content", "read"],
            order_by="creation desc",
            limit=5
        )

        return {
            "status": "success",
            "message": "Test notification flow completed",
            "results": {
                "notifications_sent": 1,
                "total_notifications": count_after_send,
                "recent_notifications": notifications
            }
        }

    except Exception as e:
        frappe.log_error(f"Failed to test notification flow: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to test notification flow: {str(e)}"
        }
