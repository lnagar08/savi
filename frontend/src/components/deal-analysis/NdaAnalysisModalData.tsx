import React, { useState, useRef, useEffect } from 'react';
import type { DragEvent } from 'react';
import uploadLinear from '../../assets/images/upload-linear.svg'
import apiClient from '../../services/api';
//import { ComprehensiveNdaResults } from './NdaComparisionResult';
import { NdaFilesDataTable } from './NdaFilesDataTable';

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

function NdaAnalysisModalData({dealId}: {dealId: string}) {

    const [globalError, setGlobalError] = useState(null);
    const [ndaAnalyses, setNdaAnalyses] = useState<NdaAnalysisData[]>([]);

    useEffect(() => {
        const fetchNdaList = async () => {
            if (!dealId) return;
            try {
                const res = await apiClient.get(`/ndaAnalysis/${dealId}`);
                if (res.status === 200) {
                    // 💾 Stores the absolute raw database array (keeps original files + child revisions together)
                    setNdaAnalyses(res.data || []); 
                } else {
                    throw new Error("Failed to fetch NDA analyses for the deal.");
                }
            } catch (error: any) {
                setGlobalError(error.message || "Something went wrong while loading files.");
            }
        };

        fetchNdaList();
    }, [dealId]);

        
  // File States
  useEffect(() => {
      const modalElement = document.getElementById('myModal');
  
      const handleModalClose = () => {
       
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

    if (houseInputRef.current) houseInputRef.current.value = '';
    if (counterpartyInputRef.current) counterpartyInputRef.current.value = '';
  };

  const [houseNda, setHouseNda] = useState<File | null>(null);
  const [counterpartyNda, setCounterpartyNda] = useState<File | null>(null);

  const [isUploadingHouse, setIsUploadingHouse] = useState<boolean>(false);
  const [isUploadingCounterparty, setIsUploadingCounterparty] = useState<boolean>(false);
  
  const [globalSuccess, setGlobalSuccess] = useState<string | null>(null);
  
  const [dragActive1, setDragActive1] = useState<boolean>(false);
  const [dragActive2, setDragActive2] = useState<boolean>(false);

  const houseInputRef = useRef<HTMLInputElement>(null);
  const counterpartyInputRef = useRef<HTMLInputElement>(null);
  

  const handleDrag = (e: DragEvent, setDragActive: React.Dispatch<React.SetStateAction<boolean>>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  
  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>, 
    fileType: 'house' | 'counterparty', 
    setDragActive: React.Dispatch<React.SetStateAction<boolean>>
    ) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const droppedFile = e.dataTransfer.files[0]; 
        
        uploadFileToDatabase(droppedFile, fileType); 
    }
};

const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, fileType: 'house' | 'counterparty') => {
  if (e.target.files && e.target.files[0]) {
    const selectedFile = e.target.files[0];
    await uploadFileToDatabase(selectedFile, fileType);
  }
};
const uploadToCloudinary = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", "Savitest"); // from Cloudinary
  formData.append("resource_type", "auto");
  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dvlp9r6uu/auto/upload",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!res.ok) {
    throw new Error("Cloudinary upload failed");
  }

  const data = await res.json();
  return {
    url: data.secure_url,
    publicId: data.public_id,
  };
};

