import type { IncomeSourceType } from "./IncomeSourceType"

export interface Income {
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
	/**	Monthly Income : Data	*/
	monthly_income?: string
	/**	Income Sources : Table - Income Source Type	*/
	income_source?: IncomeSourceType[]
}
