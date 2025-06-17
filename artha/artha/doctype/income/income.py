# Copyright (c) 2025, srujan and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document
from frappe.utils import flt, getdate
from datetime import timedelta
from dateutil.relativedelta import relativedelta


class Income(Document):
    """
    Income Document for Household Profiles

    Structure:
    - One income document per household profile
    - Monthly income amount calculated from recurring sources
    - Income sources stored in child table
    - Income ledger entries automatically generated from sources
    """

    def validate(self):
        """
        Validate the income document before saving
        """
        # Calculate total monthly income from recurring sources
        self.calculate_monthly_income()
        # Ensure ledger entries are synced with current sources
        self.sync_ledger_entries()

    def on_update(self):
        """
        After update, synchronize ledger entries with income sources
        """
        # Additional sync to handle any edge cases
        self.sync_ledger_entries()

    def calculate_monthly_income(self):
        """
        Calculate monthly income from recurring income sources only
        """
        total_monthly = 0
        for source in self.income_source:
            if source.recur:
                total_monthly += flt(source.income)
        self.monthly_income = total_monthly

    def sync_ledger_entries(self):
        """
        Synchronize ledger entries with current income sources
        - Remove ledger entries for deleted sources
        - Create/update ledger entries for current sources
        """
        try:
            # Get current source names
            current_source_names = {
                source.name for source in self.income_source}

            # Get existing ledger source names
            existing_ledger_sources = {
                entry.income_source for entry in self.income_ledger}

            # Remove ledger entries for deleted sources
            sources_to_remove = existing_ledger_sources - current_source_names
            if sources_to_remove:
                self.income_ledger = [
                    entry for entry in self.income_ledger
                    if entry.income_source not in sources_to_remove
                ]

            # Process each current source
            for source in self.income_source:
                self.ensure_ledger_entries_for_source(source)

        except Exception as e:
            frappe.log_error(
                f"Error syncing ledger entries for {self.name}: {str(e)}")
            frappe.throw(f"Failed to sync ledger entries: {str(e)}")

    def ensure_ledger_entries_for_source(self, source):
        """
        Ensure correct ledger entries exist for a source
        """
        try:
            # Get existing entries for this source
            existing_entries = [
                entry for entry in self.income_ledger
                if entry.income_source == source.name
            ]

            amount = flt(source.income)
            start_date = getdate(source.date_time)
            today = getdate()

            if source.recur:
                # For recurring income
                stop_date = getdate(
                    source.stop_date) if source.stop_date else today
                expected_dates = self.get_recurring_dates(
                    start_date, stop_date, source.recur_frequency)
                existing_dates = {getdate(entry.date_time)
                                  for entry in existing_entries}

                # Add missing entries
                for missing_date in expected_dates - existing_dates:
                    self.append("income_ledger", {
                        "income_source": source.name,
                        "income_type": "recurring",
                        "date_time": missing_date,
                        "amount": amount
                    })

                # Update existing entry amounts if changed
                for entry in existing_entries:
                    if flt(entry.amount) != amount:
                        entry.amount = amount

            else:
                # For one-time income - should have exactly one entry
                if not existing_entries:
                    self.append("income_ledger", {
                        "income_source": source.name,
                        "income_type": "one-time",
                        "date_time": start_date,
                        "amount": amount
                    })
                elif len(existing_entries) == 1:
                    # Update existing entry
                    entry = existing_entries[0]
                    entry.amount = amount
                    entry.date_time = start_date
                else:
                    # Remove extra entries, keep only one
                    for entry in existing_entries[1:]:
                        self.income_ledger.remove(entry)
                    # Update the remaining one
                    existing_entries[0].amount = amount
                    existing_entries[0].date_time = start_date

        except Exception as e:
            frappe.log_error(
                f"Error ensuring ledger entries for source {source.name}: {str(e)}")
            frappe.throw(
                f"Failed to ensure ledger entries for source {source.name}: {str(e)}")

    def get_recurring_dates(self, start_date, end_date, frequency):
        """
        Get all dates for recurring income within the date range
        """
        dates = set()
        current_date = start_date

        while current_date <= end_date:
            dates.add(current_date)
            current_date = self.get_next_occurrence(current_date, frequency)

            # Safety check
            if current_date <= start_date:
                break

        return dates

    def get_next_occurrence(self, current_date, frequency):
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

    def update_future_recurring_entries(self):
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
                                "amount": flt(source.income)
                            })
                            updated = True
                            next_date = self.get_next_occurrence(
                                next_date, source.recur_frequency)
                    else:
                        # No entries exist, create from start
                        self.ensure_ledger_entries_for_source(source)
                        updated = True

            if updated:
                self.save()

        except Exception as e:
            frappe.log_error(
                f"Error updating future recurring entries for {self.name}: {str(e)}")


def get_permission_query_conditions_for_income(user):
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


def has_permission(doc, user=None, ptype=None):
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
