"""
Income API
Provides specialized endpoints for income management and analysis
All income operations are handled here to ensure consistency and proper event handling
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
    get_next_occurrence,
    get_recurring_dates,
    create_ledger_entry,
    create_recurring_ledger_entries,
    cleanup_orphaned_entries,
    calculate_monthly_income_from_sources,
    calculate_period_income,
    get_income_summary_stats,
    validate_income_source_data,
    validate_ledger_entry_data,
    get_user_household_profile,
    format_currency_amount,
    get_period_display_name,
    log_income_operation
)


# ===============================
# LEDGER MANAGEMENT FUNCTIONS
# ===============================

@frappe.whitelist()
def create_initial_recurring_entries(income_name: str, source_name: str) -> Dict[str, Any]:
    """
    Create initial ledger entries for a new recurring source using utility function
    """
    try:
        income_doc = frappe.get_doc("Income", income_name)

        # Find the source
        source = None
        for src in income_doc.income_source:
            if src.name == source_name:
                source = src
                break

        if not source:
            frappe.throw(f"Source {source_name} not found")

        if not source.recur:
            frappe.throw(
                "Only recurring sources can have automatic ledger entries")

        # Prepare source data for utility function
        source_data = {
            'income': source.income,
            'type': source.type,
            'recur_frequency': source.recur_frequency
        }

        start_date = getdate(source.date_time)
        today = getdate()
        stop_date = getdate(source.stop_date) if source.stop_date else today

        # Use utility function to create recurring entries
        entries_added = create_recurring_ledger_entries(
            income_name, source_name, source_data, start_date, min(
                stop_date, today)
        )

        log_income_operation("create_initial_recurring_entries", {
            "income_name": income_name,
            "source_name": source_name,
            "entries_added": entries_added
        })

        return {
            "status": "success",
            "message": f"Created {entries_added} initial recurring entries",
            "entries_added": entries_added
        }

    except Exception as e:
        frappe.log_error(f"Error creating initial recurring entries: {str(e)}")
        frappe.throw(f"Failed to create initial recurring entries: {str(e)}")


@frappe.whitelist()
def update_recurring_ledger_entries_for_income(income_name: str, limit_entries: int = 1000) -> Dict[str, Any]:
    """
    Update recurring ledger entries for a specific income record
    """
    try:
        income_doc = frappe.get_doc("Income", income_name)
        today = getdate()
        total_entries_added = 0

        for source in income_doc.income_source:
            if source.recur:
                # Get existing entries for this source
                existing_entries = frappe.get_all(
                    "Income Ledger",
                    filters={
                        "parent": income_name,
                        "income_source": source.name
                    },
                    fields=["date_time"],
                    order_by="date_time desc"
                )

                if existing_entries:
                    # Find the latest entry date
                    latest_date = max(getdate(entry.date_time)
                                      for entry in existing_entries)

                    # Determine end date based on stop_date
                    end_date = today
                    if source.stop_date:
                        stop_date = getdate(source.stop_date)
                        end_date = min(today, stop_date)

                    # Create entries from latest_date + 1 occurrence to end_date
                    next_date = get_next_occurrence(
                        latest_date, source.recur_frequency)

                    entry_count = 0
                    while next_date <= end_date and entry_count < limit_entries:
                        # Check if entry already exists for this date
                        existing = frappe.db.exists("Income Ledger", {
                            "parent": income_name,
                            "income_source": source.name,
                            "date_time": next_date
                        })

                        if not existing:
                            # Create ledger entry directly in database
                            ledger_entry = frappe.get_doc({
                                "doctype": "Income Ledger",
                                "parent": income_name,
                                "parenttype": "Income",
                                "parentfield": "income_ledger",
                                "income_source": source.name,
                                "income_type": "recurring",
                                "date_time": next_date,
                                "amount": flt(source.income),
                                "source_type": source.type,
                                "description": f"Recurring {source.type} income"
                            })
                            ledger_entry.insert()
                            total_entries_added += 1
                            entry_count += 1

                        next_date = get_next_occurrence(
                            next_date, source.recur_frequency)

                        # Safety check to prevent infinite loops
                        if next_date <= latest_date:
                            frappe.log_error(
                                f"Infinite loop detected in recurring entries for {source.name}",
                                "Income Recurring Entry Error"
                            )
                            break
                else:
                    # No entries exist, create from start
                    result = create_initial_recurring_entries(
                        income_name, source.name)
                    total_entries_added += result.get("entries_added", 0)

        return {
            "status": "success",
            "message": f"Updated recurring entries for Income {income_name}",
            "entries_added": total_entries_added
        }

    except Exception as e:
        frappe.log_error(f"Error updating recurring entries: {str(e)}")
        frappe.throw(f"Failed to update recurring entries: {str(e)}")


@frappe.whitelist()
def cleanup_orphaned_ledger_entries_for_income(income_name: str) -> Dict[str, Any]:
    """
    Clean up orphaned ledger entries for a specific income record using utility function
    """
    try:
        income_doc = frappe.get_doc("Income", income_name)
        valid_source_names = {
            source.name for source in income_doc.income_source}

        # Use utility function for cleanup
        cleaned_count = cleanup_orphaned_entries(
            income_name, valid_source_names)

        log_income_operation("cleanup_orphaned_entries", {
            "income_name": income_name,
            "cleaned_count": cleaned_count
        })

        return {
            "status": "success",
            "message": f"Cleaned up {cleaned_count} orphaned entries",
            "cleaned_count": cleaned_count
        }

    except Exception as e:
        frappe.log_error(f"Error cleaning up ledger entries: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to clean up ledger entries: {str(e)}",
            "cleaned_count": 0
        }


# ===============================
# EXISTING API FUNCTIONS (Updated to use new ledger management)
# ===============================

@frappe.whitelist()
def get_period_info(filters: Optional[Union[str, Dict]] = None) -> Dict[str, Any]:
    """
    Get period information including start and end dates for display
    """
    try:
        # Parse filters if provided
        if isinstance(filters, str):
            filters = json.loads(filters)

        if not filters:
            filters = {}

        today = getdate()
        start_date = None
        end_date = None
        period_name = ""

        # Check for custom date range first
        if filters.get('dateFrom') and filters.get('dateTo'):
            start_date = getdate(filters['dateFrom'])
            end_date = getdate(filters['dateTo'])
            period_name = f"{start_date.strftime('%b %d, %Y')} - {end_date.strftime('%b %d, %Y')}"
        elif filters.get('dateFrom'):
            start_date = getdate(filters['dateFrom'])
            end_date = today
            period_name = f"From {start_date.strftime('%b %d, %Y')}"
        elif filters.get('dateTo'):
            end_date = getdate(filters['dateTo'])
            period_name = f"Until {end_date.strftime('%b %d, %Y')}"
        elif filters.get('period'):
            period = filters['period']

            if period == "this_month":
                start_date = today.replace(day=1)
                end_date = today
                period_name = "This Month"
            elif period == "last_month":
                last_month = today.replace(day=1) - timedelta(days=1)
                start_date = last_month.replace(day=1)
                end_date = last_month
                period_name = "Last Month"
            elif period == "last_3_months":
                start_date = (today.replace(day=1) -
                              timedelta(days=90)).replace(day=1)
                end_date = today
                period_name = "Last 3 Months"
            elif period == "last_6_months":
                start_date = (today.replace(day=1) -
                              timedelta(days=180)).replace(day=1)
                end_date = today
                period_name = "Last 6 Months"
            elif period == "this_year":
                start_date = today.replace(month=1, day=1)
                end_date = today
                period_name = "This Year"
            else:
                # Default to this month
                start_date = today.replace(day=1)
                end_date = today
                period_name = "This Month"
        else:
            # Default to this month
            start_date = today.replace(day=1)
            end_date = today
            period_name = "This Month"

        return {
            "start_date": start_date.strftime('%Y-%m-%d') if start_date else "",
            "end_date": end_date.strftime('%Y-%m-%d') if end_date else "",
            "period_name": period_name,
            "days_count": (end_date - start_date).days + 1 if start_date and end_date else 0,
            "is_current_period": period_name in ["This Month", "This Year"]
        }

    except Exception as e:
        frappe.log_error(f"Error getting period info: {str(e)}")
        # Provide default current month info
        today = getdate()
        start_date = today.replace(day=1)
        return {
            "start_date": start_date.strftime('%Y-%m-%d'),
            "end_date": today.strftime('%Y-%m-%d'),
            "period_name": "This Month",
            "days_count": (today - start_date).days + 1,
            "is_current_period": True
        }


@frappe.whitelist()
def get_income_filter_options(filters: Optional[Union[str, Dict]] = None) -> Dict[str, Any]:
    """
    Get all available filter options for income data
    """
    try:
        # Get user's household profile
        household_profile = frappe.db.get_value(
            "Household Profile",
            {"user": frappe.session.user},
            "name"
        )

        # Get available income types from user's data
        income_types = []
        if household_profile:
            # Get unique income types from ledger entries
            income_records = frappe.get_all(
                "Income",
                filters={"household_profile": household_profile},
                fields=["name"]
            )

            if income_records:
                for record in income_records:
                    types = frappe.get_all(
                        "Income Ledger",
                        filters={"parent": record.name},
                        fields=["source_type"],
                        group_by="source_type"
                    )
                    income_types.extend(
                        [t.source_type for t in types if t.source_type])

        # Remove duplicates and sort
        income_types = sorted(list(set(income_types)))

        # Get available frequencies
        frequencies = [
            {"value": "daily", "label": "Daily"},
            {"value": "weekly", "label": "Weekly"},
            {"value": "bi-weekly", "label": "Bi-Weekly"},
            {"value": "monthly", "label": "Monthly"},
            {"value": "quarterly", "label": "Quarterly"},
            {"value": "semi-annually", "label": "Semi-Annually"},
            {"value": "annually", "label": "Annually"},
            {"value": "yearly", "label": "Yearly"}
        ]

        # Get period options
        periods = [
            {"value": "this_month", "label": "This Month"},
            {"value": "last_month", "label": "Last Month"},
            {"value": "last_3_months", "label": "Last 3 Months"},
            {"value": "last_6_months", "label": "Last 6 Months"},
            {"value": "this_year", "label": "This Year"},
            {"value": "custom", "label": "Custom Date Range"}
        ]

        # Get sort options
        sort_options = [
            {"value": "date", "label": "Date"},
            {"value": "amount", "label": "Amount"},
            {"value": "type", "label": "Type"}
        ]

        return {
            "income_types": [{"value": t, "label": t} for t in income_types],
            "frequencies": frequencies,
            "periods": periods,
            "sort_options": sort_options,
            "recurring_options": [
                {"value": True, "label": "Recurring Only"},
                {"value": False, "label": "One-time Only"}
            ]
        }

    except Exception as e:
        frappe.log_error(f"Error fetching income filter options: {str(e)}")
        return {
            "income_types": [],
            "frequencies": [],
            "periods": [],
            "sort_options": [],
            "recurring_options": []
        }


@frappe.whitelist()
def get_income_types() -> Dict[str, List[Dict[str, str]]]:
    """
    Get all available income types
    Returns: {'income_types': [
        {'name': 'Agriculture', 'type': 'Agriculture'}, ...]}
    """
    try:
        income_types = frappe.get_all(
            "Income Type",
            fields=["name", "type"],
            order_by="type"
        )

        return {
            "income_types": income_types
        }

    except Exception as e:
        frappe.log_error(f"Error fetching income types: {str(e)}")
        frappe.throw(_("Failed to fetch income types"))


@frappe.whitelist()
def get_income_ledger(filters: Optional[Union[str, Dict]] = None) -> List[Dict[str, Any]]:
    """
    Get flattened income ledger entries for the current user's household profile
    Returns all ledger entries with source information attached
    """
    try:
        # Get user's household profile
        household_profile = frappe.db.get_value(
            "Household Profile",
            {"user": frappe.session.user},
            "name"
        )

        if not household_profile:
            return []

        # Parse filters if provided
        if isinstance(filters, str):
            filters = json.loads(filters)

        if not filters:
            filters = {}

        # Get income records for this household
        income_records = frappe.get_all(
            "Income",
            filters={"household_profile": household_profile},
            fields=["name"]
        )

        if not income_records:
            return []

        ledger_entries = []

        for income_record in income_records:
            # Get all ledger entries for this income record
            entries = frappe.get_all(
                "Income Ledger",
                filters={"parent": income_record.name},
                fields=[
                    "name", "income_source", "income_type",
                    "date_time", "amount"
                ],
                order_by="date_time desc"
            )

            # For each ledger entry, get the source information
            for entry in entries:
                # Get source details
                source_info = frappe.get_all(
                    "Income Source Type",
                    filters={"name": entry.income_source},
                    fields=[
                        "type", "income", "recur", "date_time",
                        "recur_frequency", "stop_date"
                    ]
                )

                if source_info:
                    source = source_info[0]
                    ledger_entries.append({
                        "name": entry.name,
                        "income_source": entry.income_source,
                        "income_type": entry.income_type,
                        "date_time": entry.date_time,
                        "amount": entry.amount,
                        "source_type": source.type,
                        "source_recur": source.recur,
                        "source_income": source.income,
                        "source_date_time": source.date_time,
                        "source_recur_frequency": source.recur_frequency,
                        "source_stop_date": source.stop_date
                    })

        # Apply filters
        if filters.get('income_type'):
            ledger_entries = [
                e for e in ledger_entries if e['income_type'] == filters['income_type']]

        if filters.get('dateFrom'):
            start_date = getdate(filters['dateFrom'])
            ledger_entries = [e for e in ledger_entries if getdate(
                e['date_time']) >= start_date]

        if filters.get('dateTo'):
            end_date = getdate(filters['dateTo'])
            ledger_entries = [e for e in ledger_entries if getdate(
                e['date_time']) <= end_date]

        return ledger_entries

    except Exception as e:
        frappe.log_error(f"Error fetching income ledger: {str(e)}")
        frappe.throw(_("Failed to fetch income ledger"))


@frappe.whitelist()
def get_user_income(filters: Optional[Union[str, Dict]] = None, include_analytics: bool = False) -> Dict[str, Any]:
    """
    Get income data for the current user's household profile
    Returns:
    - recurring_sources: Always unfiltered recurring income sources
    - ledger_entries: All ledger entries (filtered if filters provided)
    - analytics: Computed from ledger entries only
    """
    try:
        # Get user's household profile using utility function
        household_profile = get_user_household_profile()

        if not household_profile:
            return {
                "recurring_sources": [],
                "ledger_entries": [],
                "analytics": {
                    "total_income": 0,
                    "recurring_income": 0,
                    "one_time_income": 0,
                    "income_by_type": {},
                    "monthly_trends": [],
                    "summary": {
                        "total_sources": 0,
                        "average_source_amount": 0,
                        "top_income_type": ""
                    }
                } if include_analytics else None
            }

        # Parse filters if provided
        if isinstance(filters, str):
            filters = json.loads(filters)

        if not filters:
            filters = {}

        # Step 1: Get ALL recurring income sources (unfiltered)
        recurring_sources = []
        income_records = frappe.get_all(
            "Income",
            filters={"household_profile": household_profile},
            fields=["name"]
        )

        for record in income_records:
            sources = frappe.get_all(
                "Income Source Type",
                filters={"parent": record.name, "recur": 1},
                fields=[
                    "name", "type", "income", "recur",
                    "date_time", "recur_frequency", "stop_date"
                ],
                order_by="creation desc"
            )
            for source in sources:
                source.recur = bool(source.recur)
                recurring_sources.append(source)

        # Step 2: Get ALL ledger entries and apply filters to them
        all_ledger_entries = []
        for record in income_records:
            entries = frappe.get_all(
                "Income Ledger",
                filters={"parent": record.name},
                fields=[
                    "name", "income_source", "income_type",
                    "date_time", "amount", "source_type", "description"
                ],
                order_by="date_time desc"
            )

            # For each ledger entry, get the source information if it exists
            for entry in entries:
                flattened_entry = {
                    "name": entry.name,
                    "income_source": entry.income_source,
                    "income_type": entry.income_type,
                    "date_time": entry.date_time,
                    "amount": entry.amount,
                    "description": entry.description
                }

                if entry.income_source:
                    # This is from a recurring source - get source details
                    source_info = frappe.get_all(
                        "Income Source Type",
                        filters={"name": entry.income_source},
                        fields=[
                            "type", "income", "recur", "date_time",
                            "recur_frequency", "stop_date"
                        ]
                    )

                    if source_info:
                        source = source_info[0]
                        flattened_entry.update({
                            "source_type": source.type,
                            "source_recur": source.recur,
                            "source_income": source.income,
                            "source_date_time": source.date_time,
                            "source_recur_frequency": source.recur_frequency,
                            "source_stop_date": source.stop_date
                        })
                    else:
                        # Source deleted but ledger remains
                        flattened_entry["source_type"] = "Unknown"
                else:
                    # This is a direct entry - use stored source_type
                    flattened_entry["source_type"] = entry.source_type or "One-time"

                all_ledger_entries.append(flattened_entry)

        # Step 3: Apply filters to ledger entries
        filtered_ledger_entries = all_ledger_entries.copy()

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

        # Step 4: Calculate analytics from filtered ledger entries
        analytics_data = None
        if include_analytics:
            analytics_data = {
                "total_income": 0,
                "recurring_income": 0,
                "one_time_income": 0,
                "income_by_type": {},
                "monthly_trends": [],
                "summary": {
                    "total_sources": len(recurring_sources),
                    "average_source_amount": 0,
                    "top_income_type": ""
                },
                "period": filters.get('period', ''),
                "actual_monthly_income": sum(flt(s.income) for s in recurring_sources)
            }

            monthly_data = {}
            total_amount = 0
            type_amounts = {}

            # Calculate metrics from filtered ledger entries
            for entry in filtered_ledger_entries:
                entry_amount = flt(entry['amount'])
                analytics_data["total_income"] += entry_amount
                total_amount += entry_amount

                # Track by income type
                if entry['income_type'] == 'recurring':
                    analytics_data["recurring_income"] += entry_amount
                else:
                    analytics_data["one_time_income"] += entry_amount

                # Group by type
                source_type = entry['source_type']
                if source_type not in analytics_data["income_by_type"]:
                    analytics_data["income_by_type"][source_type] = 0
                analytics_data["income_by_type"][source_type] += entry_amount

                # Track for summary
                if source_type not in type_amounts:
                    type_amounts[source_type] = 0
                type_amounts[source_type] += entry_amount

                # Monthly trends
                entry_date = getdate(entry['date_time'])
                month_key = entry_date.strftime("%Y-%m")
                if month_key not in monthly_data:
                    monthly_data[month_key] = {
                        "total": 0,
                        "recurring": 0,
                        "one_time": 0
                    }

                monthly_data[month_key]["total"] += entry_amount
                if entry['income_type'] == 'recurring':
                    monthly_data[month_key]["recurring"] += entry_amount
                else:
                    monthly_data[month_key]["one_time"] += entry_amount

            # Generate monthly trends
            for month_key in sorted(monthly_data.keys()):
                month_date = datetime.strptime(month_key, "%Y-%m")
                analytics_data["monthly_trends"].append({
                    "month": month_date.strftime("%b %Y"),
                    "total": monthly_data[month_key]["total"],
                    "recurring": monthly_data[month_key]["recurring"],
                    "one_time": monthly_data[month_key]["one_time"]
                })

            # Summary statistics
            analytics_data["summary"]["average_source_amount"] = (
                total_amount / len(filtered_ledger_entries)
                if len(filtered_ledger_entries) > 0 else 0
            )

            # Find top income type
            if type_amounts:
                top_type = max(type_amounts.items(), key=lambda x: x[1])
                analytics_data["summary"]["top_income_type"] = top_type[0]

            # Calculate additional metrics
            total_income_for_percentage = analytics_data["recurring_income"] + \
                analytics_data["one_time_income"]
            analytics_data["recurring_percentage"] = (
                (analytics_data["recurring_income"] /
                 total_income_for_percentage) * 100
                if total_income_for_percentage > 0 else 0
            )

            # Calculate growth rate from monthly trends
            trends = analytics_data["monthly_trends"]
            if len(trends) >= 2:
                recent = trends[-1]["total"]
                previous = trends[-2]["total"]
                analytics_data["growth_rate"] = (
                    ((recent - previous) / previous) * 100
                    if previous > 0 else 0
                )
            else:
                analytics_data["growth_rate"] = 0

            # Calculate actual income from filtered ledger entries
            analytics_data["monthly_recurring_income"] = calculate_monthly_income_from_ledger(
                household_profile, filters)

            # Also calculate recurring income potential (what should be earned monthly)
            analytics_data["expected_monthly_income"] = sum(
                flt(s.income) for s in recurring_sources)

            # Calculate actual income for the period from ledger
            analytics_data["period_recurring_income"] = analytics_data["recurring_income"]
            analytics_data["period_one_time_income"] = analytics_data["one_time_income"]
            analytics_data["period_total_income"] = analytics_data["total_income"]

        return {
            "recurring_sources": recurring_sources,
            "ledger_entries": filtered_ledger_entries,
            "analytics": analytics_data if include_analytics else None
        }

    except Exception as e:
        frappe.log_error(f"Error fetching user income: {str(e)}")
        frappe.throw(_("Failed to fetch income records"))


def calculate_monthly_income_from_ledger(household_profile: str, filters: Optional[Dict] = None) -> float:
    """
    Calculate actual income based on ledger entries with optional filters using utility function
    """
    try:
        # Use utility function for period income calculation
        return calculate_period_income(household_profile, filters)
    except Exception as e:
        frappe.log_error(
            f"Error calculating filtered income from ledger: {str(e)}")
        return 0.0


@frappe.whitelist()
def get_monthly_income_summary(filters: Optional[Union[str, Dict]] = None) -> Dict[str, Union[float, int]]:
    """
    Get income summary for CHE analysis with filter support
    Calculated from ledger entries to ensure consistency with filtered data

    If no filters provided, defaults to current month for backward compatibility
    """
    try:
        # Parse filters if provided
        if isinstance(filters, str):
            filters = json.loads(filters)

        if not filters:
            # Default to current month for backward compatibility
            filters = {"period": "this_month"}

        # Get user's household profile
        household_profile = frappe.db.get_value(
            "Household Profile",
            {"user": frappe.session.user},
            "name"
        )

        if not household_profile:
            return {
                "monthly_income": 0,
                "recurring_income": 0,
                "one_time_income": 0,
                "total_sources": 0,
                "period": filters.get("period", "this_month")
            }

        # Use the existing filtered income calculation
        analytics_result = get_user_income(
            filters=json.dumps(filters),
            include_analytics=True
        )

        analytics = analytics_result.get("analytics", {})

        # Get period info for display
        period_info = get_period_info(filters)

        return {
            "monthly_income": analytics.get("total_income", 0),
            "recurring_income": analytics.get("recurring_income", 0),
            "one_time_income": analytics.get("one_time_income", 0),
            "total_sources": analytics.get("summary", {}).get("total_sources", 0),
            "expected_monthly_income": analytics.get("expected_monthly_income", 0),
            "period": filters.get("period", "custom"),
            "period_name": period_info.get("period_name", ""),
            "start_date": period_info.get("start_date", ""),
            "end_date": period_info.get("end_date", ""),
            "days_in_period": period_info.get("days_count", 0),
            "filters": filters
        }

    except Exception as e:
        frappe.log_error(f"Error calculating income summary: {str(e)}")
        frappe.throw(_("Failed to calculate income summary"))


@frappe.whitelist()
def get_income_dashboard_metrics(filters: Optional[Union[str, Dict]] = None) -> Dict[str, Any]:
    """
    Get computed dashboard metrics for income management with comprehensive filter support
    Provides all the key metrics needed for dashboard displays

    Filters supported:
    - period: this_month, last_month, last_3_months, last_6_months, this_year
    - dateFrom, dateTo: Custom date range
    - type: Specific income type
    - isRecurring: True/False for recurring vs one-time
    - amountMin, amountMax: Amount range filters
    - searchTerm: Search in income types
    - sortBy, sortOrder: Sorting options
    """
    try:
        # Parse filters if provided
        if isinstance(filters, str):
            filters = json.loads(filters)

        if not filters:
            filters = {"period": "this_month"}

        # Ensure we have a default period if none specified
        if not filters.get("period") and not (filters.get("dateFrom") or filters.get("dateTo")):
            filters["period"] = "this_month"

        # Get user's household profile
        household_profile = frappe.db.get_value(
            "Household Profile",
            {"user": frappe.session.user},
            "name"
        )

        if not household_profile:
            return {
                "actual_monthly_income": 0,
                "expected_monthly_income": 0,
                "recurring_income": 0,
                "one_time_income": 0,
                "total_sources": 0,
                "recurring_percentage": 0,
                "growth_rate": 0,
                "top_income_type": "",
                "income_by_type": {},
                "monthly_trends": [],
                "average_source_amount": 0,
                "filters": filters,
                "period": filters.get("period", "custom")
            }

        # Get analytics using existing function with full filters
        analytics_result = get_user_income(
            filters=json.dumps(filters),
            include_analytics=True
        )

        analytics = analytics_result.get("analytics", {})

        # Calculate actual total income from filtered ledger entries
        actual_total_income = calculate_monthly_income_from_ledger(
            household_profile, filters)

        # Get date range info for display
        period_info = get_period_info(filters)

        return {
            "actual_monthly_income": actual_total_income,
            "expected_monthly_income": analytics.get("expected_monthly_income", 0),
            "recurring_income": analytics.get("recurring_income", 0),
            "one_time_income": analytics.get("one_time_income", 0),
            "total_income": analytics.get("total_income", 0),
            "total_sources": analytics.get("summary", {}).get("total_sources", 0),
            "recurring_percentage": analytics.get("recurring_percentage", 0),
            "growth_rate": analytics.get("growth_rate", 0),
            "top_income_type": analytics.get("summary", {}).get("top_income_type", ""),
            "income_by_type": analytics.get("income_by_type", {}),
            "monthly_trends": analytics.get("monthly_trends", []),
            "average_source_amount": analytics.get("summary", {}).get("average_source_amount", 0),
            "filters": filters,
            "period": filters.get("period", "custom"),
            "start_date": period_info.get("start_date", ""),
            "end_date": period_info.get("end_date", ""),
            "total_ledger_entries": len(analytics_result.get("ledger_entries", [])),
            "recurring_entries": analytics.get("summary", {}).get("recurring_entries", 0),
            "one_time_entries": analytics.get("summary", {}).get("one_time_entries", 0)
        }

    except Exception as e:
        frappe.log_error(f"Error fetching income dashboard metrics: {str(e)}")
        frappe.throw(_("Failed to fetch income dashboard metrics"))


@frappe.whitelist()
def create_or_update_income(income_source: Union[str, List[Dict]], income_name: Optional[str] = None, source_name: Optional[str] = None, action: Optional[str] = None) -> Dict[str, Any]:
    """
    Create or update RECURRING income sources only
    - Only recurring income sources (recur=True) are managed here
    - One-time income goes directly to ledger via create_direct_ledger_entry
    - When source is deleted, all its automatic ledger entries are deleted
    - When source is updated, existing automatic ledger entries are kept but source is updated
    """
    try:
        # Get user's household profile using utility function
        household_profile = get_user_household_profile()
        if not household_profile:
            frappe.throw(_("No household profile found for current user"))

        # Parse income_source if it's a string
        if isinstance(income_source, str):
            income_source = json.loads(income_source)

        # Validate that only recurring sources are being created/updated here
        for source in income_source:
            if not source.get("recur", False):
                frappe.throw(
                    _("Only recurring income sources can be managed here. Use create_direct_ledger_entry for one-time income."))

        # Find or create the single Income record for this household
        income_name_db = frappe.db.get_value(
            "Income",
            {"household_profile": household_profile},
            "name"
        )
        if income_name_db:
            income_doc = frappe.get_doc("Income", income_name_db)
        else:
            income_doc = frappe.new_doc("Income")
            income_doc.household_profile = household_profile

        if action == "delete" and source_name:
            # Remove specific source and ALL its ledger entries
            income_doc.income_source = [
                row for row in income_doc.income_source if row.name != source_name]

            # Remove ledger entries linked to this source from the document
            # This ensures proper document event handling
            income_doc.income_ledger = [
                entry for entry in income_doc.income_ledger
                if entry.income_source != source_name
            ]
        elif source_name:
            # Update existing recurring source
            source_updated = False
            for existing_source in income_doc.income_source:
                if existing_source.name == source_name:
                    for source in income_source:
                        # Validate source data using utility function
                        source_errors = validate_income_source_data(source)
                        if source_errors:
                            frappe.throw(_("; ".join(source_errors)))

                        # Update source fields
                        existing_source.type = source.get("type")
                        existing_source.income = flt(source.get("income"))
                        existing_source.recur = True  # Always true for income sources
                        existing_source.date_time = convert_datetime_format(
                            source.get("date_time") or now_datetime())
                        existing_source.recur_frequency = source.get(
                            "recur_frequency")
                        existing_source.stop_date = source.get("stop_date")

                        source_updated = True
                    break

            if not source_updated:
                frappe.throw(
                    _("Income source not found: {0}").format(source_name))
        else:
            # Add new recurring sources only
            for source in income_source:
                # Validate source data using utility function
                source_errors = validate_income_source_data(source)
                if source_errors:
                    frappe.throw(_("; ".join(source_errors)))

                income_doc.append("income_source", {
                    "type": source.get("type"),
                    "income": flt(source.get("income")),
                    "recur": True,  # Always true for income sources
                    "date_time": convert_datetime_format(source.get("date_time") or now_datetime()),
                    "recur_frequency": source.get("recur_frequency"),
                    "stop_date": source.get("stop_date")
                })

        # Save the document - basic validation only
        income_doc.save()

        # Create ledger entries for new sources via API
        for source in income_doc.income_source:
            if source.recur:
                # Check if this source already has ledger entries
                existing_entries = frappe.get_all(
                    "Income Ledger",
                    filters={
                        "parent": income_doc.name,
                        "income_source": source.name
                    },
                    limit=1
                )

                if not existing_entries:
                    # Create initial entries for new source
                    create_initial_recurring_entries(
                        income_doc.name, source.name)

        # Log the operation
        log_income_operation("create_or_update_income", {
            "income_name": income_doc.name,
            "household_profile": income_doc.household_profile,
            "action": action or "create_or_update",
            "total_sources": len(income_doc.income_source),
            "monthly_income": income_doc.monthly_income
        })

        return {
            "name": income_doc.name,
            "household_profile": income_doc.household_profile,
            "monthly_income": income_doc.monthly_income,
            "total_ledger_entries": len(income_doc.income_ledger),
            "total_sources": len(income_doc.income_source)
        }
    except Exception as e:
        frappe.log_error(f"Error creating/updating income: {str(e)}")
        frappe.throw(_("Failed to save income record: {0}").format(str(e)))


@frappe.whitelist()
def validate_income_data(monthly_income: Union[str, float], income_source: Union[str, List[Dict]]) -> Dict[str, Any]:
    """
    Validate income data before saving
    """
    try:
        errors = {}

        # Validate monthly income
        monthly_income = flt(monthly_income)
        if monthly_income <= 0:
            errors["monthly_income"] = "Monthly income must be greater than 0"

        # Parse income_source if it's a string
        if isinstance(income_source, str):
            income_source = json.loads(income_source)

        # Validate income sources using utility function
        if not income_source or len(income_source) == 0:
            errors["income_source"] = "At least one income source is required"
        else:
            for i, source in enumerate(income_source):
                source_errors = validate_income_source_data(source)
                if source_errors:
                    errors[f"income_source_{i}"] = "; ".join(source_errors)

        return {
            "is_valid": len(errors) == 0,
            "errors": errors
        }

    except Exception as e:
        frappe.log_error(f"Error validating income data: {str(e)}")
        return {
            "is_valid": False,
            "errors": {"general": "Validation failed"}
        }


@frappe.whitelist()
def get_income_analytics(filters: Optional[Union[str, Dict]] = None) -> Dict[str, Any]:
    """
    Get comprehensive income analytics with advanced filtering
    Combines dashboard metrics, user income data, and insights
    """
    try:
        # Parse filters if provided
        if isinstance(filters, str):
            filters = json.loads(filters)

        if not filters:
            filters = {"period": "this_month"}

        # Get user's household profile
        household_profile = frappe.db.get_value(
            "Household Profile",
            {"user": frappe.session.user},
            "name"
        )

        if not household_profile:
            return {
                "status": "error",
                "message": "No household profile found for current user"
            }

        # Get comprehensive data
        user_income_result = get_user_income(
            filters=json.dumps(filters),
            include_analytics=True
        )

        dashboard_metrics = get_income_dashboard_metrics(filters)
        income_summary = get_monthly_income_summary(filters)
        period_info = get_period_info(filters)

        # Combine all data
        return {
            "status": "success",
            "filters": filters,
            "period_info": period_info,
            "dashboard_metrics": dashboard_metrics,
            "income_summary": income_summary,
            "recurring_sources": user_income_result.get("recurring_sources", []),
            "ledger_entries": user_income_result.get("ledger_entries", []),
            "analytics": user_income_result.get("analytics", {}),
            "totals": {
                "total_entries": len(user_income_result.get("ledger_entries", [])),
                "total_sources": len(user_income_result.get("recurring_sources", [])),
                "total_income": user_income_result.get("analytics", {}).get("total_income", 0),
                "average_per_day": (
                    user_income_result.get("analytics", {}).get("total_income", 0) /
                    max(1, period_info.get("days_count", 1))
                )
            }
        }

    except Exception as e:
        frappe.log_error(f"Error getting income analytics: {str(e)}")
        frappe.throw(_("Failed to get income analytics"))


@frappe.whitelist()
def get_income_insights() -> Dict[str, Any]:
    """
    Get AI-powered insights and recommendations for income management
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
                "insights": [],
                "recommendations": [],
                "scores": {
                    "stability": 0,
                    "diversification": 0,
                    "growth": 0
                }
            }

        # Get analytics for the last 6 months
        analytics = get_user_income(
            filters={'period': 'last_6_months'}, include_analytics=True)
        analytics_data = analytics.get('analytics', {})

        insights = []
        recommendations = []

        # Calculate scores
        recurring_percentage = 0
        if analytics_data["total_income"] > 0:
            recurring_percentage = (
                analytics_data["recurring_income"] / analytics_data["total_income"]) * 100

        stability_score = min(100, recurring_percentage * 1.2)

        source_count = len(analytics_data["income_by_type"])
        diversification_score = min(100, source_count * 25)

        # Calculate growth rate
        trends = analytics_data["monthly_trends"]
        growth_rate = 0
        if len(trends) >= 2:
            recent_avg = sum(t["total"] for t in trends[-2:]) / 2
            older_avg = sum(t["total"] for t in trends[:2]) / \
                2 if len(trends) >= 4 else recent_avg
            if older_avg > 0:
                growth_rate = ((recent_avg - older_avg) / older_avg) * 100

        growth_score = max(0, min(100, 50 + growth_rate))

        # Generate insights
        if recurring_percentage >= 80:
            insights.append({
                "type": "positive",
                "title": "Excellent Income Stability",
                "description": f"Your recurring income makes up {recurring_percentage:.1f}% of total income, providing excellent financial stability."
            })
        elif recurring_percentage >= 60:
            insights.append({
                "type": "neutral",
                "title": "Good Income Stability",
                "description": f"Your recurring income is {recurring_percentage:.1f}% of total. Consider increasing this for better stability."
            })
        else:
            insights.append({
                "type": "warning",
                "title": "Low Income Stability",
                "description": f"Only {recurring_percentage:.1f}% of your income is recurring. Focus on building stable income streams."
            })

        if source_count >= 4:
            insights.append({
                "type": "positive",
                "title": "Well Diversified",
                "description": f"You have {source_count} income sources, providing good diversification."
            })
        elif source_count >= 2:
            insights.append({
                "type": "neutral",
                "title": "Moderate Diversification",
                "description": f"You have {source_count} income sources. Consider adding more for better risk management."
            })
        else:
            insights.append({
                "type": "warning",
                "title": "Limited Diversification",
                "description": "Consider diversifying your income sources to reduce financial risk."
            })

        # Generate recommendations
        if recurring_percentage < 70:
            recommendations.append({
                "priority": "high",
                "title": "Build Recurring Income",
                "description": "Focus on creating more predictable, recurring income streams like subscriptions or contracts.",
                "action": "Consider freelance retainers, part-time employment, or passive income sources."
            })

        if source_count < 3:
            recommendations.append({
                "priority": "medium",
                "title": "Diversify Income Sources",
                "description": "Add more income streams to reduce dependency on single sources.",
                "action": "Explore side hustles, investments, or skill monetization opportunities."
            })

        if growth_rate < 0:
            recommendations.append({
                "priority": "high",
                "title": "Address Declining Income",
                "description": "Your income has been declining. Take action to reverse this trend.",
                "action": "Review existing sources, negotiate raises, or find additional income opportunities."
            })

        return {
            "insights": insights,
            "recommendations": recommendations,
            "scores": {
                "stability": round(stability_score),
                "diversification": round(diversification_score),
                "growth": round(growth_score)
            }
        }

    except Exception as e:
        frappe.log_error(f"Error getting income insights: {str(e)}")
        frappe.throw(_("Failed to get income insights"))


