'use client';
import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { executeCommand } from '@/lib/commands';
import 'xterm/css/xterm.css';

export function useTerminal() {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);
    const commandRef = useRef('');

    useEffect(() => {
        if (!terminalRef.current || xtermRef.current) return;

        // Initialize Terminal
        const term = new Terminal({
            cursorBlink: true,
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 14,
            theme: {
                background: '#0a0a0a',
                foreground: '#00ff41',
                cursor: '#00ff41',
                selectionBackground: 'rgba(0, 255, 65, 0.3)',
            },
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);

        term.open(terminalRef.current);

        // Ensure DOM is ready for measurement
        requestAnimationFrame(() => {
            try {
                fitAddon.fit();
            } catch (e) {
                console.warn('Initial fit failed, retrying...', e);
                // Fallback retry
                setTimeout(() => {
                    try { fitAddon.fit(); } catch (e2) { console.error('Fit retry failed:', e2); }
                }, 100);
            }
        });

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        // Welcome Message
        term.writeln('\x1b[1;32mVANGUARD TERMINAL [Version 1.0.0]\x1b[0m');
        term.writeln('(c) 2026 Vanguard Corp. All rights reserved.\r\n');
        term.writeln('Type "help" to list available commands.\r\n');
        term.write('$ ');

        // Handle Resize
        const handleResize = () => {
            try {
                fitAddon.fit();
            } catch (e) {
                console.error('Resize error:', e);
            }
        };
        window.addEventListener('resize', handleResize);

        // Input Handling
        term.onData((data) => {
            const charCode = data.charCodeAt(0);

            // Enter key (13)
            if (charCode === 13) {
                term.write('\r\n');
                const command = commandRef.current;
                commandRef.current = '';

                const result = executeCommand(command);

                if (result.type === 'clear') {
                    term.clear();
                } else {
                    if (result.type === 'error') {
                        term.writeln(`\x1b[31m${result.content}\x1b[0m`); // Red for error
                    } else if (result.content) {
                        term.writeln(result.content);
                    }
                }

                term.write('$ ');
            }
            // Backspace (127)
            else if (charCode === 127) {
                if (commandRef.current.length > 0) {
                    commandRef.current = commandRef.current.slice(0, -1);
                    term.write('\b \b');
                }
            }
            // Printable characters
            else if (charCode >= 32) {
                commandRef.current += data;
                term.write(data);
            }
        });

        return () => {
            window.removeEventListener('resize', handleResize);
            term.dispose();
            xtermRef.current = null;
        };
    }, []); // Run once on mount

    return { terminalRef };
}
