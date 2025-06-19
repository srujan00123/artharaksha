"""
Expense API
Provides specialized endpoints for expense management and analysis
Following the income.py architecture pattern exactly
"""

import frappe
from frappe import _
from frappe.utils import flt, getdate, now_datetime
from datetime import datetime, timedelta
import json
from typing import Dict, List, Any, Optional, Union

# Import utility functions from centralized utils module
from artha.utils.income_utils import (
    convert_datetime_format,
    get_user_household_profile,
    log_expense_operation,
    validate_expense_data as validate_expense_util,
    apply_expense_filters,
    calculate_expense_analytics,
    get_expense_types as get_expense_types_util,
    create_expense_entry
)
from artha.utils.notifications import (
    expense_notification,
    analytics_notification,
    send_custom_notification,
    realtime_notification
)


@frappe.whitelist()
def get_expense_types() -> Dict[str, List[Dict[str, str]]]:
    """
    Get all available expense types (medical and other) using utility function
    Returns: {'medical_types': [...], 'other_types': [...]}
    """
    try:
        return get_expense_types_util()
    except Exception as e:
        frappe.log_error(f"Error fetching expense types: {str(e)}")
        frappe.throw(_("Failed to fetch expense types"))


@frappe.whitelist()
def get_user_expenses(filters: Optional[Union[str, Dict]] = None, include_analytics: bool = False) -> Dict[str, Any]:
    """
    Get expense data for the current user's household profile
    Returns flattened expense entries from both medical_expenses and other_expenses child tables
    Follows the exact pattern of get_user_income
    """
    try:
        # Get user's household profile using utility function
        household_profile = get_user_household_profile()

        if not household_profile:
            return {
                "expenses": [],
                "analytics": {
                    "total_expenses": 0,
                    "medical_expenses": 0,
                    "other_expenses": 0,
                    "direct_medical": 0,
                    "indirect_medical": 0,
                    "expense_by_category": {},
                    "monthly_trends": [],
                    "summary": {
                        "total_count": 0,
                        "average_expense": 0,
                        "top_category": ""
                    }
                } if include_analytics else None
            }

        # Parse filters if provided
        if isinstance(filters, str):
            filters = json.loads(filters)

        if not filters:
            filters = {}

        # Get expense records for this household
        expense_records = frappe.get_all(
            "Expense",
            filters={"household_profile": household_profile},
            fields=["name", "creation", "modified"]
        )

        if not expense_records:
            return {
                "expenses": [],
                "analytics": {
                    "total_expenses": 0,
                    "medical_expenses": 0,
                    "other_expenses": 0,
                    "direct_medical": 0,
                    "indirect_medical": 0,
                    "expense_by_category": {},
                    "monthly_trends": [],
                    "summary": {
                        "total_count": 0,
                        "average_expense": 0,
                        "top_category": ""
                    }
                } if include_analytics else None
            }

        # Flatten all expense entries from child tables
        all_expense_entries = []

        for expense_record in expense_records:
            # Get medical expenses from child table
            medical_expenses = frappe.get_all(
                "Medical Expense Type",
                filters={"parent": expense_record.name},
                fields=[
                    "name", "medical_expense_type", "amount", "date_time",
                    "description", "proof_of_payment", "is_direct"
                ],
                order_by="date_time desc"
            )

            for med_exp in medical_expenses:
                all_expense_entries.append({
                    "name": med_exp.name,
                    "parent": expense_record.name,
                    "type": "medical",
                    "category": med_exp.medical_expense_type,
                    "amount": flt(med_exp.amount),
                    "date_time": med_exp.date_time,
                    "description": med_exp.description or "",
                    "is_direct": med_exp.is_direct if med_exp.is_direct is not None else True,
                    "proof_of_payment": med_exp.proof_of_payment,
                    "household_profile": household_profile,
                    "creation": expense_record.creation,
                    "modified": expense_record.modified
                })

            # Get other expenses from child table
            other_expenses = frappe.get_all(
                "Expense Type",
                filters={"parent": expense_record.name},
                fields=[
                    "name", "expense_type", "amount", "date_time", "description"
                ],
                order_by="date_time desc"
            )

            for other_exp in other_expenses:
                all_expense_entries.append({
                    "name": other_exp.name,
                    "parent": expense_record.name,
                    "type": "other",
                    "category": other_exp.expense_type,
                    "amount": flt(other_exp.amount),
                    "date_time": other_exp.date_time,
                    "description": other_exp.description or "",
                    "is_direct": None,
                    "proof_of_payment": None,
                    "household_profile": household_profile,
                    "creation": expense_record.creation,
                    "modified": expense_record.modified
                })

        # Apply filters to flattened entries using utility function
        filtered_entries = apply_expense_filters(all_expense_entries, filters)

        # Calculate analytics if requested using utility function
        analytics_data = None
        if include_analytics:
            analytics_data = calculate_expense_analytics(
                filtered_entries, filters)

        return {
            "expenses": filtered_entries,
            "analytics": analytics_data
        }

    except Exception as e:
        frappe.log_error(f"Error fetching user expenses: {str(e)}")
        frappe.throw(_("Failed to fetch expense records"))


