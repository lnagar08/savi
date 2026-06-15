import React, { useState } from 'react';
import apiClient from '../../services/api';
import { NdaResults } from './NdaResult';
import tdeye from '../../assets/images/tdeye.svg';
interface NdaAnalysisData {
    id: number;
    dealId: number;
    fileName: string;
    type: string;
    version: number;
    createdAt: string;
    analysisResult?: Record<string, string> | any;
    parentId: number | null;
}
interface NdaFilesDataTableProps {
  data: NdaAnalysisData[];
  setNdaAnalyses: React.Dispatch<React.SetStateAction<NdaAnalysisData[]>>;
}
interface NdaFilesDataTableProps {
  data: NdaAnalysisData[];       // 📋 Holds filtered original items (parentId === null) for table pagination rows
  allData: NdaAnalysisData[];    // 📋 Holds the complete raw portfolio data array loop context for history dropdown rendering
  setNdaAnalyses: React.Dispatch<React.SetStateAction<NdaAnalysisData[]>>;
}

export const NdaFilesDataTable: React.FC<NdaFilesDataTableProps> = ({ data, allData, setNdaAnalyses }) => {
   
    const [currentPage, setCurrentPage] = useState<number>(1);
    const itemsPerPage = 5; 

    const [selectedClauses, setSelectedClauses] = useState<Record<string, string> | null>(null);
    const [selectedFileName, setSelectedFileName] = useState<string | number>("");
    const [ndaList, setNdaList] = useState<NdaAnalysisData[]>([]);
    const [selectedType, setSelectedType] = useState<string>("house"); // Track active selector choice
    //const [selectedLookupFileName, setSelectedLookupFileName] = useState<string>("");
    const [activeSourceRow, setActiveSourceRow] = useState<NdaAnalysisData | null>(null);
    const [isAiComparing, setIsAiComparing] = useState<boolean>(false);
    const [isUploadRevised, setIsUploadRevised] = useState<boolean>(false);
    const [aiCompareResult, setAiCompareResult] = useState<any>(null);

    const [selectedLookupId, setSelectedLookupId] = useState<string>("");
    const [lookupVersions, setLookupVersions] = useState<any[]>([]); 
    const [selectedCompareVersionId, setSelectedCompareVersionId] = useState<string>(""); 

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    
    const currentRows = data.slice(indexOfFirstItem, indexOfLastItem);
    
    const totalPages = Math.ceil(data.length / itemsPerPage);

    const handlePrevPage = () => {
        if (currentPage > 1) setCurrentPage(currentPage - 1);
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };


    const [clausePage, setClausePage] = useState<number>(1);
    const clausesPerPage = 5;
    // ====================================================================
// FLOW A: MAIN VIEW ACTION (When Eye Button clicked on Main Table)
// ====================================================================
const handleViewClauses = (row: NdaAnalysisData) => {
    if (row.analysisResult) {
        const clauses = typeof row.analysisResult === 'string' 
            ? JSON.parse(row.analysisResult) 
            : row.analysisResult;
        
        setActiveSourceRow(row);
        setSelectedClauses(clauses);
        setSelectedFileName(row.id || "");
        setClausePage(1);
        setAiCompareResult(null);

        // Determine opposite type parameters
        const oppositeUiType = row.type === 'house' ? 'counterparty' : 'house';
        const schemaOppositeType = row.type === 'house' ? 'counterparty' : 'house';
        
        setSelectedType(oppositeUiType);

        // Filter master list for opposite root items using allData prop
        const initialOppositeList = allData.filter(item => 
            item.type === schemaOppositeType && 
            (item.parentId === null || item.parentId === undefined) && 
            item.fileName !== row.fileName
        );

        setNdaList(initialOppositeList);

        // 🚀 CRITICAL FIX: Extract using strict [0] array bracket indexing
        if (initialOppositeList.length > 0) {
            const firstItem = initialOppositeList[0]; // ✅ Fixed: added [0] index bracket
            const firstItemIdStr = String(firstItem.id);
            setSelectedLookupId(firstItemIdStr);

            // Fetch history tracking rows using allData
            const associatedRevisions = allData.filter(item => item.parentId === firstItem.id);
            const fullVersionHistoryTimeline = [firstItem, ...associatedRevisions].sort(
                (a, b) => a.version - b.version
            );

            setLookupVersions(fullVersionHistoryTimeline);

            if (fullVersionHistoryTimeline.length > 0) {
                const latestVersionEntry = fullVersionHistoryTimeline[fullVersionHistoryTimeline.length - 1];
                setSelectedCompareVersionId(String(latestVersionEntry.id));
            }
        } else {
            setSelectedLookupId("");
            setLookupVersions([]);
            setSelectedCompareVersionId("");
        }
    }
};

// ====================================================================
// FLOW B: TYPE DROPDOWN MODIFICATION (Template ↔ Counterparty)
// ====================================================================
const handleTypeSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const chosenType = e.target.value; 
    setSelectedType(chosenType);

    // Initial clean resets
    setSelectedLookupId("");
    setLookupVersions([]);
    setSelectedCompareVersionId("");
    setAiCompareResult(null);

    const schemaTargetType = chosenType === 'counterparty' ? 'counterparty' : 'house';

    const refreshedList = allData.filter(item => 
        item.type === schemaTargetType && 
        (item.parentId === null || item.parentId === undefined) && 
        item.id !== selectedFileName
    );

    setNdaList(refreshedList);

    // 🚀 CRITICAL FIX: Extract using strict [0] array bracket indexing
    if (refreshedList.length > 0) {
        const firstItem = refreshedList[0]; // ✅ Fixed: added [0] index bracket
        const firstItemIdStr = String(firstItem.id);
        
        setSelectedLookupId(firstItemIdStr);

        const associatedRevisions = allData.filter(item => item.parentId === firstItem.id);
        const fullVersionHistoryTimeline = [firstItem, ...associatedRevisions].sort(
            (a, b) => a.version - b.version
        );

        setLookupVersions(fullVersionHistoryTimeline);

        if (fullVersionHistoryTimeline.length > 0) {
            const latestVersionEntry = fullVersionHistoryTimeline[fullVersionHistoryTimeline.length - 1];
            setSelectedCompareVersionId(String(latestVersionEntry.id));
        }
    } else {
        setLookupVersions([]);
        setSelectedCompareVersionId("");
    }
};