@frappe.whitelist()
def update_ledger_entry(ledger_entry_name: str, new_amount: Union[str, float], new_date: str, new_type: Optional[str] = None) -> Dict[str, Any]:
    """
    Update a specific ledger entry directly without affecting the income source
    - For recurring entries: Edit the specific occurrence only, source remains unchanged
    - For one-time entries: Edit the entry directly
    - This allows editing individual occurrences without changing the recurring pattern
    """
    try:
        # Check if the ledger entry exists
        if not frappe.db.exists("Income Ledger", ledger_entry_name):
            frappe.throw(_("Ledger entry not found"))

        # Get the ledger entry
        ledger_entry = frappe.get_doc("Income Ledger", ledger_entry_name)

        # Store original data for reference
        original_amount = ledger_entry.amount
        original_type = ledger_entry.income_type

        # Update the ledger entry with proper datetime format
        ledger_entry.amount = flt(new_amount)

        # Use utility function for datetime conversion
        ledger_entry.date_time = convert_datetime_format(new_date)

        if new_type:
            ledger_entry.income_type = new_type

        # Save the ledger entry (do NOT update the source)
        ledger_entry.save()

        # Log the operation
        log_income_operation("update_ledger_entry", {
            "ledger_entry_name": ledger_entry_name,
            "original_amount": original_amount,
            "new_amount": ledger_entry.amount,
            "income_type": ledger_entry.income_type
        })

        # Note: We intentionally do NOT update the income source
        # This allows editing specific occurrences without affecting the recurring pattern
        # For recurring entries, the source settings remain unchanged for future entries
        # For one-time entries, there's no source to update anyway

        return {
            "status": "success",
            "message": f"Ledger entry updated successfully. {original_type.title()} source pattern unchanged.",
            "updated_entry": {
                "name": ledger_entry.name,
                "amount": ledger_entry.amount,
                "date_time": ledger_entry.date_time,
                "income_type": ledger_entry.income_type
            },
            "changes": {
                "amount_changed": original_amount != ledger_entry.amount,
                "type_changed": original_type != ledger_entry.income_type
            }
        }

    except Exception as e:
        frappe.log_error(f"Error updating ledger entry: {str(e)}")
        frappe.throw(_("Failed to update ledger entry: {0}").format(str(e)))


