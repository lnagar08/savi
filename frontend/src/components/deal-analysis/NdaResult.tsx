import React, { useState } from 'react';

// Explicit interfaces matching your exact flat API response structure
interface CrossCompareIssue {
  clause: string;
  rag: 'Red' | 'Amber' | 'Green';
  whatChanged: string;
  suggestedResponse: string;
}

interface CrossCompareFlatPayload {
  overallResult: 'Red' | 'Amber' | 'Green';
  highPriorityIssues: number;
  acceptability: string;
  issues: CrossCompareIssue[];
}

interface NdaResultsProps {
  data: CrossCompareFlatPayload | null;
}

export const NdaResults: React.FC<NdaResultsProps> = ({ data }) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 5;

  if (!data) return null; // Keeps component hidden safely if data hasn't arrived

  const { overallResult, highPriorityIssues, acceptability, issues = [] } = data;

  // --- Pagination Logic (Reading from the top-level 'issues' array safely) ---
  const totalEntries = issues.length;
  const totalPages = Math.ceil(totalEntries / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = issues.slice(indexOfFirstItem, indexOfLastItem);
  const startEntryIndex = totalEntries === 0 ? 0 : indexOfFirstItem + 1;
  const endEntryIndex = Math.min(indexOfLastItem, totalEntries);

  const getStatusStyleClass = (ragValue: 'Red' | 'Amber' | 'Green'): string => {
    switch (ragValue) {
      case 'Red': return 'red-status';
      case 'Amber': return 'amber-status';
      case 'Green': return 'green-status';
    }
  };

  return (
    <div className="row summary-resultrow">
      <div className="col-md-12">
        <h2>NDA Comparison Results</h2>
        
        {/* Dynamic Highlight Metrics Cards Summary */}
        <div className="summary-result">
          <div className="summary-card">
            <span className="result-status">
              Overall result
              <strong className={getStatusStyleClass(overallResult)}>
                <span className="result-sign"></span>
                {overallResult}
              </strong>
            </span>
          </div>
          <div className="summary-card midsummary-card">
            <span className="result-status">
              High priority issues<strong>{highPriorityIssues}</strong>
            </span>
          </div>
          <div className="summary-card">
            <span className="result-status">
              Acceptability
              <span className="acceptability-result">
                {acceptability}
              </span>
            </span>
          </div>
        </div>

        {/* Dynamic Paginated Short-Text Table Grid */}
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
                    <td className="fw-medium text-dark">{item.clause}</td>
                    <td>
                      <strong className={getStatusStyleClass(item.rag)}>
                        <span className="result-sign"></span>
                        {item.rag}
                      </strong>
                    </td>
                    <td className="text-secondary">{item.whatChanged}</td>
                    <td>
                      <div className="d-flex align-items-center justify-content-between gap-2">
                        <span className="text-dark fw-medium">{item.suggestedResponse}</span>
                        <button 
                          type="button"
                          className="btn p-0 border-0 bg-transparent text-success copytext"
                          style={{ outline: 'none' }}
                          title="Copy response text"
                          onClick={() => navigator.clipboard.writeText(item.suggestedResponse)}
                        >
                          <i className="la la-copy ms-1"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Centered Pagination Foot Control Elements with 0px 10px Margins */}
          {totalPages > 1 && (
            <div className="d-flex justify-content-between align-items-center mt-3 px-2">
              <div style={{ fontSize: '13px', color: '#6c757d' }}>
                Showing {startEntryIndex} to {endEntryIndex} of {totalEntries} entries
              </div>
              <ul className="pagination m-0 d-flex justify-content-center align-items-center" style={{ listStyle: 'none', padding: 0 }}>
                <li>
                  <button 
                    type="button" 
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
                    onClick={() => setCurrentPage(p => p - 1)}
                  >
                    Previous
                  </button>
                </li>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                  <li key={pageNum}>
                    <button 
                      type="button" 
                      style={{
                        fontSize: '13px',
                        border: currentPage === pageNum ? '1px solid #ff6100' : '1px solid #A9A6A6',
                        borderRadius: '5px',
                        minWidth: '1.5em',
                        padding: '0.5em 1em',
                        marginLeft: '10px',
                        textAlign: 'center',
                        background: currentPage === pageNum ? '#ff6100' : 'transparent',
                        color: currentPage === pageNum ? '#fff' : '#000',
                        fontWeight: currentPage === pageNum ? 'bold' : 'normal',
                        cursor: 'pointer',
                        outline: 'none'
                    }}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  </li>
                ))}
                <li>
                  <button 
                    type="button" 
                    disabled={currentPage === totalPages} 
                    onClick={() => setCurrentPage(p => p + 1)}
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
  );
};

export default NdaResults;
