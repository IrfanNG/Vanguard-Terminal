'use client';
import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { executeCommand, CommandResult } from '@/lib/commands';
import { green, red, cyan, bold, RESET } from '@/lib/ansi';
import 'xterm/css/xterm.css';

export function useTerminal() {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);

    // Command State
    const commandRef = useRef('');
    const historyRef = useRef<string[]>([]);
    const historyIndexRef = useRef<number>(-1);
    const busyRef = useRef(false);

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

        // Initial fit
        setTimeout(() => {
            try {
                fitAddon.fit();
            } catch (e) {
                console.debug('Initial fit failed:', e);
            }
        }, 100);

        // Handle Resize using ResizeObserver
        const resizeObserver = new ResizeObserver(() => {
            try {
                // Check if element is visible/has dimensions
                if (terminalRef.current && terminalRef.current.clientWidth > 0) {
                    fitAddon.fit();
                }
            } catch (e) {
                console.warn('Resize fit error:', e);
            }
        });

        if (terminalRef.current) {
            resizeObserver.observe(terminalRef.current);
        }

        xtermRef.current = term;
        fitAddonRef.current = fitAddon;

        // Welcome Message
        term.writeln(`${bold(green('VANGUARD TERMINAL [Version 2.0.0]'))}`);
        term.writeln(`(c) 2026 Vanguard Corp. All rights reserved.\r\n`);
        term.writeln(`Type ${cyan('help')} to list available commands.\r\n`);
        term.write('$ ');

        // Animated Loader
        const showLoader = async (message: string, duration: number = 2000) => {
            busyRef.current = true;
            const frames = ['|', '/', '-', '\\'];
            let i = 0;
            const startTime = Date.now();

            return new Promise<void>((resolve) => {
                const interval = setInterval(() => {
                    const elapsed = Date.now() - startTime;
                    if (elapsed >= duration) {
                        clearInterval(interval);
                        // Clear the loader line
                        term.write('\r\x1b[K');
                        busyRef.current = false;
                        resolve();
                        return;
                    }
                    term.write(`\r${message} ${frames[i++ % frames.length]}`);
                }, 100);
            });
        };

        // Async Command Execution
        const runAsyncCommand = async (cmd: string, args: string) => {
            if (cmd === 'scan') {
                const url = args;
                await showLoader(`Scanning ${url}...`, 2000);

                try {
                    const res = await fetch(`/api/scan?url=${encodeURIComponent(url)}`);
                    const data = await res.json();

                    if (!res.ok) {
                        term.writeln(red(`[ERROR] ${data.error || 'Scan failed'}`));
                    } else {
                        term.writeln(bold('SCAN RESULTS:'));
                        term.writeln(`----------------------------------------`);

                        // LCP Logic
                        const lcpVal = parseFloat(data.lcp);
                        const lcpColor = lcpVal < 2.5 ? green : red;
                        term.writeln(`LCP:       ${lcpColor(data.lcp)}`);

                        // CLS Logic
                        const clsVal = parseFloat(data.cls);
                        const clsColor = clsVal < 0.1 ? green : red;
                        term.writeln(`CLS:       ${clsColor(data.cls)}`);

                        // SEO Score Logic
                        const seoVal = data.seoScore;
                        const seoColor = seoVal >= 90 ? green : seoVal >= 50 ? cyan : red;
                        term.writeln(`SEO Score: ${seoColor(seoVal.toString())}/100`);
                        term.writeln(`----------------------------------------`);
                    }
                } catch (err) {
                    term.writeln(red(`[SYSTEM ERROR] Connection failed`));
                }

                term.write('\r\n$ ');
            }
        };

        // Input Handling
        term.onData((data) => {
            if (busyRef.current) return;

            const charCode = data.charCodeAt(0);

            // Enter key (13)
            if (charCode === 13) {
                term.write('\r\n');
                const command = commandRef.current;

                // Add to history if not empty
                if (command.trim()) {
                    historyRef.current.push(command);
                    historyIndexRef.current = historyRef.current.length;
                }

                commandRef.current = '';

                const result: CommandResult = executeCommand(command);

                if (result.type === 'clear') {
                    term.clear();
                    term.write('$ ');
                } else if (result.type === 'async') {
                    // Start async process
                    if (command.startsWith('scan')) {
                        const args = result.content || '';
                        runAsyncCommand('scan', args);
                    }
                } else {
                    if (result.type === 'error') {
                        term.writeln(red(result.content || 'Error'));
                    } else if (result.content) {
                        term.writeln(result.content);
                    }
                    term.write('$ ');
                }
            }
            // Backspace (127)
            else if (charCode === 127) {
                if (commandRef.current.length > 0) {
                    commandRef.current = commandRef.current.slice(0, -1);
                    term.write('\b \b');
                }
            }
            // Arrow Up (Escape Sequence: \x1b[A)
            else if (data === '\x1b[A') {
                if (historyRef.current.length > 0) {
                    // Move index back
                    if (historyIndexRef.current > 0) {
                        historyIndexRef.current--;
                    }

                    const prevCmd = historyRef.current[historyIndexRef.current];

                    // Clear current line
                    // Move cursor to start of input area ($ is 2 chars)
                    // We can cheat by clearing line and re-writing prompt for now or 
                    // calculate length using commandRef. No, simplistic approach:
                    // \r (carriage return) + clear line + prompt + cmd

                    term.write('\r\x1b[K$ ' + prevCmd);
                    commandRef.current = prevCmd;
                }
            }
            // Arrow Down (Escape Sequence: \x1b[B)
            else if (data === '\x1b[B') {
                if (historyIndexRef.current < historyRef.current.length) {
                    historyIndexRef.current++;

                    const nextCmd = historyIndexRef.current < historyRef.current.length
                        ? historyRef.current[historyIndexRef.current]
                        : '';

                    term.write('\r\x1b[K$ ' + nextCmd);
                    commandRef.current = nextCmd;
                }
            }
            // Printable characters
            else if (charCode >= 32 && charCode !== 127) {
                commandRef.current += data;
                term.write(data);
            }
        });

        return () => {
            resizeObserver.disconnect();
            term.dispose();
            xtermRef.current = null;
        };
    }, []); // Run once on mount

    return { terminalRef };
}
