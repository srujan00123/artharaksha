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


@frappe.whitelist()
def get_expense_types() -> Dict[str, List[Dict[str, str]]]:
    """
    Get all available expense types (medical and other)
    Returns: {'medical_types': [...], 'other_types': [...]}
    """
    try:
        # Medical expense categories following WHO CHE guidelines
        medical_types = [
            {"name": "consultation", "expense_type": "Consultation"},
            {"name": "diagnostics", "expense_type": "Diagnostics"},
            {"name": "medicines", "expense_type": "Medicines"},
            {"name": "hospitalization", "expense_type": "Hospitalization"},
            {"name": "travel", "expense_type": "Travel"},
            {"name": "accommodation", "expense_type": "Accommodation"},
            {"name": "wage_loss", "expense_type": "Wage Loss"},
            {"name": "other_medical", "expense_type": "Other Medical"}
        ]

        # Other expense categories
        other_types = [
            {"name": "food", "expense_type": "Food & Groceries"},
            {"name": "transportation", "expense_type": "Transportation"},
            {"name": "education", "expense_type": "Education"},
            {"name": "utilities", "expense_type": "Utilities"},
            {"name": "rent", "expense_type": "Rent/Housing"},
            {"name": "clothing", "expense_type": "Clothing"},
            {"name": "entertainment", "expense_type": "Entertainment"},
            {"name": "other", "expense_type": "Other Expenses"}
        ]

        return {
            "medical_types": medical_types,
            "other_types": other_types
        }

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
        # Get user's household profile
        household_profile = frappe.db.get_value(
            "Household Profile",
            {"user": frappe.session.user},
            "name"
        )

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

        # Apply filters to flattened entries
        filtered_entries = _apply_filters(all_expense_entries, filters)

        # Calculate analytics if requested
        analytics_data = None
        if include_analytics:
            analytics_data = _calculate_analytics(filtered_entries, filters)

        return {
            "expenses": filtered_entries,
            "analytics": analytics_data
        }

    except Exception as e:
        frappe.log_error(f"Error fetching user expenses: {str(e)}")
        frappe.throw(_("Failed to fetch expense records"))


def _apply_filters(expense_entries: List[Dict], filters: Dict) -> List[Dict]:
    """Apply filters to expense entries - following income.py pattern exactly"""
    filtered = expense_entries.copy()

    # Date filters - explicit date range takes precedence
    if filters.get('dateFrom'):
        start_date = getdate(filters['dateFrom'])
        filtered = [e for e in filtered if getdate(
            e['date_time']) >= start_date]

    if filters.get('dateTo'):
        end_date = getdate(filters['dateTo'])
        filtered = [e for e in filtered if getdate(e['date_time']) <= end_date]

    # Period filters - only apply if no explicit date range
    if filters.get('period') and not (filters.get('dateFrom') or filters.get('dateTo')):
        period = filters['period']
        today = getdate()
        start_date = None
        end_date = None

        if period == "this_month":
            start_date = today.replace(day=1)
            end_date = today
        elif period == "last_month":
            last_month = today.replace(day=1) - timedelta(days=1)
            start_date = last_month.replace(day=1)
            end_date = last_month
        elif period == "last_3_months":
            start_date = (today.replace(day=1) -
                          timedelta(days=90)).replace(day=1)
            end_date = today
        elif period == "last_6_months":
            start_date = (today.replace(day=1) -
                          timedelta(days=180)).replace(day=1)
            end_date = today
        elif period == "this_year":
            start_date = today.replace(month=1, day=1)
            end_date = today
        elif period == "custom":
            # Custom period handled by explicit dateFrom/dateTo
            pass

        if start_date and end_date:
            filtered = [e for e in filtered if start_date <=
                        getdate(e['date_time']) <= end_date]

    # Type filter
    if filters.get('type'):
        filtered = [e for e in filtered if e['type'] == filters['type']]

    # Category filter
    if filters.get('category'):
        filtered = [e for e in filtered if e['category']
                    == filters['category']]

    # Amount filters
    if filters.get('amountMin'):
        min_amount = flt(filters['amountMin'])
        filtered = [e for e in filtered if flt(e['amount']) >= min_amount]

    if filters.get('amountMax'):
        max_amount = flt(filters['amountMax'])
        filtered = [e for e in filtered if flt(e['amount']) <= max_amount]

    # Search filter
    if filters.get('searchTerm'):
        search_term = filters['searchTerm'].lower()
        filtered = [e for e in filtered if
                    search_term in e['category'].lower() or
                    search_term in (e['description'] or "").lower()]

    # Direct/Indirect filter for medical expenses
    if filters.get('isDirect') is not None:
        if filters['isDirect']:
            filtered = [e for e in filtered if e['type']
                        == 'medical' and e.get('is_direct', True)]
        else:
            filtered = [e for e in filtered if e['type'] ==
                        'medical' and not e.get('is_direct', True)]

    # Sorting
    sort_by = filters.get('sortBy', 'date')
    sort_order = filters.get('sortOrder', 'desc')
    reverse_sort = sort_order == 'desc'

    if sort_by == 'date':
        filtered.sort(key=lambda x: getdate(
            x['date_time']), reverse=reverse_sort)
    elif sort_by == 'amount':
        filtered.sort(key=lambda x: flt(x['amount']), reverse=reverse_sort)
    elif sort_by == 'category':
        filtered.sort(key=lambda x: x['category'], reverse=reverse_sort)

    return filtered