@frappe.whitelist()
def delete_ledger_entry(ledger_entry_name: str) -> Dict[str, Any]:
    """
    Delete a specific ledger entry without affecting the income source
    - For recurring entries: Delete just that one occurrence, source remains
    - For one-time entries: Delete the entry (no source exists)
    """
    try:
        # Check if the ledger entry exists
        if not frappe.db.exists("Income Ledger", ledger_entry_name):
            return {
                "status": "success",
                "message": "Ledger entry was already deleted",
                "deleted_type": "one-time"  # Default since we don't know the actual type
            }

        # Get the ledger entry
        ledger_entry = frappe.get_doc("Income Ledger", ledger_entry_name)
        income_type = ledger_entry.income_type

        # Delete the ledger entry only (do NOT delete the source)
        frappe.delete_doc("Income Ledger", ledger_entry_name)

        # Log the operation
        log_income_operation("delete_ledger_entry", {
            "ledger_entry_name": ledger_entry_name,
            "income_type": income_type
        })

        # Note: We intentionally do NOT delete the income source
        # - For recurring entries: Source should remain to continue generating future entries
        # - For one-time entries: No source exists anyway

        return {
            "status": "success",
            "message": f"Ledger entry deleted successfully (source unchanged)",
            "deleted_type": income_type
        }

    except Exception as e:
        frappe.log_error(f"Error deleting ledger entry: {str(e)}")
        frappe.throw(_("Failed to delete ledger entry: {0}").format(str(e)))


