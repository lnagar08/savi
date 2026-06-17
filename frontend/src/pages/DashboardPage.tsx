import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridSortModel,
} from '@mui/x-data-grid'
import dashboardicon1 from '../assets/images/dashboardicon1.png'
import dashboardicon2 from '../assets/images/dashboardicon2.png'
import dashboardicon3 from '../assets/images/dashboardicon3.png'
import dashboardicon4 from '../assets/images/dashboardicon4.png'
import addPost from '../assets/images/add-post.png'
import mapPin from '../assets/images/map-pin.svg'
import tdeye from '../assets/images/tdeye.svg'
import tddelete from '../assets/images/tddelete.svg'
import uploadLinear from '../assets/images/upload-linear.svg'
import AiAssistantModal from '../components/dashboard/AiAssistantModal'
import { useDealsQuery } from '../hooks/deals'
import { useTheme } from '../hooks/useTheme'
import apiClient from '../services/api'
import type { GetDealsOptions } from '../services/deals'
import { useUser } from '../contexts/UserContext'
import { useLocation, useNavigate } from 'react-router-dom'
import { formatDealValue, formatTimeAgo } from '../lib/format'

const DEAL_SORT_FIELD_MAP: Record<string, string> = {
  ref: 'ref',
  name: 'name',
  dealLead: 'dealLead',
  location: 'location',
  value: 'value',
  progress: 'progress',
  updatedAt: 'updatedAt',
}

interface UploadedFile {
  name: string
  date: string
}

