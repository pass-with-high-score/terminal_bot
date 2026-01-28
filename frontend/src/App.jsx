import { useState, useCallback } from 'react'
import ConnectForm from './components/ConnectForm'
import Terminal from './components/Terminal'
import Header from './components/Header'
import './App.css'

function App() {
  const [sessionId, setSessionId] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionInfo, setConnectionInfo] = useState(null)
  const [error, setError] = useState(null)

  const handleConnect = useCallback(async (credentials) => {
    setError(null)

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/connect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      })

      const data = await response.json()

      if (data.success) {
        setSessionId(data.session_id)
        setIsConnected(true)
        setConnectionInfo({
          host: credentials.host,
          username: credentials.username
        })
      } else {
        setError(data.message)
      }
    } catch (err) {
      setError(`Connection failed: ${err.message}`)
    }
  }, [])

  const handleDisconnect = useCallback(async () => {
    if (sessionId) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/disconnect/${sessionId}`, {
          method: 'POST',
        })
      } catch (err) {
        console.error('Disconnect error:', err)
      }
    }

    setSessionId(null)
    setIsConnected(false)
    setConnectionInfo(null)
  }, [sessionId])

  return (
    <div className="app">
      <Header
        isConnected={isConnected}
        connectionInfo={connectionInfo}
        onDisconnect={handleDisconnect}
      />

      <main className="main-content">
        {!isConnected ? (
          <ConnectForm onConnect={handleConnect} error={error} />
        ) : (
          <Terminal
            sessionId={sessionId}
            onDisconnect={handleDisconnect}
          />
        )}
      </main>
    </div>
  )
}

export default App
