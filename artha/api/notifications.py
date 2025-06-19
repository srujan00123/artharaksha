"""
Notifications API
Core notification endpoints for role-based and user-specific notifications
"""

import frappe
from frappe import _
import json
from typing import Dict, Any


@frappe.whitelist()
def get_site_info():
    """Get site information including socket configuration."""
    try:
        site_config = frappe.conf
        site_name = frappe.local.site if hasattr(
            frappe.local, 'site') else 'development.localhost'
        socketio_port = site_config.get('socketio_port', 9000)
        is_development = frappe.conf.get('developer_mode', 1) == 1
        environment = "development" if is_development else "production"

        return {
            "site_name": site_name,
            "socketio_port": socketio_port,
            "environment": environment,
            "user": frappe.session.user if frappe.session.user != "Guest" else None
        }

    except Exception as e:
        frappe.log_error(f"Failed to get site info: {str(e)}")
        return {
            "site_name": "development.localhost",
            "socketio_port": 9000,
            "environment": "development",
            "user": None
        }


@frappe.whitelist()
def get_user_rooms():
    """Get socket rooms that the current user should join."""
    try:
        user = frappe.session.user
        if user == "Guest":
            return {"rooms": ["website", "all"]}

        rooms = [
            "all",
            "website",
            f"user:{user}"
        ]

        # Add role-based rooms
        user_roles = frappe.get_roles(user)
        for role in user_roles:
            rooms.append(f"role:{role}")

        # Add site room
        if hasattr(frappe.local, 'site'):
            rooms.append(f"site:{frappe.local.site}")

        return {"rooms": rooms}

    except Exception as e:
        frappe.log_error(f"Failed to get user rooms: {str(e)}")
        return {"rooms": ["all", "website"]}


@frappe.whitelist()
def send_role_based_notification(roles=None, title=None, message=None, notification_type='info'):
    """Send notification to users with specific roles."""
    try:
        if not frappe.has_permission('System Settings', 'write'):
            frappe.throw(
                _("Insufficient permissions to send role-based notifications"))

        if isinstance(roles, str):
            roles = json.loads(roles)

        if not roles:
            frappe.throw(_("No roles specified"))

        # Validate roles
        allowed_roles = ['Artha User', 'Insights User',
                         'System Manager', 'Administrator']
        invalid_roles = [role for role in roles if role not in allowed_roles]
        if invalid_roles:
            frappe.throw(_("Invalid roles: {}. Only {} are allowed.").format(
                ', '.join(invalid_roles), ', '.join(allowed_roles)
            ))

        # Send notification using utility function
        from artha.utils.notifications import send_role_notification

        send_role_notification(
            title=title or "Role-based Notification",
            message=message or f"Notification for users with roles: {', '.join(roles)}",
            roles=roles,
            notification_type=notification_type
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
def send_room_notification(room=None, title=None, message=None, notification_type='info'):
    """Send notification to a specific room."""
    try:
        if not frappe.has_permission('System Settings', 'write'):
            frappe.throw(
                _("Insufficient permissions to send room notifications"))

        if not room:
            frappe.throw(_("No room specified"))

        # Validate room
        allowed_rooms = ['all', 'website', 'admin',
                         'artha_users', 'insights_users']
        if room not in allowed_rooms and not room.startswith('user:'):
            frappe.throw(_("Invalid room: {}. Only {} and user-specific rooms are allowed.").format(
                room, ', '.join(allowed_rooms)
            ))

        # Send notification using utility function
        from artha.utils.notifications import send_notification

        send_notification(
            title=title or "Room Notification",
            message=message or f"Notification for room: {room}",
            notification_type=notification_type,
            rooms=[room]
        )

        return {
            'success': True,
            'message': f'Notification sent to room: {room}'
        }

    except Exception as e:
        frappe.log_error(f"Error sending room notification: {str(e)}")
        frappe.throw(_("Failed to send room notification"))


@frappe.whitelist()
def send_user_notification(target_user=None, title=None, message=None, notification_type='info'):
    """Send notification to a specific user."""
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
            target_user=target_user
        )

        return {
            'success': True,
            'message': f'Notification sent to user: {target_user}'
        }

    except Exception as e:
        frappe.log_error(f"Error sending user notification: {str(e)}")
        frappe.throw(_("Failed to send user notification"))


@frappe.whitelist()
def get_available_rooms():
    """Get list of available rooms for the current user."""
    try:
        user_rooms_data = get_user_rooms()
        user_roles = frappe.get_roles(frappe.session.user)

        # Define available rooms with descriptions
        all_rooms = {
            'all': 'All System Users',
            'website': 'All Users (including Guests)',
            'admin': 'System Administrators',
            'artha_users': 'Artha Application Users',
            'insights_users': 'Insights Application Users'
        }

        # Filter rooms based on user permissions
        available_rooms = {}

        # System admins can access all rooms
        if 'System Manager' in user_roles or 'Administrator' in user_roles:
            available_rooms = all_rooms
        else:
            # Regular users can only access rooms they belong to
            user_rooms = user_rooms_data.get('rooms', [])
            for room in user_rooms:
                if room.startswith('user:'):
                    continue  # Skip personal rooms from general list
                if room in all_rooms:
                    available_rooms[room] = all_rooms[room]

        return {
            'success': True,
            'available_rooms': available_rooms,
            'user_rooms': user_rooms_data.get('rooms', []),
            'user_roles': user_roles
        }

    except Exception as e:
        frappe.log_error(f"Error getting available rooms: {str(e)}")
        return {
            'success': False,
            'available_rooms': {},
            'user_rooms': [],
            'user_roles': []
        }


