"""
Expense API
Provides comprehensive endpoints for expense management, analysis, and CHE calculations
Following the architecture patterns from income.py and support.py
"""

import frappe
from frappe import _
from frappe.utils import flt, getdate, now_datetime
from datetime import datetime, timedelta
import json


@frappe.whitelist()
def get_expense_types():
    """
    Get all available expense types (medical and other)
    Returns predefined categories following WHO CHE guidelines
    """
    try:
        # Medical expense categories following WHO CHE guidelines
        medical_types = [
            # Direct Medical Expenses
            {"name": "consultation", "expense_type": "Consultation", "category": "Direct", "is_direct": True},
            {"name": "diagnostics", "expense_type": "Diagnostics", "category": "Direct", "is_direct": True},
            {"name": "medicines", "expense_type": "Medicines", "category": "Direct", "is_direct": True},
            {"name": "hospitalization", "expense_type": "Hospitalization", "category": "Direct", "is_direct": True},
            
            # Indirect Medical Expenses
            {"name": "travel", "expense_type": "Travel", "category": "Indirect", "is_direct": False},
            {"name": "accommodation", "expense_type": "Accommodation", "category": "Indirect", "is_direct": False},
            {"name": "wage_loss", "expense_type": "Wage Loss", "category": "Indirect", "is_direct": False},
            
            # Other Medical
            {"name": "other_medical", "expense_type": "Other Medical", "category": "Direct", "is_direct": True}
        ]
        
        # Other expense categories for non-medical expenses
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
def get_detailed_breakdown(period="last_3_months", filters=None):
    """
    Get comprehensive detailed breakdown analysis for CHE/medical expenses
    Returns detailed analytics, insights, and recommendations
    """
    try:
        # Get user's household profile using user field
        household_profile = frappe.db.get_value(
            "Household Profile", 
            {"user": frappe.session.user}, 
            "name"
        )
        
        if not household_profile:
            return _get_empty_breakdown_response(period)
        
        # Parse filters if provided
        if isinstance(filters, str):
            filters = json.loads(filters)
        
        if not filters:
            filters = {}
        
        # Calculate date range
        period_info = _calculate_period_range(period, filters)
        
        # Get expense data
        expense_data = _get_expense_data_for_period(household_profile, period_info)
        
        # Calculate summary statistics
        summary = _calculate_summary_statistics(expense_data, period_info)
        
        # Calculate CHE analysis
        che_analysis = calculate_che_analysis(household_profile, summary['medical_expenses'], period)
        
        # Generate category breakdown
        category_breakdown = _generate_category_breakdown(expense_data)
        
        # Generate monthly trends
        monthly_trends = _generate_monthly_trends(expense_data, period_info)
        
        # Get top expenses
        top_expenses = _get_top_expenses(expense_data)
        
        # Generate insights and recommendations
        insights = _generate_expense_insights(summary, che_analysis, category_breakdown)
        
        return {
            "period": period_info,
            "summary": summary,
            "che_analysis": che_analysis,
            "category_breakdown": category_breakdown,
            "monthly_trends": monthly_trends,
            "top_expenses": top_expenses,
            "insights": insights
        }
        
    except Exception as e:
        frappe.log_error(f"Error getting detailed breakdown: {str(e)}")
        frappe.throw(_("Failed to get detailed breakdown"))


def _get_empty_breakdown_response(period):
    """Return empty response when no household profile found"""
    return {
        "period": {
            "label": period.replace('_', ' ').title(),
            "start_date": "",
            "end_date": "",
            "days": 0
        },
        "summary": {
            "total_expenses": 0,
            "medical_expenses": 0,
            "other_expenses": 0,
            "direct_medical": 0,
            "indirect_medical": 0,
            "expense_count": 0,
            "average_per_day": 0,
            "average_per_expense": 0
        },
        "che_analysis": {
            "che_10": False,
            "che_25": False,
            "che_40": False,
            "che_ratio": 0,
            "risk_level": "unknown",
            "risk_score": 0,
            "recommendation": "Please set up your household profile for CHE analysis",
            "annual_income": 0,
            "annualized_medical": 0,
            "per_capita_income": 0,
            "medical_burden_category": "unknown",
            "financial_protection_status": "unknown",
            "who_che_thresholds": {
                "che_10_threshold": 0,
                "che_25_threshold": 0,
                "che_40_threshold": 0
            },
            "comparative_analysis": {
                "national_average": 0,
                "income_group_average": 0,
                "comparison_status": "unknown"
            },
            "recommendations": []
        },
        "category_breakdown": {"medical": [], "other": []},
        "monthly_trends": [],
        "top_expenses": [],
        "insights": []
    }


