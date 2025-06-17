import { SchemeDocument } from './SchemeDocument'

export interface SchemeApplications{
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
	/**	Scheme Type : Select	*/
	scheme_type?: "Insurance Scheme" | "Welfare Scheme"
	/**	Scheme Reference : Dynamic Link	*/
	scheme_reference?: string
	/**	Custom Scheme? : Check	*/
	custom_scheme?: 0 | 1
	/**	Custom Scheme Type : Select	*/
	custom_scheme_type?: "Insurance Scheme" | "Welfare Scheme" | "Other"
	/**	Custom Scheme Name : Data	*/
	custom_scheme_name?: string
	/**	Custom Coverage Amount : Currency	*/
	custom_coverage_amount?: number
	/**	Description : Small Text	*/
	description?: string
	/**	Documents Submitted : Table - Scheme Document	*/
	documents_submitted?: SchemeDocument[]
	/**	Date Applied : Date	*/
	date_applied?: string
	/**	Approval Date : Date	*/
	approval_date?: string
	/**	Rejection Reason : Data	*/
	rejection_reason?: string
	/**	Certificate URL : Data	*/
	certificate_url?: string
}