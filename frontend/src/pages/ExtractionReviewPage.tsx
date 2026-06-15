import apiClient from '../services/api'

function ExtractionReviewPage() {

  const handleSaveReviewedData = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const payload = Object.fromEntries(formData.entries())
    console.log(payload)

    try {
      const res = await apiClient.post('/deals', payload)
      console.log('Saved reviewed data:', res.data)
    } catch (error) {
      console.error('Failed to save reviewed data:', error)
    }
  }

  return (
    <>
      <div className="sticky-header sticky-top">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <div className="extraction-review-left">
                <h2>Project Aurora A</h2>
                <div className="extraction-review-info">
                  <span>
                    <i className="la la-map-marker"></i>New York, NY
                  </span>
                  <span>
                    <i className="la la-dollar"></i>1400
                  </span>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="extraction-review-right">
                <div className="btn-group">
                  <button type="button" className="btn btn-info lightbtn">
                    Run Extraction
                  </button>
                  <button type="button" className="btn btn-info lightbtn">
                    Run Analysis
                  </button>
                  <button type="button" className="btn btn-info">
                    Generate Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="mainsec">
        <div className="maintitle-sec">
          <div className="container">
            <div className="row">
              <div className="col-md-6">
                <div className="page-title">
                  <h1>Extraction Review</h1>
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
                  <form onSubmit={handleSaveReviewedData}>
                    <div className="whitebg mb-30">
                      <div className="card">
                        <div className="card-header">
                          <a className="btn" data-bs-toggle="collapse" href="#collapse1">
                            Deal Overview
                          </a>
                        </div>
                        <div id="collapse1" className="collapse show" data-bs-parent="#accordion">
                          <div className="card-body">
                            <div className="formdesign">
                              <div className="row">
                                <div className="col-md-6">
                                  <div className="form-group">
                                    <label>Deal Name</label>
                                    <div className="editinput">
                                      <input type="text" name="dealName" className="form-control" defaultValue="Project Aurora A" />
                                      <button type="button" className="edit">
                                        <i className="la la-pencil"></i>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-group">
                                    <label>Location</label>
                                    <div className="editinput">
                                      <input type="text" name="location" className="form-control" defaultValue="New York, NY" />
                                      <button type="button" className="edit">
                                        <i className="la la-pencil"></i>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="row">
                                <div className="col-md-6">
                                  <div className="form-group">
                                    <label>Asset Class</label>
                                    <div className="editinput">
                                      <input type="text" name="assetClass" className="form-control" defaultValue="Office" />
                                      <button type="button" className="edit">
                                        <i className="la la-pencil"></i>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-group">
                                    <label>Transaction Value</label>
                                    <div className="editinput">
                                      <input type="text" name="transactionValue" className="form-control" defaultValue="$1400" />
                                      <button type="button" className="edit">
                                        <i className="la la-pencil"></i>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="whitebg mb-30">
                      <div className="card">
                        <div className="card-header">
                          <a className="btn" data-bs-toggle="collapse" href="#collapse2">
                            Lease Details
                          </a>
                        </div>
                        <div id="collapse2" className="collapse show" data-bs-parent="#accordion">
                          <div className="card-body">
                            <div className="formdesign">
                              <div className="row">
                                <div className="col-md-12">
                                  <div className="form-group">
                                    <label>Tenant</label>
                                    <div className="editinput">
                                      <input type="text" name="tenant" className="form-control" defaultValue="Downtown Financial Corp" />
                                      <button type="button" className="edit">
                                        <i className="la la-pencil"></i>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="row">
                                <div className="col-md-6">
                                  <div className="form-group">
                                    <label>Lease Term</label>
                                    <div className="editinput">
                                      <input type="text" name="leaseTerm" className="form-control" defaultValue="10 years" />
                                      <button type="button" className="edit">
                                        <i className="la la-pencil"></i>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <div className="form-group">
                                    <label>Remaining Lease</label>
                                    <div className="editinput">
                                      <input type="text" name="remainingLease" className="form-control" defaultValue="7 years" />
                                      <button type="button" className="edit">
                                        <i className="la la-pencil"></i>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="whitebg mb-30">
                      <div className="extraction-review-btn">
                        <input type="submit" className="btn btn-info" value="Save Reviewed Data" />
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default ExtractionReviewPage
