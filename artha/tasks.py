"""
Scheduled Tasks for Artha App
Handles recurring income ledger updates and data maintenance
"""

from artha.utils.income_utils import log_income_operation
import frappe
from frappe.utils import getdate, now_datetime
from frappe.query_builder import DocType
from frappe import qb
from typing import Dict, Any, List
import traceback

# DocType references for Query Builder
Income = DocType("Income")
IncomeLedger = DocType("Income Ledger")
ErrorLog = DocType("Error Log")

# Import utility functions from centralized utils module


def update_all_recurring_income_ledgers() -> Dict[str, Any]:
    """
    Daily scheduled task to update recurring ledger entries for all income documents
    This ensures that recurring income sources generate ledger entries up to today
    """
    try:
        frappe.logger().info("Starting daily recurring income ledger update")

        # Get all income records using Query Builder
        income_records = (
            qb.from_(Income)
            .select(Income.name, Income.household_profile)
        ).run(as_dict=True)

        updated_count = 0
        error_count = 0
        total_entries_added = 0

        for record in income_records:
            try:
                # Get current count of ledger entries using Query Builder
                entries_before = (
                    qb.from_(IncomeLedger)
                    .select(qb.functions.Count(IncomeLedger.name))
                    .where(IncomeLedger.parent == record.name)
                ).run()[0][0]

                # Use API method to update recurring entries
                from artha.api.income import update_recurring_ledger_entries_for_income
                update_result = update_recurring_ledger_entries_for_income(
                    record.name, limit_entries=1000)
                entries_added = update_result.get("entries_added", 0)

                if entries_added > 0:
                    updated_count += 1
                    total_entries_added += entries_added
                    frappe.logger().info(
                        f"Updated Income {record.name}: Added {entries_added} ledger entries"
                    )

            except Exception as e:
                error_count += 1
                frappe.log_error(
                    f"Error updating recurring ledgers for Income {record.name}: {str(e)}\n{traceback.format_exc()}",
                    "Daily Recurring Income Update Error"
                )
                continue

        # Log summary
        message = f"Daily recurring income update completed: {updated_count} income records updated, {total_entries_added} total entries added, {error_count} errors"
        frappe.logger().info(message)

        # Log operation for audit trail
        log_income_operation("daily_recurring_update", {
            "updated_count": updated_count,
            "total_entries_added": total_entries_added,
            "error_count": error_count
        })

        # Create a system log entry for tracking
        frappe.get_doc({
            "doctype": "Error Log",
            "method": "artha.tasks.update_all_recurring_income_ledgers",
            "error": message if error_count == 0 else f"{message} (Check error logs for details)"
        }).insert(ignore_permissions=True)

        return {
            "status": "success",
            "message": message,
            "updated_count": updated_count,
            "total_entries_added": total_entries_added,
            "error_count": error_count
        }

    except Exception as e:
        error_msg = f"Critical error in daily recurring income update: {str(e)}"
        frappe.log_error(
            f"{error_msg}\n{traceback.format_exc()}",
            "Daily Recurring Income Critical Error"
        )
        frappe.logger().error(error_msg)

        return {
            "status": "error",
            "message": error_msg,
            "updated_count": 0,
            "total_entries_added": 0,
            "error_count": 1
        }


def update_recent_recurring_income_ledgers() -> Dict[str, Any]:
    """
    Hourly scheduled task to update recently modified income documents
    This provides more frequent updates for active income sources
    """
    try:
        frappe.logger().info("Starting hourly recurring income ledger update")

        # Get income records modified in the last 2 hours using Query Builder
        two_hours_ago = frappe.utils.add_to_date(now_datetime(), hours=-2)

        income_records = (
            qb.from_(Income)
            .select(Income.name, Income.household_profile, Income.modified)
            .where(Income.modified >= two_hours_ago)
        ).run(as_dict=True)

        if not income_records:
            frappe.logger().info("No recently modified income records found")
            return {
                "status": "success",
                "message": "No recently modified income records to update",
                "updated_count": 0,
                "total_entries_added": 0,
                "error_count": 0
            }

        updated_count = 0
        error_count = 0
        total_entries_added = 0

        for record in income_records:
            try:
                # Get the income document
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
                    # Count entries before update using Query Builder
                    entries_before = (
                        qb.from_(IncomeLedger)
                        .select(qb.functions.Count(IncomeLedger.name))
                        .where(IncomeLedger.parent == record.name)
                    ).run()[0][0]

                    # Update using API method
                    from artha.api.income import update_recurring_ledger_entries_for_income
                    update_result = update_recurring_ledger_entries_for_income(
                        record.name, limit_entries=50)
                    entries_added = update_result.get("entries_added", 0)

                    if entries_added > 0:
                        updated_count += 1
                        total_entries_added += entries_added
                        frappe.logger().info(
                            f"Hourly update - Income {record.name}: Added {entries_added} ledger entries"
                        )

            except Exception as e:
                error_count += 1
                frappe.log_error(
                    f"Error in hourly update for Income {record.name}: {str(e)}\n{traceback.format_exc()}",
                    "Hourly Recurring Income Update Error"
                )
                continue

        message = f"Hourly recurring income update completed: {updated_count} income records updated, {total_entries_added} total entries added, {error_count} errors"
        frappe.logger().info(message)

        return {
            "status": "success",
            "message": message,
            "updated_count": updated_count,
            "total_entries_added": total_entries_added,
            "error_count": error_count
        }

    except Exception as e:
        error_msg = f"Critical error in hourly recurring income update: {str(e)}"
        frappe.log_error(
            f"{error_msg}\n{traceback.format_exc()}",
            "Hourly Recurring Income Critical Error"
        )
        frappe.logger().error(error_msg)

        return {
            "status": "error",
            "message": error_msg,
            "updated_count": 0,
            "total_entries_added": 0,
            "error_count": 1
        }


