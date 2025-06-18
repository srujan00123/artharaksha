
export interface ExpenseType{
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
	/**	Expense Type : Select	*/
	expense_type?: "Food & Groceries" | "Transportation" | "Education" | "Utilities" | "Rent/Housing" | "Clothing" | "Entertainment" | "Other Expenses"
	/**	Amount : Currency	*/
	amount?: number
	/**	Date Time : Datetime	*/
	date_time?: string
	/**	Description : Small Text	*/
	description?: string
}