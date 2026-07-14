// full
import { useQuery, useQueryClient } from '@tanstack/react-query'
//import type { LeaseInputs } from '../types/lease';
import type { ReactNode } from 'react'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import analysisicon1 from '../assets/images/analysisicon1.png'
import analysisicon2 from '../assets/images/analysisicon2.png'
import analysisicon3 from '../assets/images/analysisicon3.png'
import analysisicon4 from '../assets/images/analysisicon4.png'
import tdeye from '../assets/images/tdeye.svg'
import tddelete from '../assets/images/tddelete.svg'
import filter from '../assets/images/filter.svg'
//import property from '../assets/images/property.jpg'
//import siteVisual from '../assets/images/sitevisual.jpg'
import CreateBidLetterModal from '../components/deal-analysis/CreateBidLetterModal'
import UploadNewDocumentModal from '../components/deal-analysis/UploadNewDocumentModal'
//import NdaAnalysisModal from '../components/deal-analysis/NdaAnalysisModal'
import NdaAnalysisModalData from '../components/deal-analysis/NdaAnalysisModalData'
import AiAssistantModal from '../components/dashboard/AiAssistantModal'
import apiClient from '../services/api'

//import { calculateLease } from '../utils/leaseMath';
import InputDealModal from '../components/deal-analysis/InputDealModal'
//import fetchMarketCurves from '../utils/marketCurves';
import { includeCurrency } from '../utils/formatters';
//import { SensitivityChart } from '../utils/ZSpreadSensitivityChart';
import { toPriceSensitivityChartData } from '../utils/sensitivityChartAdapter';
import { PriceSensitivityChart } from '../utils/PriceSensitivityChart';
import { toAmortisationChartData } from '../utils/amortisationChartAdapter';
import { AmortisationChartData } from '../utils/AmortisationChartData';
import { toRentalCashflowChartData } from '../utils/rentalCashflowChartAdapter';
import { RentalCashflowChartData } from '../utils/RentalCashflowChartData';
import { toRentalCashflowProfileChartData } from '../utils/rentalCashflowProfileChartAdapter';
import { RentalCashflowProfileChartData } from '../utils/RentalCashflowProfileChartData';
//import { AmortisationChart } from '../utils/AmortisationChart';
//import { RentalCashflowChart } from '../utils/RentalCashflowChart';
//import { RentalCashflowProfileChart } from '../utils/RentalCashflowProfileChart';
import { runModel, computeCustomSensitivity } from '../utils/pricingEngine';
import type { ModelInputs } from '../utils/pricingEngine';

type DealData = {
  name?: string
  location?: string
  value?: number | string
  stage?: string
  assetClass?: string
  tenant?: string
  createdAt?: string
  inflationLagMonths?: number
  soniaCurve?: number
  inflationCurve?: number
  giltCurve?: number
  noi?: number
  vpv?: number
  ltv?: number
  comparatorBondSpread?: number
  user:{
    name: string
  },
  deal_identification?: {
    deal_name?: string
    location?: string
    value?: number | string
    stage?: string
    asset_type?: string,
    starting_rent?: number
  },
  property_details?: Record<string, unknown>
  tenant_information?: Record<string, unknown>
  lease_information?: Record<string, any>
  financial_information?: Record<string, unknown>
  market_context?: Record<string, unknown>
  deal_pipeline?: Record<string, unknown>
  source_traceabilities?: Array<{
    page?: number
    section?: string
    fields?: string[]
  }>
  documents?: Array<{
    id: string
    name: string
    createdAt: string
    url: string
    user: {
      name: string
    }
  }>
}
/*interface MarketData {
  soniaRate: any;
  giltYield: any;
  inflationRate: any;
  lastUpdated: string | null;
}*/
type TraceabilityLookup = Record<string, string>


const toLabel = (key: string) => key.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())

const isIsoDate = (value: string) =>
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(value)

const formatPrimitive = (value: unknown) => {
  if (value === null || value === undefined || value === '') {
    return '--'
  }
  if (typeof value === 'string' && isIsoDate(value)) {
    return new Date(value).toLocaleDateString('en-IN')
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }
  return String(value)
}

/*const getTraceabilityTitle = (fieldPath: string, traceabilityLookup: TraceabilityLookup) => {
  const direct = traceabilityLookup[fieldPath]
  if (direct) {
    return direct
  }

  return 'AI generated'
}*/

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isArrayOfObjects = (value: unknown): value is Record<string, unknown>[] =>
  Array.isArray(value) && value.length > 0 && value.every((item) => isPlainObject(item))