function DashboardPage() {
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [filesList, setFilesList] = useState<UploadedFile[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [dealName, setDealName] = useState('')
  const [isCreatingDeal, setIsCreatingDeal] = useState(false)
  const [apiOptions, setApiOptions] = useState<GetDealsOptions>({
    page: 1,
    limit: 10,
    search: '',
    sortBy: 'updatedAt',
    sortOrder: 'desc',
  })
  const [searchInput, setSearchInput] = useState('')
  const [sortModel, setSortModel] = useState<GridSortModel>([])
  const { displayName } = useUser()
  const navigate = useNavigate()
  const { isDarkTheme } = useTheme()

  useEffect(() => {
    const modalElement = document.getElementById('myModal');

    const handleHidden = () => {
      const backdrops = document.querySelectorAll('.modal-backdrop');
      backdrops.forEach(backdrop => backdrop.remove());
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };

    if (modalElement) {
      modalElement.addEventListener('hidden.bs.modal', handleHidden);
    }

   
    if (location.state && (location.state as any).openModal) {
      if (modalElement) {
        
        handleHidden();

        const bootstrapModal = new (window as any).bootstrap.Modal(modalElement);
        bootstrapModal.show();

        navigate(location.pathname, { replace: true, state: {} });
      }
    }

    return () => {
      if (modalElement) {
        modalElement.removeEventListener('hidden.bs.modal', handleHidden);
      }
    };
  }, [location, navigate]);

  const {
    data: dealsData,
    isLoading: isDealsLoading,
    isFetching: isDealsFetching,
  } = useDealsQuery(apiOptions)

  const dealRows: Record<string, any>[] = dealsData?.data ?? []
  const totalDeals = dealsData?.pagination?.total ?? 0

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setApiOptions((prev) => {
        if (prev.search === searchInput && prev.page === 1) {
          return prev
        }

        return {
          ...prev,
          page: 1,
          search: searchInput,
        }
      })
    }, 300)

    return () => window.clearTimeout(timeoutId)
  }, [searchInput])

  const dataGridSx = useMemo(
    () => ({
      '--DataGrid-containerBackground': isDarkTheme ? '#111827' : '#f8fafc',
      '--DataGrid-rowBorderColor': isDarkTheme ? 'rgba(148, 163, 184, 0.14)' : 'rgba(15, 23, 42, 0.08)',
      border: "transparent",
      backgroundColor: isDarkTheme ? '#152232' : '#ffffff',
      color: isDarkTheme ? '#e2e8f0' : '#1e293b',
      '& .MuiDataGrid-topContainer': {
        backgroundColor: `${isDarkTheme ? '#111827' : '#f8fafc'} !important`,
      },
      '& .MuiIconButton-root[class*=sortButton]': {
        backgroundColor: `${isDarkTheme ? '#111827' : '#f8fafc'} !important`,
      },
      '& .MuiDataGrid-columnHeaders': {
        backgroundColor: `${isDarkTheme ? '#111827' : '#f8fafc'} !important`,
        borderBottom: isDarkTheme ? '1px solid rgba(148, 163, 184, 0.2)' : '1px solid rgba(15, 23, 42, 0.12)',
      },
      '& .MuiDataGrid-columnHeader': {
        backgroundColor: `${isDarkTheme ? '#111827' : '#f8fafc'} !important`,
      },
      '& .MuiDataGrid-columnHeaderTitle': {
        fontWeight: 700,
        color: isDarkTheme ? '#f8fafc' : '#1f2937',
      },
      '& .MuiDataGrid-iconButtonContainer .MuiSvgIcon-root': {
        color: isDarkTheme ? '#cbd5e1' : '#475569',
      },
      '& .MuiDataGrid-sortIcon': {
        color: isDarkTheme ? '#cbd5e1' : '#475569',
      },
      '& .MuiDataGrid-columnSeparator': {
        color: isDarkTheme ? 'rgba(148, 163, 184, 0.3)' : 'rgba(100, 116, 139, 0.3)',
      },
      '& .MuiDataGrid-cell': {
        borderBottom: isDarkTheme ? '1px solid rgba(148, 163, 184, 0.14)' : '1px solid rgba(15, 23, 42, 0.08)',
        color: isDarkTheme ? '#e2e8f0' : '#1e293b',
      },
      '& .MuiDataGrid-row:hover': {
        backgroundColor: isDarkTheme ? 'rgba(30, 41, 59, 0.55)' : 'rgba(15, 23, 42, 0.04)',
      },
      '& .MuiDataGrid-footerContainer': {
        borderTop: isDarkTheme ? '1px solid rgba(148, 163, 184, 0.2)' : '1px solid rgba(15, 23, 42, 0.12)',
      },
      '& .MuiTablePagination-root, & .MuiTablePagination-toolbar': {
        color: isDarkTheme ? '#e2e8f0' : '#1e293b',
      },
      '& .MuiTablePagination-selectIcon, & .MuiTablePagination-actions .MuiSvgIcon-root': {
        color: isDarkTheme ? '#e2e8f0' : '#1e293b',
      },
      '& .MuiTablePagination-toolbar p': {
        marginBottom: 0,
        color: isDarkTheme ? '#e2e8f0' : '#1e293b',
      },
    }),
    [isDarkTheme],
  )


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

  const handleUploadFile = (fileToUpload?: File) => {
    
    const file = fileToUpload ?? uploadedFile
    if (!file) {
      setErrorMessage('Please upload a file first')
      setTimeout(() => setErrorMessage(''), 3000)
      return
    }

    setErrorMessage('')
    setUploadedFile(file)
    setFilesList((prev) => [...prev, { name: file.name, date: new Date().toLocaleDateString() }])
  }

  const handleDeleteFile = (fileIndex: number) => {
    const fileToDelete = filesList[fileIndex]

    if (fileToDelete && uploadedFile?.name === fileToDelete.name) {
      setUploadedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }

    setFilesList((prev) => prev.filter((_, index) => index !== fileIndex))
  }
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
  /*const handleCreateDeal = async () => {
    if (isCreatingDeal) {
      return
    }

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

    const formData = new FormData()
    formData.append('file', uploadedFile)
    formData.append('name', dealName)

    setIsCreatingDeal(true)

    try {
      const res = await apiClient.post('/deals', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      })
     

      // setUploadedFile(null)
      // setUploadCompleted(false)
      // setDealName('')
      // setFilesList([])
      if (res?.data?.data?.id) {
        const modalElement = document.querySelector('.modal-backdrop')
        modalElement?.remove()
        document.body.classList.remove('modal-open')
        document.body.style = ""
        navigate(`/deal-analysis-details?dealId=${res.data?.data?.id}`)
      }
    } catch (error) {
      console.error('Failed to create deal:', error)
      setErrorMessage('Unable to create deal. Please try again.')
      setTimeout(() => setErrorMessage(''), 3000)
    } finally {
      setIsCreatingDeal(false)
    }
  }*/
