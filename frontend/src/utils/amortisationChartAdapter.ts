import type { AmortisationRow } from './pricingEngine';

interface AmortRow {
  period: number;
  date: string;
  openingBalance: number;
  payment: number;
  interest: number;
  principal: number;
  closingBalance: number;
}

/**
 * Converts the engine's AmortisationRow[] (result.amortisation from runModel())
 * into the exact AmortRow[] shape AmortisationChart expects.
 *
 * `date` is formatted as ISO 'yyyy-mm-dd' (e.g. "2026-11-25"), which is what
 * the chart's own tickFormatter relies on — it does `tick.includes('-11-')`
 * to force a label at every November tick, so the string must contain a
 * zero-padded, hyphen-separated month for that check to work.
 */
export function toAmortisationChartData(amortisation: AmortisationRow[]): AmortRow[] {
  return amortisation.map((row) => ({
    period: row.period,
    date: row.paymentDate.toISOString().slice(0, 10), // 'yyyy-mm-dd'
    openingBalance: row.openingBalance,
    payment: row.cashflowPaid,
    interest: row.interest,
    principal: row.principal,
    closingBalance: row.closingBalance,
  }));
}
