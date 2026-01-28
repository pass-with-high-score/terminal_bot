import { useState } from 'react'
import PropTypes from 'prop-types'

// Icons
const CloseIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
)

const PlusIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
)

const TerminalIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4,17 10,11 4,5" />
        <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
)

function TabBar({ tabs, activeTabId, onSwitchTab, onCloseTab, onAddTab, onRenameTab }) {
    const [editingTabId, setEditingTabId] = useState(null)
    const [editValue, setEditValue] = useState('')

    const handleDoubleClick = (tab) => {
        setEditingTabId(tab.id)
        setEditValue(tab.customName || '')
    }

    const handleFinishEdit = (tabId) => {
        if (editValue.trim()) {
            onRenameTab(tabId, editValue.trim())
        }
        setEditingTabId(null)
        setEditValue('')
    }

    const handleKeyDown = (e, tabId) => {
        if (e.key === 'Enter') {
            handleFinishEdit(tabId)
        } else if (e.key === 'Escape') {
            setEditingTabId(null)
            setEditValue('')
        }
    }

    const getTabTitle = (tab) => {
        if (tab.customName) return tab.customName
        if (tab.connectionInfo) {
            return `${tab.connectionInfo.username}@${tab.connectionInfo.host}`
        }
        return 'New Connection'
    }

    return (
        <div className="tab-bar">
            <div className="tab-list">
                {tabs.map((tab) => (
                    <div
                        key={tab.id}
                        className={`tab-item ${tab.id === activeTabId ? 'active' : ''} ${tab.sessionId ? 'connected' : ''}`}
                        onClick={() => onSwitchTab(tab.id)}
                        onDoubleClick={() => handleDoubleClick(tab)}
                    >
                        <TerminalIcon />
                        {editingTabId === tab.id ? (
                            <input
                                type="text"
                                className="tab-rename-input"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => handleFinishEdit(tab.id)}
                                onKeyDown={(e) => handleKeyDown(e, tab.id)}
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                                placeholder={getTabTitle(tab)}
                            />
                        ) : (
                            <span className="tab-title">{getTabTitle(tab)}</span>
                        )}
                        {tabs.length > 1 && (
                            <button
                                className="tab-close-btn"
                                onClick={(e) => {
                                    e.stopPropagation()
                                    onCloseTab(tab.id)
                                }}
                                title="Close tab"
                            >
                                <CloseIcon />
                            </button>
                        )}
                    </div>
                ))}
            </div>
            <button className="tab-add-btn" onClick={onAddTab} title="New connection">
                <PlusIcon />
            </button>
        </div>
    )
}

TabBar.propTypes = {
    tabs: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            sessionId: PropTypes.string,
            customName: PropTypes.string,
            connectionInfo: PropTypes.shape({
                host: PropTypes.string,
                username: PropTypes.string
            })
        })
    ).isRequired,
    activeTabId: PropTypes.string.isRequired,
    onSwitchTab: PropTypes.func.isRequired,
    onCloseTab: PropTypes.func.isRequired,
    onAddTab: PropTypes.func.isRequired,
    onRenameTab: PropTypes.func.isRequired
}

export default TabBar