// ====================================================================
// FLOW C: AVAILABLE CLAUSES DOCUMENT SELECTION DROPDOWN CHANGE
// ====================================================================
const handleLookupFileChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const chosenParentIdStr = e.target.value;
    setSelectedLookupId(chosenParentIdStr);
    setAiCompareResult(null);
    setLookupVersions([]);
    setSelectedCompareVersionId("");

    if (!chosenParentIdStr) return;

    const targetParentIdInt = parseInt(chosenParentIdStr, 10);
    // Search within ndaList cache parameters
    const originalRootRecord = ndaList.find(item => item.id === targetParentIdInt);
    
    if (originalRootRecord) {
        const associatedRevisions = allData.filter(item => item.parentId === targetParentIdInt);
        const fullVersionHistoryTimeline = [originalRootRecord, ...associatedRevisions].sort(
            (a, b) => a.version - b.version
        );

        setLookupVersions(fullVersionHistoryTimeline);

        if (fullVersionHistoryTimeline.length > 0) {
            const latestVersionEntry = fullVersionHistoryTimeline[fullVersionHistoryTimeline.length - 1];
            setSelectedCompareVersionId(String(latestVersionEntry.id));
        }
    }
};


const handleUploadRevisedTargetClick = () => {
    if (!selectedLookupId) {
        alert("Please select an Available Clauses Document first.");
        return;
    }
    
    const targetParentIdInt = parseInt(selectedLookupId, 10);
    const originalRootRecord = ndaList.find(item => item.id === targetParentIdInt);
    if (!originalRootRecord) return;

    // Calculate the incremental version index count safely in memory
    const calculatedNextVersion = lookupVersions.length + 1;

    const fileSelectorElement = document.createElement('input');
    fileSelectorElement.type = 'file';
    fileSelectorElement.accept = '.doc,.docx,.pdf';

    fileSelectorElement.onchange = async (e: any) => {
        const freshSelectedFile = e.target.files?.[0];
        if (!freshSelectedFile) return;
        setIsUploadRevised(true);
        //setIsAiComparing(true); // Toggle background pending indicator spinner on

        const payload = new FormData();
        payload.append('file', freshSelectedFile);
        payload.append('dealId', String(originalRootRecord.dealId));
        payload.append('parentId', String(targetParentIdInt)); // 🎯 Bind parentId hook safely
        payload.append('fileType', originalRootRecord.type);       // Preserve core template vs draft category parameters
        payload.append('version', String(calculatedNextVersion));

                    try {
            const res = await apiClient.post(`/ndaAnalysis/upload`, payload, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            if (res.status !== 200 && res.status !== 201) throw new Error("Upload tracking process failed.");
            
            const newDatabaseRow: NdaAnalysisData = res.data;

            // 🚀 REAL-TIME RE-SYNC: Append to the parent state pool. 
            // It will automatically bypass the main table rows view since item.parentId !== null
            setNdaAnalyses((prevData: NdaAnalysisData[]) => [...prevData, newDatabaseRow]);

            // Immediately expand your current sidebar version tracking array list to include the new row
            const updatedHistoryTimeline = [...lookupVersions, newDatabaseRow].sort(
                (a, b) => a.version - b.version
            );
            setLookupVersions(updatedHistoryTimeline);

            // Automatically advance the "Compare against" dropdown selection pointer to target this new row ID
            setSelectedCompareVersionId(String(newDatabaseRow.id));

            //alert(`Version V${calculatedNextVersion} uploaded successfully. Click 'Compare NDAs' to analyze.`);

        } 
 catch (err) {
            alert("Failed saving document revision entry row into database.");
        } finally {
            setIsUploadRevised(false);
            //setIsAiComparing(false);
        }
    };

    fileSelectorElement.click();
};


    const handleCompareClick = async () => {
        if (!activeSourceRow || !selectedCompareVersionId) {
            alert("Please select both a source document and a target version to compare.");
            return;
        }

        setIsAiComparing(true);
        setAiCompareResult(null);

        try {
            
            const res = await apiClient.post(`/ndaAnalysis/cross-compare-clauses`, {
                sourceFileId: activeSourceRow.id,
                targetLookupFileId: parseInt(selectedCompareVersionId, 10) 
            }, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.status !== 200) throw new Error("Server comparison failed.");
            setAiCompareResult(res.data);

        } catch (err) {
            alert("Failed executing cross-clause legal comparison computation.");
        } finally {
            setIsAiComparing(false);
        }
    };

    return (
        <div>
            
            <div className="tabledesign filterno whitebg mt-4">
                <h5>NDA Analysis Lists</h5>
                <div className="table-responsive">
                    <table className="table dt-responsive categories_table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Type</th>
                                <th>Version</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            
                            {currentRows.length > 0 ? (
                                currentRows.map((row) => (
                                    <tr key={row.id}>
                                        <td>{row.fileName}</td>
                                        <td>{row.type === 'house' ? 'Template' : 'Draft'}</td>
                                        <td>V{row.version}</td>
                                        <td>{new Date(row.createdAt).toLocaleDateString('en-CA')}</td>
                                        <td className="tdaction">
                                            <button 
                                                onClick={() => handleViewClauses(row)} 
                                                className="btn btn-sm"
                                                title="View Clauses"
                                            >
                                                <img className="img-fluid" src={tdeye} alt="View Clauses" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-3 text-muted">
                                        No files found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="d-flex justify-content-between align-items-center px-3 py-2 border-top">
                        <div className="text-muted small">
                            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, data.length)} of {data.length} entries
                        </div>
                        <nav aria-label="Table navigation">
                            <ul className="pagination pagination-sm mb-0">
                                {/* Previous Button */}
                                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                    <button className="page-link" 
                                    onClick={handlePrevPage} 
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
                                    >
                                        Previous
                                    </button>
                                </li>

                                {/* Dynamic Page Numbers */}
                                {[...Array(totalPages)].map((_, index) => {
                                    const pageNumber = index + 1;
                                    return (
                                        <li key={pageNumber} className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}>
                                            <button className="page-link" 
                                            onClick={() => setCurrentPage(pageNumber)}
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
                                                }}>
                                                {pageNumber}
                                            </button>
                                        </li>
                                    );
                                })}

                                {/* Next Button */}
                                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                    <button className="page-link" 
                                    onClick={handleNextPage} 
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
                        >
                                        Next
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                )}
            </div>
            {selectedClauses && (() => {
            const clauseEntries = Object.entries(selectedClauses);
            
            const indexOfLastClause = clausePage * clausesPerPage;
            const indexOfFirstClause = indexOfLastClause - clausesPerPage;
            const currentClauses = clauseEntries.slice(indexOfFirstClause, indexOfLastClause);
            const totalClausePages = Math.ceil(clauseEntries.length / clausesPerPage);

    return (
        <div className="whitebg mt-4 shadow-sm">
            <div className="card-header text-white d-flex justify-content-between align-items-center" style={{ backgroundColor: 'transparent', borderBottom: '1px solid #A9A6A6' }}>
                <h5 className="mb-0 fs-6" style={{ color: '#000' }}>
                    <i className="fa fa-file-text me-2"></i> 
                    Extracted Clauses <span className="fw-normal">{}</span>
                </h5>
                <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setSelectedClauses(null)}
                    aria-label="Close"
                ></button>
            </div>

            <div className="row summary-resultrow">
        {/* LEFT COLUMN: ISSUES CLASSIFICATION TABLES */}
        <div className="col-md-4">
            <div className="version-strip">
            <div className="tabledesign filterno issues-table">
            <div className="table-responsive">
                <table className="table dt-responsive categories_table">
                <thead>
                    <tr>
                    <th style={{ minWidth: '110px' }}>Clause</th>
                    </tr>
                </thead>
                        <tbody>
                            {/* 3. Pure array ke bajay sirf current page ke sliced items map honge */}
                            {currentClauses.map(([clauseKey, clauseValue]) => (
                                <tr key={clauseKey}>
                                    <td className="ps-3 py-3">
                                        <strong className="text-muted">{clauseKey}:</strong>
                                        <span className="text-secondary">{String(clauseValue)}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                
            </div>
        </div>
        </div>
       
        {/* RIGHT SIDEBAR COLUMN: VERSION TREE STACKS */}
 <div className="col-md-8">
  <div className="version-strip">
    
    {/* Type Selection Box */}
    <div className="form-group mb-3">
      <h3><strong>Type</strong></h3>
      <select className="form-control form-select" id="typeSelect" value={selectedType} onChange={handleTypeSelectChange}>
        <option value="house">Template</option>
        <option value="counterparty">Counterparty</option>
      </select>
    </div>

    {/* Available Clauses Document Dropdown */}
    <div className="form-group mb-3">
      <h3><strong>Available Clauses Document</strong></h3>
      <select 
        className="form-control form-select" 
        value={selectedLookupId} /* 🚀 Dynamic Two-way binding */
        onChange={handleLookupFileChange} 
        disabled={ndaList.length === 0}
      >
        {ndaList.length > 0 ? (
          <>
            <option value="">-- Select an option --</option>
            {ndaList.map((item) => (
              <option key={item.id} value={String(item.id)}>
                {item.fileName}
              </option>
            ))}
          </>
        ) : (
          <option value="">No {selectedType === 'house' ? 'Template' : 'Counterparty'} type clauses available</option>
        )}
      </select>
    </div>

    {/* Version Heading Indicator */}
    <h3>
      <strong>Current version:</strong> V{lookupVersions.length > 0 ? lookupVersions[lookupVersions.length - 1].version : 1}
    </h3>
    
    {/* Compare Against History Version Dropdown */}
    <div className="form-group mb-3">
      <select 
        className="form-control form-select" 
        value={selectedCompareVersionId} /* 🚀 Dynamic Two-way binding */
        onChange={(e) => setSelectedCompareVersionId(e.target.value)}
        disabled={lookupVersions.length === 0}
      >
        {lookupVersions.length > 0 ? (
          <>
            <option value="">-- Select a version to compare --</option>
            {lookupVersions.map((vItem) => (
              <option key={vItem.id} value={String(vItem.id)}>
                Compare against V{vItem.version} / {vItem.type === 'house' ? 'house' : 'Counterparty'}
              </option>
            ))}
          </>
        ) : (
          <option value="">No history versions available</option>
        )}
      </select>
    </div>
    
    <button 
      type="button" 
      className="btn btn-info w-100 text-white fw-bold mb-3 btn-sm"
      onClick={handleUploadRevisedTargetClick}
      disabled={!selectedLookupId || isAiComparing || isUploadRevised}
    >
        {isUploadRevised ? (
            <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Uploading...
            </>
        ) : (
            `Upload revised ${selectedType === 'house' ? 'Template' : 'Counterparty'}`
        )}
     
    </button>
    
    <h4>History</h4>
    <ul>
      {lookupVersions.map((vItem) => (
        <li key={vItem.id}>
          <strong>V{vItem.version}</strong> {vItem.type === 'house' ? 'house' : 'Counterparty'} Uploaded
        </li>
      ))}
      {lookupVersions.length === 0 && <li className="text-muted small">No history items found.</li>}
    </ul>
  </div>
  {/* COMPARE ACTION TRIGGER BUTTON (WITH SPACING & ALIGNMENT) */}
<div className="d-flex justify-content-end w-100 my-3">
  <button 
    type="button" 
    className="btn btn-info px-4 text-white fw-bold"
    onClick={handleCompareClick}    
    disabled={isAiComparing || !selectedCompareVersionId}
    style={{ outline: 'none' }}
  >
    {isAiComparing ? (
      <>
        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        Comparing...
      </>
    ) : (
      "Compare NDAs"
    )}
  </button>
</div>

</div>



      {/* 4. Clauses Pagination HTML Controls */}
                {totalClausePages > 1 && (
                    <div className="d-flex justify-content-between align-items-center px-3 py-2 border-top bg-light">
                        <div className="text-muted small">
                            Showing {indexOfFirstClause + 1} to {Math.min(indexOfLastClause, clauseEntries.length)} of {clauseEntries.length} clauses
                        </div>
                        <nav aria-label="Clauses table navigation">
                            <ul className="pagination pagination-sm mb-0">
                                {/* Prev Button */}
                                <li className={`page-item ${clausePage === 1 ? 'disabled' : ''}`}>
                                    <button 
                                        className="page-link" 
                                        onClick={() => setClausePage(clausePage - 1)} 
                                        disabled={clausePage === 1}
                                        style={{
                                            fontSize: '13px',
                                            border: '1px solid #A9A6A6',
                                            borderRadius: '5px',
                                            minWidth: '1.5em',
                                            padding: '0.5em 1em',
                                            marginLeft: '10px',
                                            textAlign: 'center',
                                            background: 'transparent',
                                            color: clausePage === 1 ? '#000' : '#000',
                                            cursor: clausePage === 1 ? 'not-allowed' : 'pointer',
                                            opacity: clausePage === 1 ? 0.6 : 1,
                                            outline: 'none'
                                        }}
                                    >
                                        Previous
                                    </button>
                                </li>

                                {/* Dynamic Numbers */}
                                {[...Array(totalClausePages)].map((_, index) => {
                                    const pNum = index + 1;
                                    return (
                                        <li key={pNum} className={`page-item ${clausePage === pNum ? 'active' : ''}`}>
                                            <button className="page-link" 
                                            onClick={() => setClausePage(pNum)}
                                            style={{
                                                fontSize: '13px',
                                                border: clausePage === pNum ? '1px solid #ff6100' : '1px solid #A9A6A6',
                                                borderRadius: '5px',
                                                minWidth: '1.5em',
                                                padding: '0.5em 1em',
                                                marginLeft: '10px',
                                                textAlign: 'center',
                                                background: clausePage === pNum ? '#ff6100' : 'transparent',
                                                color: clausePage === pNum ? '#fff' : '#000',
                                                fontWeight: clausePage === pNum ? 'bold' : 'normal',
                                                cursor: 'pointer',
                                                outline: 'none'
                                            }}
                                            >
                                                {pNum}
                                            </button>
                                        </li>
                                    );
                                })}

                                {/* Next Button */}
                                <li className={`page-item ${clausePage === totalClausePages ? 'disabled' : ''}`}>
                                    <button 
                                        className="page-link" 
                                        onClick={() => setClausePage(clausePage + 1)} 
                                        disabled={clausePage === totalClausePages}
                                        style={{
                                        fontSize: '13px',
                                        border: '1px solid #A9A6A6',
                                        borderRadius: '5px',
                                        minWidth: '1.5em',
                                        padding: '0.5em 1em',
                                        marginLeft: '10px',
                                        textAlign: 'center',
                                        background: 'transparent',
                                        color: clausePage === totalClausePages ? '#000' : '#000',
                                        cursor: clausePage === totalClausePages ? 'not-allowed' : 'pointer',
                                        opacity: clausePage === totalClausePages ? 0.6 : 1,
                                        outline: 'none'
                                    }}
                                    >
                                        Next
                                    </button>
                                </li>
                            </ul>
                        </nav>
                    </div>
                    
                )}
                </div>

           {/* ====================================================================
                    DYNAMIC BOTTOM SCREEN AREA: TRACKS INTERACTIVE AI PIPELINE LIFECYCLES
                    ==================================================================== */}
                <div className="col-md-12">
                    
                    {isAiComparing ? (
                    /* ⏳ STATE A: SHOW LOADER INSTANTLY ON DROPDOWN CLICK CHANGE */
                    <div className="text-center p-5 border rounded bg-white shadow-sm my-3">
                        <div 
                        style={{ width: '3rem', height: '3rem' }} 
                        className="spinner-border text-info mb-3" 
                        role="status"
                        ></div>
                        <h5 className="text-secondary">Please wait...</h5>
                        <p className="text-muted small mb-0">
                        Comparing new document streams against your active baseline contract clauses.
                        </p>
                    </div>
                    ) : aiCompareResult ? (
                    /* 📊 STATE B: RENDER FLAT RESULTS MATRIX ON SUCCESSFUL COMPILATION */
                    <div className="mt-3">
                        <NdaResults data={aiCompareResult} />
                    </div>
                    ) : (
                    /* 🔍 STATE C: DEFAULT EMPTY INNER BORDER PLACEHOLDER ACCORDING TO VIEWPORT LAYOUTS */
                    selectedClauses && (
                        <div className="text-center p-5 border rounded bg-light border-dashed mt-3">
                        <span className="fs-1 d-block mb-2">⚖️</span>
                        <h6 className="text-secondary fw-semibold">Cross-Document Comparison Ready</h6>
                        <p className="text-muted small mb-0">
                            Select an available contract from the dropdown menu above to automatically cross-examine legal risk deltas.
                        </p>
                        </div>
                    )
                    )}

                </div>



            </div>
    );
})()}

        </div>
    );
};
