import { Link, useLocation } from 'react-router-dom'
import logo from '../assets/images/mainlogo.png'
import notifications from '../assets/images/notifications.svg'
import { useUser } from '../contexts/UserContext'
import { useTheme } from '../hooks/useTheme'

function Header() {
  const location = useLocation()
  const { displayName, initials } = useUser()
  const { isDarkTheme, toggleTheme } = useTheme()
  const isAuthPage = ['/signin', '/signup', '/forgot-password', '/reset-password'].includes(location.pathname)

  const renderThemeToggle = (id: string, extraClassName?: string) => (
    <div className={`modediv ${extraClassName ?? ''}`.trim()}>
      <input
        type="checkbox"
        className="checkbox"
        id={id}
        checked={isDarkTheme}
        onChange={toggleTheme}
      />
      <label htmlFor={id} className="checkbox-label">
        <i className="la la-moon"></i>
        <i className="la la-sun"></i>
        <span className="ball"></span>
      </label>
    </div>
  )

  return (
    <header className="header-sec">
      <nav className="navbar navbar-expand-lg bg-dark navbar-dark">
        <div className="container">
          <Link className="navbar-brand" to={isAuthPage ? '/signin' : '/dashboard'}>
            <img src={logo} className="img-fluid" alt="Sevi" />
          </Link>
          <div className="navrightdiv">
            {renderThemeToggle('checkbox-mobile', 'modediv-mobile')}
            {!isAuthPage && (
              <button
                className="navbar-toggler"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target="#collapsibleNavbar"
                aria-controls="collapsibleNavbar"
                aria-expanded="false"
                aria-label="Toggle navigation"
              >
                <span className="navbar-toggler-icon"></span>
              </button>
            )}
          </div>
          <div className="collapse navbar-collapse" id="collapsibleNavbar">
            {isAuthPage ? (
              <ul className="navbar-nav ms-auto">
                <li className="nav-item">{renderThemeToggle('checkbox-desktop-auth')}</li>
              </ul>
            ) : (
              <>
                <ul className="navbar-nav main-nav">
                  <li className="nav-item">
                    <Link
                      className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}
                      to="/dashboard"
                    >
                      Dashboard
                    </Link>
                  </li>
                  
                </ul>
                <ul className="navbar-nav ms-auto">
                  <li className="nav-item">{renderThemeToggle('checkbox-desktop-app')}</li>
                  <li className="nav-item navsearch">
                    <div className="searchtop">
                      <div className="input-group">
                        <i className="la la-search"></i>
                        <input type="text" className="form-control" placeholder="Search deals or alerts" />
                      </div>
                    </div>
                  </li>

                  <li className="nav-item dropdown notifications">
                    <a
                      className="nav-link dropdown-toggle"
                      href="#"
                      role="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      onClick={(e) => e.preventDefault()}
                    >
                      <img src={notifications} className="img-fluid" alt="Notifications" />
                      <span>2</span>
                    </a>
                    <ul className="dropdown-menu">
                      <li>
                        <a className="dropdown-item" href="#" onClick={(e) => e.preventDefault()}>
                          Lorem ipsum ipsum...
                        </a>
                      </li>
                      <li>
                        <a className="dropdown-item" href="#" onClick={(e) => e.preventDefault()}>
                          Lorem ipsum ipsum...
                        </a>
                      </li>
                      <li>
                        <a className="dropdown-item" href="#" onClick={(e) => e.preventDefault()}>
                          Lorem ipsum ipsum...
                        </a>
                      </li>
                    </ul>
                  </li>

                  <li className="nav-item dropdown dropdownprofile">
                    <a className="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                      <span>{initials}</span>
                    </a>
                    <ul className="dropdown-menu">
                      <li>
                        <a className="dropdown-item username" href="#">
                          {displayName}
                        </a>
                      </li>
                      <li>
                        <a className="dropdown-item" href="#">
                          <i className="la la-user"></i>My Profile
                        </a>
                      </li>
                      <li>
                        <a className="dropdown-item" href="#">
                          <i className="la la-file-invoice"></i>Reports
                        </a>
                      </li>
                      <li>
                        <Link className="dropdown-item" to="/signin">
                          <i className="la la-sign-out"></i>Log Out
                        </Link>
                      </li>
                    </ul>
                  </li>
                </ul>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  )
}

export default Header
