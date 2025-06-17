"""
Income API
Provides specialized endpoints for income management and analysis
"""

import frappe
from frappe import _
from frappe.utils import flt, getdate, now_datetime
from datetime import datetime, timedelta
import json
from typing import Dict, List, Any, Optional, Union


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
        # Get user's household profile
        household_profile = frappe.db.get_value(
            "Household Profile",
            {"user": frappe.session.user},
            "name"
        )

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

            # Calculate actual monthly income from current month's ledger entries
            analytics_data["monthly_recurring_income"] = calculate_monthly_income_from_ledger(
                household_profile)

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


def calculate_monthly_income_from_ledger(household_profile: str) -> float:
    """
    Calculate actual monthly income based on ledger entries
    This provides a more accurate monthly income calculation
    """
    try:
        # Get all income records for the household
        income_records = frappe.get_all(
            "Income",
            filters={"household_profile": household_profile},
            fields=["name"]
        )

        if not income_records:
            return 0.0

        # Get current month's date range
        today = getdate()
        start_of_month = today.replace(day=1)

        total_monthly_income = 0.0

        for record in income_records:
            # Get all ledger entries for this month
            monthly_entries = frappe.get_all(
                "Income Ledger",
                filters={
                    "parent": record.name,
                    "date_time": ["between", [start_of_month, today]]
                },
                fields=["amount"]
            )

            for entry in monthly_entries:
                total_monthly_income += flt(entry.amount)

        return total_monthly_income

    except Exception as e:
        frappe.log_error(
            f"Error calculating monthly income from ledger: {str(e)}")
        return 0.0


