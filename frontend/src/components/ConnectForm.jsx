import { useState } from 'react'
import PropTypes from 'prop-types'

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
                <h2 className="form-title">🔐 Connect to SSH Server</h2>

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
                        🔑 Password
                    </button>
                    <button
                        type="button"
                        className={`auth-tab ${authType === 'key' ? 'active' : ''}`}
                        onClick={() => setAuthType('key')}
                    >
                        📄 Private Key
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
                                    {keyFileName || '📁 Choose private key file...'}
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
                    className="submit-btn"
                    disabled={!isFormValid || isLoading}
                >
                    {isLoading ? '⏳ Connecting...' : '🚀 Connect'}
                </button>

                {error && (
                    <div className="error-message">
                        ❌ {error}
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
