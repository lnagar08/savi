import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import uploadLinear from '../../assets/images/upload-linear.svg'
import Editor from '../Editor'
import apiClient from '../../services/api';
import { useLocation } from 'react-router-dom';


declare const bootstrap: any;

interface BidLetterProps {
  dealId: string | null;
  dealName: string | undefined;
  dealLocation: string | undefined;
  yieldValue: string;
  uploadedBy: string;
  createdAt: string | undefined;
  mode?: 'create' | 'edit';
  setModalMode: (mode: 'create' | 'edit') => void;
  selectedBidId: number
}

function CreateBidLetterModal({ dealId, dealName, dealLocation, yieldValue, uploadedBy, createdAt, mode = 'create', setModalMode, selectedBidId }: BidLetterProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bidLetterName, setBidLetterName] = useState("");
  const [error, setError] = useState("");
  const [bidLetterContent, setBidLetterContent] = useState('')
  const modalRef = useRef(null);
const location = useLocation();
  useEffect(() => {
    const modalElement = document.getElementById('myModal3');

    const handleModalClose = () => {
      setBidLetterName("");
      setBidLetterContent("");
      setErrorMessage("");
      setUploadedFile(null);
      setModalMode('create');
    };

    if (modalElement) {
      modalElement.addEventListener('hidden.bs.modal', handleModalClose);
    }

    return () => {
      modalElement?.removeEventListener('hidden.bs.modal', handleModalClose);
    };
}, [setModalMode]); 

useEffect(() => {
  const fetchBidData = async () => {
    if (mode === 'edit' && selectedBidId) {
      try {
        const res = await apiClient.get(`/bidLetter/${selectedBidId}`);
        const data = res.data?.data ?? res.data;
        setBidLetterName(data.projectName || "");
        setBidLetterContent(data.rawContent || "");
      } catch (err) {
        console.error("Error fetching:", err);
      }
    } else {
      
      setBidLetterName("");
      setBidLetterContent("");
    }
  };

  fetchBidData();
}, [selectedBidId, mode]); 

useEffect(() => {
  document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
  document.body.classList.remove('modal-open');
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
}, [location]);
  const cleanupModal = (id : string) => {
  const modalBox = document.getElementById(id);
  if (modalBox) {
    modalBox.style.display = 'none';
    modalBox.classList.remove('show');
    modalBox.setAttribute('aria-hidden', 'true');
  }

  document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
  document.body.classList.remove('modal-open');
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
};

