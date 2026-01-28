import { useState, useCallback, useRef, useEffect } from 'react'
import PropTypes from 'prop-types'

// Key mappings for terminal - ANSI escape sequences
const SPECIAL_KEYS = {
    // Ctrl combinations
    'Ctrl': null, // Modifier only
    'Alt': null,  // Modifier only
    'Esc': '\x1b',
    'Tab': '\t',
    // Arrow keys
    '↑': '\x1b[A',
    '↓': '\x1b[B',
    '→': '\x1b[C',
    '←': '\x1b[D',
    // Special
    'Home': '\x1b[H',
    'End': '\x1b[F',
    'PgUp': '\x1b[5~',
    'PgDn': '\x1b[6~',
    'Del': '\x1b[3~',
    'Ins': '\x1b[2~',
    // Function keys
    'F1': '\x1bOP', 'F2': '\x1bOQ', 'F3': '\x1bOR', 'F4': '\x1bOS',
    'F5': '\x1b[15~', 'F6': '\x1b[17~', 'F7': '\x1b[18~', 'F8': '\x1b[19~',
    'F9': '\x1b[20~', 'F10': '\x1b[21~', 'F11': '\x1b[23~', 'F12': '\x1b[24~',
    // Common characters
    '/': '/', '|': '|', '\\': '\\', '-': '-', '_': '_', '~': '~',
    ':': ':', ';': ';', "'": "'", '"': '"', '`': '`',
    '[': '[', ']': ']', '{': '{', '}': '}',
    '<': '<', '>': '>', '&': '&', '*': '*', '$': '$',
}

// Ctrl key combinations
const CTRL_COMBOS = {
    'C': '\x03', 'D': '\x04', 'Z': '\x1a', 'L': '\x0c',
    'A': '\x01', 'E': '\x05', 'U': '\x15', 'K': '\x0b',
    'W': '\x17', 'R': '\x12', 'X': '\x18', 'V': '\x16',
}

// Alt key combinations (escape + key)
const ALT_COMBOS = {
    'B': '\x1bb', 'F': '\x1bf', 'D': '\x1bd',
}

// Termius/Termux style key rows
const KEY_ROWS = {
    main: ['Esc', 'Ctrl', 'Alt', 'Tab', '↑', '↓', '←', '→', '/', '-', '|'],
    extra: ['~', '`', '[', ']', '{', '}', '<', '>', '\\', '_', ':'],
    fn: ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'],
    nav: ['Home', 'End', 'PgUp', 'PgDn', 'Del', 'Ins'],
    // Common Ctrl/Alt combo letters shown when modifier is active
    ctrlCombo: ['C', 'D', 'Z', 'L', 'A', 'E', 'U', 'K', 'W', 'R', 'X', 'V'],
    altCombo: ['B', 'F', 'D'],
}

