"""
Test API for notification system
Quick testing endpoints to verify notifications work
"""

import frappe
from artha.utils.notifications import (
    income_notification,
    expense_notification,
    send_custom_notification,
    realtime_notification
)
from frappe.utils import now


@frappe.whitelist()
@income_notification('ledger_created', data_field='ledger_entry', broadcast=True)
def test_income_ledger_notification():
    """
    Test income ledger notification
    """
    return {
        "status": "success",
        "message": "Test ledger notification sent",
        "ledger_entry": {
            "name": "TEST-LEDGER-001",
            "amount": 1000,
            "date_time": now(),
            "income_type": "test_income",
            "description": "Test income ledger entry"
        }
    }


@frappe.whitelist()
@expense_notification('created', data_field='expense_data', broadcast=True)
def test_expense_notification():
    """
    Test expense notification
    """
    return {
        "status": "success",
        "message": "Test expense notification sent",
        "expense_data": {
            "name": "TEST-EXPENSE-001",
            "amount": 500,
            "category": "test_category",
            "type": "medical"
        }
    }


@frappe.whitelist()
@realtime_notification('artha:test_event', broadcast=True)
def test_realtime_notification():
    """
    Test basic realtime notification
    """
    return {
        "status": "success",
        "message": "Test realtime notification sent",
        "data": {
            "test": True,
            "timestamp": now()
        }
    }


@frappe.whitelist()
def test_custom_notification():
    """
    Test custom notification
    """
    try:
        send_custom_notification(
            title="Test Custom Notification",
            message="This is a test custom notification from the API",
            notification_type='info'
        )

        return {
            "status": "success",
            "message": "Custom notification sent successfully"
        }
    except Exception as e:
        frappe.log_error(f"Test notification error: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to send notification: {str(e)}"
        }


@frappe.whitelist()
def test_all_notifications():
    """
    Test all types of notifications at once
    """
    results = []

    try:
        # Test custom notification
        send_custom_notification(
            title="Test Suite Started",
            message="Testing all notification types",
            notification_type='info'
        )
        results.append("Custom notification: OK")

        # Test income ledger
        income_result = test_income_ledger_notification()
        results.append(f"Income ledger: {income_result['status']}")

        # Test expense
        expense_result = test_expense_notification()
        results.append(f"Expense: {expense_result['status']}")

        # Test realtime
        realtime_result = test_realtime_notification()
        results.append(f"Realtime: {realtime_result['status']}")

        send_custom_notification(
            title="Test Suite Complete",
            message="All notification tests completed",
            notification_type='success'
        )
        results.append("Test suite: Complete")

        return {
            "status": "success",
            "message": "All notifications tested",
            "results": results
        }

    except Exception as e:
        frappe.log_error(f"Test suite error: {str(e)}")
        return {
            "status": "error",
            "message": f"Test failed: {str(e)}",
            "results": results
        }


@frappe.whitelist()
def test_websocket_config():
    """
    Test WebSocket configuration and connectivity
    """
    try:
        site_config = frappe.conf

        result = {
            "status": "success",
            "config": {
                "site_name": getattr(frappe.local, 'site', None) or frappe.get_site_config().get('site_name', 'development.localhost'),
                "socketio_port": site_config.get('socketio_port', 9000),
                "redis_socketio": site_config.get('redis_socketio'),
                "developer_mode": site_config.get('developer_mode'),
                "environment": "production" if site_config.get('developer_mode') == 0 else "development"
            },
            "recommendations": []
        }

        # Add recommendations based on configuration
        if not site_config.get('redis_socketio'):
            result["recommendations"].append("Redis socketio not configured")

        if site_config.get('developer_mode'):
            result["recommendations"].append(
                "Developer mode is enabled - use port in URL")
        else:
            result["recommendations"].append(
                "Production mode - use main domain without port")

        return result

    except Exception as e:
        frappe.log_error(f"WebSocket config test error: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to get config: {str(e)}"
        }
