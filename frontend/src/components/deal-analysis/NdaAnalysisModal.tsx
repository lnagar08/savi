import React, { useState, useRef, useEffect } from 'react';
import type { ChangeEvent, DragEvent, FormEvent } from 'react';
import uploadLinear from '../../assets/images/upload-linear.svg'
import apiClient from '../../services/api';
import { ComprehensiveNdaResults } from './NdaComparisionResult';

// MAKE SURE THIS INTERFACE MATCHES IN BOTH PLACES

interface NdaRevisedItem {
  id: number;
  ndaAnalysisId: number;
  type: string;
  version: number;
  fileUrl: string | null; // <-- Ensure this is present in BOTH files
  createdAt: string;
}

interface DatabaseNdaRecord {
  id: number;
  dealId: number;
  status: 'Red' | 'Amber' | 'Green';
  issues: number;
  ndaTemplate: string | null;
  ndaDraft: string | null;
  analysisResult: {
    issues: Array<{
      rag: 'Red' | 'Amber' | 'Green';
      clause: string;
      whatChanged: string;
      suggestedResponse: string;
    }>;
  } | null;
  NdaRevised: NdaRevisedItem[]; // Uses the matching item subtype
  createdAt: string;
}


function NdaAnalysisModal({dealId}: {dealId: string}) {
  // File States
  useEffect(() => {
      const modalElement = document.getElementById('myModal');
  
      const handleModalClose = () => {
        setSummaryData(null);
        setHouseNda(null);
        setCounterpartyNda(null);
        setHouseWarning(null);
        setCounterpartyWarning(null);

        if (houseInputRef.current) houseInputRef.current.value = '';
        if (counterpartyInputRef.current) counterpartyInputRef.current.value = '';
      };
  
      if (modalElement) {
        modalElement.addEventListener('hidden.bs.modal', handleModalClose);
      }
  
      return () => {
        modalElement?.removeEventListener('hidden.bs.modal', handleModalClose);
      };
  }, []); 

   const handleClose = () => {
    setSummaryData(null);
    setHouseNda(null);
    setCounterpartyNda(null);
    setHouseWarning(null);
    setCounterpartyWarning(null);

    if (houseInputRef.current) houseInputRef.current.value = '';
    if (counterpartyInputRef.current) counterpartyInputRef.current.value = '';
  };

  const [houseNda, setHouseNda] = useState<File | null>(null);
  const [counterpartyNda, setCounterpartyNda] = useState<File | null>(null);

  // Individual Upload State Indicators
  const [isUploadingHouse, setIsUploadingHouse] = useState<boolean>(false);
  const [isUploadingCounterparty, setIsUploadingCounterparty] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Interactive Message States
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);
  const [houseWarning, setHouseWarning] = useState<string | null>(null);
  const [counterpartyWarning, setCounterpartyWarning] = useState<string | null>(null);

  const [summaryData, setSummaryData] = useState<DatabaseNdaRecord | null>(null);

  // Drag boxes structural visual markers
  const [dragActive1, setDragActive1] = useState<boolean>(false);
  const [dragActive2, setDragActive2] = useState<boolean>(false);

  const houseInputRef = useRef<HTMLInputElement>(null);
  const counterpartyInputRef = useRef<HTMLInputElement>(null);

  // Drag Action Router
  const handleDrag = (e: DragEvent, setDragActive: React.Dispatch<React.SetStateAction<boolean>>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Validating file payload parsing engine
  const processValidationAndUpload = async (
    file: File,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setWarning: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    setLoading(true);
    setWarning(null);
    setGlobalError(null);
    setGlobalSuccess(null);

    // Validate type extension parameters (.pdf, .docx, .txt)
    const allowedExtensions = /(\.pdf|\.docx|\.txt)$/i;
    if (!allowedExtensions.exec(file.name)) {
      setWarning("Unsupported format. Please drop a .pdf, .docx, or .txt file.");
      setFile(null);
      setLoading(false);
      return;
    }

    // Validate size configuration boundaries (Max limit: 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setWarning("File size exceeded. Maximum allowable limit is 5MB.");
      setFile(null);
      setLoading(false);
      return;
    }

    setFile(file);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulated network push processing
    } catch {
      setWarning("Transient connection error parsing document.");
      setFile(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (
    e: DragEvent,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setDragActive: React.Dispatch<React.SetStateAction<boolean>>,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setWarning: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processValidationAndUpload(e.dataTransfer.files[0], setFile, setLoading, setWarning);
    }
  };

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setLoading: React.Dispatch<React.SetStateAction<boolean>>,
    setWarning: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    if (e.target.files && e.target.files[0]) {
      processValidationAndUpload(e.target.files[0], setFile, setLoading, setWarning);
    }
  };

  // Submit Orchestration
  const handleCompareNDAs = async (e: FormEvent) => {
    e.preventDefault();
    if (!houseNda || !counterpartyNda) {
      setGlobalError("Submission rejected. Please supply valid parameters for both files.");
      return;
    }

    setIsSubmitting(true);
    setGlobalError(null);
    setGlobalSuccess(null);

    try {
      // STEP 1: Package raw local state files into FormData bundles
      const uploadData = new FormData();
      uploadData.append('houseNda', houseNda);
      uploadData.append('counterpartyNda', counterpartyNda);
      uploadData.append('dealId', dealId);

      // STEP 2: Persist both files to your database storage bucket via your storage API
      
      const res = await apiClient.post('/ndaAnalysis/compare', uploadData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        })
      if (res.status !== 201) {
        throw new Error("Database file backup sync failed.");
      }

      setSummaryData(res.data);
      setHouseNda(null);
      setCounterpartyNda(null);
      setHouseWarning(null);
      setCounterpartyWarning(null);

      if (houseInputRef.current) houseInputRef.current.value = '';
      if (counterpartyInputRef.current) counterpartyInputRef.current.value = '';

    } catch (error: any) {
      handleClose();
      setGlobalError(error.message || "An unexpected processing error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <div className="modal fade createdeal-modal ndamodal" id="myModal"tabIndex={-1} aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h4 className="modal-title">NDA Analysis</h4>
            <button onClick={handleClose} id="close-bid-modal" type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">
            {/* 1. Global Processing Status Banners */}
            {globalError && (
              <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
                <i className="la la-exclamation-circle me-2 fs-5"></i>
                <div>{globalError}</div>
              </div>
            )}

            {globalSuccess && (
              <div className="alert alert-success d-flex align-items-center mb-4" role="alert">
                <i className="la la-check-circle me-2 fs-5"></i>
                <div>{globalSuccess}</div>
              </div>
            )}
            <div className="formdesign">
              <form onSubmit={handleCompareNDAs}>
              {/* --- House NDA template --- */}
              <div 
                className={`form-group big mb-4 ${dragActive1 ? "drag-active border border-info" : ""}`}
                onDragEnter={(e) => handleDrag(e, setDragActive1)}
                onDragLeave={(e) => handleDrag(e, setDragActive1)}
                onDragOver={(e) => handleDrag(e, setDragActive1)}
                onDrop={(e) => handleDrop(e, setHouseNda, setDragActive1, setIsUploadingHouse, setHouseWarning)}
              >
                <label className="form-label">House NDA template</label>
                <div className="upload-files-container">
                  <div className="drag-file-area">
                    {/* Dynamic Status Icon Block */}
                    <span className="material-icons-outlined upload-icon">
                      {dragActive1 ? (
                        <span>file Upload</span>
                      ) : isUploadingHouse ? (
                        <span 
                          style={{ width: '3rem', height: '3rem' }}
                          className="spinner-border text-info role-status" 
                          aria-hidden="true"
                        ></span>
                      ) : (
                        <img src={uploadLinear} className="img-fluid" alt="Upload" />
                      )}
                    </span>
                    <h3 className="dynamic-message">
                      {isUploadingHouse 
                          ? "Reading file payload..." 
                          : houseNda 
                            ? `Selected: ${houseNda.name}` 
                            : "Drag and drop NDA template here"
                        }
                    </h3>
                    <label className="label">
                      <span className="browse-files">
                        <input
                          type="file"
                          className="default-file-input"
                          ref={houseInputRef}
                          onChange={(e) => handleFileChange(e, setHouseNda, setIsUploadingHouse, setHouseWarning)}
                          hidden
                          accept=".pdf,.docx,.doc"
                        />
                        {houseNda ? (
                          <></>
                        ) : (
                          <span className="browse-files-text">or click to upload</span>
                        )}
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* --- Counterparty NDA draft --- */}
              <div 
                  className={`form-group big mb-4 ${dragActive2 ? "drag-active border border-info" : ""}`}
                  onDragEnter={(e) => handleDrag(e, setDragActive2)}
                  onDragLeave={(e) => handleDrag(e, setDragActive2)}
                  onDragOver={(e) => handleDrag(e, setDragActive2)}
                  onDrop={(e) => handleDrop(e, setCounterpartyNda, setDragActive2, setIsUploadingCounterparty, setCounterpartyWarning)}
                >
                <label className="form-label">Counterparty NDA draft</label>
                <div className="upload-files-container">
                  <div className="drag-file-area">
                    {/* Dynamic Status Icon Block */}
                    <span className="material-icons-outlined upload-icon">
                      {dragActive2 ? (
                        <span>file Upload</span>
                      ) : isUploadingCounterparty ? (
                        <span 
                          style={{ width: '3rem', height: '3rem' }}
                          className="spinner-border text-info role-status" 
                          aria-hidden="true"
                        ></span>
                      ) : (
                        <img src={uploadLinear} className="img-fluid" alt="Upload" />
                      )}
                    </span>

                    <h3 className="dynamic-message">
                      {isUploadingCounterparty 
                        ? "Reading file payload..." 
                        : counterpartyNda 
                          ? `Selected: ${counterpartyNda.name}` 
                          : "Drag and drop NDA draft here"
                      }
                    </h3>
                   
                    <label className="label">
                      <span className="browse-files">
                        <input
                          type="file"
                          className="default-file-input"
                          ref={counterpartyInputRef}
                          onChange={(e) => handleFileChange(e, setCounterpartyNda, setIsUploadingCounterparty, setCounterpartyWarning)}
                          accept=".pdf,.docx,.doc"
                        />
                        {counterpartyNda ? (
                          <></>
                        ) : (
                          <span className="browse-files-text">or click to upload</span>
                        )}
                       
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* --- Status Messages --- */}
             
              {/* --- Compare Button --- */}
              <div className="compare-btn">
                <button
                  type="submit"
                  className="btn btn-info"
                  disabled={isSubmitting || !houseNda || !counterpartyNda}
                >
                  {isSubmitting ? "Comparing..." : "Compare NDAs"}
                </button>
              </div>
            </form>
            </div>

            <ComprehensiveNdaResults 
              data={summaryData} 
              isSubmitting={isSubmitting} 
              onRefreshDataset={(updatedRecord) => setSummaryData(updatedRecord)}
              onToggleLoadingState={(loadingState) => setIsSubmitting(loadingState)}
              setGlobalError={setGlobalError}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default NdaAnalysisModal
