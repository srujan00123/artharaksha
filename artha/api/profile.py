"""
Profile API
Provides endpoints for household profile management
"""

import frappe
from frappe import _
from typing import Dict, Any, Optional, Union


@frappe.whitelist()
def get_household_profile() -> Dict[str, Any]:
    """
    Get household profile for the current user
    Returns: {'message': profile_data} or empty if no profile found
    """
    try:
        # Get user's household profile
        household_profile = frappe.db.get_value(
            "Household Profile",
            {"user": frappe.session.user},
            "*",
            as_dict=True
        )

        if household_profile:
            return household_profile
        else:
            # Return empty dict instead of throwing error for 417 response
            return {}

    except Exception as e:
        frappe.log_error(f"Error fetching household profile: {str(e)}")
        frappe.throw(_("Failed to fetch household profile"))


@frappe.whitelist()
def get_user_profile() -> Dict[str, Any]:
    """
    Get current user profile information
    """
    try:
        user = frappe.get_doc("User", frappe.session.user)
        return {
            "name": user.name,
            "email": user.email,
            "full_name": user.full_name,
            "first_name": user.first_name,
            "last_name": user.last_name,
            "user_image": user.user_image,
            "roles": [role.role for role in user.roles]
        }
    except Exception as e:
        frappe.log_error(f"Error fetching user profile: {str(e)}")
        frappe.throw(_("Failed to fetch user profile"))


@frappe.whitelist()
def update_user_profile(**kwargs) -> Dict[str, Any]:
    """
    Update user profile information
    """
    try:
        # Get profile data from form dict, excluding cmd
        profile_data = {k: v for k,
                        v in frappe.form_dict.items() if k != 'cmd'}

        # Handle JSON string if passed as single parameter
        if 'profile_data' in profile_data:
            if isinstance(profile_data['profile_data'], str):
                import json
                profile_data = json.loads(profile_data['profile_data'])
            else:
                profile_data = profile_data['profile_data']

        user = frappe.get_doc("User", frappe.session.user)

        # Update allowed fields
        allowed_fields = ['full_name', 'first_name',
                          'last_name', 'mobile_no', 'phone']
        for field in allowed_fields:
            if field in profile_data:
                setattr(user, field, profile_data[field])

        user.save()

        return {
            "status": "success",
            "message": "Profile updated successfully"
        }
    except Exception as e:
        frappe.log_error(f"Error updating user profile: {str(e)}")
        frappe.throw(_("Failed to update user profile: {0}").format(str(e)))


@frappe.whitelist()
def create_household_profile(**kwargs) -> Dict[str, Any]:
    """
    Create or update household profile for the current user (upsert operation)
    """
    try:
        # Get profile data from form dict, excluding cmd
        profile_data = {k: v for k,
                        v in frappe.form_dict.items() if k != 'cmd'}

        # Handle JSON string if passed as single parameter
        if 'profile_data' in profile_data:
            if isinstance(profile_data['profile_data'], str):
                import json
                profile_data = json.loads(profile_data['profile_data'])
            else:
                profile_data = profile_data['profile_data']

        # Check if profile already exists
        existing_profile = frappe.db.get_value(
            "Household Profile",
            {"user": frappe.session.user},
            "name"
        )

        if existing_profile:
            # Update existing profile
            profile_doc = frappe.get_doc("Household Profile", existing_profile)

            # Update profile data
            for field, value in profile_data.items():
                if hasattr(profile_doc, field) and field not in ['name', 'user']:
                    setattr(profile_doc, field, value)

            profile_doc.save()

            return {
                "status": "success",
                "message": "Household profile updated successfully",
                "profile_name": profile_doc.name
            }
        else:
            # Create new household profile
            profile_doc = frappe.new_doc("Household Profile")
            profile_doc.user = frappe.session.user

            # Set profile data
            for field, value in profile_data.items():
                if hasattr(profile_doc, field) and field != 'user':
                    setattr(profile_doc, field, value)

            profile_doc.insert()

            return {
                "status": "success",
                "message": "Household profile created successfully",
                "profile_name": profile_doc.name
            }
    except Exception as e:
        frappe.log_error(
            f"Error creating/updating household profile: {str(e)}")
        frappe.throw(
            _("Failed to create/update household profile: {0}").format(str(e)))


@frappe.whitelist()
def update_household_profile(**kwargs) -> Dict[str, Any]:
    """
    Update household profile
    """
    try:
        # Get profile_name and profile_data from form dict
        profile_name = frappe.form_dict.get('profile_name')
        if not profile_name:
            frappe.throw(_("Profile name is required"))

        # Get profile data from form dict, excluding cmd and profile_name
        profile_data = {k: v for k, v in frappe.form_dict.items()
                        if k not in ['cmd', 'profile_name']}

        # Handle JSON string if passed as single parameter
        if 'profile_data' in profile_data:
            if isinstance(profile_data['profile_data'], str):
                import json
                profile_data = json.loads(profile_data['profile_data'])
            else:
                profile_data = profile_data['profile_data']

        # Verify ownership
        profile_doc = frappe.get_doc("Household Profile", profile_name)
        if profile_doc.user != frappe.session.user:
            frappe.throw(_("You don't have permission to update this profile"))

        # Update profile data
        for field, value in profile_data.items():
            if hasattr(profile_doc, field) and field not in ['name', 'user']:
                setattr(profile_doc, field, value)

        profile_doc.save()

        return {
            "status": "success",
            "message": "Household profile updated successfully"
        }
    except Exception as e:
        frappe.log_error(f"Error updating household profile: {str(e)}")
        frappe.throw(
            _("Failed to update household profile: {0}").format(str(e)))
