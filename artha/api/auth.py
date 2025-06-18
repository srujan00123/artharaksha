"""
Authentication API
Handles user registration and authentication-related operations
"""

import frappe
from frappe import _


@frappe.whitelist(allow_guest=True, methods=["POST"])
def register_account(email, password):
    """
    Register a new user with 'Artha User' role, no verification, direct creation.
    Also create a Household Profile, Expense, and Income document linked to the user.
    Do not return anything, do not log in automatically.
    Log errors after each step for debugging.
    """
    try:
        if not email or not password:
            frappe.throw(_("Email/Username and password are required."))

        # Check if user already exists
        if frappe.db.exists("User", email):
            frappe.throw(_("User already exists."))

        # Create user
        user = frappe.new_doc("User")
        user.email = email
        user.first_name = email.split('@')[0] if '@' in email else email
        user.new_password = password
        user.send_welcome_email = 0  # Disable welcome email
        user.save(ignore_permissions=True)
        frappe.log_error(f"User created: {user.email}")

        # Assign only 'Artha User' role
        user.add_roles("Artha User")
        frappe.log_error(f"Role assigned: Artha User to {user.email}")

        # Create Household Profile (only set user field)
        household_profile = frappe.new_doc("Household Profile")
        household_profile.user = user.email

        household_profile.save(ignore_permissions=True)
        frappe.log_error(
            f"Household Profile created: {household_profile.name}")

        # Create Expense document (only set required field)
        expense = frappe.new_doc("Expense")
        expense.household_profile = household_profile.name
        expense.save(ignore_permissions=True)
        frappe.log_error(f"Expense created: {expense.name}")

        # Create Income document (only set required field)
        income = frappe.new_doc("Income")
        income.household_profile = household_profile.name
        income.save(ignore_permissions=True)
        frappe.log_error(f"Income created: {income.name}")

        # Do not log in or return anything
        return None
    except Exception as e:
        frappe.log_error(f"Registration failed: {str(e)}")
        raise


@frappe.whitelist()
def get_permission_query_conditions_for_user(user=None):
    """
    Permission query conditions for User doctype.
    Users can only access their own user record.
    """
    if not user:
        user = frappe.session.user

    # System Manager can access all users
    if "System Manager" in frappe.get_roles(user):
        return ""

    # Artha Users can only access their own record
    if "Artha User" in frappe.get_roles(user):
        return f"`tabUser`.name = '{user}'"

    # Default: no access
    return "1=0"


@frappe.whitelist()
def has_permission_for_user(doc, user=None, ptype=None):
    """
    Permission check for User doctype.
    Users can only access their own user record.
    """
    if not user:
        user = frappe.session.user

    # System Manager has full access
    if "System Manager" in frappe.get_roles(user):
        return True

    # Artha Users can only access their own record
    if "Artha User" in frappe.get_roles(user):
        if isinstance(doc, str):
            # doc is a document name
            return doc == user
        else:
            # doc is a document object
            return doc.name == user

    # Default: no access
    return False


@frappe.whitelist()
def get_current_user_profile():
    """
    Get current user's profile information.
    """
    try:
        user = frappe.session.user
        if not user or user == "Guest":
            frappe.throw(_("Not authenticated"))

        # Get user document with required fields
        user_doc = frappe.get_doc("User", user)

        # Return only safe fields
        return {
            "name": user_doc.name,
            "email": user_doc.email,
            "first_name": user_doc.first_name,
            "middle_name": user_doc.middle_name,
            "last_name": user_doc.last_name,
            "full_name": user_doc.full_name,
            "phone": user_doc.phone,
            "mobile_no": user_doc.mobile_no,
            "location": user_doc.location,
            "bio": user_doc.bio,
            "user_image": user_doc.user_image,
            "language": user_doc.language,
            "time_zone": user_doc.time_zone,
            "desk_theme": user_doc.desk_theme,
            "enabled": user_doc.enabled,
            "user_type": user_doc.user_type,
            "last_active": user_doc.last_active,
            "creation": user_doc.creation,
            "modified": user_doc.modified
        }
    except Exception as e:
        frappe.log_error(f"Failed to get user profile: {str(e)}")
        frappe.throw(_("Failed to get user profile"))


@frappe.whitelist()
def update_user_profile(**kwargs):
    """
    Update current user's profile information.
    """
    try:
        user = frappe.session.user
        if not user or user == "Guest":
            frappe.throw(_("Not authenticated"))

        # Get user document
        user_doc = frappe.get_doc("User", user)

        # Allowed fields for update
        allowed_fields = [
            "first_name", "middle_name", "last_name", "full_name",
            "phone", "mobile_no", "location", "bio", "user_image",
            "language", "time_zone", "desk_theme"
        ]

        # Update only allowed fields
        updated = False
        for field, value in kwargs.items():
            if field in allowed_fields and hasattr(user_doc, field):
                setattr(user_doc, field, value)
                updated = True

        if updated:
            user_doc.save(ignore_permissions=True)
            frappe.db.commit()

        return get_current_user_profile()

    except Exception as e:
        frappe.log_error(f"Failed to update user profile: {str(e)}")
        frappe.throw(_("Failed to update user profile"))


@frappe.whitelist()
def get_current_user_roles():
    """
    Get roles for the current user
    """
    try:
        user = frappe.session.user
        if user == 'Guest':
            return []

        roles = frappe.get_roles(user)
        return roles

    except Exception as e:
        frappe.log_error(f"Error getting user roles: {str(e)}")
        return []


@frappe.whitelist()
def has_admin_role():
    """
    Check if current user has System Manager or Administrator role
    """
    try:
        user = frappe.session.user
        if user == 'Guest':
            return False

        roles = frappe.get_roles(user)
        return 'System Manager' in roles or 'Administrator' in roles

    except Exception as e:
        frappe.log_error(f"Error checking admin role: {str(e)}")
        return False
