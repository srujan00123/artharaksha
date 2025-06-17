# Copyright (c) 2025, srujan and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import flt, getdate
from datetime import timedelta
from dateutil.relativedelta import relativedelta
from typing import Dict, List, Any, Optional, Union, Set


class Income(Document):
    """
    Income Document for Household Profiles

    Structure:
    - One income document per household profile
    - Monthly income amount calculated from recurring sources
    - Income sources stored in child table
    - Income ledger entries automatically generated from sources
    """

    def validate(self) -> None:
        """
        Validate the income document before saving
        """
        # Validate that all income sources are marked as recurring
        self.validate_income_sources()

        # Calculate total monthly income from recurring sources only
        self.calculate_monthly_income()

    def on_update(self) -> None:
        """
        After update, create ledger entries for new recurring sources only
        """
        # Only create ledger entries for new recurring sources
        self.create_ledger_entries_for_new_sources()

    def validate_income_sources(self) -> None:
        """
        Validate that all income sources are properly configured for recurring income
        One-time income should not be in income_source table
        """
        for source in self.income_source:
            if not source.recur:
                frappe.throw(
                    f"Income source '{source.type}' must be recurring. "
                    "One-time income should be added directly to ledger using API."
                )
            if not source.recur_frequency:
                frappe.throw(
                    f"Recurring income source '{source.type}' must have a frequency specified."
                )

    def calculate_monthly_income(self) -> None:
        """
        Calculate monthly income from recurring income sources only
        All sources in income_source table are recurring by design
        One-time income does not count towards monthly income
        """
        total_monthly = 0
        for source in self.income_source:
            # All sources in this table are recurring by design
            total_monthly += flt(source.income)
        self.monthly_income = total_monthly

    def add_direct_ledger_entry(self, income_type: str, amount: float, date_time: str, description: str = "") -> str:
        """
        Add a direct ledger entry for one-time income without creating an income source
        This method is called by the API for one-time income
        """
        try:
            entry = self.append("income_ledger", {
                "income_source": None,  # No source for direct entries
                "income_type": "one-time",
                "date_time": date_time,
                "amount": flt(amount),
                "source_type": income_type,
                "description": description or f"One-time {income_type} income"
            })

            # Save the document to persist the new entry
            self.save()

            return entry.name

        except Exception as e:
            frappe.log_error(
                f"Error adding direct ledger entry to {self.name}: {str(e)}")
            frappe.throw(
                f"Failed to add direct ledger entry: {str(e)}")

    def create_ledger_entries_for_new_sources(self) -> None:
        """
        Create ledger entries only for new recurring sources that don't have any ledger entries yet
        Only recurring sources (income_source table) generate automatic ledger entries
        One-time income goes directly to ledger without creating a source
        """
        try:
            # Get existing ledger source names (excluding None for direct entries)
            existing_ledger_sources: Set[str] = {
                entry.income_source for entry in self.income_ledger
                if entry.income_source  # Exclude direct entries with no source
            }

            # Process each recurring source (all sources in income_source are recurring)
            for source in self.income_source:
                if source.name not in existing_ledger_sources:
                    # This is a new recurring source, create initial ledger entries
                    self.create_initial_recurring_entries(source)

        except Exception as e:
            frappe.log_error(
                f"Error creating ledger entries for new sources in {self.name}: {str(e)}")
            frappe.throw(
                f"Failed to create ledger entries for new sources: {str(e)}")

    def create_initial_recurring_entries(self, source: Any) -> None:
        """
        Create initial ledger entries for a new recurring source
        Only creates entries from start date to today (or stop date if earlier)
        """
        try:
            amount = flt(source.income)
            start_date = getdate(source.date_time)
            today = getdate()
            stop_date = getdate(
                source.stop_date) if source.stop_date else today

            # Get all dates for this recurring income
            dates = self.get_recurring_dates(start_date, min(
                stop_date, today), source.recur_frequency)

            # Create ledger entries for each date
            for entry_date in dates:
                self.append("income_ledger", {
                    "income_source": source.name,
                    "income_type": "recurring",
                    "date_time": entry_date,
                    "amount": amount,
                    "source_type": source.type,
                    "description": f"Recurring {source.type} income"
                })

        except Exception as e:
            frappe.log_error(
                f"Error creating initial recurring entries for source {source.name}: {str(e)}")
            frappe.throw(
                f"Failed to create initial recurring entries for source {source.name}: {str(e)}")

    def get_recurring_dates(self, start_date: Any, end_date: Any, frequency: str) -> Set[Any]:
        """
        Get all dates for recurring income within the date range
        """
        dates: Set[Any] = set()
        current_date = start_date

        while current_date <= end_date:
            dates.add(current_date)
            current_date = self.get_next_occurrence(current_date, frequency)

            # Safety check
            if current_date <= start_date:
                break

        return dates

    def get_next_occurrence(self, current_date: Any, frequency: str) -> Any:
        """
        Calculate the next occurrence date based on frequency
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

    def update_future_recurring_entries(self) -> None:
        """
        Add new ledger entries for ongoing recurring income (called by scheduler)
        """
        try:
            updated = False
            today = getdate()

            for source in self.income_source:
                if source.recur and not source.stop_date:
                    # Get latest entry for this source
                    source_entries = [
                        entry for entry in self.income_ledger
                        if entry.income_source == source.name
                    ]

                    if source_entries:
                        latest_date = max(getdate(entry.date_time)
                                          for entry in source_entries)
                        next_date = self.get_next_occurrence(
                            latest_date, source.recur_frequency)

                        # Add entries from next_date to today
                        while next_date <= today:
                            self.append("income_ledger", {
                                "income_source": source.name,
                                "income_type": "recurring",
                                "date_time": next_date,
                                "amount": flt(source.income),
                                "source_type": source.type,
                                "description": f"Recurring {source.type} income"
                            })
                            updated = True
                            next_date = self.get_next_occurrence(
                                next_date, source.recur_frequency)
                    else:
                        # No entries exist, create from start
                        self.create_initial_recurring_entries(source)
                        updated = True

            if updated:
                self.save()

        except Exception as e:
            frappe.log_error(
                f"Error updating future recurring entries for {self.name}: {str(e)}")


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