@frappe.whitelist()
def create_direct_ledger_entry(income_type: str, amount: Union[str, float], date_time: str, description: Optional[str] = None) -> Dict[str, Any]:
    """
    Create a direct ledger entry for one-time income without creating an income source
    This is for freelance work, bonuses, gifts, etc. that don't need recurring tracking
    """
    try:
        # Get user's household profile using utility function
        household_profile = get_user_household_profile()

        if not household_profile:
            frappe.throw(_("No household profile found for current user"))

        # Find or create the single Income record for this household
        income_name_db = frappe.db.get_value(
            "Income",
            {"household_profile": household_profile},
            "name"
        )

        if income_name_db:
            income_doc = frappe.get_doc("Income", income_name_db)
        else:
            income_doc = frappe.new_doc("Income")
            income_doc.household_profile = household_profile
            # Save first to get the document name - this triggers validation
            income_doc.save()
            # Reload to get fresh document with proper initialization
            income_doc = frappe.get_doc("Income", income_doc.name)

        # Use utility function to create ledger entry
        entry_data = {
            "income_source": None,  # No source for direct entries
            "income_type": "one-time",
            "date_time": date_time,  # Utility will handle conversion
            "amount": flt(amount),
            "source_type": income_type,
            "description": description or f"One-time {income_type} income"
        }

        entry_name = create_ledger_entry(income_doc.name, entry_data)

        log_income_operation("create_direct_ledger_entry", {
            "income_name": income_doc.name,
            "amount": flt(amount),
            "income_type": income_type
        })

        return {
            "status": "success",
            "message": "One-time income entry created successfully",
            "entry_name": entry_name
        }

    except Exception as e:
        frappe.log_error(f"Error creating direct ledger entry: {str(e)}")
        frappe.throw(
            _("Failed to create direct ledger entry: {0}").format(str(e)))


