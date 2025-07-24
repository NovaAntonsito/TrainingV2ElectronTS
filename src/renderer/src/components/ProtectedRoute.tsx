import React, { ReactNode } from 'react'
import { useAuth } from '../contexts/AuthContext'
import LoginPage from './LoginPage'

interface ProtectedRouteProps {
  children: ReactNode
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, login } = useAuth()

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner-large"></div>
        <p>Cargando...</p>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />
  }

  return <>{children}</>
}

export default ProtectedRoute
