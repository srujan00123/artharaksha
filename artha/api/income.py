"""
Income API
Provides specialized endpoints for income management and analysis
"""

import frappe
from frappe import _
from frappe.utils import flt, getdate, now_datetime
from datetime import datetime, timedelta
import json


@frappe.whitelist()
def get_income_types():
    """
    Get all available income types
    Returns: {'income_types': [{'name': 'Agriculture', 'type': 'Agriculture'}, ...]}
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
def get_income_ledger(filters=None):
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
def get_user_income(filters=None, include_analytics=False):
    """
    Get income records for the current user's household profile with optional filtering and analytics
    Unified endpoint that handles all complex filtering needs
    """
    try:
        # Get user's household profile
        household_profile = frappe.db.get_value(
            "Household Profile",
            {"user": frappe.session.user},
            "name"
        )

        if not household_profile:
            if include_analytics:
                return {
                    "income_records": [],
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
                    }
                }
            return []

        # Parse filters if provided
        if isinstance(filters, str):
            filters = json.loads(filters)

        if not filters:
            filters = {}

        # Build base query conditions
        conditions = {"household_profile": household_profile}

        # Enhanced date filtering logic
        start_date = None
        end_date = None

        # Handle multiple date filter formats
        if filters.get('dateRange'):
            date_range = filters['dateRange']
            today = getdate()

            if date_range == 'today':
                start_date = today
                end_date = today
            elif date_range == 'this-week':
                start_date = today - timedelta(days=today.weekday())
                end_date = today
            elif date_range == 'this-month':
                start_date = today.replace(day=1)
                end_date = today
            elif date_range == 'last-month':
                last_month = today.replace(day=1) - timedelta(days=1)
                start_date = last_month.replace(day=1)
                end_date = last_month
            elif date_range == 'last-3-months':
                start_date = (today.replace(day=1) -
                              timedelta(days=90)).replace(day=1)
                end_date = today
            elif date_range == 'this-year':
                start_date = today.replace(month=1, day=1)
                end_date = today
        elif filters.get('dateFrom') or filters.get('dateTo'):
            if filters.get('dateFrom'):
                start_date = getdate(filters['dateFrom'])
            if filters.get('dateTo'):
                end_date = getdate(filters['dateTo'])
        elif filters.get('period'):
            # Period-based filtering for analytics
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

        # Apply date filter to income records
        if start_date and end_date:
            conditions["creation"] = ["between", [start_date, end_date]]
        elif start_date:
            conditions["creation"] = [">=", start_date]
        elif end_date:
            conditions["creation"] = ["<=", end_date]

        # Determine sort order
        sort_by = filters.get('sortBy', 'date')
        sort_order = filters.get('sortOrder', 'desc')

        order_by_field = "creation"
        if sort_by == 'date':
            order_by_field = "creation"
        # Note: We can't sort by amount at the database level anymore since
        # monthly_income is calculated dynamically from filtered ledger data

        order_by = f"{order_by_field} {sort_order}"

        # Get income records
        income_records = frappe.get_all(
            "Income",
            filters=conditions,
            fields=[
                "name", "household_profile", "creation", "modified", "owner"
            ],
            order_by=order_by
        )

        # Initialize analytics data if requested
        analytics_data = None
        if include_analytics:
            analytics_data = {
                "total_income": 0,
                "recurring_income": 0,
                "one_time_income": 0,
                "income_by_type": {},
                "monthly_trends": [],
                "summary": {
                    "total_sources": 0,
                    "average_source_amount": 0,
                    "top_income_type": ""
                },
                "period": filters.get('period', ''),
                "start_date": start_date.isoformat() if start_date else "",
                "end_date": end_date.isoformat() if end_date else ""
            }
            monthly_data = {}
            total_sources = 0
            total_amount = 0
            type_amounts = {}

        # Process each income record
        filtered_records = []
        for record in income_records:
            source_conditions = {"parent": record.name}

            # Apply source-level filters
            if filters.get('type') or filters.get('incomeType'):
                source_conditions["type"] = filters.get(
                    'type') or filters.get('incomeType')

            if filters.get('frequency'):
                if filters['frequency'] == 'one-time':
                    source_conditions["recur"] = 0
                else:
                    source_conditions["recur"] = 1
                    if filters['frequency'] != 'recurring':
                        source_conditions["recur_frequency"] = filters['frequency']
            elif filters.get('isRecurring') is not None:
                source_conditions["recur"] = 1 if filters['isRecurring'] else 0

            # Get income sources
            income_sources = frappe.get_all(
                "Income Source Type",
                filters=source_conditions,
                fields=[
                    "name", "type", "income", "recur",
                    "date_time", "recur_frequency", "stop_date"
                ],
                order_by="creation"
            )

            # Apply amount filters at source level
            if filters.get('amountMin') or filters.get('amountMax'):
                filtered_sources = []
                for source in income_sources:
                    amount = flt(source.income)
                    if filters.get('amountMin') and amount < flt(filters['amountMin']):
                        continue
                    if filters.get('amountMax') and amount > flt(filters['amountMax']):
                        continue
                    filtered_sources.append(source)
                income_sources = filtered_sources

            # Apply search term filter
            if filters.get('searchTerm'):
                search_term = filters['searchTerm'].lower()
                filtered_sources = []
                for source in income_sources:
                    if search_term in source.type.lower():
                        filtered_sources.append(source)
                income_sources = filtered_sources

            # Only include records that have matching sources after filtering
            if income_sources or not any([
                filters.get('type'), filters.get(
                    'incomeType'), filters.get('frequency'),
                filters.get('isRecurring') is not None, filters.get(
                    'amountMin'),
                filters.get('amountMax'), filters.get('searchTerm')
            ]):
                # Calculate monthly_income from ledger entries for this record
                calculated_monthly_income = 0

                # Get ledger entries for each source and calculate totals
                for source in income_sources:
                    ledger_conditions = {
                        "parent": record.name,
                        "income_source": source.name
                    }

                    # Apply date filters to ledger entries if specified
                    if start_date or end_date:
                        if start_date and end_date:
                            ledger_conditions["date_time"] = [
                                "between", [start_date, end_date]]
                        elif start_date:
                            ledger_conditions["date_time"] = [">=", start_date]
                        elif end_date:
                            ledger_conditions["date_time"] = ["<=", end_date]

                    ledger_entries = frappe.get_all(
                        "Income Ledger",
                        filters=ledger_conditions,
                        fields=["date_time", "amount", "income_type"],
                        order_by="date_time"
                    )

                    # Calculate monthly equivalent from ledger entries
                    for entry in ledger_entries:
                        entry_amount = flt(entry.amount)

                        # For recurring income, use the amount as is (already monthly equivalent)
                        # For one-time income, we need to convert based on the time period
                        if entry.income_type == "recurring":
                            calculated_monthly_income += entry_amount
                        else:
                            # For one-time income in a filtered period, calculate monthly equivalent
                            if start_date and end_date:
                                # Calculate days in the period
                                period_days = (
                                    end_date - start_date).days + 1
                                # Convert to monthly equivalent (assuming 30 days per month)
                                monthly_equivalent = (
                                    entry_amount / period_days) * 30
                                calculated_monthly_income += monthly_equivalent
                            else:
                                # If no date filter, treat one-time as monthly amount
                                calculated_monthly_income += entry_amount

                    source.ledger_entries = ledger_entries

                # Set the calculated monthly_income for this record
                record.monthly_income = calculated_monthly_income
                record.income_source = income_sources
                filtered_records.append(record)

                # Calculate analytics if requested
                if include_analytics and income_sources:
                    month_key = record.creation.strftime("%Y-%m")
                    if month_key not in monthly_data:
                        monthly_data[month_key] = {
                            "total": 0,
                            "recurring": 0,
                            "one_time": 0
                        }

                    for source in income_sources:
                        # Use ledger entries for analytics calculations
                        source_monthly_recurring = 0
                        source_monthly_one_time = 0

                        for entry in source.ledger_entries:
                            entry_amount = flt(entry.amount)

                            if entry.income_type == "recurring":
                                source_monthly_recurring += entry_amount
                                analytics_data["recurring_income"] += entry_amount
                                monthly_data[month_key]["recurring"] += entry_amount
                            else:
                                # For one-time, convert to monthly equivalent if in period
                                if start_date and end_date:
                                    period_days = (
                                        end_date - start_date).days + 1
                                    monthly_equivalent = (
                                        entry_amount / period_days) * 30
                                    source_monthly_one_time += monthly_equivalent
                                    analytics_data["one_time_income"] += monthly_equivalent
                                    monthly_data[month_key]["one_time"] += monthly_equivalent
                                else:
                                    source_monthly_one_time += entry_amount
                                    analytics_data["one_time_income"] += entry_amount
                                    monthly_data[month_key]["one_time"] += entry_amount

                        source_total = source_monthly_recurring + source_monthly_one_time
                        analytics_data["total_income"] += source_total
                        monthly_data[month_key]["total"] += source_total

                        total_sources += 1
                        total_amount += source_total

                        # Group by type
                        if source.type not in analytics_data["income_by_type"]:
                            analytics_data["income_by_type"][source.type] = 0
                        analytics_data["income_by_type"][source.type] += source_total

                        # Track for summary
                        if source.type not in type_amounts:
                            type_amounts[source.type] = 0
                        type_amounts[source.type] += source_total

        # Generate monthly trends and summary for analytics
        if include_analytics:
            # Monthly trends
            for month_key in sorted(monthly_data.keys()):
                month_date = datetime.strptime(month_key, "%Y-%m")
                analytics_data["monthly_trends"].append({
                    "month": month_date.strftime("%b %Y"),
                    "total": monthly_data[month_key]["total"],
                    "recurring": monthly_data[month_key]["recurring"],
                    "one_time": monthly_data[month_key]["one_time"]
                })

            # Summary statistics
            analytics_data["summary"]["total_sources"] = total_sources
            analytics_data["summary"]["average_source_amount"] = total_amount / \
                total_sources if total_sources > 0 else 0

            # Find top income type
            if type_amounts:
                top_type = max(type_amounts.items(), key=lambda x: x[1])
                analytics_data["summary"]["top_income_type"] = top_type[0]

            # Calculate additional metrics for frontend use
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

            # Add actual monthly income (only from recurring sources)
            analytics_data["actual_monthly_income"] = analytics_data["recurring_income"]

        # Sort by amount if requested (must be done after calculations)
        if filters.get('sortBy') == 'amount':
            sort_order = filters.get('sortOrder', 'desc')
            reverse_sort = sort_order == 'desc'
            filtered_records.sort(
                key=lambda x: x.monthly_income, reverse=reverse_sort)

        if include_analytics:
            return {
                "income_records": filtered_records,
                "analytics": analytics_data
            }

        return filtered_records

    except Exception as e:
        frappe.log_error(f"Error fetching user income: {str(e)}")
        frappe.throw(_("Failed to fetch income records"))


@frappe.whitelist()
def get_monthly_income_summary():
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

        # Calculate totals from ledger entries only
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

            # Get all ledger entries for this record
            ledger_entries = frappe.get_all(
                "Income Ledger",
                filters={"parent": record.name},
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
def get_income_dashboard_metrics(period="this_month"):
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
            "actual_monthly_income": analytics.get("actual_monthly_income", 0),
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
def create_or_update_income(income_source, income_name=None, source_name=None, action=None):
    """
    Create or update income record with sources and corresponding ledger entries
    - Only one Income doctype per household profile
    - All sources are children (Income Source Type)
    - Ledger entries are created based on source configuration
    - If action == 'delete', remove the specified source and its ledger entries
    - If source_name is provided, update that source and adjust ledger entries
    - Otherwise, add a new source and create ledger entries
    - monthly_income is always recalculated from sources
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
            # Remove specific source
            income_doc.income_source = [
                row for row in income_doc.income_source if row.name != source_name]

            # Remove corresponding ledger entries
            frappe.db.delete("Income Ledger", {
                "parent": income_doc.name,
                "income_source": source_name
            })
        elif source_name:
            # Update existing source
            for existing_source in income_doc.income_source:
                if existing_source.name == source_name:
                    # Update the source fields
                    for source in income_source:
                        existing_source.type = source.get("type")
                        existing_source.income = flt(source.get("income"))
                        existing_source.recur = source.get("recur", False)
                        existing_source.date_time = source.get(
                            "date_time") or now_datetime()
                        existing_source.recur_frequency = source.get(
                            "recur_frequency")
                        existing_source.stop_date = source.get("stop_date")
                    break

            # Note: Ledger entries will be recreated automatically by Income.on_update()
        else:
            # Add new sources
            for source in income_source:
                income_doc.append("income_source", {
                    "type": source.get("type"),
                    "income": flt(source.get("income")),
                    "recur": source.get("recur", False),
                    "date_time": source.get("date_time") or now_datetime(),
                    "recur_frequency": source.get("recur_frequency"),
                    "stop_date": source.get("stop_date")
                })

        # Save the document - this will automatically:
        # 1. Validate and calculate monthly_income (via validate method)
        # 2. Recreate all ledger entries (via on_update method)
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
def update_recurring_ledger_entries():
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


def on_income_source_type_update(doc, method=None):
    """
    This function is no longer needed as ledger entries are automatically
    managed by the Income doctype's on_update method
    """
    pass


@frappe.whitelist()
def update_all_recurring_ledgers():
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
def validate_income_data(monthly_income, income_source):
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
def get_income_insights():
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
