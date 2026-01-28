import { useEffect, useRef, useCallback, useState } from 'react'
import PropTypes from 'prop-types'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import VirtualKeyboard from './VirtualKeyboard'
import '@xterm/xterm/css/xterm.css'

function Terminal({ sessionId, onDisconnect }) {
    const terminalRef = useRef(null)
    const xtermRef = useRef(null)
    const fitAddonRef = useRef(null)
    const wsRef = useRef(null)

    // Virtual keyboard state - show by default on touch devices
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(() => {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0
    })

    const connect = useCallback(() => {
        const wsUrl = `${import.meta.env.VITE_WS_URL || 'ws://localhost:8000'}/ws/terminal/${sessionId}`
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onopen = () => {
            console.log('WebSocket connected')
            // Send initial resize
            if (fitAddonRef.current && xtermRef.current) {
                const dims = fitAddonRef.current.proposeDimensions()
                if (dims) {
                    ws.send(JSON.stringify({
                        type: 'resize',
                        cols: dims.cols,
                        rows: dims.rows
                    }))
                }
            }
        }

        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data)

                if (message.type === 'output' && xtermRef.current) {
                    xtermRef.current.write(message.data)
                } else if (message.type === 'error') {
                    console.error('SSH Error:', message.message)
                    if (xtermRef.current) {
                        xtermRef.current.write(`\r\n\x1b[31m${message.message}\x1b[0m\r\n`)
                    }
                }
            } catch (e) {
                console.error('Failed to parse message:', e)
            }
        }

        ws.onerror = (error) => {
            console.error('WebSocket error:', error)
        }

        ws.onclose = () => {
            console.log('WebSocket disconnected')
        }

        return ws
    }, [sessionId])

    useEffect(() => {
        if (!terminalRef.current) return

        // Initialize xterm.js
        const term = new XTerm({
            cursorBlink: true,
            cursorStyle: 'block',
            fontSize: 14,
            fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", Monaco, Menlo, monospace',
            theme: {
                background: '#0F172A',
                foreground: '#F8FAFC',
                cursor: '#22C55E',
                cursorAccent: '#0F172A',
                selectionBackground: 'rgba(34, 197, 94, 0.3)',
                black: '#1E293B',
                red: '#EF4444',
                green: '#22C55E',
                yellow: '#F59E0B',
                blue: '#3B82F6',
                magenta: '#A855F7',
                cyan: '#06B6D4',
                white: '#F8FAFC',
                brightBlack: '#475569',
                brightRed: '#F87171',
                brightGreen: '#4ADE80',
                brightYellow: '#FBBF24',
                brightBlue: '#60A5FA',
                brightMagenta: '#C084FC',
                brightCyan: '#22D3EE',
                brightWhite: '#FFFFFF',
            },
            allowProposedApi: true,
        })

        const fitAddon = new FitAddon()
        const webLinksAddon = new WebLinksAddon()

        term.loadAddon(fitAddon)
        term.loadAddon(webLinksAddon)

        term.open(terminalRef.current)
        fitAddon.fit()

        xtermRef.current = term
        fitAddonRef.current = fitAddon

        // Connect WebSocket
        const ws = connect()

        // Handle terminal input
        term.onData((data) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'input', data }))
            }
        })

        // Handle resize
        const handleResize = () => {
            fitAddon.fit()
            if (ws.readyState === WebSocket.OPEN) {
                const dims = fitAddon.proposeDimensions()
                if (dims) {
                    ws.send(JSON.stringify({
                        type: 'resize',
                        cols: dims.cols,
                        rows: dims.rows
                    }))
                }
            }
        }

        window.addEventListener('resize', handleResize)

        // Initial fit after a small delay
        setTimeout(() => {
            handleResize()
        }, 100)

        // Focus terminal
        term.focus()

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize)
            ws.close()
            term.dispose()
        }
    }, [connect])

    // Handle virtual keyboard key press
    const handleVirtualKeyPress = useCallback((sequence) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({ type: 'input', data: sequence }))
        }
        // Refocus terminal after key press
        if (xtermRef.current) {
            xtermRef.current.focus()
        }
    }, [])

    const toggleKeyboard = useCallback(() => {
        setIsKeyboardVisible(prev => !prev)
    }, [])

    return (
        <div className={`terminal-container ${isKeyboardVisible ? 'keyboard-visible' : ''}`}>
            <div className="terminal-wrapper" ref={terminalRef}></div>
            <VirtualKeyboard
                onKeyPress={handleVirtualKeyPress}
                isVisible={isKeyboardVisible}
                onToggle={toggleKeyboard}
            />
        </div>
    )
}

Terminal.propTypes = {
    sessionId: PropTypes.string.isRequired,
    onDisconnect: PropTypes.func.isRequired
}

export default Terminal

