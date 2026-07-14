/**
 * ============================================================================
 * PRICING ENGINE — faithful TypeScript port of Sam_Model.xlsx
 * ============================================================================
 * Replicates, cell-for-cell, the logic of the three worksheets:
 *   - "Model"        -> generatePeriods() + computeOutputs() + computeSensitivity()
 *   - "Curves"       -> curvesData.json (raw data) + lookupSonia()/lookupInflation()/matchGilt()
 *   - "Amortisation" -> computeAmortisation()
 *
 *      const inputs: ModelInputs = {
 *        dealName: 'Twinkle',
 *        cashflowStartDate: '2026-04-05',
 *        cashflowExpiryDate: '2075-04-05',
 *        reviewPattern: 'Annual',
 *        paymentFrequency: 'Quarterly',
 *        indexation: 'CPI',
 *        collar: 0,
 *        cap: 0.04,
 *        startingRent: 1241760,
 *        pricingDate: '2026-03-30',
 *        stabilisedNOI: 10542815,
 *        vpv: 80859000,
 *        purchaserCosts: 0.068,
 *        targetZSpread: 0.0245,
 *        comparatorBondSpread: 0.012,
 *      };
 *
 *      const result = runModel(inputs);
 *      console.log(result.outputs.grossPrice, result.outputs.netPrice);
 * ============================================================================
 */

import curvesDataRaw from './curvesData.json';
//import { includeCurrency } from './formatters';
// ============================================================================
// TYPES
// ============================================================================

export type PaymentFrequency = 'Quarterly' | 'Semi-Annual' | 'Annual';
export type ReviewPattern = 'Annual' | 'Quarterly' | 'Semi-Annual' | '5-Yearly' | 'Custom';
export type IndexationType = 'CPI' | 'RPI' | 'LPI' | 'Fixed' | 'None';

/** Mirrors Model!B3:B18 exactly. Every field here is a live input — nothing is static. */
export interface ModelInputs {
  dealName: string; // B3 (label only, not used in any calc)
  cashflowStartDate: string; // B4 — ISO date 'yyyy-mm-dd'
  cashflowExpiryDate: string; // B5
  reviewPattern: ReviewPattern; // B6 (label only — not referenced by any Excel formula)
  paymentFrequency: PaymentFrequency; // B7 — drives the Cashflow Paid divisor
  indexation: IndexationType; // B8 (label only — not referenced by any Excel formula)
  collar: number; // B9 — decimal, e.g. 0 = 0%
  cap: number; // B10 — decimal, e.g. 0.04 = 4%
  startingRent: number; // B11
  pricingDate: string; // B12
  stabilisedNOI: number; // B14
  vpv: number; // B15 — Vacant Possession Value
  purchaserCosts: number; // B16 — decimal
  targetZSpread: number; // B17 — decimal
  comparatorBondSpread: number; // B18 — decimal
}

/** One column of Model!C21:ZZ40 */
export interface PeriodRow {
  period: number; // row 21
  paymentDate: Date; // row 22
  periodStartDate: Date; // row 23
  periodEndDate: Date; // row 24
  periodDays: number; // row 25
  cashflowYear: number; // row 26
  leaseYear: number; // row 27
  yearFracFromPricingDate: number; // row 28
  forecastInflation: number | null; // row 29
  appliedInflation: number | null; // row 30
  openingAnnualRent: number; // row 31
  indexedAnnualRent: number; // row 32
  cashflowPaid: number; // row 33
  giltYield: number | null; // row 34 (curve rate used as the risk-free base rate — SONIA curve)
  zSpread: number; // row 35
  allInDiscountRate: number; // row 36
  discountFactor: number; // row 37
  presentValue: number; // row 38
  pvTimesTime: number; // row 39
  cashflowTimesTime: number; // row 40
}

/** Mirrors Model!F2:G17 */
export interface ModelOutputs {
  netPrice: number | null; // G3
  grossPrice: number | null; // G4
  unexpiredTerm: number | null; // G5
  irr: number | null; // G6
  duration: number | null; // G7
  wal: number | null; // G8
  niy: number | null; // G9
  ltv: number | null; // G10
  incomeCover: number | null; // G11
  illiquidityPremium: number | null; // G12
  equivalentDurationDate: Date | null; // G13
  soniaAtDuration: number | null; // G14
  durationMatchedGiltYield: number | null; // G15
  selectedGilt: string | null; // G16
  ukt: number | null; // G16
  spreadOverGilts: number | null; // G17
  effectiveCashflowStartDate: Date; // B13
}

