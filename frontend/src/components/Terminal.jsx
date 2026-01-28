import { useEffect, useRef, useCallback } from 'react'
import PropTypes from 'prop-types'
import { Terminal as XTerm } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import { WebLinksAddon } from '@xterm/addon-web-links'
import '@xterm/xterm/css/xterm.css'

function Terminal({ sessionId, onDisconnect }) {
    const terminalRef = useRef(null)
    const xtermRef = useRef(null)
    const fitAddonRef = useRef(null)
    const wsRef = useRef(null)

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
            if (xtermRef.current) {
                xtermRef.current.write('\r\n\x1b[33mConnection closed.\x1b[0m\r\n')
            }
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
            fontFamily: '"Fira Code", "SF Mono", Monaco, Menlo, "Ubuntu Mono", monospace',
            theme: {
                background: '#0d1117',
                foreground: '#e6edf3',
                cursor: '#58a6ff',
                cursorAccent: '#0d1117',
                selectionBackground: 'rgba(88, 166, 255, 0.3)',
                black: '#484f58',
                red: '#ff7b72',
                green: '#3fb950',
                yellow: '#d29922',
                blue: '#58a6ff',
                magenta: '#bc8cff',
                cyan: '#39c5cf',
                white: '#b1bac4',
                brightBlack: '#6e7681',
                brightRed: '#ffa198',
                brightGreen: '#56d364',
                brightYellow: '#e3b341',
                brightBlue: '#79c0ff',
                brightMagenta: '#d2a8ff',
                brightCyan: '#56d4dd',
                brightWhite: '#f0f6fc',
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

    return (
        <div className="terminal-container">
            <div className="terminal-wrapper" ref={terminalRef}></div>
        </div>
    )
}

Terminal.propTypes = {
    sessionId: PropTypes.string.isRequired,
    onDisconnect: PropTypes.func.isRequired
}

export default Terminal