const getFieldName = (fieldPath: string) => {
  const lastSegment = fieldPath.split('.').filter(Boolean).at(-1) ?? fieldPath
  return lastSegment.replace(/\[\d+\]$/, '')
}

const editedValuesToObject = (flatValues: Record<string, string>) => {
  const nested: Record<string, unknown> = {}

  for (const [path, value] of Object.entries(flatValues)) {
    const keys = path.split('.').filter(Boolean)
    if (keys.length === 0) {
      continue
    }

    let cursor: Record<string, unknown> = nested
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      const isLast = i === keys.length - 1

      if (isLast) {
        cursor[key] = value
      } else {
        const next = cursor[key]
        if (!next || typeof next !== 'object' || Array.isArray(next)) {
          cursor[key] = {}
        }
        cursor = cursor[key] as Record<string, unknown>
      }
    }
  }

  return nested
}

type EditHandlers = {
  editingFieldPath: string | null
  draftValue: string
  editedValues: Record<string, string>
  onStartEdit: (fieldPath: string, initialValue: string) => void
  onDraftChange: (value: string) => void
  onSaveEdit: (fieldPath: string) => void
  onCancelEdit: () => void
}

const renderObjectRowItems = (
  obj: Record<string, unknown>,
  fieldPrefix: string,
  traceabilityLookup: TraceabilityLookup,
  editHandlers: EditHandlers
): ReactNode[] => {
  return Object.entries(obj).map(([key, value]) => {
    const fieldPath = fieldPrefix ? `${fieldPrefix}.${key}` : key
    const isNestedObject = isPlainObject(value)
    const isArrayValue = Array.isArray(value)
    const showLabel = !isArrayValue
    const valueClassName = isNestedObject || isArrayValue ? 'leasedetails editspan' : 'editspan'

    if (isArrayValue) {
      return <Fragment key={fieldPath}>{renderFieldContent(value, fieldPath, traceabilityLookup, editHandlers)}</Fragment>
    }

    return (
      <li key={fieldPath} className={isNestedObject ? 'fielddata' : undefined}>
        {showLabel ? (
          <label>
            {toLabel(key)} :
          </label>
        ) : null}
        <div className={valueClassName}>
          {renderFieldContent(value, fieldPath, traceabilityLookup, editHandlers)}
        </div>
      </li>
    )
  })
}

const renderFieldContent = (
  value: unknown,
  fieldPath: string,
  traceabilityLookup: TraceabilityLookup,
  editHandlers: EditHandlers
): ReactNode => {
  if (Array.isArray(value)) {
    if (value.length === 0) {
      value = ['']
    }

    const objectArray = isArrayOfObjects(value)

    if (!objectArray) {
      return (
        <>
          <h3>{toLabel(getFieldName(fieldPath))}</h3>
          <ul>
            {(value as unknown[]).map((item, index) => {
              const itemPath = `${fieldPath}[${index}]`
              const itemKey = `${fieldPath}-${index}`

              return (
                <li key={itemKey}>
                  <div className="editspan" style={{ width: '100%', textAlign: 'left' }}>
                    {renderValue(item, itemPath, traceabilityLookup, editHandlers)}
                  </div>
                </li>
              )
            })}
          </ul>
        </>
      )
    }

    return (
      <>
        <h3>{toLabel(getFieldName(fieldPath))}</h3>
        {(value as unknown[]).map((item, index) => {
          const itemPath = `${fieldPath}[${index}]`
          const itemKey = `${fieldPath}-${index}`

          if (isPlainObject(item)) {
            const itemRows = renderObjectRowItems(item, itemPath, traceabilityLookup, editHandlers)
            return <ul key={itemKey}>{itemRows}</ul>
          }

          return (
            <ul key={itemKey}>
              <li>
                <div className="editspan" style={{ width: '100%', textAlign: 'left' }}>
                  {renderValue(item, itemPath, traceabilityLookup, editHandlers)}
                </div>
              </li>
            </ul>
          )
        })}
      </>
    )
  }

  if (isPlainObject(value)) {
    return renderObjectRows(value, fieldPath, traceabilityLookup, editHandlers)
  }

  return renderValue(value, fieldPath, traceabilityLookup, editHandlers)
}

const renderObjectRows = (
  obj: Record<string, unknown>,
  fieldPrefix: string,
  traceabilityLookup: TraceabilityLookup,
  editHandlers: EditHandlers
): ReactNode => {
  const entries = Object.entries(obj)
  if (entries.length === 0) {
    return <span>--</span>
  }

  return <ul>{renderObjectRowItems(obj, fieldPrefix, traceabilityLookup, editHandlers)}</ul>
}

