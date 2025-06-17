export interface IncomeSourceType {
  name: string;
  creation: string;
  modified: string;
  owner: string;
  modified_by: string;
  docstatus: 0 | 1 | 2;
  parent?: string;
  parentfield?: string;
  parenttype?: string;
  idx?: number;
  /**	Income Type : Link - Income Type	*/
  type?: string;
  /**	Income : Currency	*/
  income?: number;
  /**	recur? : Check	*/
  recur?: 0 | 1;
  /**	Date Time : Datetime	*/
  date_time?: string;
  /**	Stop Date : Date (end date for recurring income) */
  stop_date?: string;
  /**	Recur Frequency : Select	*/
  recur_frequency?: "daily" | "weekly" | "monthly" | "yearly";
}
