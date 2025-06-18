"""
Income Utilities
Centralized utility functions for income management and processing
Used by API endpoints, scheduled tasks, and other income-related operations
"""

import frappe
from frappe.utils import flt, getdate
from frappe.query_builder import DocType
from frappe import qb
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
from typing import Dict, List, Any, Optional, Union, Set

# DocType references for Query Builder
Income = DocType("Income")
IncomeSource = DocType("Income Source Type")
IncomeLedger = DocType("Income Ledger")
HouseholdProfile = DocType("Household Profile")
IncomeType = DocType("Income Type")


# ===============================
# DATETIME UTILITIES
# ===============================

def convert_datetime_format(date_time: str) -> str:
    """
    Convert ISO datetime format to proper format for database
    Handles both ISO format (2025-06-15T00:00:00.000Z) and regular format

    Args:
        date_time: DateTime string in various formats

    Returns:
        Formatted datetime string for database storage
    """
    try:
        if isinstance(date_time, str) and 'T' in date_time and date_time.endswith('Z'):
            parsed_date = datetime.fromisoformat(
                date_time.replace('Z', '+00:00'))
            return parsed_date.strftime('%Y-%m-%d %H:%M:%S')
        return date_time
    except Exception as e:
        frappe.log_error(
            f"Error converting datetime format {date_time}: {str(e)}")
        return date_time  # Return original if conversion fails


# ===============================
# RECURRING DATE UTILITIES
# ===============================

def get_next_occurrence(current_date: Any, frequency: str) -> Any:
    """
    Calculate the next occurrence date based on frequency

    Args:
        current_date: Current date to calculate from
        frequency: Frequency string (daily, weekly, monthly, etc.)

    Returns:
        Next occurrence date
    """
    freq = str(frequency).lower()

    if freq == 'daily':
        return current_date + timedelta(days=1)
    elif freq == 'weekly':
        return current_date + timedelta(weeks=1)
    elif freq == 'bi-weekly':
        return current_date + timedelta(weeks=2)
    elif freq == 'monthly':
        return current_date + relativedelta(months=1)
    elif freq == 'quarterly':
        return current_date + relativedelta(months=3)
    elif freq == 'semi-annually':
        return current_date + relativedelta(months=6)
    elif freq in ['annually', 'yearly']:
        return current_date + relativedelta(years=1)
    else:
        # Default to monthly
        return current_date + relativedelta(months=1)


def get_recurring_dates(start_date: Any, end_date: Any, frequency: str) -> Set[Any]:
    """
    Get all dates for recurring income within the date range

    Args:
        start_date: Start date for recurring pattern
        end_date: End date for recurring pattern
        frequency: Frequency string (daily, weekly, monthly, etc.)

    Returns:
        Set of dates for the recurring pattern
    """
    dates: Set[Any] = set()
    current_date = start_date

    while current_date <= end_date:
        dates.add(current_date)
        current_date = get_next_occurrence(current_date, frequency)

        # Safety check to prevent infinite loops
        if current_date <= start_date:
            break

    return dates


def get_frequency_display_name(frequency: str) -> str:
    """
    Get display-friendly name for frequency

    Args:
        frequency: Frequency string

    Returns:
        Display name for the frequency
    """
    frequency_map = {
        'daily': 'Daily',
        'weekly': 'Weekly',
        'bi-weekly': 'Bi-Weekly',
        'monthly': 'Monthly',
        'quarterly': 'Quarterly',
        'semi-annually': 'Semi-Annually',
        'annually': 'Annually',
        'yearly': 'Yearly'
    }
    return frequency_map.get(str(frequency).lower(), frequency.title())


def validate_frequency(frequency: str) -> bool:
    """
    Validate if the frequency is supported

    Args:
        frequency: Frequency string to validate

    Returns:
        True if frequency is valid, False otherwise
    """
    valid_frequencies = [
        'daily', 'weekly', 'bi-weekly', 'monthly',
        'quarterly', 'semi-annually', 'annually', 'yearly'
    ]
    return str(frequency).lower() in valid_frequencies