def _calculate_analytics(expense_entries: List[Dict], filters: Dict) -> Dict[str, Any]:
    """Calculate analytics from expense entries"""
    total_expenses = sum(flt(e['amount']) for e in expense_entries)
    medical_expenses = sum(flt(e['amount'])
                           for e in expense_entries if e['type'] == 'medical')
    other_expenses = sum(flt(e['amount'])
                         for e in expense_entries if e['type'] == 'other')
    direct_medical = sum(flt(e['amount']) for e in expense_entries
                         if e['type'] == 'medical' and e.get('is_direct', True))
    indirect_medical = sum(flt(e['amount']) for e in expense_entries
                           if e['type'] == 'medical' and not e.get('is_direct', True))

    # Category breakdown
    expense_by_category = {}
    for entry in expense_entries:
        category = entry['category']
        if category not in expense_by_category:
            expense_by_category[category] = 0
        expense_by_category[category] += flt(entry['amount'])

    # Monthly trends
    monthly_data = {}
    for entry in expense_entries:
        entry_date = getdate(entry['date_time'])
        month_key = entry_date.strftime("%Y-%m")

        if month_key not in monthly_data:
            monthly_data[month_key] = {
                "total": 0,
                "medical": 0,
                "other": 0,
                "direct": 0,
                "indirect": 0
            }

        amount = flt(entry['amount'])
        monthly_data[month_key]["total"] += amount

        if entry['type'] == 'medical':
            monthly_data[month_key]["medical"] += amount
            if entry.get('is_direct', True):
                monthly_data[month_key]["direct"] += amount
            else:
                monthly_data[month_key]["indirect"] += amount
        else:
            monthly_data[month_key]["other"] += amount

    # Generate monthly trends
    monthly_trends = []
    for month_key in sorted(monthly_data.keys()):
        month_date = datetime.strptime(month_key, "%Y-%m")
        monthly_trends.append({
            "month": month_date.strftime("%b %Y"),
            "total": monthly_data[month_key]["total"],
            "medical": monthly_data[month_key]["medical"],
            "other": monthly_data[month_key]["other"],
            "direct": monthly_data[month_key]["direct"],
            "indirect": monthly_data[month_key]["indirect"]
        })

    # Summary statistics
    total_count = len(expense_entries)
    average_expense = total_expenses / total_count if total_count > 0 else 0
    top_category = max(expense_by_category.items(), key=lambda x: x[1])[
        0] if expense_by_category else ""

    return {
        "total_expenses": total_expenses,
        "medical_expenses": medical_expenses,
        "other_expenses": other_expenses,
        "direct_medical": direct_medical,
        "indirect_medical": indirect_medical,
        "expense_by_category": expense_by_category,
        "monthly_trends": monthly_trends,
        "summary": {
            "total_count": total_count,
            "average_expense": average_expense,
            "top_category": top_category
        },
        "period": filters.get('period', '')
    }


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
def create_expense(expense_data: Union[str, Dict]) -> Dict[str, Any]:
    """
    Create a new expense entry in the appropriate child table
    """
    try:
        # Get user's household profile
        household_profile = frappe.db.get_value(
            "Household Profile",
            {"user": frappe.session.user},
            "name"
        )
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

        # Add expense to appropriate child table
        if expense_data.get("type") == "medical":
            expense_doc.append("medical_expenses", {
                "medical_expense_type": expense_data.get("category"),
                "amount": flt(expense_data.get("amount")),
                "date_time": expense_data.get("date_time") or now_datetime(),
                "description": expense_data.get("description", ""),
                "proof_of_payment": expense_data.get("proof_of_payment"),
                "is_direct": expense_data.get("is_direct", True)
            })
        else:
            expense_doc.append("other_expenses", {
                "expense_type": expense_data.get("category"),
                "amount": flt(expense_data.get("amount")),
                "date_time": expense_data.get("date_time") or now_datetime(),
                "description": expense_data.get("description", "")
            })

        # Save the document
        expense_doc.save()

        return {
            "name": expense_doc.name,
            "household_profile": expense_doc.household_profile,
            "monthly_expense": expense_doc.monthly_expense
        }
    except Exception as e:
        frappe.log_error(f"Error creating expense: {str(e)}")
        frappe.throw(_("Failed to save expense record: {0}").format(str(e)))


