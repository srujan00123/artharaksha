# Copyright (c) 2025, srujan and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import flt
from typing import Dict, Any, Optional

# Import utility functions
from artha.utils.income_utils import calculate_monthly_income_from_sources


class Income(Document):
    """
    Income Document for Household Profiles

    Structure:
    - One income document per household profile
    - Monthly income amount calculated from recurring sources
    - Income sources stored in child table
    - Income ledger entries managed via API only

    Note: All ledger operations are handled by the API to ensure consistency
    """

    def validate(self) -> None:
        """
        Basic validation only - all business logic handled by API
        """
        # Ensure only one Income record per household profile
        self.validate_unique_household_profile()

        # Calculate total monthly income from recurring sources
        self.calculate_monthly_income()

    def validate_unique_household_profile(self) -> None:
        """
        Ensure only one Income record exists per household profile
        """
        if not self.household_profile:
            frappe.throw("Household Profile is required for Income record")

        # Check for existing Income records for this household profile
        existing_income = frappe.db.get_value(
            "Income",
            {
                "household_profile": self.household_profile,
                # Exclude current record if updating
                "name": ["!=", self.name or ""]
            },
            "name"
        )

        if existing_income:
            frappe.throw(
                f"An Income record already exists for this household profile. "
                f"Only one Income record is allowed per household. "
                f"Please add income sources to the existing record: {existing_income}"
            )

    def calculate_monthly_income(self) -> None:
        """
        Calculate monthly income from recurring income sources using utility function
        All sources in income_source table are recurring by design
        """
        # Convert sources to dictionary format for utility function
        sources_data = []
        for source in self.income_source:
            sources_data.append({
                'recur': True,  # All sources in this table are recurring
                'income': source.income
            })

        self.monthly_income = calculate_monthly_income_from_sources(
            sources_data)


def get_permission_query_conditions_for_income(user: Optional[str]) -> str:
    """
    Return query conditions to filter income based on user's household profile
    """
    if not user:
        user = frappe.session.user

    # System Manager and Administrator can see all income records
    if "System Manager" in frappe.get_roles(user) or user == "Administrator":
        return ""

    # Get user's household profiles
    household_profiles = frappe.get_all(
        "Household Profile",
        filters={"user": user},
        fields=["name"],
        pluck="name"
    )

    if not household_profiles:
        return "1=0"

    # Return condition to filter by household profiles
    household_condition = " OR ".join(
        [f"`tabIncome`.`household_profile` = '{profile}'" for profile in household_profiles])
    return f"({household_condition})"


def has_permission(doc: Any, user: Optional[str] = None, ptype: Optional[str] = None) -> bool:
    """
    Check if user has permission to access the income document
    """
    if not user:
        user = frappe.session.user

    # System Manager and Administrator have all permissions
    if "System Manager" in frappe.get_roles(user) or user == "Administrator":
        return True

    # For new documents, allow creation if user has valid household profile
    if not doc.name:
        return bool(frappe.get_all("Household Profile", filters={"user": user}, limit=1))

    # Check if the income belongs to user's household profile
    if hasattr(doc, 'household_profile'):
        household_profile = doc.household_profile
    else:
        household_profile = frappe.db.get_value(
            "Income", doc.name, "household_profile")

    if household_profile:
        profile_user = frappe.db.get_value(
            "Household Profile", household_profile, "user")
        return profile_user == user

    return False
