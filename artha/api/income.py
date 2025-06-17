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
    """
    try:
        income_types = frappe.get_all(
            "Income Type",
            fields=["name", "type"],
            order_by="type"
        )
        
        return income_types
        
    except Exception as e:
        frappe.log_error(f"Error fetching income types: {str(e)}")
        frappe.throw(_("Failed to fetch income types"))


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
                start_date = (today.replace(day=1) - timedelta(days=90)).replace(day=1)
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
                start_date = (today.replace(day=1) - timedelta(days=90)).replace(day=1)
                end_date = today
            elif period == "last_6_months":
                start_date = (today.replace(day=1) - timedelta(days=180)).replace(day=1)
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
        if sort_by == 'amount':
            order_by_field = "monthly_income"
        elif sort_by == 'date':
            order_by_field = "creation"
        
        order_by = f"{order_by_field} {sort_order}"
        
        # Get income records
        income_records = frappe.get_all(
            "Income",
            filters=conditions,
            fields=[
                "name", "household_profile", "monthly_income", 
                "creation", "modified", "owner"
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
                source_conditions["type"] = filters.get('type') or filters.get('incomeType')
            
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
                filters.get('type'), filters.get('incomeType'), filters.get('frequency'), 
                filters.get('isRecurring') is not None, filters.get('amountMin'), 
                filters.get('amountMax'), filters.get('searchTerm')
            ]):
                # Get ledger entries for each source
                for source in income_sources:
                    ledger_entries = frappe.get_all(
                        "Income Ledger",
                        filters={
                            "parent": record.name,
                            "income_source": source.name
                        },
                        fields=["date_time", "amount", "income_type"],
                        order_by="date_time"
                    )
                    source.ledger_entries = ledger_entries
                
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
                        amount = flt(source.income)
                        total_sources += 1
                        total_amount += amount
                        
                        # Convert to monthly equivalent for consistent comparison
                        monthly_amount = amount
                        if source.recur and source.recur_frequency:
                            conversion_factors = {
                                'daily': 30,
                                'weekly': 4.33,
                                'bi-weekly': 2.17,
                                'monthly': 1,
                                'quarterly': 1/3,
                                'semi-annually': 1/6,
                                'annually': 1/12,
                                'yearly': 1/12
                            }
                            factor = conversion_factors.get(source.recur_frequency.lower(), 1)
                            monthly_amount = amount * factor
                        
                        analytics_data["total_income"] += monthly_amount
                        monthly_data[month_key]["total"] += monthly_amount
                        
                        if source.recur:
                            analytics_data["recurring_income"] += monthly_amount
                            monthly_data[month_key]["recurring"] += monthly_amount
                        else:
                            analytics_data["one_time_income"] += amount
                            monthly_data[month_key]["one_time"] += amount
                        
                        # Group by type
                        if source.type not in analytics_data["income_by_type"]:
                            analytics_data["income_by_type"][source.type] = 0
                        analytics_data["income_by_type"][source.type] += monthly_amount
                        
                        # Track for summary
                        if source.type not in type_amounts:
                            type_amounts[source.type] = 0
                        type_amounts[source.type] += monthly_amount
        
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
            analytics_data["summary"]["average_source_amount"] = total_amount / total_sources if total_sources > 0 else 0
            
            # Find top income type
            if type_amounts:
                top_type = max(type_amounts.items(), key=lambda x: x[1])
                analytics_data["summary"]["top_income_type"] = top_type[0]
        
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
            fields=["name", "monthly_income"]
        )
        
        if not income_records:
            return {
                "monthly_income": 0,
                "recurring_income": 0,
                "one_time_income": 0,
                "total_sources": 0
            }
        
        # Calculate totals
        total_monthly_income = 0
        total_recurring_income = 0
        total_one_time_income = 0
        total_sources = 0
        
        for record in income_records:
            total_monthly_income += flt(record.monthly_income)
            
            # Get income sources for this record
            income_sources = frappe.get_all(
                "Income Source Type",
                filters={"parent": record.name},
                fields=["income", "recur"]
            )
            
            total_sources += len(income_sources)
            
            for source in income_sources:
                if source.recur:
                    total_recurring_income += flt(source.income)
                else:
                    total_one_time_income += flt(source.income)
        
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

        # Handle source deletion
        if action == 'delete' and source_name:
            # Remove ledger entries for this source
            frappe.db.delete("Income Ledger", {
                "parent": income_doc.name,
                "income_source": source_name
            })
            # Remove the source
            income_doc.income_source = [row for row in income_doc.income_source if row.name != source_name]
        elif source_name:
            # Update existing source and adjust ledger entries
            source_data = income_source
            if isinstance(source_data, list):
                source_data = source_data[0] if source_data else {}
            
            # Get the existing source
            existing_source = None
            for row in income_doc.income_source:
                if row.name == source_name:
                    existing_source = row
                    # Update source fields
                    row.type = source_data.get("type", row.type)
                    row.income = flt(source_data.get("income", row.income))
                    row.recur = source_data.get("recur", row.recur)
                    row.date_time = source_data.get("date_time", row.date_time)
                    row.recur_frequency = source_data.get("recur_frequency", row.recur_frequency)
                    row.stop_date = source_data.get("stop_date", row.stop_date)
                    break
            
            if existing_source:
                # Delete existing ledger entries
                frappe.db.delete("Income Ledger", {
                    "parent": income_doc.name,
                    "income_source": source_name
                })
                # Create new ledger entries based on updated source
                create_ledger_entries(income_doc, existing_source)
        else:
            # Add new sources and create ledger entries
            for source in income_source:
                new_source = income_doc.append("income_source", {
                    "type": source.get("type"),
                    "income": flt(source.get("income")),
                    "recur": source.get("recur", False),
                    "date_time": source.get("date_time") or now_datetime(),
                    "recur_frequency": source.get("recur_frequency"),
                    "stop_date": source.get("stop_date")
                })
                # Create ledger entries for the new source
                create_ledger_entries(income_doc, new_source)

        # Recalculate monthly_income from all sources
        total_monthly_income = 0
        today = getdate()
        current_month = today.month
        current_year = today.year
        
        for row in income_doc.income_source:
            amount = flt(row.income)
            is_recurring = row.recur
            freq = getattr(row, 'recur_frequency', None)
            date_time = getdate(row.date_time) if getattr(row, 'date_time', None) else today
            stop_date = getdate(row.stop_date) if getattr(row, 'stop_date', None) else None
            
            if is_recurring:
                if (date_time <= today) and (not stop_date or today <= stop_date):
                    freq_map = {
                        'daily': 30,
                        'weekly': 4.33,
                        'bi-weekly': 2.17,
                        'monthly': 1,
                        'quarterly': 1/3,
                        'semi-annually': 1/6,
                        'annually': 1/12,
                        'yearly': 1/12
                    }
                    factor = freq_map.get(str(freq).lower(), 1)
                    monthly_amount = amount * factor
                    total_monthly_income += monthly_amount
            else:
                if date_time.month == current_month and date_time.year == current_year:
                    total_monthly_income += amount
        
        income_doc.monthly_income = total_monthly_income

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

def create_ledger_entries(income_doc, source):
    """
    Create ledger entries for an income source
    - For recurring income: Create entries based on frequency until stop_date or current date
    - For one-time income: Create a single entry
    """
    try:
        amount = flt(source.income)
        is_recurring = source.recur
        freq = source.recur_frequency
        start_date = getdate(source.date_time)
        stop_date = getdate(source.stop_date) if source.stop_date else None
        today = getdate()
        
        if is_recurring:
            # Calculate frequency in days
            freq_days = {
                'daily': 1,
                'weekly': 7,
                'bi-weekly': 14,
                'monthly': 30,
                'quarterly': 90,
                'semi-annually': 180,
                'annually': 365,
                'yearly': 365
            }.get(str(freq).lower(), 30)
            
            # For recurring income without stop date, create entries until current date
            end_date = stop_date if stop_date else today
            
            # Create entries until end_date
            current_date = start_date
            while current_date <= end_date:
                # Only create ledger entry if it's in the past or today
                if current_date <= today:
                    income_doc.append("income_ledger", {
                        "income_source": source.name,
                        "income_type": "recurring",
                        "date_time": current_date,
                        "amount": amount
                    })
                current_date += timedelta(days=freq_days)
        else:
            # Create single entry for one-time income
            income_doc.append("income_ledger", {
                "income_source": source.name,
                "income_type": "one-time",
                "date_time": start_date,
                "amount": amount
            })
            
    except Exception as e:
        frappe.log_error(f"Error creating ledger entries: {str(e)}")
        frappe.throw(_("Failed to create ledger entries: {0}").format(str(e)))

@frappe.whitelist()
def update_recurring_ledger_entries():
    """
    Update ledger entries for recurring income sources without stop dates
    This should be called periodically (e.g., daily) to ensure ledger entries are up to date
    """
    try:
        # Get all income records
        income_records = frappe.get_all(
            "Income",
            fields=["name"]
        )
        
        for record in income_records:
            income_doc = frappe.get_doc("Income", record.name)
            updated = False
            
            # Check each source
            for source in income_doc.income_source:
                if source.recur and not source.stop_date:
                    # Get the latest ledger entry for this source
                    latest_entry = frappe.get_all(
                        "Income Ledger",
                        filters={
                            "parent": income_doc.name,
                            "income_source": source.name
                        },
                        fields=["date_time"],
                        order_by="date_time desc",
                        limit=1
                    )
                    
                    if latest_entry:
                        latest_date = getdate(latest_entry[0].date_time)
                        today = getdate()
                        
                        # If the latest entry is not today, create new entries
                        if latest_date < today:
                            create_ledger_entries(income_doc, source)
                            updated = True
            
            # Save if any updates were made
            if updated:
                income_doc.save()
                
        return {"status": "success", "message": "Recurring ledger entries updated"}
        
    except Exception as e:
        frappe.log_error(f"Error updating recurring ledger entries: {str(e)}")
        frappe.throw(_("Failed to update recurring ledger entries: {0}").format(str(e)))


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
        analytics = get_user_income(filters={'period': 'last_6_months'}, include_analytics=True)
        analytics_data = analytics.get('analytics', {})
        
        insights = []
        recommendations = []
        
        # Calculate scores
        recurring_percentage = 0
        if analytics_data["total_income"] > 0:
            recurring_percentage = (analytics_data["recurring_income"] / analytics_data["total_income"]) * 100
        
        stability_score = min(100, recurring_percentage * 1.2)
        
        source_count = len(analytics_data["income_by_type"])
        diversification_score = min(100, source_count * 25)
        
        # Calculate growth rate
        trends = analytics_data["monthly_trends"]
        growth_rate = 0
        if len(trends) >= 2:
            recent_avg = sum(t["total"] for t in trends[-2:]) / 2
            older_avg = sum(t["total"] for t in trends[:2]) / 2 if len(trends) >= 4 else recent_avg
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