/** Mirrors Model!I2:O9 — the +/- bps Z-spread sensitivity grid */
export interface SensitivityRow {
  label: string; // I column
  zSpread: number; // J column
  grossPrice: number | null; // K column
  netPrice: number | null; // L column
  niy: number | null; // M column
  ltv: number | null; // N column
  priceChangeVsBase: number | null; // O column
}

/** Mirrors the "Amortisation" sheet — derived from the period array + Gross Price */
export interface AmortisationRow {
  period: number;
  paymentDate: Date;
  periodDays: number;
  openingBalance: number;
  discountFactor: number;
  previousDiscountFactor: number;
  periodAccrualFactor: number;
  cashflowPaid: number;
  interest: number;
  principal: number;
  closingBalance: number;
  check: 'Fully Amortised' | null;
}

export interface FullModelResult {
  periods: PeriodRow[];
  outputs: ModelOutputs;
  sensitivity: SensitivityRow[];
  amortisation: AmortisationRow[];
}

interface CurveGilt {
  name: string;
  maturity: string | null;
  duration: number;
  yield: number;
}
interface CurvesData {
  // Rates indexed by "months from the pricing date's month-end" (g = 0, 1, 2, ...).
  // This mirrors Curves!B1 = EOMONTH(Model!B12, 0): the curve is a forward SHAPE that
  // rebases to whatever pricing date is supplied — it is NOT a fixed calendar-date series.
  soniaByMonth: (number | null)[];
  inflationByMonth: (number | null)[];
  lagMonths: number;
  gilts: CurveGilt[];
}

const curvesData = curvesDataRaw as CurvesData;

// ============================================================================
// DATE HELPERS (all dates are treated as UTC midnight to avoid TZ drift)
// ============================================================================

function toUTCDate(iso: string | Date): Date {
  if (iso instanceof Date) {
    return new Date(Date.UTC(iso.getUTCFullYear(), iso.getUTCMonth(), iso.getUTCDate()));
  }
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function dateUTC(y: number, m: number, d: number): Date {
  return new Date(Date.UTC(y, m - 1, d));
}

//function addDays(d: Date, days: number): Date {
 // return new Date(d.getTime() + days * 86400000);
//}

function daysBetween(d1: Date, d2: Date): number {
  return Math.round((d2.getTime() - d1.getTime()) / 86400000);
}

/** EDATE(date, months) — adds whole months, clamping to the end of the month. */
function edate(d: Date, months: number): Date {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();
  const target = new Date(Date.UTC(y, m + months, 1));
  const lastDayOfTarget = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  return new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), Math.min(day, lastDayOfTarget)));
}

/** EOMONTH(date, months) */
//function eomonth(d: Date, months: number): Date {
 // const target = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months + 1, 0));
 // return target;
//}

/** Excel YEARFRAC(start, end, 3) === Actual / 365 */
function yearFrac365(start: Date, end: Date): number {
  return daysBetween(start, end) / 365;
}

// ============================================================================
// QUARTER-DAY SCHEDULE (English quarter days: 25 Mar / 24 Jun / 29 Sep / 25 Dec)
// Replicates Model!C22 / D22 ... exactly, including the year-rollover logic.
// ============================================================================

const QUARTER_DAYS: [number, number][] = [
  [3, 25],
  [6, 24],
  [9, 29],
  [12, 25],
];

/** Given the previous date, returns the next strictly-later quarter day. */
function nextQuarterDate(prev: Date): Date {
  const y = prev.getUTCFullYear();
  const candidates = QUARTER_DAYS.map(([m, d]) => {
    const sameYear = dateUTC(y, m, d);
    return sameYear.getTime() > prev.getTime() ? sameYear : dateUTC(y + 1, m, d);
  });
  return candidates.reduce((min, c) => (c.getTime() < min.getTime() ? c : min));
}

/** Builds the full list of payment dates from the effective start date to expiry. */
function generatePaymentDates(effectiveStart: Date, expiry: Date): Date[] {
  if (effectiveStart.getTime() > expiry.getTime()) return [];
  const dates: Date[] = [];
  let current = nextQuarterDate(effectiveStart);
  dates.push(current);
  while (current.getTime() < expiry.getTime()) {
    current = nextQuarterDate(current);
    dates.push(current);
  }
  return dates;
}