@frappe.whitelist()
def get_income_summary() -> Dict[str, Any]:
    """
    Get comprehensive income summary for the current user's household
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
                "status": "error",
                "message": "No household profile found for current user"
            }

        # Find the Income record for this household
        income_name = frappe.db.get_value(
            "Income",
            {"household_profile": household_profile},
            "name"
        )

        if not income_name:
            return {
                "status": "success",
                "summary": {
                    "monthly_income": 0,
                    "total_sources": 0,
                    "total_ledger_entries": 0,
                    "recurring_entries": 0,
                    "one_time_entries": 0,
                    "total_actual_income": 0,
                    "income_by_type": {},
                    "latest_entry_date": None,
                    "earliest_entry_date": None
                }
            }

        # Use utility function to get comprehensive summary stats
        summary = get_income_summary_stats(household_profile)

        return {
            "status": "success",
            "summary": summary
        }

    except Exception as e:
        frappe.log_error(f"Error getting income summary: {str(e)}")
        frappe.throw(_("Failed to get income summary: {0}").format(str(e)))


@frappe.whitelist()
def cleanup_income_data() -> Dict[str, Any]:
    """
    Clean up income data for the current user's household
    Removes orphaned ledger entries and validates data consistency
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
                "status": "error",
                "message": "No household profile found for current user",
                "cleanup_summary": {
                    "orphaned_entries_removed": 0,
                    "duplicate_entries_merged": 0,
                    "invalid_dates_fixed": 0,
                    "empty_sources_removed": 0,
                }
            }

        # Find the Income record for this household
        income_name = frappe.db.get_value(
            "Income",
            {"household_profile": household_profile},
            "name"
        )

        if not income_name:
            return {
                "status": "success",
                "message": "No income data to clean up",
                "cleanup_summary": {
                    "orphaned_entries_removed": 0,
                    "duplicate_entries_merged": 0,
                    "invalid_dates_fixed": 0,
                    "empty_sources_removed": 0,
                }
            }

        # Initialize cleanup counters
        cleanup_summary = {
            "orphaned_entries_removed": 0,
            "duplicate_entries_merged": 0,
            "invalid_dates_fixed": 0,
            "empty_sources_removed": 0,
        }

        # Use API function for cleanup
        cleanup_result = cleanup_orphaned_ledger_entries_for_income(
            income_name)
        orphaned_count = cleanup_result.get("cleaned_count", 0)

        cleanup_summary["orphaned_entries_removed"] = orphaned_count
        total_cleaned = orphaned_count

        # Log cleanup operation
        log_income_operation("cleanup_income_data", {
            "household_profile": household_profile,
            "income_name": income_name,
            "total_cleaned": total_cleaned
        })

        return {
            "status": "success",
            "message": f"Cleaned up {total_cleaned} issues in income data",
            "cleanup_summary": cleanup_summary
        }

    except Exception as e:
        frappe.log_error(f"Error cleaning up income data: {str(e)}")
        return {
            "status": "error",
            "message": f"Failed to clean up income data: {str(e)}",
            "cleanup_summary": {
                "orphaned_entries_removed": 0,
                "duplicate_entries_merged": 0,
                "invalid_dates_fixed": 0,
                "empty_sources_removed": 0,
            }
        }


