export interface UserHealthCondition {
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
	/**	Condition : Link - Health Condition	*/
	condition?: string
	/**	Severity (override) : Select	*/
	severity?: "Mild" | "Moderate" | "Severe"
	/**	Duration (override) : Select	*/
	duration_override?: "Temporary" | "Permanent"
	/**	Notes : Small Text	*/
	notes?: string
}