const renderValue = (
  value: unknown,
  fieldPath: string,
  traceabilityLookup: TraceabilityLookup,
  editHandlers: EditHandlers
): ReactNode => {
  if (Array.isArray(value) || isPlainObject(value)) {
    return renderFieldContent(value, fieldPath, traceabilityLookup, editHandlers)
  }

  //const traceabilityTitle = getTraceabilityTitle(fieldPath, traceabilityLookup)
  const displayValue = editHandlers.editedValues[fieldPath] ?? formatPrimitive(value)
  const isEditing = editHandlers.editingFieldPath === fieldPath
  const isNumericField = typeof value === 'number'

  if (isEditing) {
    return (
      <div className='edit-form' style={{ width: "100%" }}>
        <input
          type="text"
          className="form-control"
          value={editHandlers.draftValue}
          onChange={(e) => {
            const nextValue = e.currentTarget.value
            if (isNumericField && !/^\d*\.?\d*$/.test(nextValue)) {
              return
            }
            editHandlers.onDraftChange(nextValue)
          }}
          style={{
            // maxWidth: '320px',
            display: 'inline-block'
          }}
        />{' '}
        <button
          type="button"
          className="edit"
          onClick={() => editHandlers.onSaveEdit(fieldPath)}
          title="Save"
        >
          <i className="la la-check"></i>
        </button>
        <button
          type="button"
          className="edit"
          onClick={editHandlers.onCancelEdit}
          title="Cancel"
          style={{ right: '-18px' }}
        >
          <i className="la la-times"></i>
        </button>
      </div>
    )
  }

  return (
    <>
      <span>{displayValue}</span>
      {/*}
      <div>
        <input className="form-check-input" type="checkbox" name="remember" />
        <i className="la la-question" data-bs-toggle="tooltip" data-bs-placement="top" title={traceabilityTitle}></i>
        <button
          type="button"
          className="edit"
          onClick={() => editHandlers.onStartEdit(fieldPath, String(displayValue))}
        >
          <i className="la la-pencil"></i>
        </button>
      </div>
      {*/}
    </>
  )
}

