import { MedicalExpenseType } from './MedicalExpenseType'
import { ExpenseType } from './ExpenseType'

export interface Expense{
	name: string
	creation: string
	modified: string
	owner: string
	modified_by: string
	docstatus: 0 | 1 | 2
	parent?: string
	parentfield?: string
	parenttype?: string
	idx?: number
	/**	Household Profile : Link - Household Profile	*/
	household_profile: string
	/**	Medical Expenses : Table - Medical Expense Type	*/
	medical_expenses?: MedicalExpenseType[]
	/**	Other Expenses : Table - Expense Type	*/
	other_expenses?: ExpenseType[]
	/**	Monthly Expense : Currency	*/
	monthly_expense?: number
}