# ===============================
# LEDGER ENTRY UTILITIES
# ===============================

def create_ledger_entry(parent_name: str, entry_data: Dict[str, Any]) -> str:
    """
    Create a single ledger entry in the database

    Args:
        parent_name: Name of the parent Income document
        entry_data: Dictionary containing ledger entry data

    Returns:
        Name of the created ledger entry
    """
    try:
        # Validate required fields
        required_fields = ['income_type', 'date_time', 'amount']
        for field in required_fields:
            if field not in entry_data:
                frappe.throw(f"Required field missing: {field}")

        # Convert datetime if needed
        if 'date_time' in entry_data:
            entry_data['date_time'] = convert_datetime_format(
                entry_data['date_time'])

        # Create ledger entry
        ledger_entry = frappe.get_doc({
            "doctype": "Income Ledger",
            "parent": parent_name,
            "parenttype": "Income",
            "parentfield": "income_ledger",
            **entry_data
        })
        ledger_entry.insert()
        return ledger_entry.name

    except Exception as e:
        frappe.log_error(f"Error creating ledger entry: {str(e)}")
        frappe.throw(f"Failed to create ledger entry: {str(e)}")


def create_recurring_ledger_entries(parent_name: str, source_name: str, source_data: Dict[str, Any],
                                    start_date: Any, end_date: Any) -> int:
    """
    Create multiple recurring ledger entries for a source

    Args:
        parent_name: Name of the parent Income document
        source_name: Name of the income source
        source_data: Source configuration data
        start_date: Start date for entries
        end_date: End date for entries

    Returns:
        Number of entries created
    """
    try:
        if not source_data.get('recur_frequency'):
            frappe.throw("Frequency is required for recurring entries")

        # Get all dates for this recurring income
        dates = get_recurring_dates(
            start_date, end_date, source_data['recur_frequency'])

        entries_added = 0
        for entry_date in dates:
            # Check if entry already exists using Query Builder
            existing_check = (
                qb.from_(IncomeLedger)
                .select(IncomeLedger.name)
                .where(
                    (IncomeLedger.parent == parent_name) &
                    (IncomeLedger.income_source == source_name) &
                    (IncomeLedger.date_time == entry_date)
                )
                .limit(1)
            ).run(as_dict=True)
            existing = bool(existing_check)

            if not existing:
                entry_data = {
                    "income_source": source_name,
                    "income_type": "recurring",
                    "date_time": entry_date,
                    "amount": flt(source_data.get('income', 0)),
                    "source_type": source_data.get('type', ''),
                    "description": f"Recurring {source_data.get('type', '')} income"
                }
                create_ledger_entry(parent_name, entry_data)
                entries_added += 1

        return entries_added

    except Exception as e:
        frappe.log_error(f"Error creating recurring ledger entries: {str(e)}")
        frappe.throw(f"Failed to create recurring ledger entries: {str(e)}")


def cleanup_orphaned_entries(parent_name: str, valid_source_names: Set[str]) -> int:
    """
    Clean up orphaned ledger entries for an income record

    Args:
        parent_name: Name of the parent Income document
        valid_source_names: Set of valid source names

    Returns:
        Number of entries cleaned up
    """
    try:
        # Find orphaned entries using Query Builder
        query = (
            qb.from_(IncomeLedger)
            .select(IncomeLedger.name)
            .where(
                (IncomeLedger.parent == parent_name) &
                (IncomeLedger.income_type == "recurring")
            )
        )

        if valid_source_names:
            query = query.where(
                IncomeLedger.income_source.notin(list(valid_source_names)))
        else:
            query = query.where(IncomeLedger.income_source.isnotnull())

        orphaned_entries = query.run(as_dict=True)

        cleaned_count = 0
        for entry in orphaned_entries:
            frappe.delete_doc("Income Ledger", entry.name)
            cleaned_count += 1

        if cleaned_count > 0:
            frappe.log_error(
                f"Cleaned up {cleaned_count} orphaned ledger entries for {parent_name}",
                "Income Ledger Cleanup"
            )

        return cleaned_count

    except Exception as e:
        frappe.log_error(f"Error cleaning up orphaned entries: {str(e)}")
        return 0


