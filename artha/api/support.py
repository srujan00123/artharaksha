"""
Support API
Provides endpoints for care support management including health conditions,
welfare schemes, insurance schemes, support pathways, household profile management,
scheme applications, and claims management
"""

import frappe
from frappe import _
from frappe.utils import flt, getdate, now_datetime
from datetime import datetime, timedelta
import json


@frappe.whitelist()
def get_health_conditions():
    """
    Get all available health conditions
    """
    try:
        health_conditions = frappe.get_all(
            "Health Condition",
            fields=[
                "name", "condition_name", "condition_type", 
                "default_severity", "default_duration", 
                "creation", "modified"
            ],
            order_by="condition_name"
        )
        
        return health_conditions
        
    except Exception as e:
        frappe.log_error(f"Error fetching health conditions: {str(e)}")
        frappe.throw(_("Failed to fetch health conditions"))


@frappe.whitelist()
def get_welfare_schemes(filters=None):
    """
    Get welfare schemes with optional filtering by type or target groups
    """
    try:
        # Parse filters if provided
        if isinstance(filters, str):
            filters = json.loads(filters)
        
        if not filters:
            filters = {}
        
        # Build query conditions
        conditions = {}
        
        # Apply type filter
        if filters.get('type'):
            conditions["type"] = filters['type']
        
        # Get welfare schemes
        welfare_schemes = frappe.get_all(
            "Welfare Scheme",
            filters=conditions,
            fields=[
                "name", "scheme_name", "type", "coverage_amount",
                "amount_range", "amount_min", "amount_max",
                "description", "apply_link", "creation", "modified"
            ],
            order_by="scheme_name"
        )
        
        # Get related data for each scheme
        for scheme in welfare_schemes:
            # Get target groups
            scheme.target_groups = frappe.get_all(
                "Target Group Child",
                filters={"parent": scheme.name},
                fields=["target_group"],
                order_by="idx"
            )
            
            # Get eligibility criteria
            scheme.scheme_eligibility = frappe.get_all(
                "Scheme Eligibility",
                filters={"parent": scheme.name},
                fields=["description"],
                order_by="idx"
            )
            
            # Get benefits
            scheme.scheme_benefit = frappe.get_all(
                "Scheme Benefit",
                filters={"parent": scheme.name},
                fields=["description"],
                order_by="idx"
            )
            
            # Get required documents
            scheme.scheme_document = frappe.get_all(
                "Scheme Document",
                filters={"parent": scheme.name},
                fields=["description"],
                order_by="idx"
            )
        
        return welfare_schemes
        
    except Exception as e:
        frappe.log_error(f"Error fetching welfare schemes: {str(e)}")
        frappe.throw(_("Failed to fetch welfare schemes"))


@frappe.whitelist()
def get_insurance_schemes(filters=None):
    """
    Get insurance schemes with optional filtering by type
    """
    try:
        # Parse filters if provided
        if isinstance(filters, str):
            filters = json.loads(filters)
        
        if not filters:
            filters = {}
        
        # Build query conditions
        conditions = {}
        
        # Apply type filter
        if filters.get('type'):
            conditions["type"] = filters['type']
        
        # Get insurance schemes
        insurance_schemes = frappe.get_all(
            "Insurance Scheme",
            filters=conditions,
            fields=[
                "name", "scheme_name", "type", "coverage_amount",
                "amount_range", "amount_min", "amount_max",
                "description", "apply_url", "creation", "modified"
            ],
            order_by="scheme_name"
        )
        
        # Get related data for each scheme
        for scheme in insurance_schemes:
            # Get target groups
            scheme.target_groups = frappe.get_all(
                "Target Group Child",
                filters={"parent": scheme.name},
                fields=["target_group"],
                order_by="idx"
            )
            
            # Get eligibility criteria
            scheme.scheme_eligibility = frappe.get_all(
                "Scheme Eligibility",
                filters={"parent": scheme.name},
                fields=["description"],
                order_by="idx"
            )
            
            # Get benefits
            scheme.scheme_benefits = frappe.get_all(
                "Scheme Benefit",
                filters={"parent": scheme.name},
                fields=["description"],
                order_by="idx"
            )
            
            # Get required documents
            scheme.scheme_documents = frappe.get_all(
                "Scheme Document",
                filters={"parent": scheme.name},
                fields=["description"],
                order_by="idx"
            )
            
            # Add scheme source for unified handling
            scheme.scheme_source = "insurance"
        
        return insurance_schemes
        
    except Exception as e:
        frappe.log_error(f"Error fetching insurance schemes: {str(e)}")
        frappe.throw(_("Failed to fetch insurance schemes"))


