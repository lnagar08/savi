
import dayjs from "dayjs";

// -------------------- Types --------------------
type Frequency = "Monthly" | "Quarterly" | "Semiannual" | "Annual";
type Inputs = {
  pricingDate: string;
  leaseStartDate: string;
  leaseExpiryDate: string;
  initialAnnualRent: number;
  paymentFrequency: Frequency;
  paymentTiming: "Arrears" | "Advance";
  reviewFrequency: "Annual" | "None";
  inflationLagMonths: number;
  cap: number;
  collar: number;
  targetZSpread: number;
  purchaserCosts: number;
  loanAmount?: number;
};

type InflationPoint = { date: string; rate: number };
type SoniaPoint = { date: string; rate: number };
type GiltPoint = { duration: number; yield: number };

type Curves = {
  inflationCurve: InflationPoint[];
  soniaCurve: SoniaPoint[];
  giltCurve: GiltPoint[];
};

type PaymentRow = {
  periodStart: string;
  periodEnd: string;
  paymentDate: string;
  days: number;
  yearFraction: number;
  leaseYear: number;
  isReview: boolean;
  appliedInflation: number;
  annualRent: number;
  paymentAmount: number;
};

type PvRow = PaymentRow & {
  soniaRate: number;
  discountRate: number;
  time: number;
  discountFactor: number;
  pv: number;
};

type SensitivityRow = { shiftBps: number; grossPrice: number; netPrice: number };
type AmortRow = {
  period: number;
  date: string;
  openingBalance: number;
  payment: number;
  interest: number;
  principal: number;
  discountFactor: number;
  prevDiscountFactor: number;
  closingBalance: number;
};

type Result = {
  inputs: Inputs;
  curves: Curves;
  paymentSchedule: {
    periodStart: string;
    periodEnd: string;
    paymentDate: string;
    paymentAmount: number;
    pv: number;
    discountRate: number;
    time: number;
    appliedInflation: number;
  }[];
  grossPrice: number;
  netPrice: number;
  irr: number | null;
  duration: number;
  wal: number;
  income: number;
  loanAmount: number;
  spreadOverGilts: number;
  sensitivityTable: SensitivityRow[];
  amortisationSchedule: AmortRow[];
  sensitivityChartData?: Array<{
    'name': number;
    'Z-Spread': string;
    'Gross Price': number;
    'Net Price': number;
  }>;
  sensitivityMetrics: { [key: string]: string }; 
};

// -------------------- Utilities --------------------
function daysBetween(a: string, b: string): number {
  return dayjs(b).diff(dayjs(a), "day");
}
function yearFractionActual365(start: string, end: string): number {
  return daysBetween(start, end) / 365;
}
function linearInterpolate(x: number, x1: number, y1: number, x2: number, y2: number): number {
  if (x2 === x1) return y1;
  return y1 + ((x - x1) / (x2 - x1)) * (y2 - y1);
}
function roundTo(x: number, dp = 2): number {
  const m = Math.pow(10, dp);
  return Math.round((x + Number.EPSILON) * m) / m;
}

// XIRR (Newton-Raphson)
function xirr(cashflows: { date: string; amount: number }[], guess = 0.1): number {
  if (!cashflows || cashflows.length === 0) throw new Error("No cashflows for XIRR");
  const dates = cashflows.map((c) => dayjs(c.date));
  const amounts = cashflows.map((c) => c.amount);
  const t0 = dates[0];

  function npv(rate: number): number {
    return amounts.reduce((s, a, i) => {
      const t = dates[i].diff(t0, "day") / 365;
      return s + a / Math.pow(1 + rate, t);
    }, 0);
  }

  function npvDerivative(rate: number): number {
    return amounts.reduce((s, a, i) => {
      const t = dates[i].diff(t0, "day") / 365;
      return s - (t * a) / Math.pow(1 + rate, t + 1);
    }, 0);
  }

  let rate = guess;
  const tol = 1e-9;
  const maxIter = 200;
  for (let i = 0; i < maxIter; i++) {
    const f = npv(rate);
    const fprime = npvDerivative(rate);
    if (Math.abs(fprime) < 1e-12) break;
    const newRate = rate - f / fprime;
    if (!isFinite(newRate)) break;
    if (Math.abs(newRate - rate) < tol) return newRate;
    rate = newRate;
  }
  return rate;
}

