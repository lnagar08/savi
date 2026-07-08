import type { SensitivityRow } from './pricingEngine';

/**
 * Converts the engine's SensitivityRow[] (result.sensitivity from runModel())
 * into the exact chartData shape PriceSensitivityChart expects:
 *   { name, 'Z-Spread', 'Gross Price', 'Net Price' }[]
 *
 * 'name' uses the row index (1..7) to match the X axis in the Excel chart.
 * If you'd rather show the bps label ("Target -15bps", "Target", ...) on the
 * X axis instead, swap `index + 1` for `row.label` below.
 */
export function toPriceSensitivityChartData(
  sensitivity: SensitivityRow[]
): Array<{ name: string | number; 'Z-Spread': string | number; 'Gross Price': number; 'Net Price': number }> {
  return sensitivity.map((row, index) => ({
    name: index + 1, // or: row.label
    'Z-Spread': (row.zSpread * 100), // decimal e.g. 0.0245 — component's own formatLeftYAxis/right-axis scaling handles display
    'Gross Price': row.grossPrice ?? 0,
    'Net Price': row.netPrice ?? 0,
  }));
}
