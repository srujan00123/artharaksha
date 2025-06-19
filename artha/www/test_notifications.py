import frappe
from frappe import _


def get_context(context):
    """
    Simple notification test page for production
    Accessible at: https://artha.commitx.in/test_notifications
    """
    context.title = "Notification System Test"

    # Check if user is logged in
    if frappe.session.user == "Guest":
        context.message = "Please log in to test notifications"
        context.login_required = True
        return context

    context.login_required = False
    context.user = frappe.session.user

    # Handle form submission
    if frappe.form_dict.get('action') == 'test':
        try:
            from artha.utils.notifications import send_custom_notification

            test_type = frappe.form_dict.get('test_type', 'simple')

            if test_type == 'simple':
                send_custom_notification(
                    title="Production Test Notification",
                    message="This notification was sent from the production test page",
                    notification_type="success",
                    target_user=frappe.session.user
                )
                context.result = "Simple notification sent successfully!"

            elif test_type == 'income':
                # Test income ledger notification
                from artha.api.income import create_direct_ledger_entry
                result = create_direct_ledger_entry(
                    income_type="bonus",
                    amount=1000,
                    date_time=frappe.utils.now(),
                    description="Production test - bonus payment"
                )
                context.result = f"Income ledger test completed: {result.get('message', 'Success')}"

            elif test_type == 'ping':
                frappe.publish_realtime(
                    event="artha_notification",
                    message={
                        "title": "Production Ping",
                        "message": "Notification system is working in production!",
                        "type": "info",
                        "timestamp": frappe.utils.now(),
                        "source": "production_test_page"
                    },
                    user=frappe.session.user
                )
                context.result = "Ping notification sent!"

        except Exception as e:
            context.result = f"Error: {str(e)}"
            context.error = True

    return context