// -------------------- Curve helpers --------------------
function findRateOnCurve(curve: { date: string; rate: number }[], targetDate: string): number {
  if (!curve || curve.length === 0) return 0;
  if (curve.length === 1) return curve[0].rate;
  const t = dayjs(targetDate).valueOf();
  const sorted = curve.slice().sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
  if (t <= dayjs(sorted[0].date).valueOf()) return sorted[0].rate;
  if (t >= dayjs(sorted[sorted.length - 1].date).valueOf()) return sorted[sorted.length - 1].rate;
  for (let i = 0; i < sorted.length - 1; i++) {
    const x1 = dayjs(sorted[i].date).valueOf();
    const x2 = dayjs(sorted[i + 1].date).valueOf();
    if (t >= x1 && t <= x2) {
      return linearInterpolate(t, x1, sorted[i].rate, x2, sorted[i + 1].rate);
    }
  }
  return sorted[sorted.length - 1].rate;
}

// -------------------- Schedule generation --------------------
function generatePaymentDates(leaseStartDate: string, leaseExpiryDate: string, frequency: Frequency) {
  const monthsMap: Record<string, number> = { Monthly: 1, Quarterly: 3, Semiannual: 6, Annual: 12 };
  const step = monthsMap[frequency] || 3;
  const dates: { periodStart: string; periodEnd: string; paymentDate: string }[] = [];
  let current = dayjs(leaseStartDate);
  while (true) {
    const next = current.add(step, "month");
    //const paymentDate = next.subtract(1, "day");
    const paymentDate = next;
    if (paymentDate.isAfter(dayjs(leaseExpiryDate))) break;
    dates.push({
      periodStart: current.format("YYYY-MM-DD"),
      periodEnd: paymentDate.format("YYYY-MM-DD"),
      paymentDate: paymentDate.format("YYYY-MM-DD"),
    });
    current = next;
  }
  const lastPeriodStart = current.format("YYYY-MM-DD");
  if (dayjs(leaseExpiryDate).isAfter(dayjs(lastPeriodStart))) {
    dates.push({
      periodStart: lastPeriodStart,
      periodEnd: dayjs(leaseExpiryDate).format("YYYY-MM-DD"),
      paymentDate: dayjs(leaseExpiryDate).format("YYYY-MM-DD"),
    });
  }
  return dates;
}


// Computes lease year = floor((periodEnd - leaseStartDate) / 365)
function leaseYearFor(leaseStartDate: string, date: string): number {
  const start = dayjs(leaseStartDate, "YYYY-MM-DD", true);
  const d = dayjs(date, "YYYY-MM-DD", true);
  if (!start.isValid() || !d.isValid()) {
    // fallback to lax parse if strict parse fails
    const s = dayjs(leaseStartDate);
    const dd = dayjs(date);
    if (!s.isValid() || !dd.isValid()) throw new Error(`Invalid dates in leaseYearFor: ${leaseStartDate}, ${date}`);
    const days = dd.diff(s, "day");
    return Math.floor(days / 365);
  }
  const days = d.diff(start, "day");
  return Math.floor(days / 365);
}


