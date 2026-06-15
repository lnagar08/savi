// full
import { useQuery } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { Fragment, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import analysisicon1 from '../assets/images/analysisicon1.png'
import analysisicon2 from '../assets/images/analysisicon2.png'
import analysisicon3 from '../assets/images/analysisicon3.png'
import analysisicon4 from '../assets/images/analysisicon4.png'
import tdeye from '../assets/images/tdeye.svg'
import tddelete from '../assets/images/tddelete.svg'
import filter from '../assets/images/filter.svg'
import property from '../assets/images/property.jpg'
import siteVisual from '../assets/images/sitevisual.jpg'
//import CreateBidLetterModal from '../components/deal-analysis/CreateBidLetterModal'
import UploadNewDocumentModal from '../components/deal-analysis/UploadNewDocumentModal'
//import NdaAnalysisModal from '../components/deal-analysis/NdaAnalysisModal'
import AiAssistantModal from '../components/dashboard/AiAssistantModal'
import apiClient from '../services/api'

type DealData = {
  name?: string
  location?: string
  value?: number | string
  stage?: string
  deal_identification?: {
    deal_name?: string
    location?: string
    value?: number | string
    stage?: string
  }
  property_details?: Record<string, unknown>
  tenant_information?: Record<string, unknown>
  lease_information?: Record<string, unknown>
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

type TraceabilityLookup = Record<string, string>

const formatCurrency = (value: number | string | undefined, fallback: string) => {
  if (value === undefined || value === null || value === '') {
    return fallback
  }
  const amount = typeof value === 'number' ? value : Number(String(value).replace(/[^\d.-]/g, ''))
  if (!Number.isFinite(amount)) {
    return fallback
  }
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    maximumFractionDigits: 0,
  }).format(amount)
}

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

const getTraceabilityTitle = (fieldPath: string, traceabilityLookup: TraceabilityLookup) => {
  const direct = traceabilityLookup[fieldPath]
  if (direct) {
    return direct
  }

  return 'AI generated'
}

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

  const traceabilityTitle = getTraceabilityTitle(fieldPath, traceabilityLookup)
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
    </>
  )
}

