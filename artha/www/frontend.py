# Copyright (c) 2024, Artha Raksha and Contributors
# MIT License

import frappe

# Disable caching for this page
no_cache = 1


def get_context(context):
    """Get context for Artha frontend template"""
    try:
        # CRITICAL FIX: Ensure proper Frappe session with sid cookie
        # This is what CRM has automatically but SPA templates miss

        # If user is logged in but no session exists, create one
        if frappe.session.user != "Guest":
            # Ensure session data is properly set
            if not frappe.session.get('sid') or not frappe.request.cookies.get('sid'):
                # Force session creation/refresh to generate sid cookie
                frappe.local.login_manager = frappe.auth.LoginManager()
                frappe.local.login_manager.user = frappe.session.user
                frappe.local.login_manager.post_login()

        # Ensure we have a database connection
        frappe.db.commit()

        # Set site name for socket connection
        context.site_name = frappe.local.site

        # Set CSRF token for API calls
        context.csrf_token = frappe.sessions.get_csrf_token()

        # Add user information if available
        if frappe.session.user != "Guest":
            context.user = frappe.session.user
            context.user_roles = frappe.get_roles()
        else:
            context.user = "Guest"
            context.user_roles = []

        # Debug information for production troubleshooting
        context.debug_info = {
            "site": frappe.local.site,
            "user": frappe.session.user,
            "has_csrf": bool(context.csrf_token),
            "has_sid": bool(frappe.session.get('sid')),
            "timestamp": frappe.utils.now()
        }

        # Add boot data similar to CRM approach
        context.boot = {
            "site_name": frappe.local.site,
            "csrf_token": context.csrf_token,
            "user": frappe.session.user,
            "is_authenticated": frappe.session.user != "Guest",
            "session_id": frappe.session.get('sid', 'Guest')
        }

        return context

    except Exception as e:
        frappe.log_error(f"Frontend context error: {str(e)}")
        # Provide fallback context
        context.site_name = frappe.local.site or "artha.localhost"
        context.csrf_token = ""
        context.user = "Guest"
        context.boot = {"site_name": context.site_name}
        return context
