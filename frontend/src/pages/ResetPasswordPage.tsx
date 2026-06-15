import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import logo from '../assets/images/logo.png'
import apiClient from '../services/api'

function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const token = searchParams.get('token')
  const email = searchParams.get('email')
  const userId = searchParams.get('userId')

  useEffect(() => {
    document.body.classList.add('signbg')
    return () => {
      document.body.classList.remove('signbg')
    }
  }, [])

  // Redirect if missing required params
  useEffect(() => {
    if (!token || !email || !userId) {
      setError('Invalid reset link. Missing required parameters.')
    }
  }, [token, email, userId])

  const handleResetPassword = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validation
    if (!password.trim()) {
      setError('Please enter a new password')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (!token || !email || !userId) {
      setError('Invalid reset link. Please request a new one.')
      return
    }

    setIsLoading(true)
    try {
      const res = await apiClient.post('/auth/reset-password', {
        token,
        email,
        userId: parseInt(userId),
        newPassword: password,
      })
      setSuccess('Password reset successfully! Redirecting to sign in...')
      console.log(res.data)
      setTimeout(() => {
        navigate('/signin')
      }, 2000)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.')
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
                <h2>Reset your password</h2>
                <p>Enter your new password below.</p>
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
                  <label htmlFor="new-password">New Password</label>
                  <input
                    id="new-password"
                    type="password"
                    className="form-control"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading || success !== ''}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="confirm-password">Confirm Password</label>
                  <input
                    id="confirm-password"
                    type="password"
                    className="form-control"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isLoading || success !== ''}
                  />
                </div>
                <input
                  type="submit"
                  className="btn btn-info"
                  value={isLoading ? 'Resetting...' : 'Reset Password'}
                  disabled={isLoading || success !== ''}
                />
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default ResetPasswordPage
