# Copyright (c) 2025, srujan and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class Income(Document):
	"""
	Income Document for Household Profiles
	
	Structure:
	- One income document per household profile
	- Monthly income amount
	- Income sources stored in child table
	"""
	
	def before_save(self):
		"""Calculate monthly income before saving and validate data"""
		self.validate_income_sources()
		self.calculate_monthly_income()
	
	def validate_income_sources(self):
		"""Validate all income sources for correctness"""
		errors = []
		if self.income_source:
			for i, source in enumerate(self.income_source):
				if not getattr(source, 'type', None):
					errors.append(f"Income source #{i+1}: Type is required.")
				if not getattr(source, 'income', None) or float(source.income) <= 0:
					errors.append(f"Income source #{i+1}: Income amount must be greater than 0.")
				if getattr(source, 'recur', False) and not getattr(source, 'recur_frequency', None):
					errors.append(f"Income source #{i+1}: Frequency is required for recurring income.")
		if errors:
			raise frappe.ValidationError("; ".join(errors))
	
	def calculate_monthly_income(self):
		"""Calculate total monthly income from all income sources"""
		total_monthly_income = 0
		
		if self.income_source:
			for source in self.income_source:
				if getattr(source, 'income', None):
					try:
						amount = float(source.income)
					except Exception:
						amount = 0
					# For recurring income, add to monthly total
					if getattr(source, 'recur', False):
						# Convert based on frequency
						monthly_amount = self.convert_to_monthly(amount, getattr(source, 'recur_frequency', None))
						total_monthly_income += monthly_amount
					# For one-time income, we might want to amortize it over a period
					# For now, let's not include one-time income in monthly calculation
		self.monthly_income = total_monthly_income
	
	def convert_to_monthly(self, amount, frequency):
		"""Convert income amount to monthly equivalent based on frequency"""
		if not frequency:
			return amount  # Default to monthly if no frequency specified
		
		frequency = str(frequency).lower()
		
		# Conversion factors to monthly
		conversion_factors = {
			'daily': 30,
			'weekly': 4.33,  # Average weeks per month
			'bi-weekly': 2.17,  # Every two weeks
			'monthly': 1,
			'quarterly': 1/3,
			'semi-annually': 1/6,
			'annually': 1/12,
			'yearly': 1/12
		}
		
		factor = conversion_factors.get(frequency, 1)  # Default to monthly
		try:
			return float(amount) * float(factor)
		except Exception:
			return 0


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
	household_condition = " OR ".join([f"`tabIncome`.`household_profile` = '{profile}'" for profile in household_profiles])
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
		household_profile = frappe.db.get_value("Income", doc.name, "household_profile")
	
	if household_profile:
		# Check if user is linked to this household profile
		profile_user = frappe.db.get_value("Household Profile", household_profile, "user")
		return profile_user == user
	
	return False