// ============================================================================
// CURVE LOOKUPS
// ----------------------------------------------------------------------------
// CRITICAL: in the workbook, Curves!B1 (SONIA) and Curves!G1 (inflation) are
// both `=EOMONTH(Model!$B$12, 0)` — i.e. the curve's date axis is NOT fixed;
// it re-bases to whatever Pricing Date (B12) you enter. The rate VALUES
// (Curves!D and Curves!H) are fixed constants keyed by "months from that
// base" (Curves!B / Curves!G, both simple 0,1,2,3... counters). So to look
// up a rate for a given calendar date, we must:
//   1. Recompute the base = EOMONTH(pricingDate, 0) for the deal being priced
//   2. Work out how many whole months the target date is after that base
//      (this reproduces XLOOKUP's "next month-end >= target" behaviour,
//      since a month's last day is always >= any date within that month)
//   3. Index into the fixed rate array at that month offset
// ============================================================================

const soniaByMonth: (number | null)[] = curvesData.soniaByMonth;
const inflationByMonth: (number | null)[] = curvesData.inflationByMonth;
const lagMonths = curvesData.lagMonths;

/** EOMONTH(date, 0) — last day of date's own month. */
function monthEnd(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
}

/** Whole months between two month-end-anchored dates (base is assumed to be a month-end). */
function monthsBetween(base: Date, target: Date): number {
  return (target.getUTCFullYear() - base.getUTCFullYear()) * 12 + (target.getUTCMonth() - base.getUTCMonth());
}

/**
 * Month-offset (g) of `target` relative to the curve base derived from `pricingDate`.
 * g=0 is the pricing date's own month; g increases by 1 per calendar month forward.
 * This reproduces Excel's XLOOKUP(target, dates, rates, , 1) because a month's last
 * day is always >= every date that falls within that month, and is the *smallest*
 * such month-end >= target — exactly the "next larger or equal" match XLOOKUP performs.
 */
function monthOffset(pricingDate: Date, target: Date): number {
  const base = monthEnd(pricingDate);
  return Math.max(0, monthsBetween(base, target));
}

/** Model!row34 — risk-free (SONIA) curve rate for a given payment date. */
function lookupSonia(pricingDate: Date, date: Date): number | null {
  let g = monthOffset(pricingDate, date);
  if (g >= soniaByMonth.length) g = soniaByMonth.length - 1;
  return soniaByMonth[g];
}

/**
 * Model!row29 — forecast inflation for a given period-end date.
 * Curves!J = "Index Lag Adjusted Curve" = Curves!I shifted back by `lagMonths`
 * months (J[g] = I[g - lagMonths]).
 */
function lookupInflation(pricingDate: Date, date: Date): number | null {
  const g = monthOffset(pricingDate, date);
  const laggedIdx = g - lagMonths;
  if (laggedIdx < 0) return null;
  if (laggedIdx >= inflationByMonth.length) return inflationByMonth[inflationByMonth.length - 1];
  return inflationByMonth[laggedIdx];
}

/** Model!G15/G16 — finds the gilt whose duration is closest to the model's own duration. */
function matchGilt(modelDuration: number): CurveGilt {
  let best = curvesData.gilts[0];
  let bestDiff = Math.abs(best.duration - modelDuration);
  for (const g of curvesData.gilts) {
    const diff = Math.abs(g.duration - modelDuration);
    if (diff < bestDiff) {
      best = g;
      bestDiff = diff;
    }
  }
  return best;
}

// ============================================================================
// XIRR (Newton-Raphson with bisection fallback — mirrors Excel's XIRR)
// ============================================================================

function xnpv(rate: number, cashflows: number[], dates: Date[]): number {
  const d0 = dates[0].getTime();
  let total = 0;
  for (let i = 0; i < cashflows.length; i++) {
    const years = (dates[i].getTime() - d0) / 86400000 / 365;
    total += cashflows[i] / Math.pow(1 + rate, years);
  }
  return total;
}