function DealAnalysisPage() {
  const [searchParams] = useSearchParams()
  const dealId = searchParams.get('dealId')
  const {
    data: deal,
    isLoading: isDealLoading,
  } = useQuery<DealData>({
    queryKey: ['deal', dealId],
    queryFn: async () => {
      const res = await apiClient.get(`/deals/${dealId}`)
      return res.data?.data ?? res.data ?? null
    },
    enabled: Boolean(dealId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  const isLoadingDeal = Boolean(dealId) && isDealLoading
  const [editingFieldPath, setEditingFieldPath] = useState<string | null>(null)
  const [draftValue, setDraftValue] = useState('')
  const [editedValues, setEditedValues] = useState<Record<string, string>>({})

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

  const dealName = deal?.name || deal?.deal_identification?.deal_name || 'Project Aurora A'
  const dealLocation = deal?.location || deal?.deal_identification?.location || 'New York, NY'
  const dealStage = deal?.stage || deal?.deal_identification?.stage || 'Due Diligence'
  const dealAmount = formatCurrency(deal?.value ?? deal?.deal_identification?.value, '£1,400')
  const creditRating = formatPrimitive(
    (deal?.tenant_information as Record<string, unknown> | undefined)?.credit_rating || 'A+'
  )
  const financialInformation = deal?.financial_information as Record<string, unknown> | undefined
  const leaseInformation = deal?.lease_information as Record<string, unknown> | undefined
  const yieldValueRaw = financialInformation?.net_initial_yield_percent
  const yieldValue = typeof yieldValueRaw === 'number' ? yieldValueRaw : Number(yieldValueRaw)
  const soniaUkti = Number.isFinite(yieldValue) ? `${yieldValue}%` : '5.20% / 4.15%'
  const remainingLease = formatPrimitive(leaseInformation?.remaining_lease || '2.5x')

  console.log(creditRating, soniaUkti, remainingLease)

  const detailCards: Array<{ title: string; data: Record<string, unknown> | undefined }> = [
    { title: 'Deal Identification', data: deal?.deal_identification as Record<string, unknown> | undefined },
    { title: 'Property Detail', data: deal?.property_details },
    { title: 'Tenant Information', data: deal?.tenant_information },
    { title: 'Lease Information', data: deal?.lease_information },
    { title: 'Financial Information', data: deal?.financial_information },
    { title: 'Market Context', data: deal?.market_context },
    { title: 'Deal Pipeline', data: deal?.deal_pipeline },
  ]

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
                  <button type="button" className="btn btn-info lightbtn" data-bs-toggle="modal" data-bs-target="#myModal">
                    NDA Analysis
                  </button>
                  <button type="button" className="btn btn-info lightbtn" data-bs-toggle="modal" data-bs-target="#myModal2">
                    Upload New Document
                  </button>
                  <button type="button" className="btn btn-info lightbtn" data-bs-toggle="modal" data-bs-target="#myModal3">
                    Create Bid Letter
                  </button>
                  <button type="button" className="btn btn-info lightbtn">Run Analysis</button>
                  <button type="button" className="btn btn-info">Generate Report</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="mainsec">
        <div className="analysis-sec">
          <div className="container">
            <div className="row analysis-card-row" style={{ display: 'none' }}>
              <div className="col-md-3">
                <div className="analysis-card cardbg1">
                  <span><img src={analysisicon1} className="img-fluid" alt="Credit Rating" /></span>
                  <h2>A+</h2>
                  <h5>Credit Rating</h5>
                </div>
              </div>
              <div className="col-md-3">
                <div className="analysis-card cardbg2">
                  <span><img src={analysisicon3} className="img-fluid" alt="SONIA UKTI" /></span>
                  <h2>5.20% / 4.15%</h2>
                  <h5>SONIA/UKTI</h5>
                </div>
              </div>
              <div className="col-md-3">
                <div className="analysis-card cardbg3">
                  <span><img src={analysisicon2} className="img-fluid" alt="Lot Size" /></span>
                  <h2>£500,000</h2>
                  <h5>Lot Size</h5>
                </div>
              </div>
              <div className="col-md-3">
                <div className="analysis-card cardbg4">
                  <span><img src={analysisicon4} className="img-fluid" alt="LTV Income Cover" /></span>
                  <h2>60% / 2.5x</h2>
                  <h5>LTV / Income Cover</h5>
                </div>
              </div>
            </div>

            <div className="row visualcol-row" style={{ display: 'none' }}>
              <div className="col-md-3">
                <div className="visualcol">
                  <h3>Asset</h3>
                  <img src={property} className="img-fluid" alt="Asset" />
                  <div className="visualcol-desc">
                    <h2>Asset</h2>
                    <p>An image of the deal site highilighting its prime location and architectural design.</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="visualcol">
                  <h3>Aerial View</h3>
                  <img src={siteVisual} className="img-fluid" alt="Aerial view" />
                  <div className="visualcol-desc">
                    <h2>Aerial View</h2>
                    <p>An image of the deal site highilighting its prime location and architectural design.</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="visualcol">
                  <h3>Site Plan</h3>
                  <img src={property} className="img-fluid" alt="Site plan" />
                  <div className="visualcol-desc">
                    <h2>Site Plan</h2>
                    <p>An image of the deal site highilighting its prime location and architectural design.</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="visualcol">
                  <h3>Location</h3>
                  <div className="responsive-map contactiframe">
                    <iframe
                      src={`https://maps.google.com/maps?q=${encodeURIComponent(dealLocation)}&t=&z=12&ie=UTF8&iwloc=&output=embed`}
                      title="Google Maps Location"
                      width="1600"
                      height="450"
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
          </div>
        </div>

        <div className="create-sec">
          <div className="container">
            <div className="row">
              <div className="col-md-12">
                <div id="accordion" className="accordion-design">
                  <div className="row">
                    {detailCards.map((section, i) => (
                      <div className="col-md-12" key={section.title}>
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
                                    )
                                    : <span>--</span>}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="tabledesign filterno whitebg">
                    <div className="documents-new">
                      <h5 className="shot-heading">Documents</h5>
                      <a href="#" className="btn btn-info">Upload New Document</a>
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
                                <a href={`${apiClient.defaults.baseURL}${doc.url}`} target="_blank" rel="noopener noreferrer">
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
                </div>
              </div>
            </div>
          </div>
        </div>

      </main >

      {/*<NdaAnalysisModal />*/}
      <UploadNewDocumentModal />
      {/*<CreateBidLetterModal />*/}

      <AiAssistantModal />

    </>
  )
}

export default DealAnalysisPage
