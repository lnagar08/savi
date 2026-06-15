import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import logo from '../assets/images/logo.png'
import apiClient from '../services/api'

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    document.body.classList.add('signbg')
    return () => {
      document.body.classList.remove('signbg')
    }
  }, [])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!email.trim()) {
      setError('Please enter your email address')
      return
    }

    setIsLoading(true)
    try {
      const res = await apiClient.post('/auth/request-reset-password', { email })
      setSuccess(res.data.message || 'Reset link sent! Please check your email.')
      setEmail('')
      console.log(res.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send reset link. Please try again.')
      console.error('Reset password error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="mainsec">
      <div className="container">
        <div className="row">
          <div className="col-md-6">
            <div className="signinimg">
              <div className="signin-left-design">
                <img src={logo} className="img-fluid" alt="Sevi" />
                <h2>
                  Move deals faster with
                  <br />
                  AI-powered <span>analysis</span> and <span>reporting</span>.
                </h2>
                <p>
                  Sevi helps investment teams extract key deal data, review opportunities, and
                  generate decision-ready reports in one secure workspace.
                </p>
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="form-card formdesign">
              <div className="mainheading">
                <h2>Forgot your password</h2>
                <p>Enter your email to receive a password reset link.</p>
              </div>
              <form onSubmit={handleResetPassword}>
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="alert alert-success" role="alert">
                    {success}
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="forgot-email">Email Address</label>
                  <input
                    id="forgot-email"
                    type="email"
                    className="form-control"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
                <input
                  type="submit"
                  className="btn btn-info"
                  value={isLoading ? 'Sending...' : 'Send Reset Link'}
                  disabled={isLoading}
                />
                <p className="dontaccount">
                  Back to <Link to="/signin">Sign In</Link>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default ForgotPasswordPage
