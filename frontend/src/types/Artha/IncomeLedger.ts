
export interface IncomeLedger{
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
	/**	Income Type : Select	*/
	income_type?: "recurring" | "one-time"
	/**	income Source : Link - Income Source Type	*/
	income_source?: string
	/**	Date Time : Datetime	*/
	date_time?: string
	/**	Amount : Currency	*/
	amount?: number
}