@frappe.whitelist()
def get_all_schemes(filters=None):
    """
    Get both welfare schemes and insurance schemes in a unified format
    """
    try:
        # Parse filters if provided
        if isinstance(filters, str):
            filters = json.loads(filters)
        
        if not filters:
            filters = {}
        
        all_schemes = []
        
        # Get welfare schemes
        welfare_schemes = get_welfare_schemes(filters)
        for scheme in welfare_schemes:
            scheme.scheme_source = "welfare"
            # Normalize field names for unified handling
            if scheme.get('apply_link'):
                scheme.apply_url = scheme.apply_link
            # Normalize child table field names
            if scheme.get('scheme_benefit'):
                scheme.scheme_benefits = scheme.scheme_benefit
            if scheme.get('scheme_document'):
                scheme.scheme_documents = scheme.scheme_document
        all_schemes.extend(welfare_schemes)
        
        # Get insurance schemes
        insurance_schemes = get_insurance_schemes(filters)
        all_schemes.extend(insurance_schemes)
        
        # Sort by scheme name
        all_schemes.sort(key=lambda x: x.get('scheme_name', ''))
        
        return all_schemes
        
    except Exception as e:
        frappe.log_error(f"Error fetching all schemes: {str(e)}")
        frappe.throw(_("Failed to fetch schemes"))


@frappe.whitelist()
def get_support_pathways(filters=None):
    """
    Get support pathways with optional filtering
    """
    try:
        # Parse filters if provided
        if isinstance(filters, str):
            filters = json.loads(filters)
        
        if not filters:
            filters = {}
        
        # Get support pathways
        support_pathways = frappe.get_all(
            "Support Pathway",
            fields=[
                "name", "title", "description", 
                "creation", "modified"
            ],
            order_by="title"
        )
        
        # Get related data for each pathway
        for pathway in support_pathways:
            # Get target groups
            pathway.target_groups = frappe.get_all(
                "Target Group Child",
                filters={"parent": pathway.name},
                fields=["target_group"],
                order_by="idx"
            )
            
            # Get support benefits
            pathway.benefits = frappe.get_all(
                "Support Benefit",
                filters={"parent": pathway.name},
                fields=["benefit_name", "description"],
                order_by="idx"
            )
        
        return support_pathways
        
    except Exception as e:
        frappe.log_error(f"Error fetching support pathways: {str(e)}")
        frappe.throw(_("Failed to fetch support pathways"))


@frappe.whitelist()
def get_household_profile():
    """
    Get the current user's household profile with health conditions
    """
    try:
        # Get user's household profile
        household_profile = frappe.get_doc(
            "Household Profile", 
            {"user": frappe.session.user}
        )
        
        if not household_profile:
            return None
        
        # Convert to dict and get health conditions
        profile_data = household_profile.as_dict()
        
        # Get detailed health condition information
        if profile_data.get('health_conditions'):
            for condition in profile_data['health_conditions']:
                # Get the health condition details
                health_condition = frappe.get_doc("Health Condition", condition.condition)
                condition.condition_details = health_condition.as_dict()
        
        return profile_data
        
    except frappe.DoesNotExistError:
        return None
    except Exception as e:
        frappe.log_error(f"Error fetching household profile: {str(e)}")
        frappe.throw(_("Failed to fetch household profile"))


