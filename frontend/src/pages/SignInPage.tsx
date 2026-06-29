import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signIn } from '../services/api'
import { signInSchema, type SignInInput } from '../schemas/auth.schema'
import logo from '../assets/images/logo.png'
//import google from '../assets/images/google.svg'
//import outlook from '../assets/images/outlook.svg'
//import microsoft from '../assets/images/microsoft.svg'
import sso from '../assets/images/sso.svg'
import { useUser } from '../contexts/UserContext'

function SignInPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof SignInInput, string>>>({})
  const [showPassword, setShowPassword] = useState(false)
  const { refreshUser } = useUser()
  const navigate = useNavigate()

  useEffect(() => {
    document.body.classList.add('signbg')
    return () => {
      document.body.classList.remove('signbg')
    }
  }, [])

  const handleSignIn = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setFieldErrors({})
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const email = String(formData.get('email') ?? '')
      const password = String(formData.get('password') ?? '')

      const validationResult = signInSchema.safeParse({ email, password })

      if (!validationResult.success) {
        const errors: Partial<Record<keyof SignInInput, string>> = {}
        validationResult.error.issues.forEach((issue) => {
          const path = issue.path[0] as keyof SignInInput
          errors[path] = issue.message
        })
        setFieldErrors(errors)
        setLoading(false)
        return
      }

      const response = await signIn(email, password)
      console.log('Sign in successful:', response)
      await refreshUser()
      navigate('/dashboard')
    } catch (err: unknown) {
      const errorMessage =
        (err as any)?.response?.data?.message ||
        (err as any)?.message ||
        'Failed to sign in. Please try again.'
      setError(errorMessage)
      console.error('Sign in error:', err)
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
                  <h2>Welcome Back</h2>
                  <p>Access your account</p>
                </div>
                <form onSubmit={handleSignIn}>
                  {error && <div className="alert alert-danger">{error}</div>}
                  <div className="form-group">
                    <label htmlFor="signin-email">Email Address</label>
                    <input
                      name="email"
                      id="signin-email"
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
                    <label htmlFor="signin-password">Password</label>
                    <div className="password-view">
                      <input
                        name="password"
                        id="signin-password"
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
                  <div className="form-group form-check forgot">
                    <label className="form-check-label" htmlFor="remember-signin">
                      <input
                        id="remember-signin"
                        className="form-check-input"
                        type="checkbox"
                        name="remember"
                      />{' '}
                      Remember me
                    </label>
                    <Link to="/forgot-password" className="forgotlink">
                      Forgot your Password?
                    </Link>
                  </div>

                  <input
                    type="submit"
                    className="btn btn-info"
                    value={loading ? 'Signing In...' : 'Sign In'}
                    disabled={loading}
                  />
                  <div className="or">
                    <span>or continue with</span>
                  </div>
                  <ul className="btngroup">
                    <li>
                      <button type="button" className="btn btn-sso">
                        <img src={sso} className="img-fluid" alt="" />
                        Use Single Sign-on (SSO)
                      </button>
                    </li>
                  </ul>
                  <p className="dontaccount">
                    Don&apos;t have an account? <Link to="/signup">Sign Up</Link>
                  </p>
                </form>
              </div>
              <div className="accessdata">Your data is encrypted and access controlled.</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default SignInPage