def _calculate_period_range(period, filters):
    """Calculate date range for the specified period"""
    today = getdate()
    
    if period == "custom" and filters.get("start_date") and filters.get("end_date"):
        start_date = getdate(filters["start_date"])
        end_date = getdate(filters["end_date"])
    elif period == "this_month":
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
    else:
        start_date = today.replace(day=1)
        end_date = today
    
    days = (end_date - start_date).days + 1
    
    return {
        "label": period.replace('_', ' ').title(),
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "days": days
    }


def _get_expense_data_for_period(household_profile, period_info):
    """Get all expense data for the specified period"""
    start_date = getdate(period_info["start_date"])
    end_date = getdate(period_info["end_date"])
    
    # Get expense records in date range
    expense_records = frappe.get_all(
        "Expense",
        filters={
            "household_profile": household_profile,
            "creation": ["between", [start_date, end_date]]
        },
        fields=["name", "creation"]
    )
    
    all_expenses = []
    
    for record in expense_records:
        # Get the full expense document to access child tables
        expense_doc = frappe.get_doc("Expense", record.name)
        
        # Process medical expenses from child table
        for med_exp in expense_doc.get("medical_expenses", []):
            all_expenses.append({
                "id": f"{record.name}-medical-{med_exp.idx}",
                "type": "medical",
                "category": med_exp.medical_expense_type or "Unknown",
                "amount": flt(med_exp.amount or 0),
                "date": med_exp.date_time or record.creation,
                "description": med_exp.description or "",
                "is_direct": getattr(med_exp, 'is_direct', True),
                "parent": record.name,
                "creation": record.creation
            })
        
        # Process other expenses from child table
        for other_exp in expense_doc.get("other_expenses", []):
            all_expenses.append({
                "id": f"{record.name}-other-{other_exp.idx}",
                "type": "other",
                "category": other_exp.expense_type or "Unknown",
                "amount": flt(other_exp.amount or 0),
                "date": other_exp.date_time or record.creation,
                "description": other_exp.description or "",
                "is_direct": None,
                "parent": record.name,
                "creation": record.creation
            })
    
    return all_expenses


def _calculate_summary_statistics(expense_data, period_info):
    """Calculate summary statistics for the expense data"""
    total_expenses = sum(exp["amount"] for exp in expense_data)
    medical_expenses = sum(exp["amount"] for exp in expense_data if exp["type"] == "medical")
    other_expenses = sum(exp["amount"] for exp in expense_data if exp["type"] == "other")
    direct_medical = sum(exp["amount"] for exp in expense_data if exp["type"] == "medical" and exp.get("is_direct", True))
    indirect_medical = sum(exp["amount"] for exp in expense_data if exp["type"] == "medical" and not exp.get("is_direct", True))
    expense_count = len(expense_data)
    
    days = period_info["days"] or 1
    average_per_day = total_expenses / days if days > 0 else 0
    average_per_expense = total_expenses / expense_count if expense_count > 0 else 0
    
    return {
        "total_expenses": total_expenses,
        "medical_expenses": medical_expenses,
        "other_expenses": other_expenses,
        "direct_medical": direct_medical,
        "indirect_medical": indirect_medical,
        "expense_count": expense_count,
        "average_per_day": average_per_day,
        "average_per_expense": average_per_expense
    }