@frappe.whitelist()
def update_health_conditions(health_conditions):
    """
    Update health conditions for the current user's household profile
    """
    try:
        # Parse health conditions if provided as string
        if isinstance(health_conditions, str):
            health_conditions = json.loads(health_conditions)
        
        # Get user's household profile
        household_profile = frappe.get_doc(
            "Household Profile", 
            {"user": frappe.session.user}
        )
        
        if not household_profile:
            frappe.throw(_("Household profile not found"))
        
        # Clear existing health conditions
        household_profile.health_conditions = []
        
        # Add new health conditions
        for condition_data in health_conditions:
            household_profile.append("health_conditions", {
                "condition": condition_data.get("condition"),
                "severity": condition_data.get("severity"),
                "duration_override": condition_data.get("duration_override"),
                "notes": condition_data.get("notes", "")
            })
        
        household_profile.save()
        
        return {"success": True, "message": "Health conditions updated successfully"}
        
    except Exception as e:
        frappe.log_error(f"Error updating health conditions: {str(e)}")
        frappe.throw(_("Failed to update health conditions"))


@frappe.whitelist()
def get_scheme_applications():
    """
    Get scheme applications for the current user
    """
    try:
        # Get user's household profile
        household_profile = frappe.get_doc(
            "Household Profile", 
            {"user": frappe.session.user}
        )
        
        if not household_profile:
            return []
        
        # Get scheme applications from household profile
        applications = []
        if household_profile.scheme_applications:
            for app in household_profile.scheme_applications:
                app_data = app.as_dict()
                
                # Get scheme details if not custom
                if not app_data.get('custom_scheme') and app_data.get('scheme_reference'):
                    try:
                        if app_data.get('scheme_type') == 'Welfare Scheme':
                            scheme = frappe.get_doc("Welfare Scheme", app_data['scheme_reference'])
                        else:
                            scheme = frappe.get_doc("Insurance Scheme", app_data['scheme_reference'])
                        
                        app_data['scheme_details'] = {
                            'scheme_name': scheme.scheme_name,
                            'type': scheme.type,
                            'coverage_amount': scheme.coverage_amount,
                            'description': scheme.description
                        }
                    except:
                        pass
                
                applications.append(app_data)
        
        return applications
        
    except frappe.DoesNotExistError:
        return []
    except Exception as e:
        frappe.log_error(f"Error fetching scheme applications: {str(e)}")
        frappe.throw(_("Failed to fetch scheme applications"))


@frappe.whitelist()
def create_scheme_application(application_data):
    """
    Create a new scheme application
    """
    try:
        # Parse application data if provided as string
        if isinstance(application_data, str):
            application_data = json.loads(application_data)
        
        # Get user's household profile
        household_profile = frappe.get_doc(
            "Household Profile", 
            {"user": frappe.session.user}
        )
        
        if not household_profile:
            frappe.throw(_("Household profile not found"))
        
        # Add new application
        household_profile.append("scheme_applications", {
            "scheme_type": application_data.get("scheme_type"),
            "scheme_reference": application_data.get("scheme_reference"),
            "custom_scheme": application_data.get("custom_scheme", 0),
            "custom_scheme_type": application_data.get("custom_scheme_type"),
            "custom_scheme_name": application_data.get("custom_scheme_name"),
            "custom_coverage_amount": application_data.get("custom_coverage_amount"),
            "description": application_data.get("description", ""),
            "date_applied": getdate(),
            "documents_submitted": application_data.get("documents_submitted", [])
        })
        
        household_profile.save()
        
        return {"success": True, "message": "Application submitted successfully"}
        
    except Exception as e:
        frappe.log_error(f"Error creating scheme application: {str(e)}")
        frappe.throw(_("Failed to create scheme application"))


@frappe.whitelist()
def update_scheme_application(application_name, application_data):
    """
    Update an existing scheme application
    """
    try:
        # Parse application data if provided as string
        if isinstance(application_data, str):
            application_data = json.loads(application_data)
        
        # Get user's household profile
        household_profile = frappe.get_doc(
            "Household Profile", 
            {"user": frappe.session.user}
        )
        
        if not household_profile:
            frappe.throw(_("Household profile not found"))
        
        # Find and update the application
        for app in household_profile.scheme_applications:
            if app.name == application_name:
                for key, value in application_data.items():
                    if hasattr(app, key):
                        setattr(app, key, value)
                break
        else:
            frappe.throw(_("Application not found"))
        
        household_profile.save()
        
        return {"success": True, "message": "Application updated successfully"}
        
    except Exception as e:
        frappe.log_error(f"Error updating scheme application: {str(e)}")
        frappe.throw(_("Failed to update scheme application"))


