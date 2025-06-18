
export interface MedicalExpenseType{
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
	/**	Medical Expense Type : Select	*/
	medical_expense_type?: "Consultation" | "Diagnostics" | "Medicines" | "Hospitalization" | "Travel" | "Accommodation" | "Wage Loss" | "Other Medical"
	/**	Amount : Currency	*/
	amount?: number
	/**	Is Direct Medical Expense : Check	*/
	is_direct?: 0 | 1
	/**	Proof of Payment : Attach	*/
	proof_of_payment?: string
	/**	Date Time : Datetime	*/
	date_time?: string
	/**	Description : Small Text	*/
	description?: string
}