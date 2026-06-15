import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom'
import Footer from './components/Footer'
import Header from './components/Header'
import CreateDealPage from './pages/CreateDealPage'
import DashboardPage from './pages/DashboardPage'
import DealAnalysisPage from './pages/DealAnalysisPage'
import DealAnalysisDetailsPage from './pages/DealAnalysisDetailsPage'
import DealReportPage from './pages/DealReportPage'
import DealReportAiPage from './pages/DealReportAiPage'
import ExtractionReviewPage from './pages/ExtractionReviewPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
import { useUser } from './contexts/UserContext'

function AppLayout() {
  return (
    <div className="app-layout">
      <Header />
      <Outlet />
      <Footer />
    </div>
  )
}

const ProtectedRoute = () => {
  const { user, isLoading } = useUser()

  if (isLoading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    )
  }

  if (!user && !isLoading) {
    return <Navigate to="/signin" replace />
  }

  return (
    <div className="app-layout">
      <Header />
      <Outlet />
      <Footer />
    </div>
  )
}


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/signin" replace />} />
        <Route element={<AppLayout />}>
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Route>
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/deal-analysis" element={<DealAnalysisPage />} />
          <Route path="/deal-analysis-details" element={<DealAnalysisDetailsPage />} />
          <Route path="/deal-report" element={<DealReportPage />} />
          <Route path="/deal-reportai" element={<DealReportAiPage />} />
          <Route path="/create-deal" element={<CreateDealPage />} />
          <Route path="/extraction-review" element={<ExtractionReviewPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