// -------------------- Main calculation --------------------
// Replace your existing calculateLease with this function
export const calculateLease = (inputs: Inputs, curves: Curves): Result => {
  const {
    leaseStartDate,
    leaseExpiryDate,
    initialAnnualRent,
    paymentFrequency,
    reviewFrequency,
    inflationLagMonths,
    cap,
    collar,
    targetZSpread,
    purchaserCosts,
    loanAmount,
  } = inputs;

  const paymentPeriods = generatePaymentDates(leaseStartDate, leaseExpiryDate, paymentFrequency);

  // Excel-like YEARFRAC basis 3 is actual/365 (we already use that)
  let annualRent = initialAnnualRent;
  const cashflowRows: PaymentRow[] = [];
  let previousLeaseYear = leaseYearFor(leaseStartDate, leaseStartDate);

  for (let i = 0; i < paymentPeriods.length; i++) {
    const p = paymentPeriods[i];
    const days = dayjs(p.periodEnd).diff(dayjs(p.periodStart), "day") + 1;
    const yf = yearFractionActual365(p.periodStart, p.periodEnd);
    const currentLeaseYear = leaseYearFor(leaseStartDate, p.periodEnd);
    const isReview = reviewFrequency === "Annual" && currentLeaseYear > previousLeaseYear;

    let appliedInflation = 0;
    if (isReview) {
      // Excel often uses observation = reviewDate - lagMonths (same as before)
      const reviewDate = p.periodEnd;
      const obsDate = dayjs(reviewDate).subtract(inflationLagMonths, "month").format("YYYY-MM-DD");
      const rawInflation = findRateOnCurve(curves.inflationCurve, obsDate);
      appliedInflation = Math.min(Math.max(rawInflation, collar), cap);
      // **Important**: Excel typically stores the new annual rent rounded to 6 decimals in helper column
      annualRent = roundTo(annualRent * (1 + appliedInflation), 6);
    }
    previousLeaseYear = currentLeaseYear;

    const freqDiv = paymentFrequency === "Quarterly" ? 4 : paymentFrequency === "Monthly" ? 12 : paymentFrequency === "Semiannual" ? 2 : 1;
    const standardDays = 365 / freqDiv;
    // treat as stub if difference > 0.5 day
    let paymentAmount = annualRent / freqDiv;
    if (Math.abs(days - standardDays) > 0.5) {
      paymentAmount = annualRent * (days / 365);
    }
    // Excel rounds payment cell to 2 decimals in most models
    paymentAmount = roundTo(paymentAmount, 2);

    cashflowRows.push({
      periodStart: p.periodStart,
      periodEnd: p.periodEnd,
      paymentDate: p.paymentDate,
      days,
      yearFraction: yf,
      leaseYear: currentLeaseYear,
      isReview,
      appliedInflation,
      annualRent: roundTo(annualRent, 6),
      paymentAmount,
    });
  }

  // Discounting and PVs with Excel-like rounding order
  const pvRows: PvRow[] = [];
  for (const row of cashflowRows) {
    const soniaRate = findRateOnCurve(curves.soniaCurve, row.paymentDate);
    // round discount rate to 6 decimals like Excel helper column
    //const discountRateRaw = soniaRate + targetZSpread;
    const discountRate = roundTo(soniaRate + targetZSpread, 6);

    const time = yearFractionActual365(inputs.pricingDate, row.paymentDate);
    
    // compute discount factor with high precision then round to 12 decimals
    const discountFactorRaw = 1 / Math.pow(1 + discountRate, time);
    const discountFactor = roundTo(discountFactorRaw, 12);

    // PV rounded to 2 decimals as Excel would show
    const pvRaw = row.paymentAmount * discountFactor;
    const pv = roundTo(pvRaw, 2);

    pvRows.push({
      ...row,
      soniaRate,
      discountRate,
      time,
      discountFactor,
      pv,
    });
  }

  // Gross and net price computed from rounded PVs to match Excel sum of displayed PVs
  const grossPrice = pvRows.reduce((s, r) => s + r.pv, 0);
  const netPrice = roundTo(grossPrice / (1 + purchaserCosts), 2);

  // Duration using rounded PVs and times
  const duration = pvRows.length ? roundTo(pvRows.reduce((s, r) => s + r.pv * r.time, 0) / Math.max(1e-12, grossPrice), 6) : 0;

  // WAL using payment amounts (rounded) and times
  const totalCashflow = pvRows.reduce((s, r) => s + r.paymentAmount, 0);
  const wal = totalCashflow ? roundTo(pvRows.reduce((s, r) => s + r.paymentAmount * r.time, 0) / totalCashflow, 6) : 0;

  // XIRR: try multiple seeds to mimic Excel behaviour and fallback
  const xirrCashflows: { date: string; amount: number }[] = [{ date: inputs.pricingDate, amount: -netPrice }];
  for (const r of pvRows) xirrCashflows.push({ date: r.paymentDate, amount: r.paymentAmount });

  let irr: number | null = null;
  const seeds = [0.05, 0.1, 0.2, -0.05];
  for (const s of seeds) {
    try {
      const val = xirrWithFallback(xirrCashflows, s);
      if (isFinite(val) && !Number.isNaN(val)) {
        irr = val;
        break;
      }
    } catch {
      // try next seed
    }
  }
  if (irr !== null) irr = roundTo(irr, 6);

  // Comparator gilt selection deterministic tie-breaker: choose min abs duration then lower yield
  let comparatorGilt: GiltPoint | null = null;
  if (curves.giltCurve && curves.giltCurve.length > 0) {
    comparatorGilt = curves.giltCurve.reduce((best: GiltPoint | null, g: GiltPoint) => {
      if (!best) return g;
      const bestDiff = Math.abs(best.duration - duration);
      const thisDiff = Math.abs(g.duration - duration);
      if (thisDiff < bestDiff) return g;
      if (thisDiff === bestDiff) return g.yield < best.yield ? g : best;
      return best;
    }, null as GiltPoint | null);
  }
  const giltYield = comparatorGilt ? comparatorGilt.yield : (curves.giltCurve && curves.giltCurve[0] ? curves.giltCurve[0].yield : 0);
  const assetYield = irr !== null ? irr : pvRows.reduce((s, r) => s + r.discountRate, 0) / Math.max(1, pvRows.length);
  const spreadOverGilts = roundTo(assetYield - giltYield, 6);

  // Sensitivities using same rounding rules
  const baseZSpread = targetZSpread; 
  const shifts = [-0.0015, -0.0010, -0.0005, 0, 0.0005, 0.0010, 0.0015];
  
  const sensitivityTable = shifts.map((shift, index) => {
    const newGross = pvRows.reduce((s, r) => {
      const newDf = roundTo(1 / Math.pow(1 + (r.discountRate + shift), r.time), 12);
      const newPv = roundTo(r.paymentAmount * newDf, 2);
      return s + newPv;
    }, 0);
    const currentZSpreadDecimal = baseZSpread + shift;
    const zSpreadPercent = roundTo(currentZSpreadDecimal * 100, 2);
    const formattedZSpreadStr = `${zSpreadPercent.toFixed(2)}%`;

    return { 
      label: index + 1,
      shiftBps: Math.round(shift * 10000), 
      zSpread: formattedZSpreadStr as any, 
      grossPrice: roundTo(newGross, 2), 
      netPrice: roundTo(newGross / (1 + purchaserCosts), 2) 
    };
  });


  // Amortisation using per-period rate derived from average discountRate and average period length
  const amortisationSchedule: AmortRow[] = [];
let runningBalance = grossPrice; 
const nPeriods = pvRows.length;
let totalRentCollected = 0;
let totalDebtServicePaid = 0;

if (nPeriods > 0) {
  for (let i = 0; i < nPeriods; i++) {
    const currentRow = pvRows[i];
    const currentDiscountFactor = currentRow.discountFactor;
    const prevDiscountFactor = i === 0 ? 1.0000 : pvRows[i - 1].discountFactor;

    // Implied yield extraction via sequential discount factor decay
    const interestRateFactor = (prevDiscountFactor / currentDiscountFactor) - 1; 
    let interest = runningBalance > 0 ? roundTo(runningBalance * interestRateFactor, 2) : 0;

    let cashflow = currentRow.paymentAmount || 0;
    let closing = 0;
    let principal = 0;

    if (runningBalance <= 0) {
      // Asset has terminated; nullify remaining lifecycle metrics
      cashflow = 0;
      interest = 0;
      principal = 0;
      closing = 0;
    } else if (runningBalance + interest <= cashflow) {
      // TERMINAL GUARD: Current remaining obligation is fully liquidated
      cashflow = roundTo(runningBalance + interest, 2); 
      closing = 0;
      principal = roundTo(runningBalance, 2);
    } else {
      // Normal continuous flow step
      closing = roundTo(runningBalance + interest - cashflow, 2);
      principal = roundTo(runningBalance - closing, 2);
    }

    const periodDebtService = roundTo(interest + principal, 2);
    
    totalRentCollected += cashflow;
    totalDebtServicePaid += periodDebtService;

    // Formatting date to DD-MM-YYYY format safely
    let formattedDate = "";
    if (currentRow.paymentDate) {
      const dateObj = new Date(currentRow.paymentDate);
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      formattedDate = `${day}-${month}-${year}`;
    }

    amortisationSchedule.push({
      period: i + 1,
      date: formattedDate,
      openingBalance: roundTo(runningBalance, 2),
      discountFactor: roundTo(currentRow.discountFactor, 6),
      prevDiscountFactor: roundTo(prevDiscountFactor, 6),
      interest,
      payment: roundTo(cashflow, 2),
      principal,
      closingBalance: closing, 
    });

    runningBalance = closing;

    // Drop trailing JS float crumbs (e.g., 0.000000023) to ground the floor
    if (Math.abs(runningBalance) < 0.01) {
      runningBalance = 0;
    }
  }
}

const totalIncomeCoverPercent = totalDebtServicePaid > 0 
  ? roundTo((totalRentCollected / totalDebtServicePaid) * 100, 2) 
  : null;

const totalLTVPercent = (loanAmount && grossPrice) 
  ? roundTo((loanAmount / grossPrice) * 100, 2) 
  : null;

  const result =  {
    inputs,
    curves,
    paymentSchedule: pvRows.map((r) => ({
      periodStart: r.periodStart,
      periodEnd: r.periodEnd,
      paymentDate: r.paymentDate,
      paymentAmount: roundTo(r.paymentAmount, 2),
      pv: roundTo(r.pv, 2),
      discountRate: roundTo(r.discountRate, 6),
      time: roundTo(r.time, 6),
      appliedInflation: roundTo(r.appliedInflation, 6),
    })),
    grossPrice: roundTo(grossPrice, 2),
    netPrice: roundTo(netPrice, 2),
    irr,
    duration: roundTo(duration, 2),
    wal: roundTo(wal, 2),
    spreadOverGilts,
    sensitivityTable,
    amortisationSchedule,
    sensitivityChartData: sensitivityTable.map((row) => ({ 
      name: row.label,            
      "Z-Spread": row.zSpread,    
      "Gross Price": row.grossPrice, 
      "Net Price": row.netPrice  
    })),
    income: totalIncomeCoverPercent ?? 0,
    loanAmount: totalLTVPercent ?? 0,
    sensitivityMetrics: sensitivityTable.reduce((acc, row) => {
    acc[`Target ${row.shiftBps}bps`] = new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(row.netPrice);; 
    return acc;
  }, {} as { [key: string]: string })
  };

  //console.log(result);
  return result;
}