def _generate_category_breakdown(expense_data):
    """Generate category breakdown with trends"""
    medical_categories = {}
    other_categories = {}
    
    for expense in expense_data:
        category = expense["category"]
        amount = expense["amount"]
        
        if expense["type"] == "medical":
            if category not in medical_categories:
                medical_categories[category] = {
                    "category": category,
                    "amount": 0,
                    "count": 0,
                    "is_direct": expense.get("is_direct", True),
                    "che_category": "direct_medical" if expense.get("is_direct", True) else "indirect_medical"
                }
            medical_categories[category]["amount"] += amount
            medical_categories[category]["count"] += 1
        else:
            if category not in other_categories:
                other_categories[category] = {
                    "category": category,
                    "amount": 0,
                    "count": 0,
                    "che_category": "non_medical"
                }
            other_categories[category]["amount"] += amount
            other_categories[category]["count"] += 1
    
    # Calculate percentages and add trend data
    total_medical = sum(cat["amount"] for cat in medical_categories.values())
    total_other = sum(cat["amount"] for cat in other_categories.values())
    
    for category in medical_categories.values():
        category["percentage"] = (category["amount"] / total_medical * 100) if total_medical > 0 else 0
        category["trend"] = "stable"  # TODO: Calculate actual trend
        category["trend_percentage"] = 0
    
    for category in other_categories.values():
        category["percentage"] = (category["amount"] / total_other * 100) if total_other > 0 else 0
        category["trend"] = "stable"  # TODO: Calculate actual trend
        category["trend_percentage"] = 0
    
    return {
        "medical": list(medical_categories.values()),
        "other": list(other_categories.values())
    }


def _generate_monthly_trends(expense_data, period_info):
    """Generate monthly trend data"""
    monthly_data = {}
    
    for expense in expense_data:
        expense_date = getdate(expense["date"])
        month_key = expense_date.strftime("%Y-%m")
        
        if month_key not in monthly_data:
            monthly_data[month_key] = {
                "month": expense_date.strftime("%b"),
                "year": expense_date.year,
                "total": 0,
                "medical": 0,
                "other": 0,
                "direct": 0,
                "indirect": 0,
                "expense_count": 0
            }
        
        monthly_data[month_key]["total"] += expense["amount"]
        monthly_data[month_key]["expense_count"] += 1
        
        if expense["type"] == "medical":
            monthly_data[month_key]["medical"] += expense["amount"]
            if expense.get("is_direct", True):
                monthly_data[month_key]["direct"] += expense["amount"]
            else:
                monthly_data[month_key]["indirect"] += expense["amount"]
        else:
            monthly_data[month_key]["other"] += expense["amount"]
    
    # Add CHE ratio calculation for each month
    for month_data in monthly_data.values():
        # TODO: Get monthly income for accurate CHE calculation
        month_data["che_ratio"] = 0  # Placeholder
    
    return sorted(monthly_data.values(), key=lambda x: f"{x['year']}-{x['month']}")


def _get_top_expenses(expense_data, limit=10):
    """Get top expenses by amount"""
    sorted_expenses = sorted(expense_data, key=lambda x: x["amount"], reverse=True)
    total_amount = sum(exp["amount"] for exp in expense_data)
    
    top_expenses = []
    for expense in sorted_expenses[:limit]:
        top_expenses.append({
            "id": expense["id"],
            "category": expense["category"],
            "amount": expense["amount"],
            "date": expense["date"],
            "description": expense["description"],
            "type": expense["type"],
            "is_direct": expense.get("is_direct"),
            "percentage_of_total": (expense["amount"] / total_amount * 100) if total_amount > 0 else 0
        })
    
    return top_expenses


def _generate_expense_insights(summary, che_analysis, category_breakdown):
    """Generate insights and recommendations based on expense analysis"""
    insights = []
    
    # CHE Risk Insights
    if che_analysis["che_25"]:
        insights.append({
            "type": "error",
            "title": "High CHE Risk",
            "message": f"Your medical expenses ({che_analysis['che_ratio']:.1f}%) exceed 25% of income, indicating catastrophic health expenditure.",
            "action": {
                "label": "Find Support Programs",
                "route": "/care-support/programs"
            }
        })
    elif che_analysis["che_10"]:
        insights.append({
            "type": "warning",
            "title": "Moderate CHE Risk",
            "message": f"Your medical expenses ({che_analysis['che_ratio']:.1f}%) are significant. Consider health insurance options.",
            "action": {
                "label": "Browse Insurance",
                "route": "/care-support/programs"
            }
        })
    
    # Category Insights
    medical_categories = category_breakdown["medical"]
    if medical_categories:
        top_medical_category = max(medical_categories, key=lambda x: x["amount"])
        if top_medical_category["percentage"] > 50:
            insights.append({
                "type": "info",
                "title": "High Category Concentration",
                "message": f"{top_medical_category['category']} accounts for {top_medical_category['percentage']:.1f}% of your medical expenses.",
                "action": {
                    "label": "View Categories",
                    "route": "/expenses/categories"
                }
            })
    
    # Expense Pattern Insights
    if summary["expense_count"] > 0:
        avg_expense = summary["average_per_expense"]
        if avg_expense > 5000:  # High average expense
            insights.append({
                "type": "info",
                "title": "High Average Expenses",
                "message": f"Your average expense is ₹{avg_expense:.0f}. Consider tracking smaller expenses for better insights.",
                "action": {
                    "label": "Add Expense",
                    "route": "/expenses/overview"
                }
            })
    
    return insights