function xirr(cashflows: number[], dates: Date[], guess = 0.1): number | null {
  // Newton-Raphson
  let rate = guess;
  const maxIter = 100;
  const tol = 1e-9;
  for (let iter = 0; iter < maxIter; iter++) {
    const f = xnpv(rate, cashflows, dates);
    const h = 1e-6;
    const fPrime = (xnpv(rate + h, cashflows, dates) - xnpv(rate - h, cashflows, dates)) / (2 * h);
    if (Math.abs(fPrime) < 1e-14) break;
    const newRate = rate - f / fPrime;
    if (!isFinite(newRate)) break;
    if (Math.abs(newRate - rate) < tol) return newRate;
    rate = newRate;
  }
  // Fallback: bisection over a wide bracket
  let lo = -0.9999;
  let hi = 10;
  let fLo = xnpv(lo, cashflows, dates);
  let fHi = xnpv(hi, cashflows, dates);
  if (isNaN(fLo) || isNaN(fHi) || fLo * fHi > 0) return isFinite(rate) ? rate : null;
  for (let iter = 0; iter < 200; iter++) {
    const mid = (lo + hi) / 2;
    const fMid = xnpv(mid, cashflows, dates);
    if (Math.abs(fMid) < 1e-6) return mid;
    if (fLo * fMid < 0) {
      hi = mid;
      fHi = fMid;
    } else {
      lo = mid;
      fLo = fMid;
    }
  }
  return (lo + hi) / 2;
}

// ============================================================================
// CORE ENGINE
// ============================================================================

