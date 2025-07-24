import React, { useState } from 'react'
import { LoginCredentials, AuthResult } from '../../../preload/index.d'
import './LoginPage.css'

interface LoginPageProps {
  onLogin: (user: any) => void
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [validationErrors, setValidationErrors] = useState<{
    username?: string
    password?: string
  }>({})

  const validateForm = (): boolean => {
    const errors: { username?: string; password?: string } = {}

    if (!credentials.username.trim()) {
      errors.username = 'El nombre de usuario es requerido'
    }

    if (!credentials.password.trim()) {
      errors.password = 'La contraseña es requerida'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setCredentials((prev) => ({
      ...prev,
      [name]: value
    }))

    // Clear validation error when user starts typing
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: undefined
      }))
    }

    // Clear general error when user makes changes
    if (error) {
      setError('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setError('')

    try {
      console.log('LoginPage: Attempting login with credentials:', {
        username: credentials.username,
        hasPassword: !!credentials.password
      })
      console.log('LoginPage: window object keys:', Object.keys(window))
      console.log('LoginPage: window.electron available:', !!window.electron)
      console.log('LoginPage: window.preloadTest available:', !!(window as any).preloadTest)
      if ((window as any).preloadTest) {
        console.log('LoginPage: preloadTest result:', (window as any).preloadTest.test())
      }
      console.log('LoginPage: window.electron.auth available:', !!window.electron?.auth)
      console.log(
        'LoginPage: window.electron.auth.login available:',
        !!window.electron?.auth?.login
      )

      const result: AuthResult = await window.electron.auth.login(credentials)
      console.log('LoginPage: Login result received:', result)

      if (result.success && result.user) {
        console.log('LoginPage: Login successful, calling onLogin')
        onLogin(result.user)
      } else {
        console.log('LoginPage: Login failed with error:', result.error)
        setError(result.error || 'Error de autenticación')
      }
    } catch (err) {
      console.error('LoginPage: Exception caught during login:', err)
      console.error('LoginPage: Error type:', typeof err)
      console.error('LoginPage: Error message:', err instanceof Error ? err.message : String(err))
      console.error('LoginPage: Error stack:', err instanceof Error ? err.stack : 'No stack trace')
      setError('Error de conexión. Por favor, intenta nuevamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Iniciar Sesión</h1>
          <p>Accede a tu colección de música</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Nombre de Usuario</label>
            <input
              type="text"
              id="username"
              name="username"
              value={credentials.username}
              onChange={handleInputChange}
              className={validationErrors.username ? 'error' : ''}
              disabled={isLoading}
              autoComplete="username"
            />
            {validationErrors.username && (
              <span className="error-message">{validationErrors.username}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={credentials.password}
              onChange={handleInputChange}
              className={validationErrors.password ? 'error' : ''}
              disabled={isLoading}
              autoComplete="current-password"
            />
            {validationErrors.password && (
              <span className="error-message">{validationErrors.password}</span>
            )}
          </div>

          {error && <div className="error-banner">{error}</div>}

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="loading-spinner"></span>
                Iniciando sesión...
              </>
            ) : (
              'Iniciar Sesión'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
