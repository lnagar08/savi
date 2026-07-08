import type { AmortisationRow } from './pricingEngine';

interface ProfileRow {
  period: number;
  date: string;
  payment: number;
}

/**
 * Converts the engine's AmortisationRow[] (result.amortisation from runModel())
 * into the exact ProfileRow[] shape RentalCashflowProfileChart expects.
 *
 * `date` uses 'dd-mm-yyyy' to stay consistent with the sibling
 * RentalCashflowChart adapter (both are part of the same "Rental Cashflow"
 * chart family) — the `tick.includes('-11-')` November check works fine
 * with this format either way.
 */
export function toRentalCashflowProfileChartData(amortisation: AmortisationRow[]): ProfileRow[] {
  return amortisation.map((row) => {
    const d = row.paymentDate;
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = d.getUTCFullYear();
    return {
      period: row.period,
      date: `${dd}-${mm}-${yyyy}`,
      payment: row.cashflowPaid,
    };
  });
}
