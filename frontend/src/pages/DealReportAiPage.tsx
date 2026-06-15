import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'
import uploadLinear from '../assets/images/upload-linear.svg'
import AiAssistantModal from '../components/dashboard/AiAssistantModal'
import Editor from '../components/Editor'
import apiClient from '../services/api';
import { useSearchParams } from 'react-router-dom';
import tdeye from '../assets/images/tdeye.svg'
import tddelete from '../assets/images/tddelete.svg'

type DealData = {
  id: number;
  name: string;
  location: string;
  yield: number;
  user: {
    id: number;
    name: string;
    email: string;
  }
}

function DealReportAiPage() {
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams()
  const dealId = searchParams.get('dealId')!;
  const [isLoading, setIsLoading] = useState(true)
  const [dbMessage, setDbMessage] = useState('')
  const [isValidDeal, setIsValidDeal] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [reportContent, setReportContent] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [dealData, setDealData] = useState<DealData | null>(null)
  const [reportName, setReportName] = useState('')
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'create' | 'edit'>('create')
  const [selectedReportId, setSelectedReportId] = useState<number | null>(null)
  

  const { data: reportData, isLoading: isReportLoading } = useQuery<DealData>({
      queryKey: ['reports', dealId],
      queryFn: async () => {
        const res = await apiClient.get(`/report/deal/${dealId}`);
        return res.data?.data ?? res.data ?? null;
      },
      enabled: Boolean(dealId),
      staleTime: 5 * 60 * 1000,
    });

  useEffect(() => {
    if (!dealId) {
      setDbMessage('Deal ID is missing. Please provide a valid dealId.')
      setIsLoading(false)
      setIsValidDeal(false)
      return
    }

    const checkDealInDatabase = async () => {
      try {
        setIsLoading(true)
        const res = await apiClient.get(`deals/${dealId}`)
        
        if (res.status === 200) {
          setIsValidDeal(true)
          setDbMessage('') 
          const dealInfo = {
            id: res.data.data.id,
            name: res.data.data.name,
            location: res.data.data.location,
            yield: res.data.data.financial_information.net_initial_yield_percent,
            user: res.data.data.user,
          }
          setDealData(dealInfo)
        } else {
          setIsValidDeal(false)
          setDbMessage(res.data.message || 'Deal ID not found.')
        }
      } catch (error: any) {
        setIsValidDeal(false)
        setDbMessage(error.response?.data?.message || 'Error checking deal ID. Please try again.' )
      } finally {
        setIsLoading(false)
      }
    }

    checkDealInDatabase()
  }, [dealId])

  useEffect(() => {
    const fetchBidData = async () => {
      if (mode === 'edit' && selectedReportId) {
        try {
          const res = await apiClient.get(`/report/${selectedReportId}`);
          const data = res.data?.data ?? res.data;
          
          setReportContent(data.rawContent || "");
        } catch (err) {
          console.error("Error fetching:", err);
        }
      } else {
        setReportContent("");
      }
    };
  
    fetchBidData();
  }, [selectedReportId, mode]); 

  if (isLoading) {
    return <div className="container text-center mt-5"><h4>Checking deal data...</h4></div>
  }

  if (!isValidDeal) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger text-center" role="alert">
          <span className="material-icons-outlined" style={{ verticalAlign: 'middle', marginRight: '8px' }}>error</span>
          {dbMessage}
        </div>
      </div>
    )
  }
  

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
      setErrorMessage('')
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

    setErrorMessage('')
    setUploadedFile(file)

    setIsUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    //formData.append('dealId', dealId)
    try {
      const res = await apiClient.post('/report', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      })
      if (res.status === 200 || res.status === 201) {
        console.log(res.data.data);
        setReportContent(res.data.data);
        setUploadedFile(null);
      } else {
        setErrorMessage('Something went wrong! try again..');
        setReportContent('');
      }

    } catch (error: any) {
      setErrorMessage(error.message || 'Something went wrong!');
      console.error('Error fetching report:', error);
      setReportContent('');
      setUploadedFile(null);
    } finally {
      setIsUploading(false);
    }
  }

  const handleGenerateReport = async () => {
    if ((reportName?.length || 0) < 5) {
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
      if (!reportContent?.trim()) {
        setErrorMessage('Something went wrong')
        setTimeout(() => setErrorMessage(''), 3000)
        return
      }
      const payload = {
        dealId: dealId,
        name: reportName, 
        rowContent: reportContent, 
      };
      let res; 

      if (mode === 'edit') {
        res = await apiClient.put(`/report/${selectedReportId}`, payload);
      } else {
        res = await apiClient.post('/report', payload);
      }
    
      if (res.status === 200 || res.status === 201) {
        queryClient.invalidateQueries({ queryKey: ['report', dealId] });
        setReportContent('');
        setUploadedFile(null);
      } else {
        setErrorMessage('Something went wrong! try again..');
        setIsSubmitting(false);
      }
    } catch (error: any) {
      setErrorMessage(error.message || 'Something went wrong!');
      console.error('Error fetching report:', error);
      setReportContent('');
    } finally {
      setIsSubmitting(false);
    }
  }

  const validateName = (value: string) => {
    setReportName(value);
    if (value.trim() === "") {
      setError("Name is required.");
    } else if (value.length < 5) {
      setError("Minimum 5 characters are required.");
    } else {
      setError(""); 
    }
  };

  return (
    <main className="mainsec dealreport-mainsec">
      <div className="maintitle-sec">
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className="page-title">
                <h1>
                  Upload Your Report Template{' '}
                  <span className="wl-mess">
                    Let Sevi map your deal data into a ready to review report
                  </span>
                </h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dealreport-sec">
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className="formdesign">
                <form onSubmit={(e) => e.preventDefault()}>
                  <div className="whitebg  mb-30">
                    <div className="form-group big">
                      <label className="form-label">Upload Template</label>
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
                          : uploadedFile ? uploadedFile.name : 'Drag and drop deal documents here'
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
                      <div className="note">
                        Supported files: PDF, DOCX <br />
                        Upload your report template. AI will extract structure and map deal data
                        automatically.
                      </div>
                    </div>
                  </div>
                </form>
              </div>

              <div className="whitebg mb-30">
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
                          <td>{dealData?.name || '-'}</td>
                          <td>
                            <span className="aicheck">
                              <i className="la la-check-circle"></i>
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td>Location</td>
                          <td>{dealData?.location || '-'}</td>
                          <td>
                            <span className="aicheck">
                              <i className="la la-check-circle"></i>
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td>Yield</td>
                          <td>{dealData?.yield !== undefined ? `${dealData.yield}%` : '-'}</td>
                          <td>
                            <span className="aicheck">
                              <i className="la la-check-circle"></i>
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="formdesign">
                  {/* Name Input Group */}
                <div className="form-group mb-4">
                  <label className="form-label">Name</label>
                  <input 
                    type='text' 
                    name="reportname" 
                    className="form-control" 
                    value={reportName} 
                    onChange={(e) => validateName(e.target.value)} 
                    placeholder="Enter report name" 
                    
                  />
                  {error && (
                    <small className="text-danger" style={{ marginTop: '5px', display: 'block' }}>
                      {error}
                    </small>
                  )}
                </div>
                  <div className="form-group openbtn">
                    <label>
                      Editor{' '}
                      <button className="btn btn-info" type="button">
                        Open in App
                      </button>
                    </label>
                    
                    <Editor
                      value={reportContent}
                      onChange={setReportContent} 
                      placeholder="Write your report content here..."
                    />
                  </div>
                </div>
                <h5 className="shot-heading">Uploaded Report List</h5>
              <div className="table-responsive">
                <table className="table dt-responsive categories_table">
                  <thead>
                    <tr>
                      <th style={{ minWidth: '120px' }}>File Name</th>
                      <th style={{ minWidth: '120px' }}>Upload Date</th>
                      <th style={{ minWidth: '50px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isReportLoading ? (
                      <tr>
                        <td colSpan={3} className="text-center">
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Loading...
                        </td>
                      </tr>
                    ) : (
                      <>
                        {reportData && Object.keys(reportData).length > 0 ? (
                          <tr>
                            <td>
                              <div className="td-dealtitle">{reportData.name}.pdf</div>
                            </td>
                            <td>{new Date().toLocaleDateString()}</td>
                            <td className="tdaction">
                              <a href="#"><img src={tdeye} className="img-fluid" alt="" /></a>
                              <a href="#"><img src={tddelete} className="img-fluid" alt="" /></a>
                            </td>
                          </tr>
                        ) : (
                          <tr>
                            <td colSpan={3} className="text-center">No reports uploaded yet.</td>
                          </tr>
                        )}
                      </>
                    )}
                  </tbody>

                </table>
              </div>
                <div className="createby">
                  <ul>
                    <li>
                      Template uploaded by <strong>{dealData?.user?.name || '-'}</strong>
                    </li>
                    <li>
                      AI-generated at <strong>12:02 PM</strong>
                    </li>
                    <li>Shared with Credit, etc.</li>
                    <li>
                      Edited by <strong>{dealData?.user?.name || '-'}</strong>
                    </li>
                    <li>
                      Finalized by <strong>{dealData?.user?.name || '-'}</strong>
                    </li>
                  </ul>
                </div>
                <div className="extraction-review-btn dealbtn">
                  
                  <button 
                    disabled={
                      (reportName?.length || 0) < 5 || 
                      !reportContent?.trim() || 
                      isSubmitting
                    }
                    onClick={handleGenerateReport}
                    type="button" 
                    className="btn btn-info"
                  >
                    
                    {isSubmitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        {mode === 'edit' ? 'Updating...' : 'Generating...'}
                      </>
                    ) : mode === 'edit' ? 'Update Report' : 'Generate Report (AI)'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AiAssistantModal />
    </main>
  )
}

export default DealReportAiPage