@frappe.whitelist()
def get_scheme_claims():
    """
    Get scheme claims for the current user
    """
    try:
        # Get user's household profile
        household_profile = frappe.get_doc(
            "Household Profile", 
            {"user": frappe.session.user}
        )
        
        if not household_profile:
            return []
        
        # Get scheme claims from household profile
        claims = []
        if household_profile.scheme_claims:
            for claim in household_profile.scheme_claims:
                claim_data = claim.as_dict()
                
                # Get scheme details if not custom
                if not claim_data.get('is_custom') and claim_data.get('scheme_reference'):
                    try:
                        if claim_data.get('scheme_type') == 'Welfare Scheme':
                            scheme = frappe.get_doc("Welfare Scheme", claim_data['scheme_reference'])
                        else:
                            scheme = frappe.get_doc("Insurance Scheme", claim_data['scheme_reference'])
                        
                        claim_data['scheme_details'] = {
                            'scheme_name': scheme.scheme_name,
                            'type': scheme.type,
                            'coverage_amount': scheme.coverage_amount,
                            'description': scheme.description
                        }
                    except:
                        pass
                
                claims.append(claim_data)
        
        return claims
        
    except frappe.DoesNotExistError:
        return []
    except Exception as e:
        frappe.log_error(f"Error fetching scheme claims: {str(e)}")
        frappe.throw(_("Failed to fetch scheme claims"))


@frappe.whitelist()
def create_scheme_claim(claim_data):
    """
    Create a new scheme claim
    """
    try:
        # Parse claim data if provided as string
        if isinstance(claim_data, str):
            claim_data = json.loads(claim_data)
        
        # Get user's household profile
        household_profile = frappe.get_doc(
            "Household Profile", 
            {"user": frappe.session.user}
        )
        
        if not household_profile:
            frappe.throw(_("Household profile not found"))
        
        # Add new claim
        household_profile.append("scheme_claims", {
            "is_custom": claim_data.get("is_custom", 0),
            "scheme_type": claim_data.get("scheme_type"),
            "scheme_reference": claim_data.get("scheme_reference"),
            "custom_scheme_name": claim_data.get("custom_scheme_name"),
            "custom_scheme_type": claim_data.get("custom_scheme_type"),
            "claim_amount": claim_data.get("claim_amount"),
            "custom": claim_data.get("status", "submitted"),
            "claim_date": getdate(),
            "approved_amount": claim_data.get("approved_amount"),
            "documents_submitted": claim_data.get("documents_submitted", [])
        })
        
        household_profile.save()
        
        return {"success": True, "message": "Claim submitted successfully"}
        
    except Exception as e:
        frappe.log_error(f"Error creating scheme claim: {str(e)}")
        frappe.throw(_("Failed to create scheme claim"))


@frappe.whitelist()
def update_scheme_claim(claim_name, claim_data):
    """
    Update an existing scheme claim
    """
    try:
        # Parse claim data if provided as string
        if isinstance(claim_data, str):
            claim_data = json.loads(claim_data)
        
        # Get user's household profile
        household_profile = frappe.get_doc(
            "Household Profile", 
            {"user": frappe.session.user}
        )
        
        if not household_profile:
            frappe.throw(_("Household profile not found"))
        
        # Find and update the claim
        for claim in household_profile.scheme_claims:
            if claim.name == claim_name:
                for key, value in claim_data.items():
                    if hasattr(claim, key):
                        setattr(claim, key, value)
                break
        else:
            frappe.throw(_("Claim not found"))
        
        household_profile.save()
        
        return {"success": True, "message": "Claim updated successfully"}
        
    except Exception as e:
        frappe.log_error(f"Error updating scheme claim: {str(e)}")
        frappe.throw(_("Failed to update scheme claim"))