function DealAnalysisDetailsPage() {
  //const navigate = useNavigate();

  //const handleUploadClick = () => {
  //  navigate('/dashboard', { state: { openModal: true } });
  //};

  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams()
  const dealId = searchParams.get('dealId')!;

  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  
  const [editData, setEditData] = useState({id: 0 });

  /*const openEditModal = (id: number) => {
    setModalMode('edit');
    setEditData({
      id: id
    });
    
    const { bootstrap } = window as any; 
    const modalElement = document.getElementById('myModal3');
    if (modalElement && bootstrap) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  };*/

  const handleDeleteBid = async (bidId: number) => {
  if (window.confirm("Are you sure you want to remove this bid letter?")) {
    try {
      const res = await apiClient.delete(`/bidLetter/${bidId}`);
      if (res.status === 200) {
        queryClient.invalidateQueries({ queryKey: ['bidLetter', dealId] });
      }
    } catch (error) {
      console.error("Delete failed", error);
      //alert("Failed to remove bid letter.");
    }
  }
};
  const { data: deal, isLoading: isDealLoading } = useQuery<DealData>({
    queryKey: ['deal', dealId],
    queryFn: async () => {
      const res = await apiClient.get(`/deals/${dealId}`);
      return res.data?.data ?? res.data ?? null;
    },
    enabled: Boolean(dealId),
    staleTime: 5 * 60 * 1000,
  });

  // 2. Bid Letter 
  const { data: bidLetter, isLoading: isBidLoading } = useQuery({
    queryKey: ['bidLetter', dealId],
    queryFn: async () => {
      const res = await apiClient.get(`/bidLetter/bid/${dealId}`);
      return res.data?.data ?? res.data ?? null;
    },
    
    enabled: Boolean(dealId),
    staleTime: 5 * 60 * 1000,
  });

  const isLoadingDeal = Boolean(dealId) && isDealLoading
  //const isLoadingBid = Boolean(dealId) && isBidLoading
  const [editingFieldPath, setEditingFieldPath] = useState<string | null>(null)
  const [draftValue, setDraftValue] = useState('')
  const [editedValues, setEditedValues] = useState<Record<string, string>>({})
  const [inputs, setInputs] = useState<ModelInputs | null>(null);
  //const [curves, setCurves] = useState();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const startEdit = (fieldPath: string, initialValue: string) => {
    setEditingFieldPath(fieldPath)
    setDraftValue(initialValue === '--' ? '' : initialValue)
  }

  const saveEdit = (fieldPath: string) => {
    setEditedValues((prev) => ({
      ...prev,
      [fieldPath]: draftValue.trim(),
    }))
    setEditingFieldPath(null)
    setDraftValue('')
  }

  const cancelEdit = () => {
    setEditingFieldPath(null)
    setDraftValue('')
  }

  useEffect(() => {
    if (deal) {
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [isLoadingDeal, deal])

  useEffect(() => {
    const editedValuesObject = editedValuesToObject(editedValues)
    console.log('Edited values as object:', editedValuesObject)
  }, [editedValues])
  
/*
  useEffect(() => {
    const loadData = async () => {
      try {
        const curveDada = await fetchMarketCurves();
        
        setCurves(curveDada);
      } catch (err) {
        console.error(err);
      }
    };

    loadData();
  }, []);*/

  const dealName = deal?.deal_identification?.deal_name || 'Project Aurora A'
  const dealLocation = deal?.location || deal?.deal_identification?.location || 'New York, NY'
  const dealStage = deal?.stage || deal?.deal_identification?.stage || 'Due Diligence'
  const dealAmount = deal?.value ?? deal?.deal_identification?.value
  const creditRating = formatPrimitive(
    (deal?.tenant_information as Record<string, unknown> | undefined)?.credit_rating || 'A+'
  )
  const financialInformation = deal?.financial_information as Record<string, unknown> | undefined
  //const leaseInformation = deal?.lease_information as Record<string, unknown> | undefined
  
  //const niy = financialInformation?.net_initial_yield_percent as any;
  const startDate = deal?.lease_information?.lease_start_date.split('T')[0];
  const expiryDate = deal?.lease_information?.lease_expiry_date.split('T')[0];
  const pricingDate = deal?.lease_information?.pricing_date? deal?.lease_information?.pricing_date.split('T')[0]: startDate;
  const collar = deal?.lease_information?.collar ? deal?.lease_information?.collar.match(/\d+/)[0] : '0';
  const cap = deal?.lease_information?.cap ? deal?.lease_information?.cap.match(/\d+/)[0] : '0';
  const starting_rent = deal?.deal_identification?.starting_rent ?? dealAmount;
  const spread = deal?.lease_information?.spread ?? 2.45; //2.45%
  const paymentFrequency = deal?.lease_information?.payment_frequency || 'Quarterly';
  const purchaserCosts = Number((financialInformation?.costs as any)?.purchaser_costs_percent || 0);
  //const loanAmount = parseFloat(deal?.lease_information?.loan_amount) || 0;
  const marketValue = parseFloat(deal?.lease_information?.market_value) || deal?.financial_information?.asking_price as number || 0;
  //const ltv = marketValue > 0 ? (loanAmount / marketValue) * 100 : 0;
  const comparatorBondSpreadValue = deal?.comparatorBondSpread ?? 0;
  //
    useEffect(() => {
    if (starting_rent && startDate && expiryDate) {
      const inputsD: ModelInputs = {
          dealName: dealName,
          cashflowStartDate: startDate,
          cashflowExpiryDate: expiryDate,
          reviewPattern: 'Annual',
          paymentFrequency: paymentFrequency,
          indexation: 'CPI',
          collar: Number(collar)/ 100,
          cap: Number(cap) / 100,
          startingRent: Number(starting_rent),
          pricingDate: pricingDate,
          stabilisedNOI: deal?.noi ?? 0,
          vpv: deal?.vpv ?? 0,
          purchaserCosts: Number(purchaserCosts) / 100,
          targetZSpread: Number(spread) / 100,
          comparatorBondSpread: (Number(comparatorBondSpreadValue) / 100) / 100,
        };
      setInputs(inputsD);
    }
   
  }, [starting_rent, startDate, expiryDate, financialInformation, deal, cap, collar, spread, pricingDate]); 

  //const soniaCurve = 0.0384;
 // const inflationCurve = 0.031;
 // const giltCurve = 0.042;
 // const curve = useMemo(() => ({
 //   inflationCurve: [{ date: "2027-01-01", rate: inflationCurve }],
 //   soniaCurve: [{ date: "2027-01-01", rate: soniaCurve }],
 //   giltCurve: [{ duration: 5, yield: giltCurve }],
    //inflationCurve: [{ date: "2027-01-01", rate: 0.031 }],
    //soniaCurve: [{ date: "2027-01-01", rate: 0.0374 }],
    //giltCurve: [{ duration: 5, yield: 0.042 }],
 // }), [curves]);

  
  const results = useMemo(() => {
    if (!inputs) return {
    outputs:{ 
      grossPrice: 0,
      netPrice: 0,
      irr: 0,
      duration: 0,
      wal: 0,
      soniaAtDuration: 0,
      ukt: 0,
      niy: 0,
      illiquidityPremium: 0,
      ltv: 0,
      incomeCover: 0,
      spreadOverGilts: 0
    },
    sensitivity:[],
    amortisation: [],
    periods: []
    
    }
    return runModel(inputs);
    //return runModel(inputs || {});
  }, [inputs]); 

  const grossPrice = Math.ceil(results.outputs.grossPrice ?? 0);
  const netPrice = Math.ceil(results.outputs.netPrice ?? 0);
  const irr = ((results.outputs.irr ?? 0) * 100).toFixed(2) + '%';
  const duration = (results.outputs.duration ?? 0).toFixed(2);
  const wall = (results.outputs.wal ?? 0).toFixed(2);
  const soniaAtDuration = ((results.outputs.soniaAtDuration ?? 0) * 100).toFixed(2) + '%';
  const ukt = ((results.outputs.ukt ?? 0) * 100).toFixed(2) + '%';
  const niy = ((results.outputs.niy ?? 0) * 100).toFixed(2) + '%';
  const illiquidityPremium = results.outputs.illiquidityPremium ?? 0;
  const ltv = ((results.outputs.ltv ?? 0) * 100).toFixed(2) + '%';
  const incomeCover = ((results.outputs.incomeCover ?? 0) * 100).toFixed(2) + '%';
  const spreadOverGilts = results.outputs.spreadOverGilts ?? 0;
  const sensitivityChartData = toPriceSensitivityChartData(results.sensitivity);
  const amortisationChartData = toAmortisationChartData(results.amortisation);
  const rentalCashflowChartData = toRentalCashflowChartData(results.amortisation);
  const rentalCashflowProfileChartData = toRentalCashflowProfileChartData(results.amortisation);

  if (!inputs || !results) return null;
  const sensitivityMetrixData = computeCustomSensitivity(inputs, results.periods, [230, 240, 250, 260, 270]);
  const sensitivityMetrix = sensitivityMetrixData.reduce((acc: Record<string, string>, item) => {
  acc[item.label] = includeCurrency(Math.ceil(item.netPrice ?? 0));
  return acc;
}, {});
  
  /*const sensitivityChartData = results.sensitivity.map((index, item) => ({
    "name": `${index + 1}`,
    "Z-Spread": item.zSpread,
    "Gross Price": item.grossPrice,
    "Net Price": item.netPrice,
  }));*/

  //console.log(results);
/*
 const inputsD: ModelInputs = {
  dealName: 'Twinkle',
  cashflowStartDate: '2026-04-05',
  cashflowExpiryDate: '2075-04-05',
  reviewPattern: 'Annual',
  paymentFrequency: 'Quarterly',
  indexation: 'CPI',
  collar: 0,
  cap: 0.04,
  startingRent: 1241760,
  pricingDate: '2026-03-30',
  stabilisedNOI: 10542815,
  vpv: 80859000,
  purchaserCosts: 0.068,
  targetZSpread: 0.0245,
  comparatorBondSpread: 0.012,
};*/

/*const resultD = runModel(inputsD);
resultD.outputs.grossPrice   // 31,458,470.93
resultD.outputs.netPrice     // 29,455,497.13
resultD.periods              // full period-by-period cashflow/discounting schedule
resultD.sensitivity           // the ±15/10/5bps Z-spread grid
resultD.amortisation           // the Amortisation-sheet-equivalent table
console.log(resultD);*/
//console.log(results.outputs.grossPrice);
  //const firstPayment = 0//results.cashflows && results.cashflows.length > 0 ? results.cashflows[0].payment : 0;
 // const isQuarterly = (deal?.lease_information?.payment_frequency || inputs?.paymentFrequency) === 'Quarterly';
  //const noi = firstPayment * (isQuarterly ? 4 : 12);
  //const incomeCover = noi / (parseFloat(deal?.lease_information?.debt_service) || 1); 

  const grossRent = Number(starting_rent || 0);
  //const operatingExpenses = Number(deal?.lease_information?.annualOperatingExpenses || 0);
  const stabilisedNOI = deal?.noi ?? 0;
  //const IRR = 0/*((results.irr ?? 0) * 100).toFixed(1) + '%';*/
  //const percentageSpread = niy - giltCurve;
  //const percentageSpread = niy;
  const bpsValue = Math.round(spreadOverGilts * 100);
  const comparatorBondSpread = `${bpsValue} Bps`;

  //const rawPremiumPercent = niy - giltCurve - inflationCurve;
  //const rawPremiumPercent = niy;
  const illiquidityPremiumBps = Math.round(illiquidityPremium * 100);
  const formattedIlliquidityPremium = `${illiquidityPremiumBps} Bps`;
  
  const dealDetails = { 
    deal_name: dealName,
    location: deal?.deal_identification?.location,
    asset_class: deal?.assetClass,
    asset_type: deal?.deal_identification?.asset_type,
    tenant: deal?.tenant,
    start_date: startDate,
    expiry_date: expiryDate,
    review_pattern: deal?.lease_information?.review_pattern,
    indexation: deal?.lease_information?.indexation_formula,
    collar_cap: `${collar || 0} / ${cap || 0}`,
    rent: includeCurrency(grossRent) 
  };

  const underwritingMatrix = {
    pricing_date: pricingDate,
    spread: `Z+250`,
    credit_rating: creditRating,
    stabillised_NOI: includeCurrency(stabilisedNOI),
    VPV: includeCurrency(deal?.vpv || 0),
    IRR: irr,
    duration: duration,
    WAL: wall,
    assumed_costs: `${purchaserCosts.toFixed(2)}%`,
    comparatorBondSpread: comparatorBondSpread,
    illiquidity_premium: formattedIlliquidityPremium,
  };

  const dealMetrics = {
    NIY: niy,
    net_price: includeCurrency(netPrice),
    gross_price: includeCurrency(grossPrice),
    LTV: ltv === 'Infinity%' ? '0%' : ltv,
    income_cover: incomeCover,
  };

  //const sensitivityMetrics = results.sensitivity[0]//results.sensitivityMetrics;

  const detailCards: Array<{ title: string; data: Record<string, unknown> | undefined }> = [
    { title: 'Deal Details', data: dealDetails as Record<string, unknown> },
    { title: 'Underwriting Metrics', data: underwritingMatrix as Record<string, unknown> },
    { title: 'Deal Metrics', data: dealMetrics as Record<string, unknown> },
    { title: 'Sensitivity Metrics', data: sensitivityMetrix as unknown as Record<string, unknown> }
  ];


  const traceabilityLookup: TraceabilityLookup = (deal?.source_traceabilities || []).reduce(
    (acc, item) => {
      const title = `From ${item.section || 'Unknown section'} (Page ${item.page ?? '-'})`
      for (const field of item.fields || []) {
        acc[field] = title
      }
      return acc
    },
    {} as TraceabilityLookup
  )

  const sectionKeyLookup: Record<string, string> = {
    'Deal Identification': 'deal_identification',
    'Property Detail': 'property_details',
    'Tenant Information': 'tenant_information',
    'Lease Information': 'lease_information',
    'Financial Information': 'financial_information',
    'Market Context': 'market_context',
    'Deal Pipeline': 'deal_pipeline',
  }

  if (isLoadingDeal) {
    return (
      <main className="mainsec">
        <div className="create-sec">
          <div className="container">
            <div className="row">
              <div className="col-md-12">
                <div className="whitebg mb-30">
                  <div className="card-body">Loading deal details...</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (!deal) {
    return (
      <main className="mainsec">
        <div className="create-sec">
          <div className="container">
            <div className="row">
              <div className="col-md-12">
                <div className="whitebg mb-30">
                  <div className="card-body">Deal not found.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }
  return (
    <>
      <div className="sticky-header sticky-top">
        <div className="container">
          <div className="row">
            <div className="col-md-4">
              <div className="extraction-review-left">
                <h2>{dealName}</h2>
                <div className="extraction-review-info">
                  <span>
                    <i className="la la-map-marker"></i>{dealLocation}
                  </span>
                  <span>
                    {/* <i className="la la-dollar"></i> */}
                    {dealAmount}
                  </span>
                  <span>
                    <img src={filter} className="img-fluid" alt="Stage" />{dealStage}
                  </span>
                </div>
              </div>
            </div>
           
            <div className="col-md-8">
              <div className="extraction-review-right">
                <div className="btn-group">
                  <button type="button" className="btn btn-info lightbtn" 
                  onClick={() => setIsModalOpen(true)}
                  >
                    Edit
                  </button>
                  <button type="button" className="btn btn-info lightbtn" data-bs-toggle="modal" data-bs-target="#myModal">
                    NDA Analysis
                  </button>
                  {/*<button type="button" className="btn btn-info lightbtn" onClick={handleUploadClick}>
                    Upload New Document
                  </button>*/}
                  <button type="button" className="btn btn-info lightbtn" data-bs-toggle="modal" data-bs-target="#myModal3">
                    Create Bid Letter
                  </button>
                  <button type="button" className="btn btn-info lightbtn">Run Analysis</button>
                  
                  <Link to={`/deal-reportai?dealId=${dealId}`} className="btn btn-info">Generate Report</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="mainsec">
        <div className="analysis-sec">
          <div className="container">
            <div className="row analysis-card-row">
              <div className="col-md-3">
                <div className="analysis-card cardbg1">
                  <span><img src={analysisicon1} className="img-fluid" alt="Credit Rating" /></span>
                  <h2>{creditRating}</h2>
                  <h5>Credit Rating</h5>
                </div>
              </div>
              <div className="col-md-3">
                <div className="analysis-card cardbg2">
                  <span><img src={analysisicon3} className="img-fluid" alt="SONIA UKTI" /></span>
                  <h2>{`${soniaAtDuration} / ${ukt}`}</h2>
                  <h5>SONIA/UKTI</h5>
                </div>
              </div>
              <div className="col-md-3">
                <div className="analysis-card cardbg3">
                  <span><img src={analysisicon2} className="img-fluid" alt="Lot Size" /></span>
                  <h2>{includeCurrency(marketValue)}</h2>
                  <h5>Lot Size</h5>
                </div>
              </div>
              <div className="col-md-3">
                <div className="analysis-card cardbg4">
                  <span><img src={analysisicon4} className="img-fluid" alt="LTV Income Cover" /></span>
                  <h2>{ltv === 'Infinity%' ? '0%' : ltv} / {incomeCover}</h2>
                  <h5>LTV / Income Cover</h5>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="create-sec">
          <div className="container">
            <div className="row">
              <div className="col-md-12">
                <div id="accordion" className="accordion-design">
                  <div className="row">
                    {detailCards.map((section, i) => (
                      <div className="col-md-6" key={section.title}>
                        <div className="whitebg mb-30 deal-detail-card-wrap">
                          
                          <div className="card deal-detail-card"> 
                            <div className="card-header deal-detail-card-header">
                              <a className="btn" data-bs-toggle="collapse" href={`#collapse${i + 1}`}>
                                {section.title}
                              </a>
                            </div>
                            <div id={`collapse${i + 1}`} className="collapse show" data-bs-parent="#accordion">
                              <div className="card-body deal-detail-card-body">
                                <div className="deal-summary">
                                  {section.data
                                    ? renderObjectRows(
                                      section.data,
                                      sectionKeyLookup[section.title] || '',
                                      traceabilityLookup,
                                      {
                                        editingFieldPath,
                                        draftValue,
                                        editedValues,
                                        onStartEdit: startEdit,
                                        onDraftChange: setDraftValue,
                                        onSaveEdit: saveEdit,
                                        onCancelEdit: cancelEdit,
                                      }
                                    ) : 'No data available'}
                                </div>

                                {section.title === 'Deal Details' && (
                                  <div className="d-flex justify-content-end mt-3">
                                    <Link 
                                      to={`/deal-analysis?dealId=${dealId}`} 
                                      className="btn btn-info btn-sm"
                                    >
                                      View More Details
                                    </Link>

                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                  </div>
                  <div className='row'>
                    <div className="col-md-12">
                      <div className='whitebg mb-30 deal-detail-card-wrap'>
                        <PriceSensitivityChart chartData={sensitivityChartData} />
                      </div>
                      <div className='whitebg mb-30 deal-detail-card-wrap'>
                        <AmortisationChartData data={amortisationChartData} />
                      </div>

                      <div className='whitebg mb-30 deal-detail-card-wrap'>
                        <RentalCashflowChartData data={rentalCashflowChartData} />
                      </div>

                      <div className='whitebg mb-30 deal-detail-card-wrap'>
                        <RentalCashflowProfileChartData data={rentalCashflowProfileChartData} />
                      </div>
                      
                    </div>
                    
                  </div>
                  <div className='row'>
                    <div className="col-md-12">
                      <div className="visualcol">
                        <h3>Location</h3>
                        <div className="contactiframe">
                          <iframe
                            src={`https://maps.google.com/maps?q=${encodeURIComponent(dealLocation)}&t=&z=12&ie=UTF8&iwloc=&output=embed`}
                            title="Google Maps Location"
                            width="100%"
                            height="350"
                            style={{ border: 0 }}
                            allowFullScreen
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                          ></iframe>
                        </div>
                        <div className="visualcol-desc">
                          <h2>Location</h2>
                          <p>An image of the deal site highilighting its prime location and architectural design.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  

                  <div className="tabledesign filterno whitebg">
                    <div className="documents-new">
                      <h5 className="shot-heading">Documents</h5>
                      {/*<button className="btn btn-info" onClick={handleUploadClick}>Upload New Document</button>*/}
                    </div>
                    <div className="table-responsive">
                      <table className="table dt-responsive categories_table">
                        <thead>
                          <tr>
                            <th style={{ minWidth: "120px" }}>File Name</th>
                            <th style={{ minWidth: "120px" }}>Upload Date</th>
                            <th style={{ minWidth: "120px" }}>Uploaded By</th>
                            <th style={{ minWidth: "50px" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deal.documents?.map(doc => (
                            <tr key={doc.id}>
                              <td><div className="td-dealtitle">{doc.name}</div></td>
                              <td>{new Date(doc.createdAt).toLocaleString('en-IN')}</td>
                              <td>{doc.user.name}</td>
                              <td className="tdaction">
                                {/*<a href={`${apiClient.defaults.baseURL}${doc.url}`} target="_blank" rel="noopener noreferrer">*/}
                                <a href={`${doc.url}`} target="_blank" rel="noopener noreferrer">
                                  <img src={tdeye} className="img-fluid" alt="" />
                                </a>
                                <a href="#"><img src={tddelete} className="img-fluid" alt="" /></a>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {/*Bid letter table*/}
                  <div className="tabledesign filterno whitebg mt-4">
                    <div className="documents-new">
                      <h5 className="shot-heading">Bid Letter</h5>
                      
                    </div>
                    <div className="table-responsive">
                      <table className="table dt-responsive categories_table">
                        <thead>
                          <tr>
                            <th style={{ minWidth: "120px" }}>File Name</th>
                            <th style={{ minWidth: "120px" }}>Upload Date</th>
                            
                            <th style={{ minWidth: "50px" }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {isBidLoading ? (
                            <tr><td colSpan={3}>Loading...</td></tr>
                          ) : bidLetter && bidLetter.length > 0 ? (
                            bidLetter.map((bid: any) => (
                              <tr key={bid.id}>
                                <td><div className="td-dealtitle">{bid.projectName}</div></td>
                                <td>{new Date(bid.createdAt).toLocaleString('en-IN')}</td>
                                
                                <td className="tdaction">
                                 
                                  <button 
                                    type="button"
                                    className="btn btn-edit" 
                                    data-bs-toggle="modal"
                                    data-bs-target="#myModal3"
                                    onClick={() => {
                                      setModalMode('edit');
                                      setEditData({ id: bid.id }); 
                                    }}
                                  >
                                    <i className="fa fa-edit"></i>
                                  </button>
                                   
                                  <button className="btn" onClick={() => handleDeleteBid(bid.id)}>
                                    <img src={tddelete} className="img-fluid" alt="Delete" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            
                            <tr><td colSpan={3}>No Bid Letters Found</td></tr>
                          )}
                        </tbody>

                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </main >
      {isModalOpen && (
        <InputDealModal
          inputs={inputs}
          //setInputs={setInputs}
          //setCurves={setCurves}
          //curve={curve}
          dealId={dealId}
          onClose={() => setIsModalOpen(false)} 
        />
      )}
      {/*<NdaAnalysisModal dealId={dealId} />*/}
      <NdaAnalysisModalData dealId={dealId} />
      <UploadNewDocumentModal />
      <CreateBidLetterModal 
        dealId={dealId}
        dealName={deal.name} 
        dealLocation={deal.location} 
        yieldValue={String(niy || "0%")}
        uploadedBy={deal.user.name} 
        createdAt={deal.createdAt} 
        mode={modalMode}
        setModalMode={setModalMode}
        selectedBidId={editData.id}
      />

      <AiAssistantModal />

    </>
  )
}
export const parseDateToISO = (dateInput: any): string => {
  if (!dateInput) return "";
  
  const d = new Date(dateInput);
  
  if (isNaN(d.getTime())) return ""; 

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0'); 
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`; 
};

export default DealAnalysisDetailsPage
