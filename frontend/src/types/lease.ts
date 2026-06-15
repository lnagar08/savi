export interface LeaseInputs {
  pricingDate: string;
  leaseStartDate: string;
  leaseExpiryDate: string;
  initialAnnualRent: number;
  paymentFrequency: 'Monthly' | 'Quarterly' | 'Semiannual' | 'Annual';
  paymentTiming: "Arrears" | "Advance";
  reviewFrequency: "Annual" | "None";
  inflationLagMonths: number;
  cap: number;
  collar: number;
  purchaserCosts: number;
  targetZSpread: number;
  loanAmount?: number;
  //comparatorBondSpread: number;
  noi?: number;
  vpv?: number;
  ltv?: number;
}
export interface SensitivityScenario {
  shift: string;
  grossPrice: number;
  netPrice: number;
}
export interface CalculationResult {
  grossPrice: number;
  netPrice: number;
  irr: number;
  duration: number;
  wal: number;
  spreadOverGilts: number;
  comparatorBondSpreadBps: number;
  stabilisedNOI: number;
  vpf: number;
  cashflows: any[];
  // इसे Record<string, string> या Record<string, number> के रूप में डिफाइन करें
  sensitivityTable: Record<string, string>; 
  amortisationSchedule: any[];
  sensitivityChartData: any[];
  income: number;
  loanAmount: number;
}
