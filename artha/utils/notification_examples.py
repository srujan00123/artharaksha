"""
Examples of using notification decorators in Artha APIs
This file demonstrates the various ways to use the notification decorators
"""

import frappe
from artha.utils.notifications import (
    realtime_notification,
    income_notification,
    expense_notification,
    send_custom_notification,
    bulk_notification
)
from typing import Dict, Any


# Example 1: Basic realtime notification
@frappe.whitelist()
@realtime_notification('artha:test_event', broadcast=True)
def test_basic_notification() -> Dict[str, Any]:
    """
    Example of a basic realtime notification
    """
    return {
        "status": "success",
        "message": "Test notification sent successfully",
        "timestamp": frappe.utils.now()
    }


# Example 2: Income notification with data extraction
@frappe.whitelist()
@income_notification('created', data_field='income_data', broadcast=True)
def example_create_income() -> Dict[str, Any]:
    """
    Example of creating income with notification
    """
    # Your income creation logic here
    income_data = {
        "name": "INC-001",
        "amount": 5000,
        "type": "salary",
        "user": frappe.session.user
    }

    return {
        "status": "success",
        "message": "Income created successfully",
        "income_data": income_data
    }


# Example 3: Expense notification
@frappe.whitelist()
@expense_notification('created', data_field='expense_data', broadcast=True)
def example_create_expense() -> Dict[str, Any]:
    """
    Example of creating expense with notification
    """
    # Your expense creation logic here
    expense_data = {
        "name": "EXP-001",
        "amount": 1500,
        "category": "groceries",
        "user": frappe.session.user
    }

    return {
        "status": "success",
        "message": "Expense created successfully",
        "expense_data": expense_data
    }


# Example 4: Bulk operation notification
@frappe.whitelist()
# Count will be extracted from result
@bulk_notification('processed', 'income', 0)
def example_bulk_process() -> Dict[str, Any]:
    """
    Example of bulk processing with notification
    """
    # Your bulk processing logic here
    processed_count = 25

    return {
        "status": "success",
        "message": f"Processed {processed_count} records",
        "count": processed_count
    }


# Example 5: Custom notification function
@frappe.whitelist()
def example_custom_notification():
    """
    Example of sending custom notifications programmatically
    """
    try:
        # Your business logic here

        # Send success notification
        send_custom_notification(
            title="Operation Complete",
            message="Your data has been processed successfully",
            notification_type='success'
        )

        return {"status": "success", "message": "Custom notification sent"}

    except Exception as e:
        # Send error notification
        send_custom_notification(
            title="Operation Failed",
            message=f"An error occurred: {str(e)}",
            notification_type='error'
        )

        frappe.throw(str(e))


# Example 6: Targeted user notification
@frappe.whitelist()
@realtime_notification('artha:user_specific', user_field='target_user', broadcast=False)
def example_user_notification(target_user: str) -> Dict[str, Any]:
    """
    Example of sending notification to a specific user
    """
    return {
        "status": "success",
        "message": f"Notification sent to {target_user}",
        "target_user": target_user,
        "data": {
            "type": "user_specific",
            "content": "This is a targeted notification"
        }
    }


# Example 7: Room-based notification
@frappe.whitelist()
@realtime_notification('artha:admin_alert', rooms=['admin'], broadcast=False)
def example_admin_notification() -> Dict[str, Any]:
    """
    Example of sending notification to admin room only
    """
    return {
        "status": "success",
        "message": "Admin notification sent",
        "data": {
            "type": "admin_alert",
            "content": "Important system alert for administrators"
        }
    }


# Example 8: Multiple decorators (advanced)
@frappe.whitelist()
@income_notification('updated', data_field='income_data')
@bulk_notification('synced', 'ledger', 0)
def example_multiple_decorators() -> Dict[str, Any]:
    """
    Example of using multiple notification decorators
    Note: This creates multiple events, use sparingly
    """
    return {
        "status": "success",
        "message": "Multiple notifications sent",
        "income_data": {
            "name": "INC-001",
            "updated_fields": ["amount", "date"]
        },
        "count": 10  # For bulk notification
    }


# Example 9: Error handling with notifications
@frappe.whitelist()
@realtime_notification('artha:process_complete', broadcast=True)
def example_error_handling() -> Dict[str, Any]:
    """
    Example showing that notifications only fire on success
    """
    try:
        # Simulate some processing
        import random
        if random.choice([True, False]):
            # Success case - notification will be sent
            return {
                "status": "success",
                "message": "Processing completed successfully",
                "data": {"processed": True}
            }
        else:
            # Error case - notification will NOT be sent
            frappe.throw("Simulated error occurred")

    except Exception as e:
        # Send manual error notification if needed
        send_custom_notification(
            title="Process Failed",
            message=str(e),
            notification_type='error'
        )
        raise


# Example 10: Conditional notifications
@frappe.whitelist()
def example_conditional_notification(send_notification: bool = True):
    """
    Example of conditionally sending notifications
    """
    # Your business logic here
    result = {"status": "success", "message": "Operation completed"}

    # Send notification only if requested
    if send_notification:
        send_custom_notification(
            title="Task Complete",
            message="Your requested operation has finished",
            notification_type='info'
        )

    return result