@frappe.whitelist()
def update_expense(expense_name: str, expense_data: Union[str, Dict]) -> Dict[str, Any]:
    """
    Update an existing expense entry in child table
    """
    try:
        # Parse expense_data if it's a string
        if isinstance(expense_data, str):
            expense_data = json.loads(expense_data)

        # Get the child table document directly
        if expense_data.get("type") == "medical":
            child_doc = frappe.get_doc("Medical Expense Type", expense_name)
            child_doc.medical_expense_type = expense_data.get("category")
            child_doc.amount = flt(expense_data.get("amount"))
            child_doc.date_time = expense_data.get("date_time")
            child_doc.description = expense_data.get("description", "")
            child_doc.proof_of_payment = expense_data.get("proof_of_payment")
            child_doc.is_direct = expense_data.get("is_direct", True)
        else:
            child_doc = frappe.get_doc("Expense Type", expense_name)
            child_doc.expense_type = expense_data.get("category")
            child_doc.amount = flt(expense_data.get("amount"))
            child_doc.date_time = expense_data.get("date_time")
            child_doc.description = expense_data.get("description", "")

        child_doc.save()

        # Get parent document info
        parent_doc = frappe.get_doc("Expense", child_doc.parent)

        return {
            "name": parent_doc.name,
            "household_profile": parent_doc.household_profile,
            "monthly_expense": parent_doc.monthly_expense
        }
    except Exception as e:
        frappe.log_error(f"Error updating expense: {str(e)}")
        frappe.throw(_("Failed to update expense record: {0}").format(str(e)))


@frappe.whitelist()
def delete_expense(expense_name: str, expense_id: str) -> Dict[str, Any]:
    """
    Delete an expense entry from child table
    """
    try:
        # Delete the child table document
        frappe.delete_doc("Medical Expense Type",
                          expense_id, ignore_missing=True)
        frappe.delete_doc("Expense Type", expense_id, ignore_missing=True)

        return {
            "status": "success",
            "message": "Expense deleted successfully"
        }
    except Exception as e:
        frappe.log_error(f"Error deleting expense: {str(e)}")
        frappe.throw(_("Failed to delete expense record: {0}").format(str(e)))


@frappe.whitelist()
def validate_expense_data(expense_data: Union[str, Dict]) -> Dict[str, Any]:
    """
    Validate expense data before saving
    """
    try:
        # Parse expense_data if it's a string
        if isinstance(expense_data, str):
            expense_data = json.loads(expense_data)

        errors = {}

        # Type validation
        if not expense_data.get("type") or expense_data["type"] not in ["medical", "other"]:
            errors["type"] = "Please select a valid expense type"

        # Category validation
        if not expense_data.get("category") or expense_data["category"].strip() == "":
            errors["category"] = "Please select a category"

        # Amount validation
        amount = flt(expense_data.get("amount", 0))
        if amount <= 0:
            errors["amount"] = "Please enter a valid amount greater than 0"

        # Date validation
        if not expense_data.get("date_time"):
            errors["date_time"] = "Please select a date"
        else:
            try:
                expense_date = getdate(expense_data["date_time"])
                today = getdate()
                if expense_date > today:
                    errors["date_time"] = "Expense date cannot be in the future"
            except:
                errors["date_time"] = "Please enter a valid date"

        return {
            "is_valid": len(errors) == 0,
            "errors": errors
        }

    except Exception as e:
        frappe.log_error(f"Error validating expense data: {str(e)}")
        return {
            "is_valid": False,
            "errors": {"general": "Validation failed"}
        }