@frappe.whitelist()
def get_user_notifications_enhanced(limit: int = 20, include_read: bool = False):
    """Get notifications for the current user using Frappe's Notification Log system."""
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
                "document_type", "document_name", "type", "read",
                "from_user"
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

            notification.created_ago = frappe.utils.pretty_date(
                notification.creation)

            if notification.document_type and notification.document_name:
                notification.action_link = f"/app/{notification.document_type.lower().replace(' ', '-')}/{notification.document_name}"

        return {
            "status": "success",
            "notifications": notifications,
            "total_unread": len([n for n in notifications if not n.read]) if include_read else len(notifications)
        }

    except Exception as e:
        frappe.log_error(f"Failed to get enhanced notifications: {str(e)}")
        frappe.throw(_("Failed to get notifications"))


@frappe.whitelist()
def mark_notification_as_read_enhanced(notification_id: str):
    """Mark a notification as read using Frappe's standard system."""
    try:
        user = frappe.session.user
        if user == "Guest":
            frappe.throw(_("Not authenticated"))

        notification = frappe.get_doc("Notification Log", notification_id)
        if notification.for_user != user:
            frappe.throw(_("Not authorized"))

        frappe.call("frappe.desk.doctype.notification_log.notification_log.mark_as_read",
                    docname=notification_id)

        return {"status": "success", "message": "Notification marked as read"}

    except Exception as e:
        frappe.log_error(f"Failed to mark notification as read: {str(e)}")
        frappe.throw(_("Failed to mark notification as read"))


@frappe.whitelist()
def mark_all_notifications_as_read_enhanced():
    """Mark all notifications as read for the current user."""
    try:
        user = frappe.session.user
        if user == "Guest":
            frappe.throw(_("Not authenticated"))

        frappe.call(
            "frappe.desk.doctype.notification_log.notification_log.mark_all_as_read")

        return {"status": "success", "message": "All notifications marked as read"}

    except Exception as e:
        frappe.log_error(f"Failed to mark all notifications as read: {str(e)}")
        frappe.throw(_("Failed to mark all notifications as read"))


@frappe.whitelist()
def get_notification_stats():
    """Get notification statistics for the current user."""
    try:
        user = frappe.session.user
        if user == "Guest":
            frappe.throw(_("Not authenticated"))

        total_notifications = frappe.db.count(
            "Notification Log", {"for_user": user})
        unread_notifications = frappe.db.count(
            "Notification Log", {"for_user": user, "read": 0})

        recent_notifications = frappe.get_all(
            "Notification Log",
            filters={"for_user": user},
            fields=["subject", "creation", "type", "read"],
            order_by="creation desc",
            limit=5
        )

        return {
            "status": "success",
            "stats": {
                "total": total_notifications,
                "unread": unread_notifications,
                "read": total_notifications - unread_notifications,
                "recent": recent_notifications
            }
        }

    except Exception as e:
        frappe.log_error(f"Failed to get notification stats: {str(e)}")
        frappe.throw(_("Failed to get notification statistics"))


# Simple test endpoints for admin interface
@frappe.whitelist(allow_guest=False)
def send_simple_test_notification() -> Dict[str, Any]:
    """Simple test notification endpoint - CSRF exempt for testing."""
    try:
        from artha.utils.notifications import send_notification

        send_notification(
            title="Simple Test Notification",
            message="This is a simple test notification (CSRF exempt)",
            notification_type="info",
            target_user=frappe.session.user
        )

        return {
            "status": "success",
            "message": "Simple test notification sent successfully",
            "user": frappe.session.user,
            "timestamp": frappe.utils.now()
        }

    except Exception as e:
        frappe.logger().error(
            f"Failed to send simple test notification: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to send test notification: {str(e)}"
        }


@frappe.whitelist(allow_guest=False, methods=['POST'])
def send_test_notification(title: str = "Test Notification", message: str = "This is a test notification from the backend", notification_type: str = "info") -> Dict[str, Any]:
    """Send a test notification for admin testing."""
    try:
        from artha.utils.notifications import send_notification

        send_notification(
            title=title,
            message=message,
            notification_type=notification_type,
            target_user=frappe.session.user
        )

        return {
            "status": "success",
            "message": "Test notification sent successfully",
            "notification_data": {
                "title": title,
                "message": message,
                "type": notification_type,
                "user": frappe.session.user
            }
        }

    except Exception as e:
        frappe.logger().error(f"Failed to send test notification: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to send test notification: {str(e)}"
        }
