import type { AmortisationRow } from './pricingEngine';

interface CashflowRow {
  period: number;
  date: string; // Format: DD-MM-YYYY
  interest: number;
  principal: number;
}

/**
 * Converts the engine's AmortisationRow[] (result.amortisation from runModel())
 * into the exact CashflowRow[] shape RentalCashflowChart expects.
 *
 * `date` is formatted as 'dd-mm-yyyy' as specified on the component's own
 * CashflowRow interface. Note this is a DIFFERENT format than the
 * AmortisationChart adapter (which uses ISO 'yyyy-mm-dd') — the component's
 * `tick.includes('-11-')` November check still works with either format
 * since both put the zero-padded month between two hyphens.
 */
export function toRentalCashflowChartData(amortisation: AmortisationRow[]): CashflowRow[] {
  return amortisation.map((row) => {
    const d = row.paymentDate;
    const dd = String(d.getUTCDate()).padStart(2, '0');
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const yyyy = d.getUTCFullYear();
    return {
      period: row.period,
      date: `${dd}-${mm}-${yyyy}`,
      interest: row.interest,
      principal: row.principal,
    };
  });
}