@frappe.whitelist()
def trigger_ledger_update(income_name: str = None) -> Dict[str, Any]:
    """
    Manually trigger ledger updates for income records
    This is useful when ledger entries need to be updated outside of scheduled tasks
    """
    try:
        if income_name:
            # Update specific income record
            if not frappe.db.exists("Income", income_name):
                frappe.throw(_("Income record not found"))

            income_doc = frappe.get_doc("Income", income_name)

            # Check permission
            if not income_doc.has_permission("write"):
                frappe.throw(
                    _("Insufficient permissions to update this income record"))

            # Get current count of ledger entries
            entries_before = frappe.db.count(
                "Income Ledger", {"parent": income_name})

            # Update using API method
            update_result = update_recurring_ledger_entries_for_income(
                income_name)
            entries_added = update_result.get("entries_added", 0)

            entries_after = frappe.db.count(
                "Income Ledger", {"parent": income_name})

            log_income_operation("trigger_ledger_update", {
                "income_name": income_name,
                "entries_added": entries_added,
                "total_entries": entries_after
            })

            return {
                "status": "success",
                "message": f"Updated Income {income_name}: Added {entries_added} ledger entries",
                "entries_added": entries_added,
                "total_entries": entries_after
            }
        else:
            # Get user's household profile
            household_profile = frappe.db.get_value(
                "Household Profile",
                {"user": frappe.session.user},
                "name"
            )

            if not household_profile:
                frappe.throw(_("No household profile found for current user"))

            # Find the Income record for this household
            income_name_db = frappe.db.get_value(
                "Income",
                {"household_profile": household_profile},
                "name"
            )

            if not income_name_db:
                return {
                    "status": "success",
                    "message": "No income record found to update",
                    "entries_added": 0,
                    "total_entries": 0
                }

            # Update the user's income record using API method
            entries_before = frappe.db.count(
                "Income Ledger", {"parent": income_name_db})

            # Update using API method
            update_result = update_recurring_ledger_entries_for_income(
                income_name_db)
            entries_added = update_result.get("entries_added", 0)

            entries_after = frappe.db.count(
                "Income Ledger", {"parent": income_name_db})

            log_income_operation("trigger_ledger_update_user", {
                "household_profile": household_profile,
                "income_name": income_name_db,
                "entries_added": entries_added,
                "total_entries": entries_after
            })

            return {
                "status": "success",
                "message": f"Updated your income record: Added {entries_added} ledger entries",
                "entries_added": entries_added,
                "total_entries": entries_after
            }

    except Exception as e:
        frappe.log_error(f"Error triggering ledger update: {str(e)}")
        frappe.throw(_("Failed to update ledger entries: {0}").format(str(e)))
