import React, { useState } from 'react';
import apiClient from '../../services/api';
interface IssueDetail {
  rag: 'Red' | 'Amber' | 'Green';
  clause: string;
  whatChanged: string;
  suggestedResponse: string;
}

interface AnalysisResultPayload {
  issues: IssueDetail[];
}

interface NdaRevisedItem {
  id: number;
  ndaAnalysisId: number;
  type: string;
  version: number;
  fileUrl: string | null; // Supports updated fileUrl property parameter rules
  createdAt: string;
}

interface DatabaseNdaRecord {
  id: number;
  dealId: number;
  status: 'Red' | 'Amber' | 'Green';
  issues: number;
  ndaTemplate: string | null;
  ndaDraft: string | null;
  analysisResult: AnalysisResultPayload | null;
  NdaRevised: NdaRevisedItem[];
  createdAt: string;
}

interface ComprehensiveNdaResultsProps {
  data: DatabaseNdaRecord | null;
  isSubmitting?: boolean;
  onRefreshDataset: (updatedRecord: DatabaseNdaRecord) => void;
  onToggleLoadingState: (loadingState: boolean) => void;
  setGlobalError: (errorMessage: string) => void;
}

export const ComprehensiveNdaResults: React.FC<ComprehensiveNdaResultsProps> = ({ 
  data, 
  isSubmitting,
  onRefreshDataset,
  onToggleLoadingState,
  setGlobalError
}) => {
  const [selectedTarget, setSelectedTarget] = useState<string>("Compare against V1 / Template");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 3;

  if (isSubmitting) {
    return (
      <div className="p-5 text-center">
        <div style={{ width: '3rem', height: '3rem' }} className="spinner-border text-info mb-3" role="status"></div>
        <h4 className="text-secondary">Please wait...</h4>
        <p className="text-muted small">Comparing NDAs...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-5 text-center border rounded bg-light my-3">
        <span className="fs-1 d-block mb-2">📊</span>
        <h5 className="text-secondary">No Active Comparison Report</h5>
        <p className="text-muted small mb-0">Please upload and submit your documents on the form above to generate results.</p>
      </div>
    );
  }

  const { id: ndaAnalysisId, status, issues: issueCount, analysisResult, NdaRevised = [] } = data;
  const issuesList = analysisResult?.issues || [];

  // Sort and isolate arrays for sidebar history loop rendering metrics
  const templateVersions = NdaRevised.filter(item => item.type === "template").sort((a,b) => a.version - b.version);
  const draftVersions = NdaRevised.filter(item => item.type === "draft").sort((a,b) => a.version - b.version);

  // Derive active context based on selection dropdown values
  const isTargetingTemplate = selectedTarget.toLowerCase().includes("template");
  const activeUploadType: 'template' | 'draft' = isTargetingTemplate ? 'template' : 'draft';
  const calculatedNextVersion = isTargetingTemplate ? templateVersions.length + 1 : draftVersions.length + 1;

  // Pagination Slice Calculators
  const totalEntries = issuesList.length;
  const totalPages = Math.ceil(totalEntries / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = issuesList.slice(indexOfFirstItem, indexOfLastItem);
  const startEntryIndex = totalEntries === 0 ? 0 : indexOfFirstItem + 1;
  const endEntryIndex = Math.min(indexOfLastItem, totalEntries);

  // Native Trigger Execution Flow Handler Hook
  const handleUploadRevisedClick = () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.doc,.docx,.pdf';

    fileInput.onchange = async (e: any) => {
      const targetFile = e.target.files?.[0];
      if (!targetFile) return;

      onToggleLoadingState(true);

      const payload = new FormData();
      payload.append('file', targetFile);
      payload.append('ndaAnalysisId', String(ndaAnalysisId));
      payload.append('type', activeUploadType);
      payload.append('version', String(calculatedNextVersion));
        
      try {
        const res = await apiClient.post('/ndaAnalysis/append-and-recompare', payload, {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        })
        if (res.status !== 200) {
            throw new Error("Database file backup sync failed.");
        }

        const freshlyUpdatedRecord: DatabaseNdaRecord = res.data;
        onRefreshDataset(freshlyUpdatedRecord); // Push payload back up to parents state context hooks
        setCurrentPage(1); // Return pagination window back to baseline page indexing
      } catch (err) {
        setGlobalError(err instanceof Error ? err.message : "An unexpected error occurred during file upload and re-comparison.");
      } finally {
        onToggleLoadingState(false);
      }
    };

    fileInput.click();
  };

  const getStatusStyleClass = (ragValue: 'Red' | 'Amber' | 'Green'): string => {
    switch (ragValue) {
      case 'Red': return 'red-status';
      case 'Amber': return 'amber-status';
      case 'Green': return 'green-status';
    }
  };

  return (
    <div className="row summary-resultrow">
      {/* LEFT COLUMN: ISSUES CLASSIFICATION TABLES */}
      <div className="col-md-9">
        <h2>NDA Comparison Results</h2>
        <div className="summary-result">
          <div className="summary-card">
            <span className="result-status">Overall result<strong className={getStatusStyleClass(status)}><span className="result-sign"></span>{status}</strong></span>
          </div>
          <div className="summary-card midsummary-card">
            <span className="result-status">High priority issues<strong>{issueCount}</strong></span>
          </div>
          <div className="summary-card">
            <span className="result-status">Acceptability<span className="acceptability-result">{status === 'Green' ? 'Acceptable' : 'Accept with changes'}</span></span>
          </div>
        </div>

        <div className="tabledesign filterno issues-table">
          <div className="table-responsive">
            <table className="table dt-responsive categories_table">
              <thead>
                <tr>
                  <th style={{ minWidth: '110px' }}>Clause</th>
                  <th style={{ minWidth: '60px' }}>RAG</th>
                  <th style={{ minWidth: '210px' }}>What changed</th>
                  <th style={{ minWidth: '120px' }}>Suggested response</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.clause}</td>
                    <td><strong className={getStatusStyleClass(item.rag)}><span className="result-sign"></span>{item.rag}</strong></td>
                    <td>{item.whatChanged}</td>
                    <td>
                      <span className="copytext" style={{ cursor: 'pointer' }} onClick={() => navigator.clipboard.writeText(item.suggestedResponse)}>
                        {item.suggestedResponse} <i className="la la-copy ms-1"></i>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controllers */}
        
            <div className="d-flex justify-content-between align-items-center mt-3 px-2">
            {/* Left Info Text Element */}
            <div className="dataTables_info" style={{ fontSize: '13px', color: '#6c757d' }} role="status" aria-live="polite">
                Showing {startEntryIndex} to {endEntryIndex} of {totalEntries} entries
            </div>

            {/* Pagination Control Node Lists Wrapper */}
            {totalPages > 1 && (
                <div className="dataTables_paginate paging_simple_numbers">
                <ul className="pagination m-0" style={{ gap: '0px', listStyle: 'none', display: 'flex', padding: 0 }}>
                    
                    {/* Previous Action Node Link Element */}
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                    <button 
                        type="button"
                        className="page-link"
                        disabled={currentPage === 1}
                        style={{
                        fontSize: '13px',
                        border: '1px solid #A9A6A6',
                        borderRadius: '5px',
                        minWidth: '1.5em',
                        padding: '0.5em 1em',
                        marginLeft: '10px',
                        textAlign: 'center',
                        background: 'transparent',
                        color: currentPage === 1 ? '#000' : '#000',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        opacity: currentPage === 1 ? 0.6 : 1,
                        outline: 'none'
                        }}
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    >
                        Previous
                    </button>
                    </li>

                    {/* Dynamic Individual Numeric Page Control Loop Nodes */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
                    <li key={pageNumber} className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}>
                        <button
                        type="button"
                        className="page-link"
                        style={{
                            fontSize: '13px',
                            border: currentPage === pageNumber ? '1px solid #ff6100' : '1px solid #A9A6A6',
                            borderRadius: '5px',
                            minWidth: '1.5em',
                            padding: '0.5em 1em',
                            marginLeft: '10px',
                            textAlign: 'center',
                            background: currentPage === pageNumber ? '#ff6100' : 'transparent',
                            color: currentPage === pageNumber ? '#fff' : '#000',
                            fontWeight: currentPage === pageNumber ? 'bold' : 'normal',
                            cursor: 'pointer',
                            outline: 'none'
                        }}
                        onClick={() => setCurrentPage(pageNumber)}
                        >
                        {pageNumber}
                        </button>
                    </li>
                    ))}

                    {/* Next Action Node Link Element */}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                    <button
                        type="button"
                        className="page-link"
                        disabled={currentPage === totalPages}
                        style={{
                        fontSize: '13px',
                        border: '1px solid #A9A6A6',
                        borderRadius: '5px',
                        minWidth: '1.5em',
                        padding: '0.5em 1em',
                        marginLeft: '10px',
                        textAlign: 'center',
                        background: 'transparent',
                        color: currentPage === totalPages ? '#000' : '#000',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        opacity: currentPage === totalPages ? 0.6 : 1,
                        outline: 'none'
                        }}
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    >
                        Next
                    </button>
                    </li>

                </ul>
                </div>
            )}
            </div>

        </div>
      </div>

      {/* RIGHT SIDEBAR COLUMN: VERSION TREE STACKS */}
      <div className="col-md-3">
        <div className="version-strip">
          <h3><strong>Current version:</strong> V{templateVersions.length || 1}</h3>
          
          <div className="form-group">
            <select 
              className="form-control form-select" 
              value={selectedTarget}
              onChange={(e) => setSelectedTarget(e.target.value)}
            >
              <option value="Compare against V1 / Template">Compare against V1 / Template</option>
              <option value="Compare against V2 / Draft">Compare against V2 / Draft</option>
            </select>
          </div>
          
          <button 
            type="button" 
            className="btn btn-info"
            onClick={handleUploadRevisedClick}
          >
            Upload {activeUploadType === 'template' ? 'Template' : 'revised draft'}
          </button>
          
          <h4>History</h4>
          <ul>
            {templateVersions.map((vItem) => (
              <li key={`template-${vItem.id}`}>
                <strong>V{vItem.version}</strong> Template Uploaded
              </li>
            ))}
            {draftVersions.map((vItem) => (
              <li key={`draft-${vItem.id}`}>
                <strong>V{vItem.version}</strong> Draft Uploaded
              </li>
            ))}
            <li>
              <strong className={getStatusStyleClass(status)}>
                <span className="latestresult">latest result:</span>
                <span className="result-sign"></span>{status}
              </strong>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