# Removed _apply_filters - now using apply_expense_filters utility function


# Removed _calculate_analytics - now using calculate_expense_analytics utility function


@frappe.whitelist()
def get_expense_dashboard_metrics(period: str = "this_month") -> Dict[str, Any]:
    """
    Get computed dashboard metrics for expense management
    Provides all the key metrics needed for dashboard displays
    """
    try:
        # Get analytics using existing function
        analytics_result = get_user_expenses(
            filters=json.dumps({"period": period}),
            include_analytics=True
        )

        analytics = analytics_result.get("analytics", {})

        return {
            "total_expenses": analytics.get("total_expenses", 0),
            "medical_expenses": analytics.get("medical_expenses", 0),
            "other_expenses": analytics.get("other_expenses", 0),
            "direct_medical": analytics.get("direct_medical", 0),
            "indirect_medical": analytics.get("indirect_medical", 0),
            "expense_count": analytics.get("summary", {}).get("total_count", 0),
            "average_expense": analytics.get("summary", {}).get("average_expense", 0),
            "top_category": analytics.get("summary", {}).get("top_category", ""),
            "expense_by_category": analytics.get("expense_by_category", {}),
            "monthly_trends": analytics.get("monthly_trends", []),
            "period": period,
            "start_date": "",
            "end_date": ""
        }

    except Exception as e:
        frappe.log_error(f"Error fetching expense dashboard metrics: {str(e)}")
        frappe.throw(_("Failed to fetch expense dashboard metrics"))


@frappe.whitelist()
@expense_notification('created', data_field='expense_data', broadcast=True)
def create_expense(expense_data: Union[str, Dict]) -> Dict[str, Any]:
    """
    Create a new expense entry in the appropriate child table
    """
    try:
        # Get user's household profile using utility function
        household_profile = get_user_household_profile()
        if not household_profile:
            frappe.throw(_("No household profile found for current user"))

        # Parse expense_data if it's a string
        if isinstance(expense_data, str):
            expense_data = json.loads(expense_data)

        # Find or create the single Expense record for this household
        expense_name_db = frappe.db.get_value(
            "Expense",
            {"household_profile": household_profile},
            "name"
        )
        if expense_name_db:
            expense_doc = frappe.get_doc("Expense", expense_name_db)
        else:
            expense_doc = frappe.new_doc("Expense")
            expense_doc.household_profile = household_profile
            expense_doc.save()  # Save to get document name

        # Use utility function to create expense entry
        entry_name = create_expense_entry(expense_doc.name, expense_data)

        # Log the operation
        log_expense_operation("create_expense", {
            "expense_name": expense_doc.name,
            "household_profile": household_profile,
            "entry_name": entry_name,
            "amount": expense_data.get("amount"),
            "type": expense_data.get("type"),
            "category": expense_data.get("category")
        })

        return {
            "status": "success",
            "expense_data": {
                "name": expense_doc.name,
                "household_profile": expense_doc.household_profile,
                "monthly_expense": expense_doc.monthly_expense,
                "entry_name": entry_name,
                "type": expense_data.get("type"),
                "category": expense_data.get("category"),
                "amount": expense_data.get("amount")
            }
        }
    except Exception as e:
        frappe.log_error(f"Error creating expense: {str(e)}")
        frappe.throw(_("Failed to save expense record: {0}").format(str(e)))