function freqDivisor(freq: PaymentFrequency): number {
  return freq === 'Quarterly' ? 4 : freq === 'Semi-Annual' ? 2 : 1;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Builds Model!C21:ZZ40 (the full period-by-period cashflow schedule) using the
 * given z-spread. Everything upstream of discounting (dates, rent indexation,
 * cashflow amounts) is spread-independent, so this function is also reused,
 * unmodified in shape, to reprice the sensitivity grid at different spreads.
 */
export function generatePeriods(inputs: ModelInputs, zSpreadOverride?: number): PeriodRow[] {
  const cashflowStart = toUTCDate(inputs.cashflowStartDate);
  const cashflowExpiry = toUTCDate(inputs.cashflowExpiryDate);
  const pricingDate = toUTCDate(inputs.pricingDate);
  const effectiveStart = cashflowStart.getTime() > pricingDate.getTime() ? cashflowStart : pricingDate; // B13 = MAX(B4,B12)

  const zSpread = zSpreadOverride ?? inputs.targetZSpread;
  const divisor = freqDivisor(inputs.paymentFrequency);

  const paymentDates = generatePaymentDates(effectiveStart, cashflowExpiry);

  const periods: PeriodRow[] = [];
  let prevPeriodEnd = effectiveStart;
  let prevLeaseYear: number | null = null;
  let prevIndexedRent = inputs.startingRent;

  paymentDates.forEach((paymentDate, i) => {
    const periodStartDate = prevPeriodEnd;
    const periodEndDate = paymentDate.getTime() < cashflowExpiry.getTime() ? paymentDate : cashflowExpiry;
    const periodDays = Math.max(0, daysBetween(periodStartDate, periodEndDate));
    const cashflowYear = paymentDate.getUTCFullYear();
    const leaseYear = Math.floor(yearFrac365(cashflowStart, periodEndDate));
    const yearFracFromPricingDate = yearFrac365(pricingDate, paymentDate);

    const forecastInflation = lookupInflation(pricingDate, periodEndDate);
    const appliedInflation = forecastInflation === null ? null : clamp(forecastInflation, inputs.collar, inputs.cap);

    const openingAnnualRent = i === 0 ? inputs.startingRent : prevIndexedRent;
    const indexedAnnualRent =
      prevLeaseYear !== null && leaseYear > prevLeaseYear && appliedInflation !== null
        ? openingAnnualRent * (1 + appliedInflation)
        : openingAnnualRent;

    const isStubPeriod = periodStartDate.getTime() === effectiveStart.getTime() || periodEndDate.getTime() === cashflowExpiry.getTime();
    const cashflowPaid = isStubPeriod ? (indexedAnnualRent * periodDays) / 365 : indexedAnnualRent / divisor;

    const giltYield = lookupSonia(pricingDate, paymentDate);
    const allInDiscountRate = (giltYield ?? 0) + zSpread;
    const discountFactor = 1 / Math.pow(1 + allInDiscountRate, yearFracFromPricingDate);
    const presentValue = cashflowPaid * discountFactor;
    const pvTimesTime = presentValue * yearFracFromPricingDate;
    const cashflowTimesTime = cashflowPaid * yearFracFromPricingDate;

    periods.push({
      period: i + 1,
      paymentDate,
      periodStartDate,
      periodEndDate,
      periodDays,
      cashflowYear,
      leaseYear,
      yearFracFromPricingDate,
      forecastInflation,
      appliedInflation,
      openingAnnualRent,
      indexedAnnualRent,
      cashflowPaid,
      giltYield,
      zSpread,
      allInDiscountRate,
      discountFactor,
      presentValue,
      pvTimesTime,
      cashflowTimesTime,
    });

    prevPeriodEnd = periodEndDate;
    prevLeaseYear = leaseYear;
    prevIndexedRent = indexedAnnualRent;
  });

  return periods;
}

/** Prices the cashflow schedule at an arbitrary z-spread without rebuilding rent/dates. */
function priceAtSpread(periods: PeriodRow[], zSpread: number): number {
  let sum = 0;
  for (const p of periods) {
    const allInRate = (p.giltYield ?? 0) + zSpread;
    const df = 1 / Math.pow(1 + allInRate, p.yearFracFromPricingDate);
    sum += p.cashflowPaid * df;
  }
  return sum;
}


/**
 * Builds sensitivity rows for an arbitrary list of bps offsets from the
 * target Z-spread — e.g. [230, 240, 250, 260, 270] for a "Z+230 / Z+240 / ..."
 * style metrics panel. Reuses the same spread-independent period array as
 * computeSensitivity(), so dates/rent/cashflow are never recomputed —
 * only the discount rate and resulting price change per row.
 */
export function computeCustomSensitivity(
  inputs: ModelInputs,
  periods: PeriodRow[],
  offsetsBps: number[]
): SensitivityRow[] {
  return offsetsBps.map((bps) => {
    const offset = bps / 10000;
    const zSpread = inputs.targetZSpread + offset;
    const grossPrice = priceAtSpread(periods, zSpread);
    const netPrice = grossPrice / (1 + inputs.purchaserCosts);
    const niy = grossPrice ? inputs.startingRent / grossPrice : null;
    const ltv = grossPrice / inputs.vpv;
    return {
      label: bps === 0 ? 'Target' : bps > 0 ? `Z+${bps}` : `Z${bps}`,
      zSpread,
      grossPrice,
      netPrice,
      niy,
      ltv,
      priceChangeVsBase: null, // not meaningful without a fixed base row here; compute separately if needed
    };
  });
}

/** Model!F2:G17 */
export function computeOutputs(inputs: ModelInputs, periods: PeriodRow[]): ModelOutputs {
  const cashflowStart = toUTCDate(inputs.cashflowStartDate);
  const cashflowExpiry = toUTCDate(inputs.cashflowExpiryDate);
  const pricingDate = toUTCDate(inputs.pricingDate);
  const effectiveCashflowStartDate =
    cashflowStart.getTime() > pricingDate.getTime() ? cashflowStart : pricingDate;

  const sumPV = periods.reduce((s, p) => s + p.presentValue, 0);
  const sumPVxTime = periods.reduce((s, p) => s + p.pvTimesTime, 0);
  const sumCF = periods.reduce((s, p) => s + p.cashflowPaid, 0);
  const sumCFxTime = periods.reduce((s, p) => s + p.cashflowTimesTime, 0);

  const grossPrice = periods.length ? sumPV : null;
  const netPrice = grossPrice !== null ? grossPrice / (1 + inputs.purchaserCosts) : null;
  const unexpiredTerm = yearFrac365(cashflowStart, cashflowExpiry);
  const duration = grossPrice ? sumPVxTime / sumPV : null;
  const wal = sumCF ? sumCFxTime / sumCF : null;
  const niy = grossPrice ? inputs.startingRent / grossPrice : null;
  const ltv = grossPrice !== null ? grossPrice / inputs.vpv : null;
  const incomeCover = inputs.stabilisedNOI ? inputs.startingRent / inputs.stabilisedNOI : null;
  const illiquidityPremium = inputs.targetZSpread - inputs.comparatorBondSpread;

  // XIRR: -grossPrice at pricingDate, then each period's cashflow at its payment date.
  let irr: number | null = null;
  if (grossPrice !== null && periods.length) {
    const cfDates = [pricingDate, ...periods.map((p) => p.paymentDate)];
    const cfAmounts = [-grossPrice, ...periods.map((p) => p.cashflowPaid)];
    irr = xirr(cfAmounts, cfDates);
  }

  let equivalentDurationDate: Date | null = null;
  let soniaAtDuration: number | null = null;
  let durationMatchedGiltYield: number | null = null;
  let selectedGilt: string | null = null;
  let spreadOverGilts: number | null = null;
  let ukt: number | null = null;

  if (duration !== null) {
    equivalentDurationDate = edate(pricingDate, Math.round(duration * 12));
    soniaAtDuration = lookupSonia(pricingDate, equivalentDurationDate);
    const gilt = matchGilt(duration);
    durationMatchedGiltYield = gilt.yield;
    selectedGilt = gilt.name;
    ukt = gilt.yield;
    if (soniaAtDuration !== null) {
      spreadOverGilts = soniaAtDuration + inputs.targetZSpread - durationMatchedGiltYield;
    }
  }

  return {
    netPrice,
    grossPrice,
    unexpiredTerm,
    irr,
    duration,
    wal,
    niy,
    ltv,
    incomeCover,
    illiquidityPremium,
    equivalentDurationDate,
    soniaAtDuration,
    durationMatchedGiltYield,
    selectedGilt,
    ukt,
    spreadOverGilts,
    effectiveCashflowStartDate,
  };
}

/** Model!I2:O9 — the Z-spread sensitivity grid (+/- 15/10/5 bps around target). */
export function computeSensitivity(inputs: ModelInputs, basePeriods: PeriodRow[], baseOutputs: ModelOutputs): SensitivityRow[] {
  const offsets: [string, number][] = [
    ['Target -15bps', -0.0015],
    ['Target -10bps', -0.001],
    ['Target -5bps', -0.0005],
    ['Target', 0],
    ['Target +5bps', 0.0005],
    ['Target +10bps', 0.001],
    ['Target +15bps', 0.0015],
  ];

  const baseGrossPrice = baseOutputs.grossPrice ?? 0;
  const baseNetPrice = baseOutputs.netPrice ?? 0;

  return offsets.map(([label, offset]) => {
    const zSpread = inputs.targetZSpread + offset;
    const grossPrice = priceAtSpread(basePeriods, zSpread);
    const netPrice = grossPrice / (1 + inputs.purchaserCosts);
    const niy = grossPrice ? inputs.startingRent / grossPrice : null;
    const ltv = grossPrice / inputs.vpv;
    // The "Target" (0bps) row compares Gross-to-Gross as a sanity check (matches Excel O6);
    // every other row compares Net-to-Net (matches Excel O3/O4/O5/O7/O8/O9).
    const priceChangeVsBase = offset === 0 ? grossPrice - baseGrossPrice : netPrice - baseNetPrice;

    return { label, zSpread, grossPrice, netPrice, niy, ltv, priceChangeVsBase };
    
  });

}

/** "Amortisation" sheet — derived purely from the period array + Gross Price. */
export function computeAmortisation(periods: PeriodRow[], grossPrice: number): AmortisationRow[] {
  const rows: AmortisationRow[] = [];
  let openingBalance = grossPrice;
  //let prevDF = 1;

  periods.forEach((p, i) => {
    const discountFactor = p.discountFactor;
    const previousDiscountFactor = i === 0 ? 1 : periods[i - 1].discountFactor;
    const periodAccrualFactor = previousDiscountFactor / discountFactor;
    const cashflowPaid = p.cashflowPaid;
    const interest = openingBalance * (periodAccrualFactor - 1);
    const principal = cashflowPaid - interest;
    const closingBalance = openingBalance + interest - cashflowPaid;

    rows.push({
      period: p.period,
      paymentDate: p.paymentDate,
      periodDays: p.periodDays,
      openingBalance,
      discountFactor,
      previousDiscountFactor,
      periodAccrualFactor,
      cashflowPaid,
      interest,
      principal,
      closingBalance,
      check: Math.abs(closingBalance) < 1 ? 'Fully Amortised' : null,
    });

    openingBalance = closingBalance;
    //prevDF = discountFactor;
  });

  return rows;
}

/** Runs the entire model end-to-end: periods, headline outputs, sensitivity grid, amortisation. */
export function runModel(inputs: ModelInputs): FullModelResult {
  
  const periods = generatePeriods(inputs);
  const outputs = computeOutputs(inputs, periods);
  const sensitivity = computeSensitivity(inputs, periods, outputs);
  const amortisation = outputs.grossPrice !== null ? computeAmortisation(periods, outputs.grossPrice) : [];

  return { periods, outputs, sensitivity, amortisation };
}