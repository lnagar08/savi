import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import tdeye from '../assets/images/tdeye.svg'
import tddelete from '../assets/images/tddelete.svg'
import uploadLinear from '../assets/images/upload-linear.svg'
import apiClient from '../services/api'

interface UploadedFile {
  name: string
  date: string
}

function CreateDealPage() {


  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const [isDragActive, setIsDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadCompleted, setUploadCompleted] = useState(false)
  const [filesList, setFilesList] = useState<UploadedFile[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [dealName, setDealName] = useState('')

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
      setUploadCompleted(false)
      handleUploadFile(files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files && files.length > 0) {
      setErrorMessage('')
      setUploadedFile(files[0])
      setUploadCompleted(false)
      handleUploadFile(files[0])
    }
    e.currentTarget.value = ''
  }

  const handleUploadFile = (fileToUpload?: File) => {
    const file = fileToUpload ?? uploadedFile
    if (!file) {
      setErrorMessage('Please upload a file first')
      setTimeout(() => setErrorMessage(''), 3000)
      return
    }

    setErrorMessage('')
    setUploadedFile(file)
    setUploadCompleted(true)
    setFilesList((prev) => [...prev, { name: file.name, date: new Date().toLocaleDateString() }])
  }

  const handleCreateDeal = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!dealName.trim()) {
      setErrorMessage('Please enter a deal name')
      setTimeout(() => setErrorMessage(''), 3000)
      return
    }

    if (!uploadedFile) {
      setErrorMessage('Please upload a file first')
      setTimeout(() => setErrorMessage(''), 3000)
      return
    }

    setErrorMessage('')
    console.log('Creating deal:', dealName, uploadedFile)
    setUploadedFile(null)
    setUploadCompleted(false)
    setDealName('')

    const data = await apiClient.post('/deals/parse',
      { file: uploadedFile, name: dealName },
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    console.log(data)
    navigate('/extraction-review')
  }

  const handleRemoveFile = () => {
    setUploadedFile(null)
    setUploadCompleted(false)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDeleteFile = (fileName: string) => {
    setFilesList(filesList.filter((file) => file.name !== fileName))
  }

  return (
    <main className="mainsec">
      <div className="maintitle-sec">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <div className="page-title">
                <h1>Deal Information</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="create-sec">
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className="formdesign">
                <form onSubmit={handleCreateDeal}>
                  <div className="whitebg mb-30">
                    <div className="form-group big">
                      <label>Deal Name</label>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Enter deal name"
                          value={dealName}
                          onChange={(e) => {
                            setDealName(e.target.value)
                            if (e.target.value.trim()) {
                              setErrorMessage('')
                            }
                          }}
                        />
                        <button className="btn btn-info" type="submit">
                          Create Deal
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="whitebg mb-30">
                    <div className="form-group big">
                      <label className="form-label">Upload Documents</label>
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
                              <i className="la la-check-circle-o"></i>
                            ) : (
                              <img src={uploadLinear} className="img-fluid" alt="Upload" />
                            )}
                          </span>
                          <h3 className="dynamic-message">
                            {isDragActive
                              ? 'Drop your file here!'
                              : uploadedFile
                                ? 'File Dropped Successfully!'
                                : 'Drag and drop deal documents here'}
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
                              <span className="browse-files-text" style={uploadedFile ? { top: '0' } : {}}>
                                {uploadedFile ? '' : 'or click to upload'}
                              </span>
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
                          <div
                            className="file-block"
                            style={{
                              display: uploadedFile ? 'flex' : 'none',
                            }}
                          >
                            <div className="file-info">
                              <span className="material-icons-outlined file-icon">
                                <i className="la la-file-import"></i>
                              </span>
                              <span className="file-name">{uploadedFile?.name}</span>
                              {uploadedFile && <span> | </span>}
                              <span className="file-size">{uploadedFile ? (uploadedFile.size / 1024).toFixed(1) + ' KB' : ''}</span>
                            </div>
                            <span
                              className="material-icons remove-file-icon"
                              onClick={handleRemoveFile}
                              style={{ cursor: 'pointer' }}
                            >
                              <i className="la la-trash"></i>
                            </span>
                          </div>
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
                            {uploadCompleted ? (
                              <>
                                <span className="material-icons-outlined upload-button-icon">check_circle</span>
                                Uploaded
                              </>
                            ) : (
                              'Upload'
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="note">Supported files: PDF, DOCX</div>
                    </div>
                  </div>
                </form>
              </div>

              <div className="tabledesign filterno whitebg">
                <h5 className="shot-heading">Uploaded Files List</h5>
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
                      {filesList.map((file, index) => (
                        <tr key={index}>
                          <td>
                            <div className="td-dealtitle">{file.name}</div>
                          </td>
                          <td>{file.date}</td>
                          <td className="tdaction">
                            <a href="#">
                              <img src={tdeye} className="img-fluid" alt="View" />
                            </a>
                            <a href="#" onClick={() => {
                              handleDeleteFile(file.name)
                            }}>
                              <img src={tddelete} className="img-fluid" alt="Delete" />
                            </a>
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
    </main>
  )
}

export default CreateDealPage
