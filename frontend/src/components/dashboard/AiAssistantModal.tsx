import { useState } from 'react'
import ai from '../../assets/images/ai.png'

function AiAssistantModal() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        className="btn btn-ai"
        type="button"
        id="myBtn"
        aria-label="Open AI assistant"
        onClick={() => setIsOpen(true)}
      >
        <img src={ai} className="img-fluid" alt="AI" />
      </button>

      <div
        id="myModalai"
        className="modal aimodal"
        style={{ display: isOpen ? 'block' : 'none' }}
        onClick={() => setIsOpen(false)}
      >
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Chat with SeviAI</h2>
            <span
              className="close"
              role="button"
              tabIndex={0}
              onClick={() => setIsOpen(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setIsOpen(false)
                }
              }}
            >
              &times;
            </span>
          </div>
          <div className="modal-body">
            <h2 className="modaltop-heading">
              Your <span>Smart Assistant</span> for deal, <span>tracking, notes & insights</span>{' '}
              <a href="#" onClick={(e) => e.preventDefault()}>
                New Topoc
              </a>
            </h2>
            <div className="question-option">
              <h3>Ask any question!</h3>
              <ul>
                <li><span>Deal Summary</span></li>
                <li><span>Timeline Tracker</span></li>
                <li><span>Last 7 Days Update</span></li>
                <li><span>What&apos;s Outstanding</span></li>
                <li><span>Other</span></li>
              </ul>
            </div>
          </div>
          <div className="modal-footer">
            <div className="input-group btnai">
              <input type="text" className="form-control" placeholder="Ask anything" />
              <button className="btn btn-info" type="button">
                <i className="la la-paper-plane"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default AiAssistantModal