@frappe.whitelist()
def get_eligible_schemes():
    """
    Get welfare and insurance schemes that the current user might be eligible for
    based on their household profile
    """
    try:
        # Get user's household profile
        household_profile = frappe.get_doc(
            "Household Profile", 
            {"user": frappe.session.user}
        )
        
        if not household_profile:
            return []
        
        # Get all schemes (both welfare and insurance)
        all_schemes = get_all_schemes()
        
        eligible_schemes = []
        
        for scheme in all_schemes:
            # Get eligibility criteria
            eligibility_criteria = scheme.get('scheme_eligibility', [])
            
            # For now, do basic eligibility check based on household profile
            # Since we only have description field, we'll use simple heuristics
            is_eligible = True
            eligibility_status = []
            
            # Basic eligibility checks based on common criteria
            user_income = flt(household_profile.annual_income or 0)
            
            # Income-based eligibility (most government schemes have income limits)
            if scheme.get('type') == "Government":
                income_eligible = user_income <= 200000  # Basic threshold
                eligibility_status.append({
                    "criteria": "Annual Income",
                    "required": "≤ ₹2,00,000",
                    "current": f"₹{user_income:,.0f}",
                    "met": income_eligible
                })
                if not income_eligible:
                    is_eligible = False
            
            # Vulnerability status check
            if household_profile.vulnerability_status:
                eligibility_status.append({
                    "criteria": "Vulnerability Status",
                    "required": "Applicable",
                    "current": "Yes",
                    "met": True
                })
            
            # Ration card holder check
            if household_profile.ration_card_holder:
                eligibility_status.append({
                    "criteria": "Ration Card",
                    "required": "Applicable",
                    "current": "Yes",
                    "met": True
                })
            
            # CHE indicators
            if household_profile.che_10:
                eligibility_status.append({
                    "criteria": "CHE 10%",
                    "required": "Applicable",
                    "current": "Yes",
                    "met": True
                })
            
            if household_profile.che_25:
                eligibility_status.append({
                    "criteria": "CHE 25%",
                    "required": "Applicable", 
                    "current": "Yes",
                    "met": True
                })
            
            # Add eligibility criteria descriptions if available
            for criterion in eligibility_criteria:
                if criterion.get('description'):
                    eligibility_status.append({
                        "criteria": "Additional Criteria",
                        "required": criterion['description'],
                        "current": "Check manually",
                        "met": None  # Cannot auto-determine
                    })
            
            # Add scheme with eligibility information
            scheme_info = scheme.copy()
            scheme_info.update({
                "is_eligible": is_eligible,
                "eligibility_status": eligibility_status,
                "eligibility_score": sum(1 for status in eligibility_status if status["met"]) / len(eligibility_status) if eligibility_status else 0
            })
            
            eligible_schemes.append(scheme_info)
        
        # Sort by eligibility score (most eligible first)
        eligible_schemes.sort(key=lambda x: x["eligibility_score"], reverse=True)
        
        return eligible_schemes
        
    except frappe.DoesNotExistError:
        return []
    except Exception as e:
        frappe.log_error(f"Error fetching eligible schemes: {str(e)}")
        frappe.throw(_("Failed to fetch eligible schemes"))


