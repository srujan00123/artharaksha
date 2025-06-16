import type { SupportBenefit } from "./SupportBenefit"
import type { TargetGroupChild } from "./TargetGroupChild"

export interface SupportPathway {
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
	/**	Title : Data	*/
	title?: string
	/**	Description : Small Text	*/
	description?: string
	/**	Target Groups : Table MultiSelect - Target Group Child	*/
	target_groups?: TargetGroupChild[]
	/**	Support Benefits : Table - Support Benefit	*/
	support_benefits?: SupportBenefit[]
}
