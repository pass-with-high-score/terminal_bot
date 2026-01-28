import { useState, useCallback, useMemo } from 'react'
import { Analytics } from '@vercel/analytics/react'
import ConnectForm from './components/ConnectForm'
import Terminal from './components/Terminal'
import Header from './components/Header'
import TabBar from './components/TabBar'
import './App.css'

let tabIdCounter = 1

function generateTabId() {
  return `tab-${++tabIdCounter}`
}

function App() {
  const [tabs, setTabs] = useState([
    { id: 'tab-1', sessionId: null, connectionInfo: null, error: null }
  ])
  const [activeTabId, setActiveTabId] = useState('tab-1')

  const activeTab = useMemo(
    () => tabs.find(tab => tab.id === activeTabId) || tabs[0],
    [tabs, activeTabId]
  )

  const updateTab = useCallback((tabId, updates) => {
    setTabs(prev => prev.map(tab =>
      tab.id === tabId ? { ...tab, ...updates } : tab
    ))
  }, [])

  const handleConnect = useCallback(async (credentials) => {
    updateTab(activeTabId, { error: null })

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
        updateTab(activeTabId, {
          sessionId: data.session_id,
          connectionInfo: {
            host: credentials.host,
            username: credentials.username
          },
          error: null
        })
      } else {
        updateTab(activeTabId, { error: data.message })
      }
    } catch (err) {
      updateTab(activeTabId, { error: `Connection failed: ${err.message}` })
    }
  }, [activeTabId, updateTab])

  const handleDisconnect = useCallback(async () => {
    const tab = tabs.find(t => t.id === activeTabId)
    if (tab?.sessionId) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/disconnect/${tab.sessionId}`, {
          method: 'POST',
        })
      } catch (err) {
        console.error('Disconnect error:', err)
      }
    }

    updateTab(activeTabId, {
      sessionId: null,
      connectionInfo: null,
      error: null
    })
  }, [activeTabId, tabs, updateTab])

  const handleAddTab = useCallback(() => {
    const newTab = {
      id: generateTabId(),
      sessionId: null,
      connectionInfo: null,
      error: null
    }
    setTabs(prev => [...prev, newTab])
    setActiveTabId(newTab.id)
  }, [])

  const handleCloseTab = useCallback(async (tabId) => {
    const tab = tabs.find(t => t.id === tabId)

    // Disconnect if connected
    if (tab?.sessionId) {
      try {
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/disconnect/${tab.sessionId}`, {
          method: 'POST',
        })
      } catch (err) {
        console.error('Disconnect error:', err)
      }
    }

    // Remove tab
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId)

      // If we're closing the active tab, switch to another
      if (tabId === activeTabId && newTabs.length > 0) {
        const closedIndex = prev.findIndex(t => t.id === tabId)
        const newActiveIndex = Math.min(closedIndex, newTabs.length - 1)
        setActiveTabId(newTabs[newActiveIndex].id)
      }

      // Ensure at least one tab exists
      if (newTabs.length === 0) {
        const newTab = {
          id: generateTabId(),
          sessionId: null,
          connectionInfo: null,
          error: null
        }
        setActiveTabId(newTab.id)
        return [newTab]
      }

      return newTabs
    })
  }, [tabs, activeTabId])

  const handleSwitchTab = useCallback((tabId) => {
    setActiveTabId(tabId)
  }, [])

  const handleRenameTab = useCallback((tabId, newName) => {
    updateTab(tabId, { customName: newName })
  }, [updateTab])

  return (
    <div className="app">
      <Header
        isConnected={!!activeTab?.sessionId}
        connectionInfo={activeTab?.connectionInfo}
        onDisconnect={handleDisconnect}
      />

      <TabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSwitchTab={handleSwitchTab}
        onCloseTab={handleCloseTab}
        onAddTab={handleAddTab}
        onRenameTab={handleRenameTab}
      />

      <main className="main-content">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={`tab-content ${tab.id === activeTabId ? 'active' : ''}`}
          >
            {!tab.sessionId ? (
              <ConnectForm
                onConnect={handleConnect}
                error={tab.error}
              />
            ) : (
              <Terminal
                sessionId={tab.sessionId}
                onDisconnect={handleDisconnect}
              />
            )}
          </div>
        ))}
      </main>
      <Analytics />
    </div>
  )
}

export default App