@frappe.whitelist()
@expense_notification('updated', data_field='expense_data', broadcast=True)
def update_expense(expense_name: str, expense_data: Union[str, Dict]) -> Dict[str, Any]:
    """
    Update an existing expense entry in child table
    Enhanced with better error handling and existence checking
    """
    try:
        # Parse expense_data if it's a string
        if isinstance(expense_data, str):
            expense_data = json.loads(expense_data)

        # Validate expense data using utility function
        validation_errors = validate_expense_util(expense_data)
        if validation_errors:
            frappe.throw(_("; ".join(validation_errors)))

        # Check if the expense entry exists first
        child_doc = None
        if expense_data.get("type") == "medical":
            if not frappe.db.exists("Medical Expense Type", expense_name):
                frappe.throw(
                    _("Medical expense entry not found: {0}").format(expense_name))
            child_doc = frappe.get_doc("Medical Expense Type", expense_name)
            child_doc.medical_expense_type = expense_data.get("category")
            child_doc.amount = flt(expense_data.get("amount"))
            child_doc.date_time = convert_datetime_format(
                expense_data.get("date_time"))
            child_doc.description = expense_data.get("description", "")
            child_doc.proof_of_payment = expense_data.get("proof_of_payment")
            child_doc.is_direct = expense_data.get("is_direct", True)
        else:
            if not frappe.db.exists("Expense Type", expense_name):
                frappe.throw(
                    _("Expense entry not found: {0}").format(expense_name))
            child_doc = frappe.get_doc("Expense Type", expense_name)
            child_doc.expense_type = expense_data.get("category")
            child_doc.amount = flt(expense_data.get("amount"))
            child_doc.date_time = convert_datetime_format(
                expense_data.get("date_time"))
            child_doc.description = expense_data.get("description", "")

        child_doc.save()

        # Log the operation
        log_expense_operation("update_expense", {
            "expense_name": expense_name,
            "amount": expense_data.get("amount"),
            "type": expense_data.get("type"),
            "category": expense_data.get("category")
        })

        # Get parent document info
        parent_doc = frappe.get_doc("Expense", child_doc.parent)

        return {
            "status": "success",
            "expense_data": {
                "name": parent_doc.name,
                "household_profile": parent_doc.household_profile,
                "monthly_expense": parent_doc.monthly_expense,
                "entry_name": expense_name,
                "type": expense_data.get("type"),
                "category": expense_data.get("category"),
                "amount": expense_data.get("amount")
            }
        }
    except Exception as e:
        frappe.log_error(f"Error updating expense: {str(e)}")
        frappe.throw(_("Failed to update expense record: {0}").format(str(e)))


@frappe.whitelist()
@expense_notification('deleted', data_field='deleted_expense', broadcast=True)
def delete_expense(expense_name: str, expense_id: str) -> Dict[str, Any]:
    """
    Delete an expense entry from child table
    Enhanced with better error handling and existence checking
    """
    try:
        # Check if it's a medical expense first
        medical_exists = frappe.db.exists("Medical Expense Type", expense_id)
        if medical_exists:
            frappe.delete_doc("Medical Expense Type",
                              expense_id, ignore_missing=True)
            log_expense_operation("delete_expense", {
                "expense_name": expense_name,
                "expense_id": expense_id,
                "type": "medical"
            })
            return {
                "status": "success",
                "deleted_expense": {
                    "expense_id": expense_id,
                    "type": "medical",
                    "expense_name": expense_name
                },
                "message": "Medical expense deleted successfully"
            }

        # Check if it's an other expense
        other_exists = frappe.db.exists("Expense Type", expense_id)
        if other_exists:
            frappe.delete_doc("Expense Type", expense_id, ignore_missing=True)
            log_expense_operation("delete_expense", {
                "expense_name": expense_name,
                "expense_id": expense_id,
                "type": "other"
            })
            return {
                "status": "success",
                "deleted_expense": {
                    "expense_id": expense_id,
                    "type": "other",
                    "expense_name": expense_name
                },
                "message": "Expense deleted successfully"
            }

        # If neither exists, return success (already deleted)
        log_expense_operation("delete_expense", {
            "expense_name": expense_name,
            "expense_id": expense_id,
            "type": "not_found"
        })
        return {
            "status": "success",
            "message": "Expense entry not found (may have been already deleted)"
        }

    except Exception as e:
        frappe.log_error(f"Error deleting expense: {str(e)}")
        # Don't throw error for "not found" cases - return success
        if "not found" in str(e).lower():
            return {
                "status": "success",
                "message": "Expense entry not found (may have been already deleted)"
            }
        frappe.throw(_("Failed to delete expense record: {0}").format(str(e)))


@frappe.whitelist()
def validate_expense_data(expense_data: Union[str, Dict]) -> Dict[str, Any]:
    """
    Validate expense data before saving using utility function
    """
    try:
        # Parse expense_data if it's a string
        if isinstance(expense_data, str):
            expense_data = json.loads(expense_data)

        # Use utility function for validation
        validation_errors = validate_expense_util(expense_data)

        # Convert list of errors to dictionary format for backward compatibility
        errors = {}
        for i, error in enumerate(validation_errors):
            errors[f"error_{i}"] = error

        return {
            "is_valid": len(validation_errors) == 0,
            "errors": errors
        }

    except Exception as e:
        frappe.log_error(f"Error validating expense data: {str(e)}")
        return {
            "is_valid": False,
            "errors": {"general": "Validation failed"}
        }
