"""
Income API
Provides specialized endpoints for income management and analysis
"""

import frappe
from frappe import _
from frappe.utils import flt, getdate, now_datetime, random_string
from datetime import datetime, timedelta
import json
from frappe.auth import LoginManager


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
            # Legacy format support
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
            # New format - direct date range
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
                    "date_time", "recur_frequency"
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
            
            # Apply date filters to sources if specified
            if (start_date or end_date) and income_sources:
                filtered_sources = []
                for source in income_sources:
                    source_date = getdate(source.date_time) if source.date_time else getdate(record.creation)
                    
                    if start_date and source_date < start_date:
                        continue
                    if end_date and source_date > end_date:
                        continue
                    
                    filtered_sources.append(source)
                income_sources = filtered_sources
            
            # Only include records that have matching sources after filtering
            if income_sources or not any([
                filters.get('type'), filters.get('incomeType'), filters.get('frequency'), 
                filters.get('isRecurring') is not None, filters.get('amountMin'), 
                filters.get('amountMax'), filters.get('searchTerm')
            ]):
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


# Keep get_income_analytics as a wrapper for backward compatibility
@frappe.whitelist()
def get_income_analytics(period="last_3_months", filters=None):
    """
    DEPRECATED: Use get_user_income with include_analytics=True instead
    Get comprehensive income analytics for specified period with filtering
    """
    if isinstance(filters, str):
        filters = json.loads(filters)
    
    if not filters:
        filters = {}
    
    filters['period'] = period
    
    result = get_user_income(filters=filters, include_analytics=True)
    return result.get('analytics', {})


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
def create_or_update_income(monthly_income, income_source, income_name=None):
    """
    Create or update income record with sources
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
        
        # Create or update income record
        if income_name:
            # Update existing record
            income_doc = frappe.get_doc("Income", income_name)
            income_doc.monthly_income = flt(monthly_income)
            
            # Clear existing income sources
            income_doc.income_source = []
        else:
            # Create new record
            income_doc = frappe.new_doc("Income")
            income_doc.household_profile = household_profile
            income_doc.monthly_income = flt(monthly_income)
        
        # Add income sources
        for source in income_source:
            income_doc.append("income_source", {
                "type": source.get("type"),
                "income": flt(source.get("income")),
                "recur": source.get("recur", False),
                "date_time": source.get("date_time") or now_datetime(),
                "recur_frequency": source.get("recur_frequency")
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
        analytics = get_income_analytics("last_6_months")
        
        insights = []
        recommendations = []
        
        # Calculate scores
        recurring_percentage = 0
        if analytics["total_income"] > 0:
            recurring_percentage = (analytics["recurring_income"] / analytics["total_income"]) * 100
        
        stability_score = min(100, recurring_percentage * 1.2)
        
        source_count = len(analytics["income_by_type"])
        diversification_score = min(100, source_count * 25)
        
        # Calculate growth rate
        trends = analytics["monthly_trends"]
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