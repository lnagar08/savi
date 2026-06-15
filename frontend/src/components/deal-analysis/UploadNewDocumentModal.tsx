import uploadLinear from '../../assets/images/upload-linear.svg'
import tdeye from '../../assets/images/tdeye.svg'
import tddelete from '../../assets/images/tddelete.svg'

function UploadNewDocumentModal() {
  return (
    <div className="modal fade createdeal-modal" id="myModal2" tabIndex={-1} aria-hidden="true">
      <div className="modal-dialog">
        <div className="modal-content">
          <div className="modal-header">
            <h4 className="modal-title">Create Deal</h4>
            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div className="modal-body">
            <div className="formdesign">
              <form>
                <div className="form-group big">
                  <label>Deal Name</label>
                  <div className="input-group"><input type="text" className="form-control" placeholder="Enter deal name" /></div>
                </div>
                <div className="form-group big">
                  <label className="form-label">Upload New Document</label>
                  <div className="upload-files-container">
                    <div className="drag-file-area">
                      <span className="material-icons-outlined upload-icon"><img src={uploadLinear} className="img-fluid" alt="Upload" /></span>
                      <h3 className="dynamic-message">Drag and drop deal document here</h3>
                      <label className="label"><span className="browse-files"><input type="file" className="default-file-input" /><span className="browse-files-text">or click to upload</span></span></label>
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
                      <th style={{ minWidth: '50px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        <div className="td-dealtitle">Sales Agreement.pdf</div>
                      </td>
                      <td>04/24/2026</td>
                      <td className="tdaction">
                        <a href="#"><img src={tdeye} className="img-fluid" alt="" /></a>
                        <a href="#"><img src={tddelete} className="img-fluid" alt="" /></a>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="td-dealtitle">Sales Agreement.pdf</div>
                      </td>
                      <td>04/24/2026</td>
                      <td className="tdaction">
                        <a href="#"><img src={tdeye} className="img-fluid" alt="" /></a>
                        <a href="#"><img src={tddelete} className="img-fluid" alt="" /></a>
                      </td>
                    </tr>
                    <tr>
                      <td>
                        <div className="td-dealtitle">Sales Agreement.pdf</div>
                      </td>
                      <td>04/24/2026</td>
                      <td className="tdaction">
                        <a href="#"><img src={tdeye} className="img-fluid" alt="" /></a>
                        <a href="#"><img src={tddelete} className="img-fluid" alt="" /></a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="createby">
                <ul>
                  <li>Template uploaded by <strong>Jane Smith</strong></li>
                  <li>AI-generated at <strong>12:02 PM</strong></li>
                  <li>Shared with Credit, etc.</li>
                  <li>Edited by <strong>Jane Smith</strong></li>
                  <li>Finalized by <strong>Michael Davis</strong></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-info">Create Deal</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UploadNewDocumentModal
