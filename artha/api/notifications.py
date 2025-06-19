"""
Notifications and Socket Configuration API
Handles notifications and provides socket configuration for frontend
"""

import frappe
from frappe import _
import json
from typing import Dict, Any


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


@frappe.whitelist(allow_guest=False, methods=['POST'])
def send_test_notification(title: str = "Test Notification", message: str = "This is a test notification from the backend", notification_type: str = "info", custom_message: str = None) -> Dict[str, Any]:
    """
    Send a test notification for debugging purposes
    Enhanced for admin testing interface
    """
    try:
        from artha.utils.notifications import send_custom_notification

        # Use custom message if provided (for stress testing)
        final_message = custom_message or message
        final_title = title if not custom_message else "Backend Test"

        # Send custom notification via utility function
        send_custom_notification(
            title=final_title,
            message=final_message,
            notification_type=notification_type,
            target_user=frappe.session.user
        )

        # Also publish directly via Frappe's realtime system for redundancy
        frappe.publish_realtime(
            event="artha_notification",
            message={
                "title": final_title,
                "message": final_message,
                "type": notification_type,
                "timestamp": frappe.utils.now(),
                "user": frappe.session.user,
                "test": True,
                "source": "backend_endpoint"
            },
            user=frappe.session.user
        )

        frappe.logger().info(
            f"Test notification sent to user: {frappe.session.user} - Title: {final_title}")

        return {
            "status": "success",
            "message": "Test notification sent successfully via backend endpoint",
            "notification_data": {
                "title": final_title,
                "message": final_message,
                "type": notification_type,
                "user": frappe.session.user,
                "endpoint": "send_test_notification"
            }
        }

    except Exception as e:
        frappe.logger().error(f"Failed to send test notification: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to send test notification: {str(e)}"
        }


@frappe.whitelist(allow_guest=False, methods=['POST'])
def trigger_income_test_notification() -> Dict[str, Any]:
    """
    Trigger a test income notification with the decorator pattern
    Enhanced for admin testing interface
    """
    try:
        from artha.utils.notifications import income_notification

        # Use the decorator pattern to test
        @income_notification('ledger_created', data_field='ledger_entry')
        def mock_income_operation():
            return {
                "status": "success",
                "message": "Test income entry created via decorator pattern",
                "ledger_entry": {
                    "amount": 5000,
                    "income_type": "salary",
                    "source_type": "Monthly Salary Test",
                    "description": "Test salary payment from admin interface",
                    "timestamp": frappe.utils.now(),
                    "test_mode": True,
                    "user": frappe.session.user
                }
            }

        # Execute the decorated function
        result = mock_income_operation()

        # Also send a direct custom notification for immediate feedback
        from artha.utils.notifications import send_custom_notification

        send_custom_notification(
            title="Income Test Notification",
            message=f"Successfully tested income decorator pattern with ₹5,000 test entry",
            notification_type="success",
            target_user=frappe.session.user
        )

        frappe.logger().info(
            f"Test income notification triggered for user: {frappe.session.user}")

        return {
            "status": "success",
            "message": "Test income notification triggered successfully via decorator pattern",
            "result": result,
            "test_data": {
                "decorator_used": "income_notification",
                "event_type": "artha:income_ledger_created",
                "amount": 5000,
                "user": frappe.session.user
            }
        }

    except Exception as e:
        frappe.logger().error(
            f"Failed to trigger test income notification: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to trigger test income notification: {str(e)}"
        }


@frappe.whitelist(allow_guest=False, methods=['POST'])
def test_socket_handlers() -> Dict[str, Any]:
    """
    Test custom socket handlers by sending events that should be processed
    by the realtime handlers in apps/artha/realtime/handlers.js
    """
    try:
        # Send a test ping event that should be handled by our custom handlers
        frappe.publish_realtime(
            event="artha_test_ping",
            message={
                "test": True,
                "message": "Testing custom socket handlers",
                "timestamp": frappe.utils.now(),
                "user": frappe.session.user,
                "source": "backend_test"
            },
            user=frappe.session.user
        )

        # Send another test event with different data
        frappe.publish_realtime(
            event="artha_handler_test",
            message={
                "title": "Socket Handler Test",
                "message": "This tests the custom realtime handlers",
                "type": "info",
                "data": {
                    "handler_test": True,
                    "endpoint": "test_socket_handlers",
                    "user": frappe.session.user
                }
            },
            user=frappe.session.user
        )

        frappe.logger().info(
            f"Socket handler test events sent for user: {frappe.session.user}")

        return {
            "status": "success",
            "message": "Socket handler test events sent successfully",
            "events_sent": [
                "artha_test_ping",
                "artha_handler_test"
            ],
            "user": frappe.session.user
        }

    except Exception as e:
        frappe.logger().error(f"Failed to test socket handlers: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to test socket handlers: {str(e)}"
        }


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