@frappe.whitelist()
def get_monthly_income_summary() -> Dict[str, Union[float, int]]:
    """
    Get monthly income summary for CHE analysis
    Calculated from ledger entries to ensure consistency with filtered data
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
                "monthly_income": 0,
                "recurring_income": 0,
                "one_time_income": 0,
                "total_sources": 0
            }

        # Get all income records for the household
        income_records = frappe.get_all(
            "Income",
            filters={"household_profile": household_profile},
            fields=["name"]
        )

        if not income_records:
            return {
                "monthly_income": 0,
                "recurring_income": 0,
                "one_time_income": 0,
                "total_sources": 0
            }

        # Calculate totals from current month's ledger entries only
        today = getdate()
        start_of_month = today.replace(day=1)

        total_monthly_income = 0
        total_recurring_income = 0
        total_one_time_income = 0
        total_sources = 0

        for record in income_records:
            # Get income sources for this record (for counting)
            income_sources = frappe.get_all(
                "Income Source Type",
                filters={"parent": record.name},
                fields=["name"]
            )

            total_sources += len(income_sources)

            # Get current month's ledger entries for this record
            ledger_entries = frappe.get_all(
                "Income Ledger",
                filters={
                    "parent": record.name,
                    "date_time": ["between", [start_of_month, today]]
                },
                fields=["amount", "income_type"]
            )

            for entry in ledger_entries:
                entry_amount = flt(entry.amount)
                total_monthly_income += entry_amount

                if entry.income_type == "recurring":
                    total_recurring_income += entry_amount
                else:
                    total_one_time_income += entry_amount

        return {
            "monthly_income": total_monthly_income,
            "recurring_income": total_recurring_income,
            "one_time_income": total_one_time_income,
            "total_sources": total_sources
        }

    except Exception as e:
        frappe.log_error(f"Error calculating monthly income summary: {str(e)}")
        frappe.throw(_("Failed to calculate monthly income summary"))


@frappe.whitelist()
def get_income_dashboard_metrics(period: str = "this_month") -> Dict[str, Any]:
    """
    Get computed dashboard metrics for income management
    Provides all the key metrics needed for dashboard displays
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
                "actual_monthly_income": 0,
                "recurring_income": 0,
                "one_time_income": 0,
                "total_sources": 0,
                "recurring_percentage": 0,
                "growth_rate": 0,
                "top_income_type": "",
                "income_by_type": {},
                "monthly_trends": [],
                "period": period
            }

        # Get analytics using existing function
        analytics_result = get_user_income(
            filters=json.dumps({"period": period}),
            include_analytics=True
        )

        analytics = analytics_result.get("analytics", {})

        return {
            "actual_monthly_income": analytics.get("monthly_recurring_income", 0),
            "expected_monthly_income": analytics.get("expected_monthly_income", 0),
            "recurring_income": analytics.get("recurring_income", 0),
            "one_time_income": analytics.get("one_time_income", 0),
            "total_sources": analytics.get("summary", {}).get("total_sources", 0),
            "recurring_percentage": analytics.get("recurring_percentage", 0),
            "growth_rate": analytics.get("growth_rate", 0),
            "top_income_type": analytics.get("summary", {}).get("top_income_type", ""),
            "income_by_type": analytics.get("income_by_type", {}),
            "monthly_trends": analytics.get("monthly_trends", []),
            "average_source_amount": analytics.get("summary", {}).get("average_source_amount", 0),
            "period": period,
            "start_date": analytics.get("start_date", ""),
            "end_date": analytics.get("end_date", "")
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
        # Get user's household profile
        household_profile = frappe.db.get_value(
            "Household Profile",
            {"user": frappe.session.user},
            "name"
        )
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

            # Delete ALL ledger entries linked to this source
            frappe.db.delete("Income Ledger", {
                "parent": income_doc.name,
                "income_source": source_name
            })
        elif source_name:
            # Update existing recurring source
            for existing_source in income_doc.income_source:
                if existing_source.name == source_name:
                    for source in income_source:
                        existing_source.type = source.get("type")
                        existing_source.income = flt(source.get("income"))
                        existing_source.recur = True  # Always true for income sources
                        existing_source.date_time = source.get(
                            "date_time") or now_datetime()
                        existing_source.recur_frequency = source.get(
                            "recur_frequency")
                        existing_source.stop_date = source.get("stop_date")
                    break
        else:
            # Add new recurring sources only
            for source in income_source:
                income_doc.append("income_source", {
                    "type": source.get("type"),
                    "income": flt(source.get("income")),
                    "recur": True,  # Always true for income sources
                    "date_time": source.get("date_time") or now_datetime(),
                    "recur_frequency": source.get("recur_frequency"),
                    "stop_date": source.get("stop_date")
                })

        # Save the document
        income_doc.save()

        return {
            "name": income_doc.name,
            "household_profile": income_doc.household_profile,
            "monthly_income": income_doc.monthly_income
        }
    except Exception as e:
        frappe.log_error(f"Error creating/updating income: {str(e)}")
        frappe.throw(_("Failed to save income record: {0}").format(str(e)))


@frappe.whitelist()
def update_recurring_ledger_entries() -> Dict[str, Any]:
    """
    Update ledger entries for recurring income sources without stop dates across all income documents
    This should be called periodically (e.g., daily) to ensure ledger entries are up to date
    """
    try:
        # Get all income records
        income_records = frappe.get_all("Income", fields=["name"])
        updated_count = 0

        for record in income_records:
            try:
                income_doc = frappe.get_doc("Income", record.name)

                # Check if any recurring sources need updates
                needs_update = False
                today = getdate()

                for source in income_doc.income_source:
                    if source.recur and not source.stop_date:
                        # Get the latest ledger entry for this source
                        source_entries = [
                            entry for entry in income_doc.income_ledger
                            if entry.income_source == source.name
                        ]

                        if source_entries:
                            latest_date = max(getdate(entry.date_time)
                                              for entry in source_entries)
                            if latest_date < today:
                                needs_update = True
                                break
                        else:
                            # No entries exist, we need updates
                            needs_update = True
                            break

                if needs_update:
                    income_doc.update_future_recurring_entries()
                    updated_count += 1

            except Exception as e:
                frappe.log_error(
                    f"Error updating recurring ledgers for Income {record.name}: {str(e)}")
                continue

        return {
            "status": "success",
            "message": f"Updated recurring ledger entries for {updated_count} income documents",
            "updated_count": updated_count
        }

    except Exception as e:
        frappe.log_error(f"Error updating recurring ledger entries: {str(e)}")
        frappe.throw(
            _("Failed to update recurring ledger entries: {0}").format(str(e)))


def on_income_source_type_update(doc: Any, method: Optional[str] = None) -> None:
    """
    This function is no longer needed as ledger entries are automatically
    managed by the Income doctype's on_update method
    """
    pass


@frappe.whitelist()
def update_all_recurring_ledgers() -> Dict[str, Any]:
    """
    Scheduled function to update recurring ledger entries for all income documents
    Should be set up as a daily scheduled job
    """
    try:
        result = update_recurring_ledger_entries()
        frappe.log_error(
            f"Scheduled update of recurring ledgers completed: {result.get('message', 'Unknown result')}",
            "Income Recurring Ledger Update"
        )
        return result

    except Exception as e:
        frappe.log_error(
            f"Scheduled recurring ledger update failed: {str(e)}",
            "Income Recurring Ledger Update Error"
        )
        return {"status": "error", "message": str(e)}


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

        # Validate income sources
        if not income_source or len(income_source) == 0:
            errors["income_source"] = "At least one income source is required"
        else:
            for i, source in enumerate(income_source):
                if not source.get("type"):
                    errors[f"income_source_{i}_type"] = "Income type is required"

                if flt(source.get("income", 0)) <= 0:
                    errors[f"income_source_{i}_income"] = "Income amount must be greater than 0"

                if source.get("recur") and not source.get("recur_frequency"):
                    errors[f"income_source_{i}_frequency"] = "Frequency is required for recurring income"

                # Validate frequency values
                if source.get("recur_frequency"):
                    valid_frequencies = [
                        'daily', 'weekly', 'bi-weekly', 'monthly',
                        'quarterly', 'semi-annually', 'annually', 'yearly'
                    ]
                    if source.get("recur_frequency") not in valid_frequencies:
                        errors[
                            f"income_source_{i}_frequency"] = f"Invalid frequency. Must be one of: {', '.join(valid_frequencies)}"

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

        # Update the ledger entry
        ledger_entry.amount = flt(new_amount)
        ledger_entry.date_time = new_date
        if new_type:
            ledger_entry.income_type = new_type

        # Save the ledger entry (do NOT update the source)
        ledger_entry.save()

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
        # Get user's household profile
        household_profile = frappe.db.get_value(
            "Household Profile",
            {"user": frappe.session.user},
            "name"
        )

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
            income_doc.save()  # Save first to get the document name
            income_doc = frappe.get_doc("Income", income_doc.name)  # Reload

        # Use the new doctype method for better consistency
        entry_name = income_doc.add_direct_ledger_entry(
            income_type=income_type,
            amount=flt(amount),
            date_time=date_time,
            description=description or f"One-time {income_type} income"
        )

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
def create_ledger_entry(income_source_name: str, amount: Union[str, float], date_time: str, income_type: str = "one-time") -> Dict[str, Any]:
    """
    Create a new ledger entry for an existing income source
    """
    try:
        # Get the source document to get parent income
        source_doc = frappe.db.get_value(
            "Income Source Type",
            {"name": income_source_name},
            ["parent"],
            as_dict=True
        )

        if not source_doc:
            frappe.throw(_("Income source not found"))

        # Get the income document
        income_doc = frappe.get_doc("Income", source_doc.parent)

        # Create new ledger entry
        new_entry = {
            "income_source": income_source_name,
            "income_type": income_type,
            "date_time": date_time,
            "amount": flt(amount)
        }

        # Add to ledger
        income_doc.append("income_ledger", new_entry)

        # Recalculate and save
        income_doc.validate()
        income_doc.save()

        return {
            "status": "success",
            "message": "Ledger entry created successfully",
            "entry_name": income_doc.income_ledger[-1].name
        }

    except Exception as e:
        frappe.log_error(f"Error creating ledger entry: {str(e)}")
        frappe.throw(_("Failed to create ledger entry: {0}").format(str(e)))
