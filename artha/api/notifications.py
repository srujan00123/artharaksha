"""
Notifications and Socket Configuration API
Handles notifications and provides socket configuration for frontend
"""

import frappe
from frappe import _
import json


@frappe.whitelist()
def get_site_info():
    """
    Get site information including socket configuration.
    """
    try:
        # Get site config
        site_config = frappe.conf

        # Get site name from frappe.local.site - this is the actual site folder name
        # This is what Frappe uses for namespacing: /{sitename}
        site_name = frappe.local.site if hasattr(
            frappe.local, 'site') else 'development.localhost'

        # Get socket port (use standard Frappe socketio_port)
        socketio_port = site_config.get('socketio_port', 9000)

        # Properly detect environment
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
    """
    Get socket rooms that the current user should join.
    """
    try:
        user = frappe.session.user
        if user == "Guest":
            return {"rooms": ["website", "all"]}

        # Basic rooms for authenticated users
        rooms = [
            "all",
            "website",
            f"user:{user}"
        ]

        # Add role-based rooms
        user_roles = frappe.get_roles(user)
        for role in user_roles:
            rooms.append(f"role:{role}")

        # Add company/organization rooms if applicable
        if hasattr(frappe.local, 'site'):
            rooms.append(f"site:{frappe.local.site}")

        return {"rooms": rooms}

    except Exception as e:
        frappe.log_error(f"Failed to get user rooms: {str(e)}")
        return {"rooms": ["all", "website"]}


@frappe.whitelist()
def get_notifications():
    """
    Get notifications for the current user.
    """
    try:
        user = frappe.session.user
        if user == "Guest":
            return []

        # Get notifications from Notification Log
        notifications = frappe.get_all(
            "Notification Log",
            filters={
                "for_user": user,
                "read": 0
            },
            fields=[
                "name", "subject", "email_content as content",
                "creation", "document_type", "document_name", "type"
            ],
            order_by="creation desc",
            limit=50
        )

        return notifications

    except Exception as e:
        frappe.log_error(f"Failed to get notifications: {str(e)}")
        return []


@frappe.whitelist()
def mark_notification_read(notification_id):
    """
    Mark a notification as read.
    """
    try:
        user = frappe.session.user
        if user == "Guest":
            frappe.throw(_("Not authenticated"))

        # Verify notification belongs to user
        notification = frappe.get_doc("Notification Log", notification_id)
        if notification.for_user != user:
            frappe.throw(_("Not authorized"))

        # Mark as read
        notification.read = 1
        notification.save(ignore_permissions=True)
        frappe.db.commit()

        return {"success": True}

    except Exception as e:
        frappe.log_error(f"Failed to mark notification as read: {str(e)}")
        frappe.throw(_("Failed to mark notification as read"))


@frappe.whitelist()
def mark_all_notifications_read():
    """
    Mark all notifications as read for the current user.
    """
    try:
        user = frappe.session.user
        if user == "Guest":
            frappe.throw(_("Not authenticated"))

        # Update all unread notifications for the user
        frappe.db.set_value(
            "Notification Log",
            {"for_user": user, "read": 0},
            "read", 1
        )
        frappe.db.commit()

        return {"success": True}

    except Exception as e:
        frappe.log_error(f"Failed to mark all notifications as read: {str(e)}")
        frappe.throw(_("Failed to mark all notifications as read"))


@frappe.whitelist()
def send_notification(to_user, subject, content, doctype=None, docname=None):
    """
    Send a notification to a user (creates Notification Log entry).
    """
    try:
        current_user = frappe.session.user
        if current_user == "Guest":
            frappe.throw(_("Not authenticated"))

        # Create notification log entry
        notification = frappe.new_doc("Notification Log")
        notification.for_user = to_user
        notification.from_user = current_user
        notification.subject = subject
        notification.email_content = content
        notification.document_type = doctype
        notification.document_name = docname
        notification.type = "Alert"
        notification.save(ignore_permissions=True)
        frappe.db.commit()

        # Emit socket event for real-time notification
        frappe.publish_realtime(
            event="notification",
            message={
                "id": notification.name,
                "subject": subject,
                "content": content,
                "from_user": current_user,
                "creation": notification.creation,
                "type": "Alert"
            },
            user=to_user
        )

        return {"success": True, "notification_id": notification.name}

    except Exception as e:
        frappe.log_error(f"Failed to send notification: {str(e)}")
        frappe.throw(_("Failed to send notification"))


@frappe.whitelist()
def broadcast_notification(subject, content, role=None):
    """
    Broadcast a notification to all users or users with a specific role.
    """
    try:
        current_user = frappe.session.user
        if current_user == "Guest":
            frappe.throw(_("Not authenticated"))

        # Check if user has permission to broadcast
        if "System Manager" not in frappe.get_roles(current_user):
            frappe.throw(_("Not authorized to broadcast notifications"))

        # Get target users
        if role:
            # Get users with specific role
            users = frappe.get_all(
                "Has Role",
                filters={"role": role},
                fields=["parent as user"],
                distinct=True
            )
            target_users = [u.user for u in users if u.user != "Guest"]
        else:
            # Get all active users
            users = frappe.get_all(
                "User",
                filters={"enabled": 1, "user_type": "System User"},
                fields=["name as user"]
            )
            target_users = [u.user for u in users if u.user != "Guest"]

        # Create notifications for each user
        for user in target_users:
            notification = frappe.new_doc("Notification Log")
            notification.for_user = user
            notification.from_user = current_user
            notification.subject = subject
            notification.email_content = content
            notification.type = "Alert"
            notification.save(ignore_permissions=True)

            # Emit socket event
            frappe.publish_realtime(
                event="notification",
                message={
                    "id": notification.name,
                    "subject": subject,
                    "content": content,
                    "from_user": current_user,
                    "creation": notification.creation,
                    "type": "Alert"
                },
                user=user
            )

        frappe.db.commit()

        return {"success": True, "users_notified": len(target_users)}

    except Exception as e:
        frappe.log_error(f"Failed to broadcast notification: {str(e)}")
        frappe.throw(_("Failed to broadcast notification"))


