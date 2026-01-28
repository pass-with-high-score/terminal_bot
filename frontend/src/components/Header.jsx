import PropTypes from 'prop-types'

// Terminal Icon - cleaner design
const TerminalIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4,17 10,11 4,5" />
        <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
)

const PowerIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
        <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
)

function Header({ isConnected, connectionInfo, onDisconnect }) {
    return (
        <header className="header">
            <div className="header-title">
                <TerminalIcon />
                <span>SSH Terminal</span>
            </div>

            <div className="header-status">
                <div className="status-indicator">
                    <span className={`status-dot ${isConnected ? 'connected' : ''}`}></span>
                    <span>
                        {isConnected
                            ? `${connectionInfo?.username}@${connectionInfo?.host}`
                            : 'Disconnected'
                        }
                    </span>
                </div>

                {isConnected && (
                    <button className="disconnect-btn" onClick={onDisconnect}>
                        <PowerIcon />
                        Disconnect
                    </button>
                )}
            </div>
        </header>
    )
}

Header.propTypes = {
    isConnected: PropTypes.bool.isRequired,
    connectionInfo: PropTypes.shape({
        host: PropTypes.string,
        username: PropTypes.string
    }),
    onDisconnect: PropTypes.func.isRequired
}

export default Header