# ===============================
# CALCULATION UTILITIES
# ===============================

def calculate_monthly_income_from_sources(sources: List[Dict[str, Any]]) -> float:
    """
    Calculate total monthly income from recurring sources

    Args:
        sources: List of income source dictionaries

    Returns:
        Total monthly income amount
    """
    total_monthly = 0
    for source in sources:
        if source.get('recur', False):  # Only count recurring sources
            total_monthly += flt(source.get('income', 0))
    return total_monthly


def calculate_period_income(ledger_entries: List[Dict[str, Any]],
                            start_date: Any = None, end_date: Any = None) -> Dict[str, float]:
    """
    Calculate income totals for a specific period

    Args:
        ledger_entries: List of ledger entry dictionaries
        start_date: Period start date (optional)
        end_date: Period end date (optional)

    Returns:
        Dictionary with income totals by type
    """
    totals = {
        'total_income': 0,
        'recurring_income': 0,
        'one_time_income': 0,
        'income_by_type': {}
    }

    for entry in ledger_entries:
        # Apply date filters if provided
        if start_date or end_date:
            entry_date = getdate(entry.get('date_time'))
            if start_date and entry_date < getdate(start_date):
                continue
            if end_date and entry_date > getdate(end_date):
                continue

        amount = flt(entry.get('amount', 0))
        income_type = entry.get('income_type', '')
        source_type = entry.get('source_type', 'Unknown')

        # Add to totals
        totals['total_income'] += amount

        if income_type == 'recurring':
            totals['recurring_income'] += amount
        else:
            totals['one_time_income'] += amount

        # Group by source type
        if source_type not in totals['income_by_type']:
            totals['income_by_type'][source_type] = 0
        totals['income_by_type'][source_type] += amount

    return totals


