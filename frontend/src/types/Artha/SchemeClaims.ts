import { SchemeDocument } from './SchemeDocument'

export interface SchemeClaims{
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
	/**	is Custom? : Check	*/
	is_custom?: 0 | 1
	/**	Scheme Type : Select	*/
	scheme_type?: "Welfare Scheme" | "Insurance Scheme"
	/**	Scheme Reference : Dynamic Link	*/
	scheme_reference?: string
	/**	Custom Scheme Name : Data	*/
	custom_scheme_name?: string
	/**	Custom Scheme Type : Data	*/
	custom_scheme_type?: string
	/**	Claim Amount : Currency	*/
	claim_amount?: number
	/**	Scheme Status : Select	*/
	custom?: "submitted" | "processing" | "approved" | "rejected" | "paid"
	/**	Documents Submitted : Table - Scheme Document	*/
	documents_submitted?: SchemeDocument[]
	/**	Claim Date : Date	*/
	claim_date?: string
	/**	Approved Amount : Currency	*/
	approved_amount?: number
}