@frappe.whitelist(allow_guest=False, methods=['POST'])
def debug_income_notification_flow() -> Dict[str, Any]:
    """
    Debug function to test the complete income notification flow
    This replicates what happens when real income is added/updated
    """
    try:
        frappe.logger().info("=== Starting Income Notification Debug ===")

        # Step 1: Test direct ledger entry creation (this should trigger notification)
        from artha.api.income import create_direct_ledger_entry

        frappe.logger().info("Step 1: Testing create_direct_ledger_entry")
        result1 = create_direct_ledger_entry(
            income_type="freelance",
            amount=1000,
            date_time=frappe.utils.now(),
            description="Debug test - direct ledger entry"
        )
        frappe.logger().info(f"Direct ledger result: {result1}")

        # Step 2: Test create_or_update_income (adding new source)
        from artha.api.income import create_or_update_income

        frappe.logger().info("Step 2: Testing create_or_update_income")
        test_source = [{
            "type": "salary",
            "income": 5000,
            "date_time": frappe.utils.now(),
            "recur_frequency": "Monthly",
            "stop_date": None
        }]

        result2 = create_or_update_income(
            income_source=test_source
        )
        frappe.logger().info(f"Create/update income result: {result2}")

        # Step 3: Test manual ledger update trigger
        if result2.get('status') == 'success' and result2.get('income_data', {}).get('name'):
            from artha.api.income import trigger_ledger_update

            frappe.logger().info("Step 3: Testing trigger_ledger_update")
            income_name = result2['income_data']['name']
            result3 = trigger_ledger_update(income_name)
            frappe.logger().info(f"Trigger ledger update result: {result3}")
        else:
            result3 = {"status": "skipped",
                       "message": "No income created in step 2"}

        # Step 4: Send final summary notification
        send_custom_notification(
            title="Income Debug Complete",
            message=f"Income notification debug completed. Check server logs for details.",
            notification_type="info",
            target_user=frappe.session.user
        )

        frappe.logger().info("=== Income Notification Debug Complete ===")

        return {
            "status": "success",
            "message": "Income notification flow debug completed",
            "results": {
                "step1_direct_ledger": result1,
                "step2_create_income": result2,
                "step3_trigger_update": result3
            },
            "debug_info": {
                "user": frappe.session.user,
                "timestamp": frappe.utils.now(),
                "logs": "Check server logs for detailed notification flow"
            }
        }

    except Exception as e:
        frappe.logger().error(f"Income notification debug failed: {str(e)}")
        frappe.log_error(
            f"Income debug error: {str(e)}", "Income Notification Debug")

        return {
            "status": "error",
            "message": f"Income notification debug failed: {str(e)}",
            "error_details": str(e)
        }


@frappe.whitelist(allow_guest=False, methods=['POST'])
def test_income_ledger_notification() -> Dict[str, Any]:
    """
    Test function specifically for income ledger notifications
    This tests the actual API endpoints that should trigger notifications
    """
    try:
        frappe.logger().info("=== Testing Income Ledger Notifications ===")

        # Test 1: Create direct ledger entry (should trigger artha:income_ledger_created)
        from artha.api.income import create_direct_ledger_entry

        frappe.logger().info("Testing create_direct_ledger_entry...")
        result1 = create_direct_ledger_entry(
            income_type="bonus",
            amount=2500,
            date_time=frappe.utils.now(),
            description="Test notification - bonus payment"
        )
        frappe.logger().info(f"Direct ledger entry result: {result1}")

        # Test 2: Create income with recurring source (should trigger notifications)
        if result1.get('status') == 'success':
            frappe.logger().info("✅ Direct ledger entry created successfully")

            # Send confirmation notification
            send_custom_notification(
                title="Income Ledger Test Complete",
                message="Successfully created test income entry. You should see notifications for this action.",
                notification_type="success",
                target_user=frappe.session.user,
                additional_data={
                    "test_type": "income_ledger_notification",
                    "entry_amount": 2500,
                    "entry_type": "bonus"
                }
            )

        return {
            "status": "success",
            "message": "Income ledger notification test completed successfully",
            "test_results": {
                "direct_ledger_entry": result1
            },
            "instructions": "Check your notifications center for income-related notifications"
        }

    except Exception as e:
        frappe.logger().error(
            f"Income ledger notification test failed: {str(e)}")
        return {
            "status": "error",
            "message": f"Test failed: {str(e)}",
            "error_details": str(e)
        }


@frappe.whitelist(allow_guest=False)
def send_simple_test_notification() -> Dict[str, Any]:
    """
    Simple test notification endpoint - CSRF exempt for production testing
    """
    try:
        from artha.utils.notifications import send_custom_notification

        send_custom_notification(
            title="Simple Test Notification",
            message="This is a simple test notification (CSRF exempt)",
            notification_type="info",
            target_user=frappe.session.user
        )

        frappe.logger().info(
            f"Simple test notification sent to user: {frappe.session.user}")

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


@frappe.whitelist(allow_guest=False)
def ping_notification_system() -> Dict[str, Any]:
    """
    Simple ping endpoint to verify notification system is working
    """
    try:
        # Basic system info
        user = frappe.session.user
        site_name = frappe.local.site if hasattr(
            frappe.local, 'site') else 'unknown'

        # Send a simple ping notification
        frappe.publish_realtime(
            event="artha_notification",
            message={
                "title": "System Ping",
                "message": f"Notification system is working! User: {user}",
                "type": "info",
                "timestamp": frappe.utils.now(),
                "source": "ping_endpoint"
            },
            user=user
        )

        return {
            "status": "success",
            "message": "Notification system ping successful",
            "system_info": {
                "user": user,
                "site": site_name,
                "timestamp": frappe.utils.now()
            }
        }

    except Exception as e:
        frappe.logger().error(f"Notification system ping failed: {str(e)}")
        return {
            "status": "error",
            "message": f"Ping failed: {str(e)}"
        }
