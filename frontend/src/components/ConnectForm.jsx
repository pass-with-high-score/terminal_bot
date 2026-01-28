import { useState } from 'react'
import PropTypes from 'prop-types'

// SVG Icons
const LockIcon = ({ width = 24, height = 24 }) => (
    <svg width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
)

const KeyIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
)

const FileKeyIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14,2 14,8 20,8" />
        <circle cx="10" cy="16" r="2" />
        <path d="m16 20-4-4" />
    </svg>
)

const FolderIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    </svg>
)

const ArrowRightIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14" />
        <path d="m12 5 7 7-7 7" />
    </svg>
)

const LoaderIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
)

const AlertCircleIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
)

const CheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20,6 9,17 4,12" />
    </svg>
)

function ConnectForm({ onConnect, error }) {
    const [host, setHost] = useState('')
    const [port, setPort] = useState('22')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [privateKey, setPrivateKey] = useState('')
    const [passphrase, setPassphrase] = useState('')
    const [authType, setAuthType] = useState('password')
    const [keyFileName, setKeyFileName] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleFileChange = (e) => {
        const file = e.target.files?.[0]
        if (file) {
            setKeyFileName(file.name)
            const reader = new FileReader()
            reader.onload = (event) => {
                setPrivateKey(event.target?.result || '')
            }
            reader.readAsText(file)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)

        const credentials = {
            host,
            port: parseInt(port, 10),
            username,
            ...(authType === 'password'
                ? { password }
                : { private_key: privateKey, passphrase: passphrase || undefined }
            )
        }

        await onConnect(credentials)
        setIsLoading(false)
    }

    const isFormValid = host && username && (
        authType === 'password' ? password : privateKey
    )

    return (
        <div className="connect-form-container">
            <form className="connect-form" onSubmit={handleSubmit}>
                <div className="form-header">
                    <LockIcon className="form-header-icon" width="28" height="28" />
                    <h2 className="form-title">SSH Connect</h2>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Host</label>
                        <input
                            type="text"
                            className="form-input"
                            placeholder="192.168.1.100"
                            value={host}
                            onChange={(e) => setHost(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group port">
                        <label className="form-label">Port</label>
                        <input
                            type="number"
                            className="form-input"
                            placeholder="22"
                            value={port}
                            onChange={(e) => setPort(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">Username</label>
                    <input
                        type="text"
                        className="form-input"
                        placeholder="root"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>

                <div className="auth-tabs">
                    <button
                        type="button"
                        className={`auth-tab ${authType === 'password' ? 'active' : ''}`}
                        onClick={() => setAuthType('password')}
                    >
                        <KeyIcon />
                        Password
                    </button>
                    <button
                        type="button"
                        className={`auth-tab ${authType === 'key' ? 'active' : ''}`}
                        onClick={() => setAuthType('key')}
                    >
                        <FileKeyIcon />
                        Private Key
                    </button>
                </div>

                {authType === 'password' ? (
                    <div className="form-group">
                        <label className="form-label">Password</label>
                        <input
                            type="password"
                            className="form-input"
                            placeholder="Enter password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                ) : (
                    <>
                        <div className="form-group">
                            <label className="form-label">Private Key File</label>
                            <div className="file-input-wrapper">
                                <input
                                    type="file"
                                    className="file-input"
                                    id="keyFile"
                                    onChange={handleFileChange}
                                    accept=".pem,.key,id_rsa,id_ed25519,id_ecdsa"
                                />
                                <label
                                    htmlFor="keyFile"
                                    className={`file-input-label ${keyFileName ? 'has-file' : ''}`}
                                >
                                    {keyFileName ? (
                                        <>
                                            <CheckIcon />
                                            {keyFileName}
                                        </>
                                    ) : (
                                        <>
                                            <FolderIcon />
                                            Choose private key file...
                                        </>
                                    )}
                                </label>
                            </div>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Passphrase (optional)</label>
                            <input
                                type="password"
                                className="form-input"
                                placeholder="Key passphrase"
                                value={passphrase}
                                onChange={(e) => setPassphrase(e.target.value)}
                            />
                        </div>
                    </>
                )}

                <button
                    type="submit"
                    className={`submit-btn ${isLoading ? 'loading' : ''}`}
                    disabled={!isFormValid || isLoading}
                >
                    {isLoading ? (
                        <>
                            <LoaderIcon />
                            Connecting...
                        </>
                    ) : (
                        <>
                            Connect
                            <ArrowRightIcon />
                        </>
                    )}
                </button>

                {error && (
                    <div className="error-message">
                        <AlertCircleIcon />
                        <span>{error}</span>
                    </div>
                )}
            </form>
        </div>
    )
}

ConnectForm.propTypes = {
    onConnect: PropTypes.func.isRequired,
    error: PropTypes.string
}

export default ConnectForm
