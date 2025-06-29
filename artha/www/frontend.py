# Copyright (c) 2024, Artha Raksha and Contributors
# MIT License

import frappe

# Disable caching for this page
no_cache = 1


@frappe.whitelist(methods=["POST"], allow_guest=True)
def get_context_for_dev():
    """Get context for development mode (following Gameplan's pattern)"""
    if not frappe.conf.developer_mode:
        frappe.throw("This method is only meant for developer mode")
    return get_boot()


def get_boot():
    """Get boot data for Artha frontend (following Gameplan's pattern)"""
    return frappe._dict({
        "frappe_version": frappe.__version__,
        "site_name": frappe.local.site,
        "user": frappe.session.user,
        "csrf_token": frappe.sessions.get_csrf_token(),
        "is_authenticated": frappe.session.user != "Guest",
        "user_roles": frappe.get_roles() if frappe.session.user != "Guest" else [],
        "app_version": "1.0.0",  # You can make this dynamic like Gameplan does
        "socketio_port": frappe.conf.get('socketio_port', 9000),
    })


def get_context(context):
    """Get context for Artha frontend template (following Gameplan's pattern)"""
    try:
        # Ensure proper session and CSRF token
        csrf_token = frappe.sessions.get_csrf_token()
        frappe.db.commit()

        # Set boot data following Gameplan's pattern
        context.boot = get_boot()
        context.boot.csrf_token = csrf_token

        # For backward compatibility
        context.site_name = frappe.local.site
        context.csrf_token = csrf_token
        context.user = frappe.session.user
        context.socketio_port = frappe.conf.get('socketio_port', 9000)

        return context

    except Exception as e:
        frappe.log_error(f"Frontend context error: {str(e)}")
        # Provide fallback context
        context.site_name = frappe.local.site or "artha.localhost"
        context.csrf_token = ""
        context.user = "Guest"
        context.socketio_port = 9000
        context.boot = {"site_name": context.site_name, "socketio_port": 9000}
        return context
