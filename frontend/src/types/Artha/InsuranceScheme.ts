import { TargetGroupChild } from './TargetGroupChild'
import { SchemeEligibility } from './SchemeEligibility'
import { SchemeBenefit } from './SchemeBenefit'
import { SchemeDocument } from './SchemeDocument'

export interface InsuranceScheme{
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
	/**	Target Groups : Table MultiSelect - Target Group Child	*/
	target_groups?: TargetGroupChild[]
	/**	Apply Url : Data	*/
	apply_url?: string
	/**	Description : Small Text	*/
	description?: string
	/**	Scheme Eligibility : Table - Scheme Eligibility	*/
	scheme_eligibility?: SchemeEligibility[]
	/**	Scheme Benefits : Table - Scheme Benefit	*/
	scheme_benefits?: SchemeBenefit[]
	/**	Scheme Documents : Table - Scheme Document	*/
	scheme_documents?: SchemeDocument[]
}