def get_income_summary_stats(ledger_entries: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Generate comprehensive income statistics

    Args:
        ledger_entries: List of ledger entry dictionaries

    Returns:
        Dictionary with various income statistics
    """
    if not ledger_entries:
        return {
            'total_entries': 0,
            'total_income': 0,
            'average_amount': 0,
            'latest_date': None,
            'earliest_date': None,
            'income_by_type': {}
        }

    entry_dates = []
    total_income = 0
    income_by_type = {}

    for entry in ledger_entries:
        amount = flt(entry.get('amount', 0))
        total_income += amount

        # Track dates
        if entry.get('date_time'):
            entry_dates.append(getdate(entry['date_time']))

        # Group by source type
        source_type = entry.get('source_type', 'Unknown')
        if source_type not in income_by_type:
            income_by_type[source_type] = {'amount': 0, 'entries': 0}
        income_by_type[source_type]['amount'] += amount
        income_by_type[source_type]['entries'] += 1

    return {
        'total_entries': len(ledger_entries),
        'total_income': total_income,
        'average_amount': total_income / len(ledger_entries) if ledger_entries else 0,
        'latest_date': max(entry_dates) if entry_dates else None,
        'earliest_date': min(entry_dates) if entry_dates else None,
        'income_by_type': income_by_type
    }


# ===============================
# VALIDATION UTILITIES
# ===============================

def validate_income_source_data(source_data: Dict[str, Any]) -> List[str]:
    """
    Validate income source data and return list of errors

    Args:
        source_data: Dictionary containing source data

    Returns:
        List of validation error messages
    """
    errors = []

    # Required fields
    if not source_data.get('type'):
        errors.append("Income type is required")

    if flt(source_data.get('income', 0)) <= 0:
        errors.append("Income amount must be greater than 0")

    # Recurring source validation
    if source_data.get('recur'):
        if not source_data.get('recur_frequency'):
            errors.append("Frequency is required for recurring income")
        elif not validate_frequency(source_data['recur_frequency']):
            errors.append("Invalid frequency specified")

    return errors


def validate_ledger_entry_data(entry_data: Dict[str, Any]) -> List[str]:
    """
    Validate ledger entry data and return list of errors

    Args:
        entry_data: Dictionary containing ledger entry data

    Returns:
        List of validation error messages
    """
    errors = []

    # Required fields
    if not entry_data.get('date_time'):
        errors.append("Date and time is required")

    if flt(entry_data.get('amount', 0)) <= 0:
        errors.append("Amount must be greater than 0")

    if not entry_data.get('income_type'):
        errors.append("Income type is required")

    # Type-specific validation
    income_type = entry_data.get('income_type')
    if income_type == 'recurring' and not entry_data.get('income_source'):
        errors.append("Income source is required for recurring entries")

    if income_type == 'one-time' and not entry_data.get('source_type'):
        errors.append("Source type is required for one-time entries")

    return errors


# ===============================
# HELPER UTILITIES
# ===============================

def get_user_household_profile(user: str = None) -> Optional[str]:
    """
    Get household profile for a user using Query Builder

    Args:
        user: User email (defaults to current session user)

    Returns:
        Household profile name or None
    """
    if not user:
        user = frappe.session.user

    result = (
        qb.from_(HouseholdProfile)
        .select(HouseholdProfile.name)
        .where(HouseholdProfile.user == user)
        .limit(1)
    ).run(as_dict=True)

    return result[0].name if result else None


def format_currency_amount(amount: float) -> str:
    """
    Format amount as currency string

    Args:
        amount: Numeric amount

    Returns:
        Formatted currency string
    """
    return f"₹{flt(amount):,.2f}"


def get_period_display_name(period: str) -> str:
    """
    Get display name for period filter

    Args:
        period: Period identifier

    Returns:
        Display name for the period
    """
    period_map = {
        'this_month': 'This Month',
        'last_month': 'Last Month',
        'last_3_months': 'Last 3 Months',
        'last_6_months': 'Last 6 Months',
        'this_year': 'This Year',
        'custom': 'Custom Period'
    }
    return period_map.get(period, period.title())


def log_income_operation(operation: str, details: Dict[str, Any]) -> None:
    """
    Log income operation for audit trail

    Args:
        operation: Operation name
        details: Operation details dictionary
    """
    try:
        frappe.logger().info(f"Income Operation: {operation} - {details}")
    except Exception:
        # Silent fail for logging
        pass


# ===============================
# EXPENSE-SPECIFIC UTILITIES
# ===============================

def validate_expense_data(expense_data: Dict[str, Any]) -> List[str]:
    """
    Validate expense data before saving

    Args:
        expense_data: Dictionary containing expense data

    Returns:
        List of validation error messages (empty if valid)
    """
    errors = []

    # Type validation
    if not expense_data.get("type") or expense_data["type"] not in ["medical", "other"]:
        errors.append("Please select a valid expense type (medical or other)")

    # Category validation
    if not expense_data.get("category") or str(expense_data["category"]).strip() == "":
        errors.append("Please select a category")

    # Amount validation
    amount = flt(expense_data.get("amount", 0))
    if amount <= 0:
        errors.append("Please enter a valid amount greater than 0")

    # Date validation
    if not expense_data.get("date_time"):
        errors.append("Please select a date")
    else:
        try:
            expense_date = getdate(expense_data["date_time"])
            today = getdate()
            if expense_date > today:
                errors.append("Expense date cannot be in the future")
        except:
            errors.append("Please enter a valid date")

    # Medical expense specific validation
    if expense_data.get("type") == "medical":
        # is_direct validation (should be boolean)
        if "is_direct" in expense_data and expense_data["is_direct"] not in [True, False, 0, 1]:
            errors.append("Direct/Indirect flag must be a boolean value")

    return errors


def apply_expense_filters(expense_entries: List[Dict], filters: Dict) -> List[Dict]:
    """
    Apply filters to expense entries - reusable filtering logic

    Args:
        expense_entries: List of expense entries
        filters: Filter dictionary

    Returns:
        Filtered list of expense entries
    """
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


def calculate_expense_analytics(expense_entries: List[Dict], filters: Dict) -> Dict[str, Any]:
    """
    Calculate analytics from expense entries

    Args:
        expense_entries: List of expense entries
        filters: Filter dictionary for context

    Returns:
        Analytics dictionary with comprehensive metrics
    """
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


def get_expense_types() -> Dict[str, List[Dict[str, str]]]:
    """
    Get all available expense types (medical and other) - centralized configuration

    Returns:
        Dictionary with medical_types and other_types lists
    """
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


def create_expense_entry(parent_name: str, expense_data: Dict[str, Any]) -> str:
    """
    Create an expense entry in the appropriate child table

    Args:
        parent_name: Name of the parent Expense document
        expense_data: Dictionary containing expense data

    Returns:
        Name of the created expense entry
    """
    try:
        # Validate expense data
        validation_errors = validate_expense_data(expense_data)
        if validation_errors:
            frappe.throw("; ".join(validation_errors))

        # Get parent document
        expense_doc = frappe.get_doc("Expense", parent_name)

        # Convert datetime if needed
        date_time = convert_datetime_format(expense_data.get("date_time"))

        # Add expense to appropriate child table
        if expense_data.get("type") == "medical":
            row = expense_doc.append("medical_expenses", {
                "medical_expense_type": expense_data.get("category"),
                "amount": flt(expense_data.get("amount")),
                "date_time": date_time,
                "description": expense_data.get("description", ""),
                "proof_of_payment": expense_data.get("proof_of_payment"),
                "is_direct": expense_data.get("is_direct", True)
            })
        else:
            row = expense_doc.append("other_expenses", {
                "expense_type": expense_data.get("category"),
                "amount": flt(expense_data.get("amount")),
                "date_time": date_time,
                "description": expense_data.get("description", "")
            })

        # Save the document
        expense_doc.save()

        return row.name

    except Exception as e:
        frappe.log_error(f"Error creating expense entry: {str(e)}")
        frappe.throw(f"Failed to create expense entry: {str(e)}")


def log_expense_operation(operation: str, details: Dict[str, Any]) -> None:
    """
    Log expense operations for audit trail and debugging

    Args:
        operation: Name of the operation being performed
        details: Dictionary containing operation details
    """
    try:
        log_message = f"Expense Operation: {operation}"
        frappe.log_error(
            message=f"{log_message}\nDetails: {frappe.as_json(details)}",
            title=f"Expense {operation.title()}"
        )
    except Exception as e:
        # Don't fail the main operation if logging fails
        frappe.log_error(
            f"Failed to log expense operation {operation}: {str(e)}")


def get_recurring_income_sources(household_profile: str) -> list:
    """
    Fetch all recurring income sources for a household profile using Query Builder.
    """
    results = (
        qb.from_(Income)
        .join(IncomeSource).on(Income.name == IncomeSource.parent)
        .select(
            IncomeSource.name,
            IncomeSource.type,
            IncomeSource.income,
            IncomeSource.recur,
            IncomeSource.date_time,
            IncomeSource.recur_frequency,
            IncomeSource.stop_date
        )
        .where(
            (Income.household_profile == household_profile) &
            (IncomeSource.recur == 1)
        )
        .orderby(IncomeSource.creation, order=qb.desc)
    ).run(as_dict=True)

    # Convert recur to boolean for consistency
    for source in results:
        source.recur = bool(source.recur)

    return results


def get_all_ledger_entries(household_profile: str) -> list:
    """
    Fetch all ledger entries for a household profile with source info using Query Builder.
    """
    results = (
        qb.from_(Income)
        .join(IncomeLedger).on(Income.name == IncomeLedger.parent)
        .left_join(IncomeSource).on(IncomeLedger.income_source == IncomeSource.name)
        .select(
            IncomeLedger.name,
            IncomeLedger.income_source,
            IncomeLedger.income_type,
            IncomeLedger.date_time,
            IncomeLedger.amount,
            IncomeLedger.source_type,
            IncomeLedger.description,
            IncomeSource.type.as_("source_type_from_source"),
            IncomeSource.recur.as_("source_recur"),
            IncomeSource.income.as_("source_income"),
            IncomeSource.date_time.as_("source_date_time"),
            IncomeSource.recur_frequency.as_("source_recur_frequency"),
            IncomeSource.stop_date.as_("source_stop_date")
        )
        .where(Income.household_profile == household_profile)
        .orderby(IncomeLedger.date_time, order=qb.desc)
    ).run(as_dict=True)

    # Process results to flatten entry data with source info
    flattened_entries = []
    for entry in results:
        flattened_entry = {
            "name": entry.name,
            "income_source": entry.income_source,
            "income_type": entry.income_type,
            "date_time": entry.date_time,
            "amount": entry.amount,
            "description": entry.description
        }

        if entry.income_source and entry.source_type_from_source:
            # Use source information from join
            flattened_entry.update({
                "source_type": entry.source_type_from_source,
                "source_recur": entry.source_recur,
                "source_income": entry.source_income,
                "source_date_time": entry.source_date_time,
                "source_recur_frequency": entry.source_recur_frequency,
                "source_stop_date": entry.source_stop_date
            })
        elif entry.income_source:
            # Source deleted but ledger remains
            flattened_entry["source_type"] = "Unknown"
        else:
            # Direct entry - use stored source_type
            flattened_entry["source_type"] = entry.source_type or "One-time"

        flattened_entries.append(flattened_entry)

    return flattened_entries


def apply_income_filters(ledger_entries: list, filters: dict) -> list:
    """
    Apply all supported filters to the ledger entries.
    """
    filtered_ledger_entries = ledger_entries.copy()
    # Date filters
    if filters.get('dateFrom'):
        start_date = getdate(filters['dateFrom'])
        filtered_ledger_entries = [
            e for e in filtered_ledger_entries
            if getdate(e['date_time']) >= start_date]
    if filters.get('dateTo'):
        end_date = getdate(filters['dateTo'])
        filtered_ledger_entries = [
            e for e in filtered_ledger_entries
            if getdate(e['date_time']) <= end_date
        ]
    # Period filters
    start_date = None
    end_date = None
    if filters.get('period'):
        period = filters['period']
        today = getdate()
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
    if start_date and end_date:
        filtered_ledger_entries = [
            e for e in filtered_ledger_entries
            if start_date <= getdate(e['date_time']) <= end_date
        ]
    # Income type filter
    if filters.get('type'):
        filtered_ledger_entries = [
            e for e in filtered_ledger_entries
            if e['source_type'] == filters['type']
        ]
    # Frequency filter
    if filters.get('isRecurring') is not None:
        if filters['isRecurring']:
            filtered_ledger_entries = [
                e for e in filtered_ledger_entries
                if e['income_type'] == 'recurring'
            ]
        else:
            filtered_ledger_entries = [
                e for e in filtered_ledger_entries
                if e['income_type'] == 'one-time'
            ]
    # Amount filters
    if filters.get('amountMin'):
        min_amount = flt(filters['amountMin'])
        filtered_ledger_entries = [
            e for e in filtered_ledger_entries
            if flt(e['amount']) >= min_amount
        ]
    if filters.get('amountMax'):
        max_amount = flt(filters['amountMax'])
        filtered_ledger_entries = [
            e for e in filtered_ledger_entries
            if flt(e['amount']) <= max_amount
        ]
    # Search filter
    if filters.get('searchTerm'):
        search_term = filters['searchTerm'].lower()
        filtered_ledger_entries = [
            e for e in filtered_ledger_entries
            if search_term in e['source_type'].lower()
        ]
    # Sorting
    sort_by = filters.get('sortBy', 'date')
    sort_order = filters.get('sortOrder', 'desc')
    reverse_sort = sort_order == 'desc'
    if sort_by == 'date':
        filtered_ledger_entries.sort(
            key=lambda x: getdate(x['date_time']),
            reverse=reverse_sort
        )
    elif sort_by == 'amount':
        filtered_ledger_entries.sort(
            key=lambda x: flt(x['amount']),
            reverse=reverse_sort
        )
    elif sort_by == 'type':
        filtered_ledger_entries.sort(
            key=lambda x: x['source_type'],
            reverse=reverse_sort
        )
    return filtered_ledger_entries
