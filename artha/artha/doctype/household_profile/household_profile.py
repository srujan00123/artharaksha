# Copyright (c) 2025, srujan and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class HouseholdProfile(Document):
	pass


def get_permission_query_conditions_for_household_profile(user):
	"""
	Return query conditions to filter household profiles based on user linkage
	"""
	if not user:
		user = frappe.session.user
	
	# System Manager and Administrator can see all household profiles
	if "System Manager" in frappe.get_roles(user) or user == "Administrator":
		return ""
	
	# Users can only see household profiles where they are linked in the user field
	return f"`tabHousehold Profile`.`user` = '{user}'"


def has_permission(doc, user=None, ptype=None):
	"""
	Check if user has permission to access the household profile document
	"""
	if not user:
		user = frappe.session.user
	
	# System Manager and Administrator have all permissions
	if "System Manager" in frappe.get_roles(user) or user == "Administrator":
		return True
	
	# For new documents, allow creation by any authenticated user
	if not doc.name:
		return True
	
	# Users can only access household profiles where they are linked in the user field
	if hasattr(doc, 'user'):
		return doc.user == user
	else:
		linked_user = frappe.db.get_value("Household Profile", doc.name, "user")
		return linked_user == user
