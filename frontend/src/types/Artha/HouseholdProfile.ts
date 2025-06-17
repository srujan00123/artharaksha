import { HouseholdProfileChild } from './HouseholdProfileChild'
import { UserHealthCondition } from './UserHealthCondition'
import { SchemeApplications } from './SchemeApplications'
import { SchemeClaims } from './SchemeClaims'

export interface HouseholdProfile{
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
	/**	User : Link - User	*/
	user?: string
	/**	Address : Data	*/
	address?: string
	/**	District : Data	*/
	district?: string
	/**	Family Member Count : Int	*/
	family_member_count?: number
	/**	Household Profiles of family members : Table MultiSelect - Household Profile Child	*/
	table_multiselect?: HouseholdProfileChild[]
	/**	Annual Income : Currency	*/
	annual_income?: number
	/**	Vulnerability Status : Check	*/
	vulnerability_status?: 0 | 1
	/**	Ration Card Holder : Check	*/
	ration_card_holder?: 0 | 1
	/**	CHE 10% : Check	*/
	che_10?: 0 | 1
	/**	CHE 25% : Check	*/
	che_25?: 0 | 1
	/**	Health Conditions : Table - User Health Condition	*/
	health_conditions?: UserHealthCondition[]
	/**	Scheme Applications : Table - Scheme Applications	*/
	scheme_applications?: SchemeApplications[]
	/**	Scheme Claims : Table - Scheme Claims	*/
	scheme_claims?: SchemeClaims[]
}