const uploadFileToDatabase = async (file: File, fileType: 'house' | 'counterparty') => {
  if (fileType === 'house') setIsUploadingHouse(true);
  if (fileType === 'counterparty') setIsUploadingCounterparty(true);
  setGlobalError(null);

  //const formData = new FormData();
  

  const uploadResult = await uploadToCloudinary(file);
  //formData.append("file", uploadResult.url);
 // formData.append("dealId", String(dealId));
 // formData.append("fileType", fileType);
 // formData.append("version", "1");
  const fileMeta = {
      fileName: file.name,
      fileSize: file.size,
      //fileType: file.type,
      extension: file.name.split('.').pop(),
    };

  try {
    /*const res = await apiClient.post(`/ndaAnalysis/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });*/

    const res = await apiClient.post('/ndaAnalysis/upload', {
          file: uploadResult.url,
          dealId: String(dealId),
          fileType: fileType,
          version: "1",
          ...fileMeta,
        });

    if (res.status === 200 || res.status === 201) {
      const newUploadedItem = res.data; 
      
      setNdaAnalyses((prevList) => [newUploadedItem, ...prevList]); 
      setGlobalSuccess("File uploaded and analyzed successfully!");

      if (fileType === 'house') {
        setHouseNda(null); 
        
        if (houseInputRef.current) {
          houseInputRef.current.value = ""; 
        }
      }
      
      if (fileType === 'counterparty') {
        setCounterpartyNda(null); 
        
        if (counterpartyInputRef.current) {
          counterpartyInputRef.current.value = ""; 
        }
      }

    } else {
      throw new Error("File upload failed. Please try again.");
    }
  } catch (error: any) {
    console.error("Upload error:", error);
    setGlobalError(error.message || "File upload failed. Please try again.");
  } finally {
    setIsUploadingHouse(false);
    setIsUploadingCounterparty(false);
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
              <form>
              {/* --- House NDA template --- */}
                <div 
                className={`form-group big mb-4 ${dragActive1 ? "drag-active border border-info" : ""}`}
                onDragEnter={(e) => handleDrag(e, setDragActive1)}
                onDragLeave={(e) => handleDrag(e, setDragActive1)}
                onDragOver={(e) => handleDrag(e, setDragActive1)}
                onDrop={(e) => handleDrop(e, 'house', setDragActive1)}
                >

                <label className="form-label">House NDA template</label>
                <div className="upload-files-container">
                  <div className="drag-file-area">
                    {/* Dynamic Status Icon Block */}
                    <span className="material-icons-outlined upload-icon">
                      {isUploadingHouse ? (
                        // Yeh spinner tab chalega jab isUploadingHouse = true hoga
                        <span 
                            style={{ width: '3rem', height: '3rem' }}
                            className="spinner-border text-info role-status" 
                            aria-hidden="true"
                        ></span>
                        ) : (
                        // Normal file icon tab dikhega jab loading nahi ho rahi hogi
                        <img src={uploadLinear} className="img-fluid" alt="Upload" />
                        )}
                    </span>
                    <h3 className="dynamic-message">
                        {isUploadingHouse ? "Reading file payload..." : "Drag and drop NDA template here"}
                    </h3>
                    <label className="label">
                      <span className="browse-files">
                        <input
                        type="file"
                        className="default-file-input"
                        ref={houseInputRef}
                        onChange={(e) => handleFileChange(e, 'house')} // Direct handle change function call
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
                onDrop={(e) => handleDrop(e, 'counterparty', setDragActive2)}
                >

                <label className="form-label">Counterparty NDA draft</label>
                <div className="upload-files-container">
                  <div className="drag-file-area">
                    {/* Dynamic Status Icon Block */}
                    <span className="material-icons-outlined upload-icon">
                      {isUploadingCounterparty ? (
                        // Yeh spinner tab chalega jab isUploadingCounterparty = true hoga
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
                        onChange={(e) => handleFileChange(e, 'counterparty')} // Direct handle change function call
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
             
              {/*<div className="compare-btn">
                <button
                  type="submit"
                  className="btn btn-info"
                  disabled={isSubmitting || !houseNda || !counterpartyNda}
                >
                  {isSubmitting ? "Comparing..." : "Compare NDAs"}
                </button>
              </div> */}
              
            </form>
            </div>
            <NdaFilesDataTable 
                data={ndaAnalyses.filter(item => item.parentId === null || item.parentId === undefined)} 
                allData={ndaAnalyses} // Add this prop to give the child component access to the full dataset array
                setNdaAnalyses={setNdaAnalyses} 
            />
            {/*
            <ComprehensiveNdaResults 
              data={summaryData} 
              isSubmitting={isSubmitting} 
              onRefreshDataset={(updatedRecord) => setSummaryData(updatedRecord)}
              onToggleLoadingState={(loadingState) => setIsSubmitting(loadingState)}
              setGlobalError={setGlobalError}
            />
            */}
          </div>
        </div>
      </div>
    </div>
  )
}

export default NdaAnalysisModalData
