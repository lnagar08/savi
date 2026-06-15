import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './assets/css/bootstrap.min.css'
import './assets/css/style.css'
import './assets/css/font-awesome.min.css'
import './assets/css/responsive.css'
import './assets/css/owl.carousel.min.css'
import './assets/css/line-awesome.min.css'
import './assets/js/bootstrap.bundle.min.js'
import './index.css'
import App from './App.tsx'
import { UserProvider } from './contexts/UserContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
    }
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <App />
      </UserProvider>
    </QueryClientProvider>
  </StrictMode>,
)