@frappe.whitelist()
def get_support_recommendations():
    """
    Get personalized support recommendations based on user's health conditions
    and household profile, including both welfare and insurance schemes
    """
    try:
        # Get user's household profile
        household_profile = frappe.get_doc(
            "Household Profile", 
            {"user": frappe.session.user}
        )
        
        if not household_profile:
            return {
                "health_based_support": [],
                "income_based_support": [],
                "insurance_recommendations": [],
                "general_support": []
            }
        
        recommendations = {
            "health_based_support": [],
            "income_based_support": [],
            "insurance_recommendations": [],
            "general_support": []
        }
        
        # Get health-based support pathways
        if household_profile.health_conditions:
            condition_types = []
            for condition in household_profile.health_conditions:
                health_condition = frappe.get_doc("Health Condition", condition.condition)
                condition_types.append(health_condition.condition_type)
            
            # Get relevant support pathways
            all_pathways = frappe.get_all(
                "Support Pathway",
                fields=["name", "title", "description"]
            )
            
            for pathway in all_pathways:
                # Get pathway benefits that might be relevant
                benefits = frappe.get_all(
                    "Support Benefit",
                    filters={"parent": pathway.name},
                    fields=["benefit_name", "description"]
                )
                
                pathway.benefits = benefits
                recommendations["health_based_support"].append(pathway)
        
        # Get income-based recommendations (welfare schemes)
        annual_income = flt(household_profile.annual_income or 0)
        if annual_income < 200000:  # Low income threshold
            low_income_schemes = frappe.get_all(
                "Welfare Scheme",
                filters={"type": "Government"},
                fields=["name", "scheme_name", "description", "apply_link"],
                limit=5
            )
            for scheme in low_income_schemes:
                scheme.scheme_source = "welfare"
                if scheme.get('apply_link'):
                    scheme.apply_url = scheme.apply_link
            recommendations["income_based_support"] = low_income_schemes
        
        # Get insurance recommendations
        insurance_schemes = frappe.get_all(
            "Insurance Scheme",
            fields=["name", "scheme_name", "description", "apply_url", "coverage_amount"],
            limit=5
        )
        for scheme in insurance_schemes:
            scheme.scheme_source = "insurance"
        recommendations["insurance_recommendations"] = insurance_schemes
        
        # Get general support pathways
        general_pathways = frappe.get_all(
            "Support Pathway",
            fields=["name", "title", "description"],
            limit=3
        )
        
        for pathway in general_pathways:
            benefits = frappe.get_all(
                "Support Benefit",
                filters={"parent": pathway.name},
                fields=["benefit_name", "description"]
            )
            pathway.benefits = benefits
        
        recommendations["general_support"] = general_pathways
        
        return recommendations
        
    except frappe.DoesNotExistError:
        return {
            "health_based_support": [],
            "income_based_support": [],
            "insurance_recommendations": [],
            "general_support": []
        }
    except Exception as e:
        frappe.log_error(f"Error fetching support recommendations: {str(e)}")
        frappe.throw(_("Failed to fetch support recommendations"))


@frappe.whitelist()
def delete_scheme_application(application_name):
    """
    Delete a scheme application from the user's household profile
    """
    try:
        # Get user's household profile
        household_profile = frappe.get_doc(
            "Household Profile", 
            {"user": frappe.session.user}
        )
        
        if not household_profile:
            frappe.throw(_("Household profile not found"))
        
        # Find and remove the application
        application_found = False
        for i, app in enumerate(household_profile.scheme_applications):
            if app.name == application_name:
                household_profile.scheme_applications.pop(i)
                application_found = True
                break
        
        if not application_found:
            frappe.throw(_("Application not found"))
        
        household_profile.save()
        
        return {"success": True, "message": "Application deleted successfully"}
        
    except Exception as e:
        frappe.log_error(f"Error deleting scheme application: {str(e)}")
        frappe.throw(_("Failed to delete scheme application"))


@frappe.whitelist()
def delete_scheme_claim(claim_name):
    """
    Delete a scheme claim from the user's household profile
    """
    try:
        # Get user's household profile
        household_profile = frappe.get_doc(
            "Household Profile", 
            {"user": frappe.session.user}
        )
        
        if not household_profile:
            frappe.throw(_("Household profile not found"))
        
        # Find and remove the claim
        claim_found = False
        for i, claim in enumerate(household_profile.scheme_claims):
            if claim.name == claim_name:
                household_profile.scheme_claims.pop(i)
                claim_found = True
                break
        
        if not claim_found:
            frappe.throw(_("Claim not found"))
        
        household_profile.save()
        
        return {"success": True, "message": "Claim deleted successfully"}
        
    except Exception as e:
        frappe.log_error(f"Error deleting scheme claim: {str(e)}")
        frappe.throw(_("Failed to delete scheme claim")) 