@frappe.whitelist()
def send_test_notification():
    """
    Send a test notification to the current user
    Note: This endpoint is primarily for testing and admin purposes
    """
    try:
        user = frappe.session.user

        # Publish realtime notification
        frappe.publish_realtime(
            event='artha_notification',
            message={
                'title': 'Test Notification',
                'message': f'Hello {user}! This is a test notification.',
                'type': 'info',
                'data': {
                    'timestamp': frappe.utils.now(),
                    'user': user
                }
            },
            user=user
        )

        return {
            'success': True,
            'message': 'Test notification sent successfully'
        }

    except Exception as e:
        frappe.log_error(f"Error sending test notification: {str(e)}")
        frappe.throw(_("Failed to send test notification"))


@frappe.whitelist()
def send_role_based_notification(roles=None, title=None, message=None, notification_type='info'):
    """
    Send notification to users with specific roles
    Limited to: Artha User, Insights User, System Manager, Administrator
    """
    try:
        # Check if user has permission to send role-based notifications
        if not frappe.has_permission('System Settings', 'write'):
            frappe.throw(
                _("Insufficient permissions to send role-based notifications"))

        if isinstance(roles, str):
            roles = json.loads(roles)

        if not roles:
            frappe.throw(_("No roles specified"))

        # Validate roles - only allow specific roles
        allowed_roles = ['Artha User', 'Insights User',
                         'System Manager', 'Administrator']
        invalid_roles = [role for role in roles if role not in allowed_roles]
        if invalid_roles:
            frappe.throw(_("Invalid roles: {}. Only {} are allowed.").format(
                ', '.join(invalid_roles), ', '.join(allowed_roles)
            ))

        # Get all users with the specified roles
        users_with_roles = []
        for role in roles:
            users = frappe.get_all('Has Role',
                                   filters={'role': role},
                                   fields=['parent'],
                                   distinct=True
                                   )
            users_with_roles.extend([user.parent for user in users])

        # Remove duplicates
        target_users = list(set(users_with_roles))

        # Send notification to each user
        for user in target_users:
            frappe.publish_realtime(
                event='artha_notification',
                message={
                    'title': title or f'Role-based Notification',
                    'message': message or f'Notification for users with roles: {", ".join(roles)}',
                    'type': notification_type,
                    'data': {
                        'timestamp': frappe.utils.now(),
                        'sender': frappe.session.user,
                        'target_roles': roles
                    }
                },
                user=user
            )

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
    """
    Send notification to a specific room
    Limited to standard Frappe rooms: all, website, admin, artha_users, insights_users
    """
    try:
        # Check if user has permission to send room notifications
        if not frappe.has_permission('System Settings', 'write'):
            frappe.throw(
                _("Insufficient permissions to send room notifications"))

        if not room:
            frappe.throw(_("No room specified"))

        # Validate room - only allow specific rooms
        allowed_rooms = ['all', 'website', 'admin',
                         'artha_users', 'insights_users']
        if room not in allowed_rooms and not room.startswith('user:'):
            frappe.throw(_("Invalid room: {}. Only {} and user-specific rooms are allowed.").format(
                room, ', '.join(allowed_rooms)
            ))

        # Publish to specific room
        frappe.publish_realtime(
            event='artha_notification',
            message={
                'title': title or f'Room Notification',
                'message': message or f'Notification for room: {room}',
                'type': notification_type,
                'data': {
                    'timestamp': frappe.utils.now(),
                    'sender': frappe.session.user,
                    'target_room': room
                }
            },
            room=room
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
    """
    Send notification to a specific user
    """
    try:
        # Check if user has permission to send notifications
        if not frappe.has_permission('System Settings', 'write'):
            frappe.throw(
                _("Insufficient permissions to send user notifications"))

        if not target_user:
            frappe.throw(_("No target user specified"))

        # Validate user exists
        if not frappe.db.exists('User', target_user):
            frappe.throw(_("User {} does not exist").format(target_user))

        # Send to user-specific room
        frappe.publish_realtime(
            event='artha_notification',
            message={
                'title': title or f'Personal Notification',
                'message': message or f'You have a new notification',
                'type': notification_type,
                'data': {
                    'timestamp': frappe.utils.now(),
                    'sender': frappe.session.user,
                    'target_user': target_user
                }
            },
            user=target_user
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
    """
    Get list of available rooms for the current user
    """
    try:
        user_rooms_data = get_user_rooms()
        user_roles = user_rooms_data.get('rooms', [])

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