// Helper: try Newton then secant fallback
function xirrWithFallback(cashflows: { date: string; amount: number }[], guess = 0.1): number {
  try {
    return xirr(cashflows, guess);
  } catch {
    // simple secant fallback
    const f = (r: number) => {
      const dates = cashflows.map((c) => dayjs(c.date));
      const amounts = cashflows.map((c) => c.amount);
      const t0 = dates[0];
      return amounts.reduce((s, a, i) => s + a / Math.pow(1 + r, dates[i].diff(t0, "day") / 365), 0);
    };
    let x0 = 0.05, x1 = 0.15;
    for (let i = 0; i < 200; i++) {
      const y0 = f(x0), y1 = f(x1);
      if (Math.abs(y1 - y0) < 1e-12) break;
      const x2 = x1 - y1 * (x1 - x0) / (y1 - y0);
      if (!isFinite(x2)) break;
      if (Math.abs(x2 - x1) < 1e-9) return x2;
      x0 = x1; x1 = x2;
    }
    throw new Error("XIRR failed");
  }
}


/*
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(customParseFormat);

type Frequency = "Monthly" | "Quarterly" | "Semiannual" | "Annual";

type Inputs = {
  pricingDate: string;
  leaseStartDate: string;
  leaseExpiryDate: string;
  initialAnnualRent: number;
  paymentFrequency: Frequency;
  paymentTiming: "Arrears" | "Advance";
  reviewFrequency: "Annual" | "None";
  inflationLagMonths: number;
  cap: number;
  collar: number;
  targetZSpread: number;
  purchaserCosts: number;
};

type InflationPoint = { date: string; rate: number };
type SoniaPoint = { date: string; rate: number };
type GiltPoint = { duration: number; yield: number };

type Curves = {
  inflationCurve: InflationPoint[];
  soniaCurve: SoniaPoint[];
  giltCurve: GiltPoint[];
};

function roundTo(x: number, dp = 2): number {
  const m = Math.pow(10, dp);
  return Math.round((x + Number.EPSILON) * m) / m;
}

function parseDateToISO(dateStr: string): string {
  let d = dayjs(dateStr, "YYYY-MM-DD", true);
  if (d.isValid()) return d.format("YYYY-MM-DD");
  const formats = ["DD-MM-YYYY", "D-M-YYYY", "DD/MM/YYYY", "D/M/YYYY"];
  for (const f of formats) {
    d = dayjs(dateStr, f, true);
    if (d.isValid()) return d.format("YYYY-MM-DD");
  }
  d = dayjs(dateStr);
  if (d.isValid()) return d.format("YYYY-MM-DD");
  throw new Error(`Invalid date: ${dateStr}`);
}

function generatePaymentDates(leaseStartDate: string, leaseExpiryDate: string, frequency: Frequency) {
  const monthsMap = { Monthly: 1, Quarterly: 3, Semiannual: 6, Annual: 12 };
  const step = monthsMap[frequency] || 3;
  const dates: { periodStart: string; periodEnd: string; paymentDate: string }[] = [];
  let current = dayjs(leaseStartDate);
  while (true) {
    const next = current.add(step, "month");
    // FIX 1: Excel-style roll → use next (not next.subtract(1,'day'))
    const paymentDate = next;
    if (paymentDate.isAfter(dayjs(leaseExpiryDate))) break;
    dates.push({
      periodStart: current.format("YYYY-MM-DD"),
      periodEnd: paymentDate.format("YYYY-MM-DD"),
      paymentDate: paymentDate.format("YYYY-MM-DD"),
    });
    current = next;
  }
  const lastPeriodStart = current.format("YYYY-MM-DD");
  if (dayjs(leaseExpiryDate).isAfter(dayjs(lastPeriodStart))) {
    dates.push({
      periodStart: lastPeriodStart,
      periodEnd: dayjs(leaseExpiryDate).format("YYYY-MM-DD"),
      paymentDate: dayjs(leaseExpiryDate).format("YYYY-MM-DD"),
    });
  }
  return dates;
}

function leaseYearFor(leaseStartDate: string, date: string): number {
  const days = dayjs(date).diff(dayjs(leaseStartDate), "day");
  return Math.floor(days / 365); // FIX 2: Excel parity
}

function findRateOnCurve(curve: { date: string; rate: number }[], targetDate: string): number {
  if (!curve || curve.length === 0) return 0;
  if (curve.length === 1) return curve[0].rate;
  const t = dayjs(targetDate).valueOf();
  const sorted = curve.slice().sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf());
  if (t <= dayjs(sorted[0].date).valueOf()) return sorted[0].rate;
  if (t >= dayjs(sorted[sorted.length - 1].date).valueOf()) return sorted[sorted.length - 1].rate;
  for (let i = 0; i < sorted.length - 1; i++) {
    const x1 = dayjs(sorted[i].date).valueOf();
    const x2 = dayjs(sorted[i + 1].date).valueOf();
    if (t >= x1 && t <= x2) {
      return sorted[i].rate + ((t - x1) / (x2 - x1)) * (sorted[i + 1].rate - sorted[i].rate);
    }
  }
  return sorted[sorted.length - 1].rate;
}

export function calculateLease(inputs: Inputs, curves: Curves) {
  console.log(curves);
  const normalizedInputs: Inputs = { ...inputs };
  normalizedInputs.pricingDate = parseDateToISO(inputs.pricingDate); 
  normalizedInputs.leaseStartDate = parseDateToISO(inputs.leaseStartDate);
  normalizedInputs.leaseExpiryDate = parseDateToISO(inputs.leaseExpiryDate);

  const paymentPeriods = generatePaymentDates(normalizedInputs.leaseStartDate, normalizedInputs.leaseExpiryDate, normalizedInputs.paymentFrequency);

  let annualRent = normalizedInputs.initialAnnualRent;
  let previousLeaseYear = leaseYearFor(normalizedInputs.leaseStartDate, normalizedInputs.leaseStartDate);

  const pvRows: any[] = [];
  for (const p of paymentPeriods) {
    // FIX 2: inclusive days
    const days = dayjs(p.periodEnd).diff(dayjs(p.periodStart), "day") + 1;
    const leaseYear = leaseYearFor(normalizedInputs.leaseStartDate, p.periodEnd);
    const isReview = normalizedInputs.reviewFrequency === "Annual" && leaseYear > previousLeaseYear;
    let appliedInflation = 0;
    if (isReview) {
      const obsDate = dayjs(p.periodEnd).subtract(normalizedInputs.inflationLagMonths, "month").format("YYYY-MM-DD");
      const rawInflation = findRateOnCurve(curves.inflationCurve, obsDate);
      appliedInflation = Math.min(Math.max(rawInflation, normalizedInputs.collar), normalizedInputs.cap);
      annualRent = roundTo(annualRent * (1 + appliedInflation), 6); // FIX 3: round annualRent
    }
    previousLeaseYear = leaseYear;

    const freqDiv = normalizedInputs.paymentFrequency === "Quarterly" ? 4 : normalizedInputs.paymentFrequency === "Monthly" ? 12 : normalizedInputs.paymentFrequency === "Semiannual" ? 2 : 1;
    const standardDays = 365 / freqDiv;
    let paymentAmount = annualRent / freqDiv;
    if (Math.abs(days - standardDays) > 0.5) {
      paymentAmount = annualRent * (days / 365);
    }
    paymentAmount = roundTo(paymentAmount, 2); // FIX 3: round paymentAmount

    const soniaRate = findRateOnCurve(curves.soniaCurve, p.paymentDate);
    let discountRate = soniaRate + normalizedInputs.targetZSpread;
    discountRate = roundTo(discountRate, 6); // FIX 3: round discountRate
    const time = dayjs(p.paymentDate).diff(dayjs(normalizedInputs.pricingDate), "day") / 365;
    const df = 1 / Math.pow(1 + discountRate, time);
    const pv = roundTo(paymentAmount * df, 2);

    pvRows.push({ paymentDate: p.paymentDate, paymentAmount, discountRate, time, df, pv });
  }

  const grossPrice = roundTo(pvRows.reduce((s, r) => s + r.pv, 0), 2);
  const netPrice = roundTo(grossPrice / (1 + normalizedInputs.purchaserCosts), 2);

  const result =  {
    inputs,
    curves,
    paymentSchedule: pvRows.map((r) => ({
      periodStart: r.periodStart,
      periodEnd: r.periodEnd,
      paymentDate: r.paymentDate,
      paymentAmount: roundTo(r.paymentAmount, 2),
      pv: roundTo(r.pv, 2),
      discountRate: roundTo(r.discountRate, 6),
      time: roundTo(r.time, 6),
      appliedInflation: roundTo(r.appliedInflation, 6),
    })),
    grossPrice: roundTo(grossPrice, 2),
    netPrice: roundTo(netPrice, 2),
    irr:0,
    duration: 12,
    wal: 12,
    spreadOverGilts: 0,
    sensitivityTable: [],
    amortisationSchedule: [],
    sensitivityChartData: [],
    income: 0,
    loanAmount: 0,
    sensitivityMetrics: {}
  };

  //console.log(result);
  return result;
}
/*
const inputs: Inputs = {
  pricingDate: "30-03-2026",
  leaseStartDate: "05-04-2026",
  leaseExpiryDate: "05-04-2075",
  initialAnnualRent: 1241760,
  paymentFrequency: "Quarterly",
  paymentTiming: "Arrears",
  reviewFrequency: "Annual",
  inflationLagMonths: 3,
  cap: 0.04,
  collar: 0,
  targetZSpread: 0.0245,
  purchaserCosts: 0.068,
};

const curves: Curves = {
  inflationCurve: [{ date: "2027-01-01", rate: 0.031 }],
  soniaCurve: [{ date: "2027-01-01", rate: 0.035 }],
  giltCurve: [{ duration: 5, yield: 0.042 }],
};

console.log(calculateLease(inputs, curves));*/
