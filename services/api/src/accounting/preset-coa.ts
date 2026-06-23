// ============================================
// PRESET CHART OF ACCOUNTS (F&B Standard)
// Hardcoded — auto-generated on outlet creation
// ============================================

export interface PresetAccount {
  code: string;
  name: string;
  type: string;
  description: string;
  parentCode?: string;
}

export const PRESET_COA: PresetAccount[] = [
  // ASSETS (1000-1999)
  { code: "1000", name: "Cash", type: "ASSET", description: "Cash on hand" },
  { code: "1001", name: "Cash - POS Counter", type: "ASSET", description: "Cash from POS sales", parentCode: "1000" },
  { code: "1002", name: "Cash - QR Menu", type: "ASSET", description: "Cash from QR menu orders", parentCode: "1000" },
  { code: "1010", name: "Bank", type: "ASSET", description: "Bank accounts" },
  { code: "1011", name: "Bank - Maybank", type: "ASSET", description: "Maybank account", parentCode: "1010" },
  { code: "1012", name: "Bank - CIMB", type: "ASSET", description: "CIMB account", parentCode: "1010" },
  { code: "1100", name: "Inventory - Raw Materials", type: "ASSET", description: "Raw food inventory" },
  { code: "1200", name: "Inventory - Pre-cooked", type: "ASSET", description: "Pre-cooked items" },
  { code: "1500", name: "Equipment", type: "ASSET", description: "Kitchen & POS equipment" },
  { code: "1600", name: "Accumulated Depreciation", type: "ASSET", description: "Equipment depreciation (contra-asset)" },

  // LIABILITIES (2000-2999)
  { code: "2000", name: "Accounts Payable", type: "LIABILITY", description: "Money owed to suppliers" },
  { code: "2100", name: "Tax Payable - SST", type: "LIABILITY", description: "Sales & Service Tax payable" },
  { code: "2200", name: "EPF Payable", type: "LIABILITY", description: "Employees Provident Fund payable" },
  { code: "2210", name: "SOCSO Payable", type: "LIABILITY", description: "SOCSO contributions payable" },
  { code: "2300", name: "Loan", type: "LIABILITY", description: "Business loan" },

  // EQUITY (3000-3999)
  { code: "3000", name: "Owner's Capital", type: "EQUITY", description: "Owner investment" },
  { code: "3100", name: "Retained Earnings", type: "EQUITY", description: "Accumulated profits" },
  { code: "3200", name: "Drawings", type: "EQUITY", description: "Owner withdrawals (contra-equity)" },

  // REVENUE (4000-4999)
  { code: "4000", name: "Food Sales", type: "REVENUE", description: "Revenue from food items" },
  { code: "4010", name: "Beverage Sales", type: "REVENUE", description: "Revenue from drinks" },
  { code: "4100", name: "Service Charge", type: "REVENUE", description: "Service charge income" },
  { code: "4200", name: "Discount Given", type: "REVENUE", description: "Discounts applied (contra-revenue)" },

  // COGS (5000-5999)
  { code: "5000", name: "COGS - Food", type: "EXPENSE", description: "Cost of food sold" },
  { code: "5010", name: "COGS - Beverage", type: "EXPENSE", description: "Cost of beverages sold" },

  // OPERATING EXPENSES (6000-6999)
  { code: "6000", name: "Wages & Salaries", type: "EXPENSE", description: "Staff wages and salaries" },
  { code: "6010", name: "EPF Contribution", type: "EXPENSE", description: "Employer EPF contribution" },
  { code: "6020", name: "SOCSO Contribution", type: "EXPENSE", description: "Employer SOCSO contribution" },
  { code: "6100", name: "Rent", type: "EXPENSE", description: "Shop rental" },
  { code: "6200", name: "Utilities", type: "EXPENSE", description: "Electric, water, gas" },
  { code: "6300", name: "Marketing", type: "EXPENSE", description: "Advertising & promotions" },
  { code: "6400", name: "Maintenance", type: "EXPENSE", description: "Equipment repairs" },
  { code: "6500", name: "Supplies", type: "EXPENSE", description: "Office & cleaning supplies" },
  { code: "6600", name: "Insurance", type: "EXPENSE", description: "Business insurance" },
  { code: "6700", name: "Depreciation", type: "EXPENSE", description: "Asset depreciation expense" },
  { code: "6800", name: "Bank Charges", type: "EXPENSE", description: "Bank fees & charges" },
  { code: "6900", name: "Miscellaneous", type: "EXPENSE", description: "Other expenses" },
];
