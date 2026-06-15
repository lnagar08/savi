import AiAssistantModal from '../components/dashboard/AiAssistantModal'

function DealReportPage() {
  return (
    <main className="mainsec dealreport-mainsec">
      <div className="maintitle-sec">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <div className="page-title">
                <h1>Deal Report</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dealreport-sec">
        <div className="container">
          <div className="row">
            <div className="col-md-12">
              <div className="whitebg mb-30">
                <div className="card-header">Deal Information</div>
                <div className="deal-summary">
                  <ul>
                    <li>
                      <label>Deal Name :</label>
                      <span>Project Aurora A</span>
                    </li>
                    <li>
                      <label>Location :</label>
                      <span>New York, NY</span>
                    </li>
                    <li>
                      <label>Sector :</label>
                      <span>Multifamily</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="whitebg mb-30">
                <div className="card-header">Key Metrics</div>
                <div className="deal-summary">
                  <ul>
                    <li>
                      <label>Value :</label>
                      <span>$300,250</span>
                    </li>
                    <li>
                      <label>NOI :</label>
                      <span>$185,250</span>
                    </li>
                    <li>
                      <label>Yield :</label>
                      <span>12.35%</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="whitebg mb-30 formdesign">
                <div className="investmentnots">
                  <p>
                    Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod
                    tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam,
                    quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
                    consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse
                    cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non
                    proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
                  </p>
                </div>
              </div>

              <div className="whitebg mb-30">
                <div className="extraction-review-btn">
                  <button className="btn btn-info pdfbtn" type="button">
                    Save
                  </button>
                  <input type="submit" className="btn btn-info" value="Download PDF" />
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

export default DealReportPage