# Remove the custom get_user_expenses function - use standard CRUD instead


@frappe.whitelist()
def get_expense_analytics(period="last_3_months", filters=None):
    """
    Get comprehensive expense analytics for specified period with medical/other breakdown
    """
    try:
        # Get user's household profile using user field
        household_profile = frappe.db.get_value(
            "Household Profile", 
            {"user": frappe.session.user}, 
            "name"
        )
        
        if not household_profile:
            return {
                "total_expenses": 0,
                "medical_expenses": 0,
                "other_expenses": 0,
                "direct_medical": 0,
                "indirect_medical": 0,
                "expense_by_category": {},
                "monthly_trends": [],
                "che_analysis": {},
                "period": period,
                "start_date": "",
                "end_date": ""
            }
        
        # Parse filters if provided
        if isinstance(filters, str):
            filters = json.loads(filters)
        
        if not filters:
            filters = {}
        
        # Calculate date range based on period
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
        else:
            start_date = today.replace(day=1)
            end_date = today
        
        # Get expense records in date range
        expense_records = frappe.get_all(
            "Expense",
            filters={
                "household_profile": household_profile,
                "creation": ["between", [start_date, end_date]]
            },
            fields=["name", "creation"]
        )
        
        total_expenses = 0
        medical_expenses = 0
        other_expenses = 0
        direct_medical = 0
        indirect_medical = 0
        expense_by_category = {}
        monthly_data = {}
        
        for record in expense_records:
            month_key = record.creation.strftime("%Y-%m")
            if month_key not in monthly_data:
                monthly_data[month_key] = {
                    "total": 0,
                    "medical": 0,
                    "other": 0,
                    "direct": 0,
                    "indirect": 0
                }
            
            # Get the full expense document to access child tables
            expense_doc = frappe.get_doc("Expense", record.name)
            
            # Process medical expenses from child table
            for med_exp in expense_doc.get("medical_expenses", []):
                amount = flt(med_exp.amount or 0)
                category = med_exp.medical_expense_type or "Unknown"
                
                total_expenses += amount
                medical_expenses += amount
                monthly_data[month_key]["total"] += amount
                monthly_data[month_key]["medical"] += amount
                
                # Direct vs Indirect categorization
                if med_exp.is_direct if med_exp.is_direct is not None else True:
                    direct_medical += amount
                    monthly_data[month_key]["direct"] += amount
                else:
                    indirect_medical += amount
                    monthly_data[month_key]["indirect"] += amount
                
                # Category breakdown
                if category not in expense_by_category:
                    expense_by_category[category] = 0
                expense_by_category[category] += amount
            
            # Process other expenses from child table
            for other_exp in expense_doc.get("other_expenses", []):
                amount = flt(other_exp.amount or 0)
                category = other_exp.expense_type or "Unknown"
                
                total_expenses += amount
                other_expenses += amount
                monthly_data[month_key]["total"] += amount
                monthly_data[month_key]["other"] += amount
                
                # Category breakdown
                if category not in expense_by_category:
                    expense_by_category[category] = 0
                expense_by_category[category] += amount
        
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
        
        # Calculate CHE analysis
        che_analysis = calculate_che_analysis(household_profile, medical_expenses, period)
        
        return {
            "total_expenses": total_expenses,
            "medical_expenses": medical_expenses,
            "other_expenses": other_expenses,
            "direct_medical": direct_medical,
            "indirect_medical": indirect_medical,
            "expense_by_category": expense_by_category,
            "monthly_trends": monthly_trends,
            "che_analysis": che_analysis,
            "period": period,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        }
        
    except Exception as e:
        frappe.log_error(f"Error getting expense analytics: {str(e)}")
        frappe.throw(_("Failed to get expense analytics"))