function VirtualKeyboard({ onKeyPress, isVisible, onToggle }) {
    const [activeModifier, setActiveModifier] = useState(null) // 'Ctrl' or 'Alt'
    const [showExtraRows, setShowExtraRows] = useState(false)
    const [currentExtraRow, setCurrentExtraRow] = useState('extra')
    const touchStartRef = useRef(null)

    // Listen for physical keyboard when modifier is active
    useEffect(() => {
        if (!activeModifier || !isVisible) return

        const handlePhysicalKeyPress = (e) => {
            const key = e.key.toUpperCase()
            let sequence = ''

            if (activeModifier === 'Ctrl' && CTRL_COMBOS[key]) {
                e.preventDefault()
                e.stopPropagation()
                sequence = CTRL_COMBOS[key]
            } else if (activeModifier === 'Alt' && ALT_COMBOS[key]) {
                e.preventDefault()
                e.stopPropagation()
                sequence = ALT_COMBOS[key]
            } else if (activeModifier === 'Alt') {
                // Alt + any key = escape sequence + key
                e.preventDefault()
                e.stopPropagation()
                sequence = '\x1b' + e.key.toLowerCase()
            }

            if (sequence) {
                onKeyPress?.(sequence)
                setActiveModifier(null)
            }
        }

        // Use capture phase to intercept before terminal
        window.addEventListener('keydown', handlePhysicalKeyPress, true)

        return () => {
            window.removeEventListener('keydown', handlePhysicalKeyPress, true)
        }
    }, [activeModifier, isVisible, onKeyPress])

    const handleKeyPress = useCallback((key) => {
        // Handle modifier toggles
        if (key === 'Ctrl' || key === 'Alt') {
            setActiveModifier(prev => prev === key ? null : key)
            return
        }

        let sequence = ''

        // If Ctrl is active and key is a letter for Ctrl combo
        if (activeModifier === 'Ctrl' && CTRL_COMBOS[key.toUpperCase()]) {
            sequence = CTRL_COMBOS[key.toUpperCase()]
            setActiveModifier(null)
        } else if (SPECIAL_KEYS[key] !== null && SPECIAL_KEYS[key] !== undefined) {
            sequence = SPECIAL_KEYS[key]
        }

        if (sequence && onKeyPress) {
            onKeyPress(sequence)
        }
    }, [activeModifier, onKeyPress])

    // Swipe gesture for arrow keys (Termius style)
    const handleTouchStart = useCallback((e) => {
        touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
    }, [])

    const handleTouchEnd = useCallback((e) => {
        if (!touchStartRef.current) return

        const deltaX = e.changedTouches[0].clientX - touchStartRef.current.x
        const deltaY = e.changedTouches[0].clientY - touchStartRef.current.y
        const threshold = 30

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            if (deltaX > threshold) onKeyPress?.(SPECIAL_KEYS['→'])
            else if (deltaX < -threshold) onKeyPress?.(SPECIAL_KEYS['←'])
        } else {
            if (deltaY > threshold) onKeyPress?.(SPECIAL_KEYS['↓'])
            else if (deltaY < -threshold) onKeyPress?.(SPECIAL_KEYS['↑'])
        }
        touchStartRef.current = null
    }, [onKeyPress])

    const renderKey = (key) => {
        const isModifier = key === 'Ctrl' || key === 'Alt'
        const isActive = isModifier && activeModifier === key
        const isArrow = ['↑', '↓', '←', '→'].includes(key)

        return (
            <button
                key={key}
                className={`tk-key ${isActive ? 'active' : ''} ${isModifier ? 'modifier' : ''} ${isArrow ? 'arrow' : ''}`}
                onClick={() => handleKeyPress(key)}
                onMouseDown={(e) => e.preventDefault()}
                onTouchStart={(e) => e.preventDefault()}
                onTouchEnd={() => handleKeyPress(key)}
            >
                {key}
            </button>
        )
    }

    if (!isVisible) {
        return (
            <button className="tk-toggle-btn" onClick={onToggle} title="Show Keyboard">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M6 16h12" />
                </svg>
            </button>
        )
    }

    return (
        <div className="termux-keyboard">
            {/* Extra rows (toggleable) */}
            {showExtraRows && (
                <div className="tk-extra-section">
                    <div className="tk-extra-tabs">
                        <button
                            className={`tk-extra-tab ${currentExtraRow === 'extra' ? 'active' : ''}`}
                            onClick={() => setCurrentExtraRow('extra')}
                            onMouseDown={(e) => e.preventDefault()}
                        >
                            Symbols
                        </button>
                        <button
                            className={`tk-extra-tab ${currentExtraRow === 'fn' ? 'active' : ''}`}
                            onClick={() => setCurrentExtraRow('fn')}
                            onMouseDown={(e) => e.preventDefault()}
                        >
                            F1-F12
                        </button>
                        <button
                            className={`tk-extra-tab ${currentExtraRow === 'nav' ? 'active' : ''}`}
                            onClick={() => setCurrentExtraRow('nav')}
                            onMouseDown={(e) => e.preventDefault()}
                        >
                            Nav
                        </button>
                    </div>
                    <div className="tk-row tk-extra-row">
                        {KEY_ROWS[currentExtraRow].map(renderKey)}
                    </div>
                </div>
            )}

            {/* Main toolbar row - always visible */}
            <div className="tk-main-bar">
                <button
                    className={`tk-expand-btn ${showExtraRows ? 'expanded' : ''}`}
                    onClick={() => setShowExtraRows(!showExtraRows)}
                    onMouseDown={(e) => e.preventDefault()}
                    title={showExtraRows ? 'Collapse' : 'More keys'}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points={showExtraRows ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
                    </svg>
                </button>

                <div
                    className="tk-row"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    {KEY_ROWS.main.map(renderKey)}
                </div>

                <button className="tk-close-btn" onClick={onToggle} onMouseDown={(e) => e.preventDefault()} title="Hide">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </div>

            {/* Modifier combo row - shows common letters when Ctrl/Alt is active */}
            {activeModifier && (
                <div className="tk-combo-section">
                    <div className="tk-combo-header">
                        <span className="tk-hint-badge">{activeModifier}</span>
                        <span>Tap a key to send {activeModifier}+key</span>
                        <button
                            className="tk-cancel-btn"
                            onClick={() => setActiveModifier(null)}
                            onMouseDown={(e) => e.preventDefault()}
                        >
                            ✕
                        </button>
                    </div>
                    <div className="tk-row tk-combo-row">
                        {(activeModifier === 'Ctrl' ? KEY_ROWS.ctrlCombo : KEY_ROWS.altCombo).map((key) => (
                            <button
                                key={key}
                                className="tk-key combo-key"
                                onClick={() => handleKeyPress(key)}
                                onMouseDown={(e) => e.preventDefault()}
                                onTouchStart={(e) => e.preventDefault()}
                                onTouchEnd={() => handleKeyPress(key)}
                            >
                                {key}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

VirtualKeyboard.propTypes = {
    onKeyPress: PropTypes.func.isRequired,
    isVisible: PropTypes.bool.isRequired,
    onToggle: PropTypes.func.isRequired
}

export default VirtualKeyboard