const handleClose = () => {
  setBidLetterName("");
  setBidLetterContent("");
  setErrorMessage("");
  setError("");
  setUploadedFile(null);
  setModalMode('create'); 

  cleanupModal('myModal3');
};

  const date = new Date(createdAt || "");
  const formattedTime = createdAt 
  ? date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  : "N/A";

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragover' || e.type === 'dragenter') {
      setIsDragActive(true)
    } else if (e.type === 'dragleave') {
      setIsDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      setUploadedFile(files[0])
      handleUploadFile(files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files && files.length > 0) {
      setErrorMessage('')
      setUploadedFile(files[0])
      handleUploadFile(files[0])
    }
    e.currentTarget.value = ''
  }

  const handleUploadFile = async (fileToUpload?: File) => {
    const file = fileToUpload ?? uploadedFile
    if (!file) {
      setErrorMessage('Please upload a file first')
      setTimeout(() => setErrorMessage(''), 3000)
      return
    }

    if (!dealId) {
      setErrorMessage('Something went wrong')
      setTimeout(() => setErrorMessage(''), 3000)
      return
    }

    setErrorMessage('')
    setUploadedFile(file)

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('dealId', dealId)
    try {
      const res = await apiClient.post('/bidLetter', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      })
      if (res.status === 200 || res.status === 201) {
       
        setBidLetterContent(res.data.data);
        setUploadedFile(null);
      } else {
        setErrorMessage('Something went wrong! try again..');
        setBidLetterContent('');
      }

    } catch (error: any) {
      setErrorMessage(error.message || 'Something went wrong!');
      console.error('Error fetching bid letter:', error);
      setBidLetterContent('');
      setUploadedFile(null);
    } finally {
      setIsUploading(false);
    }
  }
  const handleCreateBidLetter = async () => {
    if (bidLetterName.length < 5) {
      setError("Please enter name at least 5 characters before saving.");
      return; 
    }
    setIsSubmitting(true)
    try {
      if (!dealId) {
        setErrorMessage('Something went wrong')
        setTimeout(() => setErrorMessage(''), 3000)
        return
      }
      if (!bidLetterContent) {
        setErrorMessage('Something went wrong')
        setTimeout(() => setErrorMessage(''), 3000)
        return
      }
      const payload = {
        dealId: dealId,
        name: bidLetterName, 
        rowContent: bidLetterContent, 
      };
      let res; 

      if (mode === 'edit') {
        res = await apiClient.put(`/bidLetter/${selectedBidId}`, payload);
      } else {
        res = await apiClient.post('/bidLetter/bidSubmit', payload);
      }
    
      if (res.status === 200 || res.status === 201) {
        queryClient.invalidateQueries({ queryKey: ['bidLetter', dealId] });
        setBidLetterContent('');
        setUploadedFile(null);
        handleClose();
      } else {
        setErrorMessage('Something went wrong! try again..');
        setIsSubmitting(false);
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Something went wrong!');
      console.error('Error fetching bid letter:', error);
      setBidLetterContent('');
    } finally {
      setIsSubmitting(false);
    }
  }
const validateName = (value: string) => {
  setBidLetterName(value);
  
  if (value.trim() === "") {
    setError("Name is required.");
  } else if (value.length < 5) {
    setError("Minimum 5 characters are required.");
  } else {
    setError(""); 
  }
};

  return (
    <div className="modal fade createdeal-modal" id="myModal3" tabIndex={-1} aria-hidden="true" data-bs-backdrop="static" data-bs-keyboard="false">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h4 className="modal-title">{mode === 'edit' ? 'Update Bid Letter' : 'Create Bid Letter'}</h4>
            <button ref={modalRef} onClick={handleClose} id="close-bid-modal" type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <div className="formdesign">
              <form id="createBidLetterForm" onSubmit={(e) => e.preventDefault()}>
                {mode === 'create' && (
                <div className="form-group big">
                  <label className="form-label">Upload your bid letter template</label>
                  <div className="upload-files-container">
                      <div
                        className="drag-file-area"
                        onDragOver={handleDrag}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                      >
                        <span className="material-icons-outlined upload-icon">
                          {isDragActive ? (
                            <span>file Upload</span>
                          ) : uploadedFile ? (
                            <span 
                            style={{ width: '3rem', height: '3rem' }}
                            className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          ) : (
                            <img src={uploadLinear} className="img-fluid" alt="Upload" />
                          )}
                        </span>
                        <h3 className="dynamic-message">
                          {isDragActive
                            ? 'Drop your file here!'
                          : uploadedFile ? 
                          <>
                          {uploadedFile.name}
                          <div className="alert alert-info text-center py-2 mb-2 small" role="alert">
                        Please wait while the template is being generated. This may take up to 2 minutes.
                      </div>
                          </>
                          
                          
                          : 'Drag and drop deal documents here'
                          }
                        </h3>
                        <label className="label">
                          <span className="browse-files">
                            <input
                              ref={fileInputRef}
                              type="file"
                              className="default-file-input"
                              onChange={handleFileInputChange}
                              accept=".pdf,.docx,.doc"
                            />
                            {uploadedFile ? (
                              <></>
                            ) : (
                              <span className="browse-files-text">or click to upload</span>
                              
                            )}
                          </span>
                        </label>
                        <span
                          className="cannot-upload-message"
                          style={{
                            display: errorMessage ? 'flex' : 'none',
                            animation: 'fadeIn linear 1.5s',
                          }}
                        >
                          <span className="material-icons-outlined">error</span>
                          <span>{errorMessage}</span>
                          <span
                            className="material-icons-outlined cancel-alert-button"
                            onClick={() => setErrorMessage('')}
                            style={{ cursor: 'pointer' }}
                          >
                            cancel
                          </span>
                        </span>
                        <button
                          type="button"
                          className="upload-button"
                          onClick={() => handleUploadFile()}
                          style={{
                            width: '0px',
                            opacity: 0,
                            height: '0px',
                            padding: '0px',
                            margin: '0px',
                          }}
                        >
                          Upload
                        </button>
                      </div>
                    </div>
                    
                  <div className="note">Supported files: PDF, DOCX <br />Upload your bid letter template. AI will extract structure and map deal data automatically.</div>
               
                </div>
                )}
                <h5 className="shot-heading">AI Extracted Data</h5>
                <div className="table-responsive">
                  <div className="tabledesign">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Template Field</th>
                          <th>Mapped Data</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Deal Name</td>
                          <td>{dealName}</td>
                          <td><span className="aicheck"><i className="la la-check-circle"></i></span></td>
                        </tr>
                        <tr>
                          <td>Location</td>
                          <td>{dealLocation}</td>
                          <td><span className="aicheck"><i className="la la-check-circle"></i></span></td>
                        </tr>
                        <tr>
                          <td>Yield</td>
                          <td>{yieldValue}</td>
                          <td><span className="aicheck"><i className="la la-check-circle"></i></span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                {/* Name Input Group */}
                <div className="form-group mb-4">
                  <label className="form-label">Name</label>
                  <input 
                    type='text' 
                    name="bidlettername" 
                    className="form-control" 
                    value={bidLetterName} 
                    onChange={(e) => validateName(e.target.value)} 
                    placeholder="Enter bid letter name" 
                    
                  />
                  {error && (
                    <small className="text-danger" style={{ marginTop: '5px', display: 'block' }}>
                      {error}
                    </small>
                  )}
                </div>
                <div className="form-group openbtn">
                  <label>Editor <button className="btn btn-info" type="button">Open in App</button></label>
                  <Editor
                    value={bidLetterContent}
                    onChange={setBidLetterContent} 
                    placeholder="Write your bid letter content here..."
                  />
                  
                </div>
                <div className="createby">
                  <ul>
                    <li>Template uploaded by <strong>{uploadedBy}</strong></li>
                    <li>AI-generated at <strong>{formattedTime}</strong></li>
                    <li>Shared with Credit, etc.</li>
                    <li>Edited by <strong>{uploadedBy}</strong></li>
                    <li>Finalized by <strong>{uploadedBy}</strong></li>
                  </ul>
                </div>
              </form>
            </div>
          </div>
          <div className="modal-footer">
           <button 
            disabled={
              (bidLetterName?.length || 0) < 5 || 
              !bidLetterContent?.trim() || 
              isSubmitting
            }
            onClick={handleCreateBidLetter}
            type="button" 
            className="btn btn-info"
          >
            
            {isSubmitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                {mode === 'edit' ? 'Updating...' : 'Creating...'}
              </>
            ) : mode === 'edit' ? 'Update Bid Letter' : 'Create Bid Letter'}
          </button>

          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateBidLetterModal
