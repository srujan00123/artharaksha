export interface ExpenseType {
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
  /**	Expense Type : Select	*/
  expense_type?:
    | "Travel"
    | "Wage loss"
    | "Accommodation"
    | "Rent"
    | "Miscellaneous"
    | "Grocery"
    | "Food"
    | "School Fees"
    | "Tuition Fees"
    | "Entertainment"
    | "Clothes"
    | "Other";
  /**	Amount : Currency	*/
  amount?: number;
  /**	Date Time : Datetime	*/
  date_time?: string;
  /**	Description : Small Text	*/
  description?: string;
}
