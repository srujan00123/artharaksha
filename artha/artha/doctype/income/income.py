# Copyright (c) 2025, srujan and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import flt, getdate
from datetime import timedelta
from dateutil.relativedelta import relativedelta
import calendar


class Income(Document):
    """
    Income Document for Household Profiles

    Structure:
    - One income document per household profile
    - Monthly income amount
    - Income sources stored in child table
    - Income ledger entries automatically generated from sources
    """

    def validate(self):
        """
        Validate the income document before saving
        """
        # Calculate total monthly income from sources
        self.calculate_monthly_income()

    def on_update(self):
        """
        After update, recreate all ledger entries based on current sources
        """
        self.recreate_ledger_entries()

    def calculate_monthly_income(self):
        """
        Calculate monthly income from all income sources
        """
        total_monthly = 0

        for source in self.income_source:
            if source.recur:
                # For recurring income, use the amount directly
                total_monthly += flt(source.income)
            # One-time income is not included in monthly calculation

        self.monthly_income = total_monthly

    def recreate_ledger_entries(self):
        """
        Recreate all ledger entries based on current income sources
        """
        try:
            # Clear all existing ledger entries for this income document
            self.clear_ledger_entries()

            # Create new ledger entries for all sources
            for source in self.income_source:
                self.create_ledger_entries_for_source(source)

        except Exception as e:
            frappe.log_error(
                f"Error recreating ledger entries for {self.name}: {str(e)}")
            frappe.throw(f"Failed to recreate ledger entries: {str(e)}")

    def clear_ledger_entries(self):
        """
        Clear all existing ledger entries for this income document
        """
        # Clear child table
        self.income_ledger = []

        # Also delete from database to ensure consistency
        frappe.db.delete("Income Ledger", {"parent": self.name})

    def create_ledger_entries_for_source(self, source):
        """
        Create ledger entries for a single income source
        """
        try:
            amount = flt(source.income)
            is_recurring = source.recur
            freq = source.recur_frequency
            start_date = getdate(source.date_time)
            stop_date = getdate(source.stop_date) if source.stop_date else None
            today = getdate()

            if is_recurring:
                # For recurring income without stop date, create entries until current date
                end_date = stop_date if stop_date else today

                # Create entries based on frequency until end_date
                current_date = start_date

                while current_date <= end_date:
                    # Only create ledger entry if it's in the past or today
                    if current_date <= today:
                        self.append("income_ledger", {
                            "income_source": source.name,
                            "income_type": "recurring",
                            "date_time": current_date,
                            "amount": amount
                        })

                    # Calculate next occurrence based on frequency
                    current_date = self.get_next_occurrence(current_date, freq)

                    # Safety check to prevent infinite loops
                    if current_date <= getdate(source.date_time):
                        frappe.log_error(
                            f"Invalid date progression for source {source.name}")
                        break
            else:
                # Create single entry for one-time income
                self.append("income_ledger", {
                    "income_source": source.name,
                    "income_type": "one-time",
                    "date_time": start_date,
                    "amount": amount
                })

        except Exception as e:
            frappe.log_error(
                f"Error creating ledger entries for source {source.name}: {str(e)}")
            frappe.throw(
                f"Failed to create ledger entries for source {source.name}: {str(e)}")

    def get_next_occurrence(self, current_date, frequency):
        """
        Calculate the next occurrence date based on frequency
        """
        freq = str(frequency).lower()

        if freq == 'daily':
            return current_date + timedelta(days=1)

        elif freq == 'weekly':
            # Same day of week, next week
            return current_date + timedelta(weeks=1)

        elif freq == 'bi-weekly':
            # Same day of week, every 2 weeks
            return current_date + timedelta(weeks=2)

        elif freq == 'monthly':
            # Same day of month, next month
            # Handle month-end dates properly (e.g., Jan 31 -> Feb 28/29)
            next_date = current_date + relativedelta(months=1)
            return next_date

        elif freq == 'quarterly':
            # Same day, 3 months later
            return current_date + relativedelta(months=3)

        elif freq == 'semi-annually':
            # Same day, 6 months later
            return current_date + relativedelta(months=6)

        elif freq in ['annually', 'yearly']:
            # Same day, next year
            return current_date + relativedelta(years=1)

        else:
            # Default to monthly if frequency is unknown
            frappe.log_error(
                f"Unknown frequency: {frequency}, defaulting to monthly")
            return current_date + relativedelta(months=1)

    def update_recurring_ledgers(self):
        """
        Update ledger entries for recurring income sources without stop dates
        Called by scheduled job to add new entries for ongoing recurring income
        """
        try:
            updated = False
            today = getdate()

            for source in self.income_source:
                if source.recur and not source.stop_date:
                    # Get the latest ledger entry for this source
                    latest_entries = [
                        entry for entry in self.income_ledger
                        if entry.income_source == source.name
                    ]

                    if latest_entries:
                        # Sort by date and get the most recent
                        latest_entries.sort(key=lambda x: getdate(
                            x.date_time), reverse=True)
                        latest_date = getdate(latest_entries[0].date_time)

                        # Add new entries from the next occurrence until today
                        current_date = self.get_next_occurrence(
                            latest_date, source.recur_frequency)

                        while current_date <= today:
                            self.append("income_ledger", {
                                "income_source": source.name,
                                "income_type": "recurring",
                                "date_time": current_date,
                                "amount": flt(source.income)
                            })
                            updated = True
                            current_date = self.get_next_occurrence(
                                current_date, source.recur_frequency)

                    else:
                        # No entries exist, create them from start date
                        self.create_ledger_entries_for_source(source)
                        updated = True

            if updated:
                self.save()

        except Exception as e:
            frappe.log_error(
                f"Error updating recurring ledgers for {self.name}: {str(e)}")


def get_permission_query_conditions_for_income(user):
    """
    Return query conditions to filter income based on user's household profile
    """
    if not user:
        user = frappe.session.user

    # System Manager and Administrator can see all income records
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
        # If user has no household profiles, they can't see any income records
        return "1=0"

    # Return condition to filter by household profiles linked to the user
    household_condition = " OR ".join(
        [f"`tabIncome`.`household_profile` = '{profile}'" for profile in household_profiles])
    return f"({household_condition})"


def has_permission(doc, user=None, ptype=None):
    """
    Check if user has permission to access the income document
    """
    if not user:
        user = frappe.session.user

    # System Manager and Administrator have all permissions
    if "System Manager" in frappe.get_roles(user) or user == "Administrator":
        return True

    # For new documents (no doc.name), allow creation if user has valid household profile
    if not doc.name:
        return bool(frappe.get_all("Household Profile", filters={"user": user}, limit=1))

    # Check if the income belongs to user's household profile
    if hasattr(doc, 'household_profile'):
        household_profile = doc.household_profile
    else:
        household_profile = frappe.db.get_value(
            "Income", doc.name, "household_profile")

    if household_profile:
        # Check if user is linked to this household profile
        profile_user = frappe.db.get_value(
            "Household Profile", household_profile, "user")
        return profile_user == user

    return False
