import React from 'react'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import MusicDashboard from './components/MusicDashboard'

function App(): React.JSX.Element {
  return (
    <AuthProvider>
      <ToastProvider>
        <ProtectedRoute>
          <MusicDashboard />
        </ProtectedRoute>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App
