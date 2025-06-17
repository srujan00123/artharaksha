import { TargetGroupChild } from './TargetGroupChild'
import { SchemeEligibility } from './SchemeEligibility'
import { SchemeBenefit } from './SchemeBenefit'
import { SchemeDocument } from './SchemeDocument'

export interface WelfareScheme{
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
	/**	Scheme Name : Data	*/
	scheme_name?: string
	/**	Type : Select	*/
	type?: "Government" | "Private"
	/**	Coverage Amount : Currency	*/
	coverage_amount?: number
	/**	Amount Range? : Check	*/
	amount_range?: 0 | 1
	/**	Amount Min : Currency	*/
	amount_min?: number
	/**	Amount Max : Currency	*/
	amount_max?: number
	/**	Description : Small Text	*/
	description?: string
	/**	Target Groups : Table MultiSelect - Target Group Child	*/
	target_groups?: TargetGroupChild[]
	/**	Apply Link : Data	*/
	apply_link?: string
	/**	Scheme Eligibility : Table - Scheme Eligibility	*/
	scheme_eligibility?: SchemeEligibility[]
	/**	Scheme Benefit : Table - Scheme Benefit	*/
	scheme_benefit?: SchemeBenefit[]
	/**	Scheme Document : Table - Scheme Document	*/
	scheme_document?: SchemeDocument[]
}