def calculate_che_analysis(household_profile, medical_expenses, period):
    """
    Calculate Comprehensive Catastrophic Health Expenditure (CHE) analysis
    Following WHO guidelines and international standards
    """
    try:
        # Initialize default values
        annual_income = 0
        household_size = 1
        profile_exists = False
        
        # Try to get household profile data
        if household_profile:
            try:
                profile_doc = frappe.get_doc("Household Profile", household_profile)
                annual_income = flt(profile_doc.annual_income or 0)
                household_size = flt(profile_doc.family_member_count or 1)
                profile_exists = True
            except frappe.DoesNotExistError:
                frappe.log_error(f"Household Profile {household_profile} not found")
        
        # If no profile or no income data, try to get current user's profile
        if not profile_exists or annual_income <= 0:
            try:
                # Try to find any household profile for current user
                profiles = frappe.get_all("Household Profile", 
                                        filters={"user": frappe.session.user}, 
                                        fields=["name", "annual_income", "family_member_count"],
                                        limit=1)
                if profiles:
                    profile = profiles[0]
                    annual_income = flt(profile.annual_income or 0)
                    household_size = flt(profile.family_member_count or 1)
                    profile_exists = True
            except Exception as e:
                frappe.log_error(f"Error fetching user household profile: {str(e)}")
        
        # Calculate period multiplier for annualizing expenses
        period_multipliers = {
            "this_month": 12,
            "last_month": 12,
            "last_3_months": 4,
            "last_6_months": 2,
            "this_year": 1,
            "custom": 1  # Assume yearly for custom periods
        }
        
        multiplier = period_multipliers.get(period, 1)
        annualized_medical = medical_expenses * multiplier
        
        # If still no income data, provide estimated analysis based on medical expenses
        if annual_income <= 0:
            # Estimate income based on medical expenses and provide conservative analysis
            # This is a fallback to still provide some meaningful insights
            estimated_income = max(annualized_medical * 4, 100000)  # Assume medical is at most 25% of income
            
            # Determine risk level based on medical expenses alone
            if annualized_medical > 50000:
                risk_level = "high"
                risk_score = 75
                che_assumption = True
            elif annualized_medical > 25000:
                risk_level = "moderate" 
                risk_score = 50
                che_assumption = True
            elif annualized_medical > 10000:
                risk_level = "low"
                risk_score = 25
                che_assumption = True
            else:
                risk_level = "minimal"
                risk_score = 10
                che_assumption = False
            
            return {
                "che_10": che_assumption,  # Conservative assumption based on medical expenses
                "che_25": annualized_medical > 25000,  # If medical > 25k, likely high burden
                "che_40": annualized_medical > 50000,  # If medical > 50k, likely critical
                "che_ratio": 0,  # Can't calculate without income
                "risk_level": risk_level,
                "risk_score": risk_score,
                "recommendation": f"Please update your household profile with income information for accurate CHE analysis. Your annualized medical expenses (₹{annualized_medical:,.0f}) suggest {risk_level} financial burden.",
                "annual_income": 0,
                "annualized_medical": round(annualized_medical, 2),
                "per_capita_income": 0,
                "medical_burden_category": f"{risk_level}_burden",
                "financial_protection_status": "unknown",
                "who_che_thresholds": {
                    "che_10_threshold": 0,
                    "che_25_threshold": 0,
                    "che_40_threshold": 0
                },
                "comparative_analysis": {
                    "national_average": 3.5,
                    "income_group_average": 0,
                    "comparison_status": "unknown"
                },
                "recommendations": [
                    "URGENT: Set up your household profile with accurate income information for proper CHE analysis",
                    f"Your medical expenses of ₹{annualized_medical:,.0f} annually require financial planning",
                    "Consider applying for government health insurance schemes (Ayushman Bharat)",
                    "Explore community health programs and financial assistance options",
                    "Build an emergency health fund for unexpected medical expenses",
                    "Consult with healthcare financing advisors for personalized recommendations"
                ]
            }
        
        # Calculate per capita income
        per_capita_income = annual_income / household_size if household_size > 0 else annual_income
        
        # Calculate CHE ratios based on WHO thresholds
        che_ratio = (annualized_medical / annual_income) * 100 if annual_income > 0 else 0
        che_10 = che_ratio >= 10  # WHO threshold for catastrophic expenditure
        che_25 = che_ratio >= 25  # WHO threshold for impoverishing expenditure
        che_40 = che_ratio >= 40  # Extreme financial hardship threshold
        
        # Calculate WHO CHE thresholds in absolute terms
        che_10_threshold = annual_income * 0.10
        che_25_threshold = annual_income * 0.25
        che_40_threshold = annual_income * 0.40
        
        # Determine comprehensive risk level and score
        risk_score = 0
        if che_ratio >= 40:
            risk_level = "critical"
            risk_score = 100
        elif che_ratio >= 25:
            risk_level = "high"
            risk_score = 75
        elif che_ratio >= 10:
            risk_level = "moderate"
            risk_score = 50
        elif che_ratio >= 5:
            risk_level = "low"
            risk_score = 25
        else:
            risk_level = "minimal"
            risk_score = 10
        
        # Determine medical burden category
        if che_ratio >= 40:
            medical_burden_category = "extreme_burden"
        elif che_ratio >= 25:
            medical_burden_category = "high_burden"
        elif che_ratio >= 10:
            medical_burden_category = "moderate_burden"
        elif che_ratio >= 5:
            medical_burden_category = "low_burden"
        else:
            medical_burden_category = "minimal_burden"
        
        # Determine financial protection status
        if che_ratio >= 25:
            financial_protection_status = "unprotected"
        elif che_ratio >= 10:
            financial_protection_status = "partially_protected"
        else:
            financial_protection_status = "protected"
        
        # Generate comprehensive recommendations
        recommendations = []
        
        if che_40:
            recommendations.extend([
                "URGENT: Seek immediate financial assistance from government health schemes",
                "Apply for emergency medical aid programs",
                "Consider debt restructuring or financial counseling",
                "Explore community health insurance options"
            ])
        elif che_25:
            recommendations.extend([
                "Apply for government health insurance schemes (Ayushman Bharat, state schemes)",
                "Explore employer health insurance options",
                "Consider health savings accounts",
                "Look into medical loan options with favorable terms"
            ])
        elif che_10:
            recommendations.extend([
                "Consider purchasing health insurance",
                "Build an emergency health fund",
                "Explore preventive healthcare options",
                "Research government health schemes for future needs"
            ])
        else:
            recommendations.extend([
                "Maintain current financial health practices",
                "Consider building a health emergency fund",
                "Explore preventive healthcare investments"
            ])
        
        # Add income-specific recommendations
        if per_capita_income < 50000:  # Low income
            recommendations.append("Prioritize government health schemes and community health programs")
        elif per_capita_income < 200000:  # Middle income
            recommendations.append("Balance between government schemes and private insurance options")
        else:  # Higher income
            recommendations.append("Consider comprehensive private health insurance with high coverage")
        
        # Comparative analysis (placeholder - would need actual data)
        national_average_che = 3.5  # Example: India's average CHE ratio
        income_group_average = 0
        
        if per_capita_income < 50000:
            income_group_average = 8.2  # Low income group average
        elif per_capita_income < 200000:
            income_group_average = 4.1  # Middle income group average
        else:
            income_group_average = 2.3  # High income group average
        
        if che_ratio > income_group_average * 1.5:
            comparison_status = "above_average"
        elif che_ratio > income_group_average:
            comparison_status = "slightly_above_average"
        else:
            comparison_status = "below_average"
        
        # Generate main recommendation based on risk level
        main_recommendations = {
            "critical": f"CRITICAL: Your medical expenses ({che_ratio:.1f}%) indicate extreme financial hardship. Immediate intervention required.",
            "high": f"HIGH RISK: Your medical expenses ({che_ratio:.1f}%) exceed WHO's impoverishing threshold. Urgent financial protection needed.",
            "moderate": f"MODERATE RISK: Your medical expenses ({che_ratio:.1f}%) indicate catastrophic health expenditure. Consider health insurance options.",
            "low": f"LOW RISK: Your medical expenses ({che_ratio:.1f}%) are manageable but monitor for increases.",
            "minimal": f"MINIMAL RISK: Your medical expenses ({che_ratio:.1f}%) are well within safe limits."
        }
        
        return {
            "che_10": che_10,
            "che_25": che_25,
            "che_40": che_40,
            "che_ratio": round(che_ratio, 2),
            "risk_level": risk_level,
            "risk_score": risk_score,
            "recommendation": main_recommendations[risk_level],
            "annual_income": annual_income,
            "annualized_medical": round(annualized_medical, 2),
            "per_capita_income": round(per_capita_income, 2),
            "medical_burden_category": medical_burden_category,
            "financial_protection_status": financial_protection_status,
            "who_che_thresholds": {
                "che_10_threshold": round(che_10_threshold, 2),
                "che_25_threshold": round(che_25_threshold, 2),
                "che_40_threshold": round(che_40_threshold, 2)
            },
            "comparative_analysis": {
                "national_average": national_average_che,
                "income_group_average": income_group_average,
                "comparison_status": comparison_status
            },
            "recommendations": recommendations
        }
        
    except Exception as e:
        frappe.log_error(f"Error calculating comprehensive CHE analysis: {str(e)}")
        return {
            "che_10": False,
            "che_25": False,
            "che_40": False,
            "che_ratio": 0,
            "risk_level": "error",
            "risk_score": 0,
            "recommendation": f"Unable to calculate CHE analysis. Error: {str(e)}. Please check your profile data and try again.",
            "annual_income": 0,
            "annualized_medical": 0,
            "per_capita_income": 0,
            "medical_burden_category": "unknown",
            "financial_protection_status": "unknown",
            "who_che_thresholds": {
                "che_10_threshold": 0,
                "che_25_threshold": 0,
                "che_40_threshold": 0
            },
            "comparative_analysis": {
                "national_average": 0,
                "income_group_average": 0,
                "comparison_status": "unknown"
            },
            "recommendations": [
                "Please set up your household profile with income information",
                "Contact support if you continue to experience issues",
                "Try refreshing the page and checking your data"
            ]
        }