const handleCreateDeal = async () => {
  if (isCreatingDeal) return;

  if (!dealName.trim()) {
    setErrorMessage('Please enter a deal name');
    setTimeout(() => setErrorMessage(''), 3000);
    return;
  }

  if (!uploadedFile) {
    setErrorMessage('Please upload a file first');
    setTimeout(() => setErrorMessage(''), 3000);
    return;
  }

  setIsCreatingDeal(true);

  try {
    // 🔥 STEP 1: Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(uploadedFile);

    // 🔥 STEP 2: Extract metadata
    const fileMeta = {
      fileName: uploadedFile.name,
      fileSize: uploadedFile.size,
      fileType: uploadedFile.type,
      extension: uploadedFile.name.split('.').pop(),
    };

    // 🔥 STEP 3: Send to backend (NO FILE)
    const res = await apiClient.post('/deals', {
      name: dealName,
      fileUrl: uploadResult.url,
      publicId: uploadResult.publicId,
      ...fileMeta,
    });

    if (res?.data?.data?.id) {
      navigate(`/deal-analysis-details?dealId=${res.data.data.id}`);
    }

  } catch (error) {
    console.error('Failed to create deal:', error);
    setErrorMessage('Unable to create deal. Please try again.');
    setTimeout(() => setErrorMessage(''), 3000);
  } finally {
    setIsCreatingDeal(false);
  }
};
  const handlePaginationModelChange = useCallback((model: GridPaginationModel) => {
    setApiOptions((prev) => ({
      ...prev,
      page: model.page + 1,
      limit: model.pageSize,
    }))
  }, [])

  const handleSortModelChange = useCallback((model: GridSortModel) => {
    setSortModel(model)

    const activeSort = model[0]
    const mappedSortField = activeSort?.field ? DEAL_SORT_FIELD_MAP[activeSort.field] : undefined

    setApiOptions((prev) => ({
      ...prev,
      page: 1,
      sortBy: mappedSortField ?? 'updatedAt',
      sortOrder: (activeSort?.sort ?? 'desc') as 'asc' | 'desc',
    }))
  }, [])

  const dealColumns = useMemo<GridColDef[]>(() => [
    {
      field: 'ref',
      headerName: 'Ref',
      minWidth: 120,
      renderCell: (params) => params.value ?? '-',
    },
    {
      field: 'name',
      headerName: 'Deal Name',
      minWidth: 200,
      flex: 1.6,
      sortable: true,
      renderCell: (params) => (
        <a
          href="#"
          className="td-dealtitle"
          onClick={(e) => {
            e.preventDefault()
            if (params.row?.id) {
              navigate(`/deal-analysis?dealId=${params.row.id}`)
            }
          }}
        >
          {params.value ?? '--'}
        </a>
      ),
    },
    {
      field: 'dealLead',
      headerName: 'Deal Lead',
      minWidth: 200,
      flex: 1.2,
      renderCell: (params) => params.value ?? '--',
    },
    {
      field: 'location',
      headerName: 'Location',
      minWidth: 250,
      flex: 1.5,
      renderCell: (params) => (
        <div className="td-deallocation">
          <img src={mapPin} className="img-fluid" alt="Location" /> {params.value ?? '--'}
        </div>
      ),
    },
    {
      field: 'value',
      headerName: '£ Value',
      minWidth: 120,
      flex: 1,
      renderCell: (params) => <span className="tdvalue">{formatDealValue(params.value)}</span>,
    },
    {
      field: 'assetClass',
      headerName: 'Asset Class',
      minWidth: 200,
      flex: 1.2,
      valueGetter: (_value, row) => row?.deal_identification?.asset_type ?? '--',
    },
    {
      field: 'sector',
      headerName: 'Sector',
      minWidth: 150,
      flex: 0.9,
      valueGetter: (_value, row) => row?.deal_identification?.sector ?? '--',
    },
    {
      field: 'progress',
      headerName: 'Progress',
      minWidth: 120,
      flex: 0.9,
      renderCell: (params) => params.value ?? '--',
    },
    {
      field: 'stage',
      headerName: 'Stage',
      minWidth: 250,
      flex: 1.2,
      valueGetter: (_value, row) => row?.deal_identification?.stage ?? 'Review',
      renderCell: (params) => <span className="status-d status1">{params.value}</span>,
    },
    {
      field: 'updatedAt',
      headerName: 'Last Updated',
      minWidth: 140,
      flex: 1,
      renderCell: (params) => (params.value ? formatTimeAgo(new Date(params.value)) : '--'),
    },
    {
      field: 'action',
      headerName: 'Action',
      minWidth: 120,
      flex: 0.9,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', whiteSpace: 'nowrap' }}>
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault()
              if (params.row?.id) {
                navigate(`/deal-analysis-details?dealId=${params.row.id}`)
              }
            }}
          >
            <img src={tdeye} alt="View" style={{ width: '22px', height: '22px', minWidth: '22px', minHeight: '22px', display: 'block', filter: isDarkTheme ? 'invert(1)' : undefined }} />
          </a>
          <a href="#" onClick={(e) => e.preventDefault()}>
            <img src={tddelete} alt="Delete" style={{ width: '22px', height: '22px', minWidth: '22px', minHeight: '22px', display: 'block' }} />
          </a>
        </div>
      ),
    },
  ], [navigate, isDarkTheme])

  return (
    <main className="mainsec">
      <div className="maintitle-sec">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <div className="page-title">
                <h1>
                  Welcome back, <span className="wl-name">{displayName}!</span>{' '}
                  <span className="wl-mess">Let&apos;s power through your deals.</span>
                </h1>
              </div>
            </div>
            <div className="col-md-6">
              <div className="titleright-btn">
                <a href="#" className="btn btn-info exbtn" onClick={(e) => e.preventDefault()}>
                  Upload NDA
                </a>
                <a href="#" className="btn btn-info exbtn" onClick={(e) => e.preventDefault()}>
                  Generate Report
                </a>
                <button type="button" className="btn btn-info" data-bs-toggle="modal" data-bs-target="#myModal">
                  <i className="la la-plus"></i>Create Deal
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="table-search">
        <div className="container">
          <div className="row dashboardcard-row">
            <div className="col-md-12">
              <h2 className="dashboardheading">Live Deals</h2>
            </div>
            <div className="col-md-3">
              <div className="dashboard-card dashboardcardbg1">
                <h5>Under Review</h5>
                <span className="dashboardicon">
                  <img src={dashboardicon1} className="img-fluid" alt="Under Review" />
                </span>
                <h2>
                  <span className="count">15</span>{' '}
                  <span className="value">&pound;48.2M</span>
                </h2>
              </div>
            </div>
            <div className="col-md-3">
              <div className="dashboard-card dashboardcardbg2">
                <h5>Bid Submitted</h5>
                <span className="dashboardicon">
                  <img src={dashboardicon2} className="img-fluid" alt="Bid Submitted" />
                </span>
                <h2>
                  <span className="count">08</span>{' '}
                  <span className="value">&pound;112.7M</span>
                </h2>
              </div>
            </div>
            <div className="col-md-3">
              <div className="dashboard-card dashboardcardbg3">
                <h5>Governance</h5>
                <span className="dashboardicon">
                  <img src={dashboardicon3} className="img-fluid" alt="Governance" />
                </span>
                <h2>
                  <span className="count">04</span>{' '}
                  <span className="value">&pound;65.1M</span>
                </h2>
              </div>
            </div>
            <div className="col-md-3">
              <div className="dashboard-card dashboardcardbg4">
                <h5>Execution</h5>
                <span className="dashboardicon">
                  <img src={dashboardicon4} className="img-fluid" alt="Execution" />
                </span>
                <h2>
                  <span className="count">03</span>{' '}
                  <span className="value">&pound;19.5M</span>
                </h2>
              </div>
            </div>
          </div>

          <div className="row filtersrow">
            <div className="col-md-6">
              <div className="searchtop">
                <div className="input-group">
                  <i className="la la-search"></i>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search deals.."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="filters-right">
                <div className="form-group">
                  <select className="form-control form-select" defaultValue="Filter by">
                    <option>Filter by</option>
                    <option>Stage 1</option>
                    <option>Stage 2</option>
                    <option>Stage 3</option>
                  </select>
                </div>
                <div className="form-group">
                  <select className="form-control form-select" defaultValue="Sort by">
                    <option>Sort by</option>
                    <option>Stage 1</option>
                    <option>Stage 2</option>
                    <option>Stage 3</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-md-12">
              <div className="tabledesign filterno whitebg">
                {!isDealsLoading && !isDealsFetching && totalDeals === 0 ? (
                  <div className="table-nodata">
                    <img src={addPost} className="img-fluid" alt="Add deal" />
                    <h3>Create your first deal to begin analysis.</h3>
                    <button
                      type="button"
                      className="btn btn-info"
                      data-bs-toggle="modal"
                      data-bs-target="#myModal"
                    >
                      <i className="la la-plus"></i>Create Deal
                    </button>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <div style={{ width: '100%' }}>
                      <DataGrid
                        rows={dealRows}
                        columns={dealColumns}
                        loading={isDealsLoading || isDealsFetching}
                        rowCount={totalDeals}
                        paginationMode="server"
                        sortingMode="server"
                        paginationModel={{
                          page: apiOptions.page - 1,
                          pageSize: apiOptions.limit,
                        }}
                        onPaginationModelChange={handlePaginationModelChange}
                        sortModel={sortModel}
                        onSortModelChange={handleSortModelChange}
                        disableRowSelectionOnClick
                        pageSizeOptions={[10, 25, 50]}
                        sx={dataGridSx}
                        disableColumnMenu
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <AiAssistantModal />
 
      <div className="modal fade createdeal-modal" id="myModal" tabIndex={-1} aria-labelledby="createDealModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h4 className="modal-title" id="createDealModalLabel">Create Deal</h4>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <div className="modal-body">
              <div className="formdesign">
                <form id="createDealForm" onSubmit={(e) => e.preventDefault()}>
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
                    </div>
                  </div>

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
                          ) : (
                            <img src={uploadLinear} className="img-fluid" alt="Upload" />
                          )}
                        </span>
                        <h3 className="dynamic-message">
                          {isDragActive
                            ? 'Drop your file here!'
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
                            <span className="browse-files-text">or click to upload</span>
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
                    <div className="note">Supported files: PDF, DOCX</div>
                  </div>

                </form>
              </div>

              <div className="tabledesign filterno">
                <h5 className="shot-heading">Uploaded Files List</h5>
                <div className="table-responsive">
                  <table className="table dt-responsive categories_table">
                    <thead>
                      <tr>
                        <th style={{ minWidth: '120px' }}>File Name</th>
                        <th style={{ minWidth: '120px' }}>Upload Date</th>
                        <th style={{ minWidth: '120px' }}>Uploaded By</th>
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
                          <td>{displayName}</td>
                          <td className="tdaction">
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', whiteSpace: 'nowrap' }}>
                              <a href="#" onClick={(e) => e.preventDefault()}>
                                <img src={tdeye} className="img-fluid" alt="View" style={{ width: '18px', height: '18px' }} />
                              </a>
                              <a href="#" onClick={(e) => {
                                e.preventDefault()
                                handleDeleteFile(index)
                              }}>
                                <img src={tddelete} className="img-fluid" alt="Delete" style={{ width: '18px', height: '18px' }} />
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              {isCreatingDeal && (
                <div className="alert alert-info text-center py-2 mb-2 small" role="alert">
                  Please wait while the deal is being created. This may take up to 2 minutes.
                </div>
              )}
              <button type="button" className="btn btn-info" onClick={handleCreateDeal} disabled={isCreatingDeal}>
                {isCreatingDeal ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Creating...
                  </>
                ) : (
                  'Create Deal'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default DashboardPage