def cleanup_orphaned_income_data() -> Dict[str, Any]:
    """
    Weekly cleanup task to remove orphaned ledger entries and fix data inconsistencies
    This is not scheduled by default but can be called manually or added to weekly schedule
    """
    try:
        frappe.logger().info("Starting income data cleanup")

        # Get all income records using Query Builder
        income_records = (
            qb.from_(Income)
            .select(Income.name)
        ).run(as_dict=True)

        total_cleaned = 0
        error_count = 0

        for record in income_records:
            try:
                # Use API method for cleanup
                from artha.api.income import cleanup_orphaned_ledger_entries_for_income
                cleanup_result = cleanup_orphaned_ledger_entries_for_income(
                    record.name)
                cleaned_count = cleanup_result.get("cleaned_count", 0)

                if cleaned_count > 0:
                    total_cleaned += cleaned_count
                    frappe.logger().info(
                        f"Cleaned up {cleaned_count} orphaned entries from Income {record.name}"
                    )

            except Exception as e:
                error_count += 1
                frappe.log_error(
                    f"Error cleaning up Income {record.name}: {str(e)}\n{traceback.format_exc()}",
                    "Income Data Cleanup Error"
                )
                continue

        message = f"Income data cleanup completed: {total_cleaned} orphaned entries removed, {error_count} errors"
        frappe.logger().info(message)

        return {
            "status": "success",
            "message": message,
            "total_cleaned": total_cleaned,
            "error_count": error_count
        }

    except Exception as e:
        error_msg = f"Critical error in income data cleanup: {str(e)}"
        frappe.log_error(
            f"{error_msg}\n{traceback.format_exc()}",
            "Income Data Cleanup Critical Error"
        )
        frappe.logger().error(error_msg)

        return {
            "status": "error",
            "message": error_msg,
            "total_cleaned": 0,
            "error_count": 1
        }


@frappe.whitelist()
def manual_trigger_income_ledger_update(income_name: str = None) -> Dict[str, Any]:
    """
    Manual trigger for income ledger updates
    Can be called from API or console for specific income records or all records
    """
    try:
        if income_name:
            # Update specific income record using API method
            entries_before = (
                qb.from_(IncomeLedger)
                .select(qb.functions.Count(IncomeLedger.name))
                .where(IncomeLedger.parent == income_name)
            ).run()[0][0]

            # Update using API method
            from artha.api.income import update_recurring_ledger_entries_for_income
            update_result = update_recurring_ledger_entries_for_income(
                income_name, limit_entries=1000)
            entries_added = update_result.get("entries_added", 0)

            return {
                "status": "success",
                "message": f"Updated Income {income_name}: Added {entries_added} ledger entries",
                "entries_added": entries_added
            }
        else:
            # Update all income records
            return update_all_recurring_income_ledgers()

    except Exception as e:
        error_msg = f"Error in manual income ledger update: {str(e)}"
        frappe.log_error(
            f"{error_msg}\n{traceback.format_exc()}",
            "Manual Income Ledger Update Error"
        )

        return {
            "status": "error",
            "message": error_msg,
            "entries_added": 0
        }


# Utility functions for task monitoring

def get_income_task_status() -> Dict[str, Any]:
    """
    Get status of income-related scheduled tasks using Query Builder
    """
    try:
        # Get recent error logs related to income tasks using Query Builder
        seven_days_ago = frappe.utils.add_to_date(now_datetime(), days=-7)

        recent_errors = (
            qb.from_(ErrorLog)
            .select(ErrorLog.method, ErrorLog.error, ErrorLog.creation)
            .where(
                (ErrorLog.method.isin([
                    "artha.tasks.update_all_recurring_income_ledgers",
                    "artha.tasks.update_recent_recurring_income_ledgers",
                    "artha.tasks.cleanup_orphaned_income_data"
                ])) &
                (ErrorLog.creation >= seven_days_ago)
            )
            .orderby(ErrorLog.creation, order="desc")
            .limit(10)
        ).run(as_dict=True)

        # Get count of income records using Query Builder
        income_count = (
            qb.from_(Income)
            .select(qb.functions.Count(Income.name))
        ).run()[0][0]

        # Get count of total ledger entries using Query Builder
        ledger_count = (
            qb.from_(IncomeLedger)
            .select(qb.functions.Count(IncomeLedger.name))
        ).run()[0][0]

        return {
            "status": "success",
            "income_records_count": income_count,
            "total_ledger_entries": ledger_count,
            "recent_errors": recent_errors,
            "last_check": now_datetime()
        }

    except Exception as e:
        return {
            "status": "error",
            "message": f"Error getting task status: {str(e)}",
            "income_records_count": 0,
            "total_ledger_entries": 0,
            "recent_errors": [],
            "last_check": now_datetime()
        }
