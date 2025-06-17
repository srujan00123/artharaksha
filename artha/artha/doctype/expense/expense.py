# Copyright (c) 2025, srujan and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import flt
from typing import Dict, List, Any, Optional, Union


class Expense(Document):
    """
    Expense Document for Household Profiles

    Structure:
    - One expense document per household profile
    - Medical expenses stored in child table
    - Other expenses stored in child table
    - Monthly expense calculated from all expenses
    """

    def validate(self) -> None:
        """
        Validate the expense document before saving
        Following the income doctype pattern
        """
        # Calculate total monthly expense from all sources
        self.calculate_monthly_expense()

        # Validate child table entries
        self.validate_medical_expenses()
        self.validate_other_expenses()

    def calculate_monthly_expense(self) -> None:
        """
        Calculate monthly expense from all expense entries
        This is for summary purposes and CHE calculations
        """
        total_monthly = 0

        # Add medical expenses
        for med_expense in self.medical_expenses:
            total_monthly += flt(med_expense.amount)

        # Add other expenses
        for other_expense in self.other_expenses:
            total_monthly += flt(other_expense.amount)

        self.monthly_expense = total_monthly

    def validate_medical_expenses(self) -> None:
        """
        Validate medical expense entries
        """
        for med_expense in self.medical_expenses:
            if not med_expense.medical_expense_type:
                frappe.throw(
                    "Medical expense type is required for all medical expenses")

            if flt(med_expense.amount) <= 0:
                frappe.throw(
                    "Amount must be greater than 0 for all medical expenses")

            # Ensure is_direct is properly set (default to True if not specified)
            if med_expense.is_direct is None:
                med_expense.is_direct = 1

    def validate_other_expenses(self) -> None:
        """
        Validate other expense entries
        """
        for other_expense in self.other_expenses:
            if not other_expense.expense_type:
                frappe.throw("Expense type is required for all other expenses")

            if flt(other_expense.amount) <= 0:
                frappe.throw(
                    "Amount must be greater than 0 for all other expenses")

    def get_medical_expense_summary(self) -> Dict[str, float]:
        """
        Get summary of medical expenses
        Returns breakdown of direct vs indirect medical expenses
        """
        direct_medical = 0
        indirect_medical = 0

        for med_expense in self.medical_expenses:
            amount = flt(med_expense.amount)
            if med_expense.is_direct:
                direct_medical += amount
            else:
                indirect_medical += amount

        return {
            "total_medical": direct_medical + indirect_medical,
            "direct_medical": direct_medical,
            "indirect_medical": indirect_medical
        }

    def get_expense_by_category(self) -> Dict[str, float]:
        """
        Get expenses grouped by category
        """
        category_breakdown = {}

        # Medical expenses
        for med_expense in self.medical_expenses:
            category = med_expense.medical_expense_type or "Unknown"
            if category not in category_breakdown:
                category_breakdown[category] = 0
            category_breakdown[category] += flt(med_expense.amount)

        # Other expenses
        for other_expense in self.other_expenses:
            category = other_expense.expense_type or "Unknown"
            if category not in category_breakdown:
                category_breakdown[category] = 0
            category_breakdown[category] += flt(other_expense.amount)

        return category_breakdown

    def get_total_expenses(self) -> float:
        """
        Get total expenses across all categories
        """
        total = 0

        # Medical expenses
        for med_expense in self.medical_expenses:
            total += flt(med_expense.amount)

        # Other expenses
        for other_expense in self.other_expenses:
            total += flt(other_expense.amount)

        return total


def get_permission_query_conditions_for_expense(user: Optional[str]) -> str:
    """
    Return query conditions to filter expenses based on user's household profile
    Following the income doctype pattern
    """
    if not user:
        user = frappe.session.user

    # System Manager and Administrator can see all expenses
    if "System Manager" in frappe.get_roles(user) or user == "Administrator":
        return ""

    # Get user's household profiles using the proper user field
    household_profiles = frappe.get_all(
        "Household Profile",
        filters={"user": user},
        fields=["name"],
        pluck="name"
    )

    if not household_profiles:
        # If user has no household profiles, they can't see any expenses
        return "1=0"

    # Return condition to filter by household profiles linked to the user
    household_condition = " OR ".join(
        [f"`tabExpense`.`household_profile` = '{profile}'" for profile in household_profiles])
    return f"({household_condition})"


def has_permission(doc: Any, user: Optional[str] = None, ptype: Optional[str] = None) -> bool:
    """
    Check if user has permission to access the expense document
    Following the income doctype pattern
    """
    if not user:
        user = frappe.session.user

    # System Manager and Administrator have all permissions
    if "System Manager" in frappe.get_roles(user) or user == "Administrator":
        return True

    # For new documents (no doc.name), allow creation if user has valid household profile
    if not doc.name:
        return bool(frappe.get_all("Household Profile", filters={"user": user}, limit=1))

    # Check if the expense belongs to user's household profile
    if hasattr(doc, 'household_profile'):
        household_profile = doc.household_profile
    else:
        household_profile = frappe.db.get_value(
            "Expense", doc.name, "household_profile")

    if household_profile:
        # Check if user is linked to this household profile
        profile_user = frappe.db.get_value(
            "Household Profile", household_profile, "user")
        return profile_user == user

    return False
