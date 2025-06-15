
export interface HealthCondition{
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
	/**	Condition Name : Data	*/
	condition_name?: string
	/**	Condition Type : Select	*/
	condition_type?: "Disease" | "Disability" | "Allergy" | "Other"
	/**	Default Severity : Select	*/
	default_severity?: "Mild" | "Moderate" | "Severe"
	/**	Default Duration : Select	*/
	default_duration?: "Temporary" | "Permanent"
}