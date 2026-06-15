import axios from 'axios'

// Create axios instance with base URL
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Enable cookies for authentication
})

// Add response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // if (error.response?.status === 401) {
    //   // Handle unauthorized access - clear and redirect to signin
    //   window.location.href = '/signin'
    // }
    return Promise.reject(error)
  }
)

// Sign up API - expects: name, email, password
export const signUp = async (name: string, email: string, password: string) => {
  try {
    const response = await apiClient.post('/auth/signup', {
      name,
      email,
      password,
    })
    return response.data
  } catch (error) {
    throw error
  }
}

// Sign in API - expects: email, password
export const signIn = async (email: string, password: string) => {
  try {
    const response = await apiClient.post('/auth/signin', {
      email,
      password,
    })
    return response.data
  } catch (error) {
    throw error
  }
}

// Refresh token API
export const refreshToken = async () => {
  try {
    const response = await apiClient.post('/auth/refresh')
    return response.data
  } catch (error) {
    throw error
  }
}

// Get current user
export const getMe = async () => {
  try {
    const response = await apiClient.get('/auth/me')
    return response.data
  } catch (error) {
    throw error
  }
}

// Logout API
export const logout = async () => {
  try {
    const response = await apiClient.post('/auth/logout')
    return response.data
  } catch (error) {
    throw error
  }
}

export default apiClient
