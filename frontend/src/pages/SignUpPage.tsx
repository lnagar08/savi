import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUp } from '../services/api'
import { signUpSchema, type SignUpInput } from '../schemas/auth.schema'
import logo from '../assets/images/logo.png'
import { useUser } from '../contexts/UserContext'

function SignUpPage() {
  const navigate = useNavigate()
  const { refreshUser } = useUser()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof SignUpInput, string>>>({})
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    document.body.classList.add('signbg')
    return () => {
      document.body.classList.remove('signbg')
    }
  }, [])

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const name = String(formData.get('name') ?? '')
      const email = String(formData.get('email') ?? '')
      const password = String(formData.get('password') ?? '')
      const terms = formData.get('terms') === 'on'

      const validationResult = signUpSchema.safeParse({ name, email, password, terms })

      if (!validationResult.success) {
        const errors: Partial<Record<keyof SignUpInput, string>> = {}
        validationResult.error.issues.forEach((issue) => {
          const path = issue.path[0] as keyof SignUpInput
          errors[path] = issue.message
        })
        setFieldErrors(errors)
        setLoading(false)
        return
      }

      const response = await signUp(name, email, password)
      console.log('Sign up successful:', response)
      await refreshUser()
      navigate('/dashboard')
    } catch (err: unknown) {
      const errorMessage =
        (err as any)?.response?.data?.message ||
        (err as any)?.message ||
        'Failed to sign up. Please try again.'
      setError(errorMessage)
      console.error('Sign up error:', err)
    } finally {
      setLoading(false)
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
            <div className="signinright">
              <div className="form-card formdesign">
                <div className="mainheading">
                  <h2>Sign Up</h2>
                  <p>Your Journey Starts Here with Sevi</p>
                </div>
                <form onSubmit={handleSignUp}>
                  {error && <div className="alert alert-danger">{error}</div>}
                  <div className="form-group">
                    <label htmlFor="signup-name">Full Name</label>
                    <input
                      name="name"
                      id="signup-name"
                      type="text"
                      className={`form-control ${fieldErrors.name ? 'is-invalid' : ''}`}
                      placeholder="John Doe"
                      disabled={loading}
                    />
                    {fieldErrors.name && (
                      <div className="invalid-feedback" style={{ display: 'block' }}>
                        {fieldErrors.name}
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="signup-email">Email Address</label>
                    <input
                      name="email"
                      id="signup-email"
                      type="email"
                      className={`form-control ${fieldErrors.email ? 'is-invalid' : ''}`}
                      placeholder="you@example.com"
                      disabled={loading}
                    />
                    {fieldErrors.email && (
                      <div className="invalid-feedback" style={{ display: 'block' }}>
                        {fieldErrors.email}
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label htmlFor="signup-company">Company Name</label>
                    <input
                      name="companyName"
                      id="signup-company"
                      type="text"
                      className="form-control"
                      placeholder="Company Name"
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="signup-password">Password</label>
                    <div className="password-view">
                      <input
                        name="password"
                        id="signup-password"
                        type={showPassword ? 'text' : 'password'}
                        className={`form-control ${fieldErrors.password ? 'is-invalid' : ''}`}
                        placeholder="*************"
                        disabled={loading}
                      />
                      <i
                        className={`la ${showPassword ? 'la-eye' : 'la-eye-slash'}`}
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ cursor: 'pointer' }}
                      ></i>
                    </div>
                    {fieldErrors.password && (
                      <div className="invalid-feedback" style={{ display: 'block' }}>
                        {fieldErrors.password}
                      </div>
                    )}
                  </div>
                  <div className="form-group form-check">
                    <label className="form-check-label" htmlFor="agree-terms">
                      <input
                        name="terms"
                        className={`form-check-input ${fieldErrors.terms ? 'is-invalid' : ''}`}
                        type="checkbox"
                        id="agree-terms"
                        disabled={loading}
                      />
                      I agree with <a href="#">Terms of Use</a> and <a href="#">Privacy Policy</a>.
                    </label>
                    {fieldErrors.terms && (
                      <div className="invalid-feedback" style={{ display: 'block' }}>
                        {fieldErrors.terms}
                      </div>
                    )}
                  </div>
                  <input
                    type="submit"
                    className="btn btn-info"
                    value={loading ? 'Creating Account...' : 'Create Account'}
                    disabled={loading}
                  />
                  <p className="dontaccount">
                    Already have an account? <Link to="/signin">Sign In</Link>
                  </p>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default SignUpPage