# Remove custom CRUD operations - use standard Frappe CRUD endpoints instead


@frappe.whitelist()
def get_monthly_summary(options=None):
    """
    Get monthly expense summary for dashboard and CHE analysis
    """
    try:
        # Parse options if provided
        if isinstance(options, str):
            options = json.loads(options)
        
        if not options:
            options = {}
        
        # Get user's household profile using user field
        household_profile = frappe.db.get_value(
            "Household Profile", 
            {"user": frappe.session.user}, 
            "name"
        )
        
        if not household_profile:
            return {
                "monthly_medical": 0,
                "monthly_other": 0,
                "monthly_total": 0,
                "direct_medical": 0,
                "indirect_medical": 0
            }
        
        # Get current month expenses
        today = getdate()
        month_start = today.replace(day=1)
        
        # Get this month's expense records
        expense_records = frappe.get_all(
            "Expense",
            filters={
                "household_profile": household_profile,
                "creation": ["between", [month_start, today]]
            },
            fields=["name"]
        )
        
        monthly_medical = 0
        monthly_other = 0
        direct_medical = 0
        indirect_medical = 0
        
        for record in expense_records:
            # Get the full expense document to access child tables
            expense_doc = frappe.get_doc("Expense", record.name)
            
            # Process medical expenses from child table
            for med_exp in expense_doc.get("medical_expenses", []):
                amount = flt(med_exp.amount or 0)
                monthly_medical += amount
                
                if med_exp.is_direct if med_exp.is_direct is not None else True:
                    direct_medical += amount
                else:
                    indirect_medical += amount
            
            # Process other expenses from child table
            for other_exp in expense_doc.get("other_expenses", []):
                monthly_other += flt(other_exp.amount or 0)
        
        return {
            "monthly_medical": monthly_medical,
            "monthly_other": monthly_other,
            "monthly_total": monthly_medical + monthly_other,
            "direct_medical": direct_medical,
            "indirect_medical": indirect_medical
        }
        
    except Exception as e:
        frappe.log_error(f"Error getting monthly summary: {str(e)}")
        frappe.throw(_("Failed to get monthly summary"))
