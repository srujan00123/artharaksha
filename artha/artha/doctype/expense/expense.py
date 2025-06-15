# Copyright (c) 2025, srujan and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class Expense(Document):
	"""
	Simple Expense Document
	
	Structure:
	- One expense document per household profile
	- Medical expenses stored in child table
	- Other expenses stored in child table
	"""
	pass


def get_permission_query_conditions_for_expense(user):
	"""
	Return query conditions to filter expenses based on user's household profile
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
	household_condition = " OR ".join([f"`tabExpense`.`household_profile` = '{profile}'" for profile in household_profiles])
	return f"({household_condition})"


def has_permission(doc, user=None, ptype=None):
	"""
	Check if user has permission to access the expense document
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
		household_profile = frappe.db.get_value("Expense", doc.name, "household_profile")
	
	if household_profile:
		# Check if user is linked to this household profile
		profile_user = frappe.db.get_value("Household Profile", household_profile, "user")
		return profile_user == user
	
	return False
