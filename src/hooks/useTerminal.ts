'use client';
import { useEffect, useRef, useState } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from '@xterm/addon-fit';
import { executeCommand, CommandResult } from '@/lib/commands';
import { green, red, cyan, bold, dim, RESET } from '@/lib/ansi';
import { loadAliases, saveAliases, loadMonitoredUrls, saveMonitoredUrls } from '@/lib/storage';
import 'xterm/css/xterm.css';

const TIPS = [
    "TIP: Use 'scan --deep' for a full SEO audit.",
    "TIP: Aliases can save you keystrokes. Try 'alias gs=scan google.com'",
    "TIP: 'monitor --list' shows all active background jobs.",
    "TIP: Press Up/Down arrows to cycle through command history.",
    "TIP: The 'neofetch' command displays system vitals.",
];

export function useTerminal() {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Terminal | null>(null);
    const fitAddonRef = useRef<FitAddon | null>(null);

    // State for UI
    const [statusInfo, setStatusInfo] = useState({
        monitorCount: 0,
        time: '',
    });

    // Refs for internals
    const commandRef = useRef('');
    const historyRef = useRef<string[]>([]);
    const historyIndexRef = useRef<number>(-1);
    const busyRef = useRef(false);

    // Phase 3 State
    const aliasesRef = useRef<Record<string, string>>({});
    const monitorsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

    // Interval refs
    const tipIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Definitions must come before init() due to usage

        // --- 1. HELPERS ---
        const updateStatusCount = () => {
            setStatusInfo(prev => ({
                ...prev,
                monitorCount: monitorsRef.current.size
            }));
        };

        const stopAllMonitors = () => {
            monitorsRef.current.forEach(timer => clearInterval(timer));
            monitorsRef.current.clear();
            saveMonitoredUrls([]);
            updateStatusCount();

            if (xtermRef.current) {
                // optional feedback?
            }
        };

        const startMonitor = (url: string) => {
            if (monitorsRef.current.has(url)) return;

            const interval = setInterval(async () => {
                const term = xtermRef.current;
                if (!term) return;

                try {
                    const res = await fetch(`/api/scan?url=${encodeURIComponent(url)}`);
                    const timestamp = new Date().toLocaleTimeString();

                    term.write(`\r\x1b[K`);
                    if (res.ok) {
                        term.writeln(`${dim(`[${timestamp}]`)} MONITOR: ${cyan(url)} is ${green('UP (200 OK)')}`);
                    } else {
                        term.writeln(`${dim(`[${timestamp}]`)} MONITOR: ${cyan(url)} is ${red('DOWN')}`);
                    }
                    term.write(`$ ${commandRef.current}`);
                } catch (e) {
                    // silent fail
                }
            }, 60000);

            monitorsRef.current.set(url, interval);
            updateStatusCount();

            const currentUrls = Array.from(monitorsRef.current.keys());
            saveMonitoredUrls(currentUrls);
        };

        const showLoader = async (message: string, duration: number = 2000) => {
            const term = xtermRef.current;
            if (!term) return;

            busyRef.current = true;
            const frames = ['|', '/', '-', '\\'];
            let i = 0;
            const startTime = Date.now();

            return new Promise<void>((resolve) => {
                const interval = setInterval(() => {
                    const elapsed = Date.now() - startTime;
                    if (elapsed >= duration) {
                        clearInterval(interval);
                        term.write('\r\x1b[K');
                        busyRef.current = false;
                        resolve();
                        return;
                    }
                    term.write(`\r${message} ${frames[i++ % frames.length]}`);
                }, 100);
            });
        };

        const runAsyncCommand = async (cmd: string, args: string) => {
            const term = xtermRef.current;
            if (!term) return;

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
                        const lcpVal = parseFloat(data.lcp);
                        const lcpColor = lcpVal < 2.5 ? green : red;
                        term.writeln(`LCP:       ${lcpColor(data.lcp)}`);
                        const clsVal = parseFloat(data.cls);
                        const clsColor = clsVal < 0.1 ? green : red;
                        term.writeln(`CLS:       ${clsColor(data.cls)}`);
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
            else if (cmd === 'monitor') {
                if (args === '--stop') {
                    stopAllMonitors();
                    term.writeln(green('All monitors stopped.'));
                    term.write('$ ');
                } else if (args === '--list') {
                    const active = Array.from(monitorsRef.current.keys());
                    if (active.length === 0) {
                        term.writeln(dim('No active monitors.'));
                    } else {
                        term.writeln(bold('ACTIVE MONITORS:'));
                        active.forEach(u => term.writeln(`- ${cyan(u)}`));
                    }
                    term.write('$ ');
                } else {
                    const url = args;
                    if (!url) {
                        term.writeln(red('USAGE: monitor [url]'));
                    } else {
                        startMonitor(url);
                        term.writeln(green(`Monitoring started for: ${url}`));
                    }
                    term.write('$ ');
                }
            }
        };

        const restoreSession = () => {
            const term = xtermRef.current;
            if (!term) return;

            aliasesRef.current = loadAliases();
            const aliasCount = Object.keys(aliasesRef.current).length;

            term.writeln(`${bold(green('VANGUARD TERMINAL [Version 3.0.0]'))}`);
            term.writeln(`(c) 2026 Vanguard Corp. All rights reserved.\r\n`);

            if (aliasCount > 0) {
                term.writeln(dim(`Restoring Vanguard session... [${aliasCount}] aliases found.`));
            }

            term.writeln(`Type ${cyan('help')} to list available commands.\r\n`);
            term.write('$ ');

            const savedMonitors = loadMonitoredUrls();
            savedMonitors.forEach(url => startMonitor(url));
        };

        // --- 2. INIT LOGIC ---
        const initTerminal = () => {
            if (xtermRef.current || !terminalRef.current) return;

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

            // Safe open
            term.open(terminalRef.current);
            try { fitAddon.fit(); } catch (e) { }

            xtermRef.current = term;
            fitAddonRef.current = fitAddon;

            // Bind Input
            term.onData((data) => {
                if (busyRef.current) return;

                const charCode = data.charCodeAt(0);

                if (charCode === 13) { // Enter
                    term.write('\r\n');
                    const command = commandRef.current;

                    if (command.trim()) {
                        historyRef.current.push(command);
                        historyIndexRef.current = historyRef.current.length;
                    }
                    commandRef.current = '';

                    const result: CommandResult = executeCommand(command, aliasesRef.current);

                    if (result.type === 'clear') {
                        term.clear();
                        term.write('$ ');
                    } else if (result.type === 'async') {
                        // Re-resolve for execution
                        const parts = command.trim().split(/\s+/);
                        let resolvedCmd = parts[0];
                        let resolvedArgs = parts.slice(1).join(' ');

                        if (aliasesRef.current[resolvedCmd]) {
                            const aliasParts = aliasesRef.current[resolvedCmd].split(/\s+/);
                            resolvedCmd = aliasParts[0];
                            resolvedArgs = [...aliasParts.slice(1), ...parts.slice(1)].join(' ');
                        }
                        runAsyncCommand(resolvedCmd, resolvedArgs);
                    } else if (result.type === 'text') {
                        if (result.content?.startsWith('ALIAS_SET:')) {
                            const [_, payload] = result.content.split('ALIAS_SET:');
                            const [key, val] = payload.split('|');
                            aliasesRef.current[key] = val;
                            saveAliases(aliasesRef.current);
                            term.writeln(green(`Alias set: ${bold(key)} => '${val}'`));
                        } else if (result.content?.startsWith('ALIAS_REMOVE:')) {
                            const [_, key] = result.content.split('ALIAS_REMOVE:');
                            delete aliasesRef.current[key];
                            saveAliases(aliasesRef.current);
                            term.writeln(green(`Alias removed: ${bold(key)}`));
                        } else {
                            if (result.content) term.writeln(result.content);
                        }
                        term.write('$ ');
                    } else {
                        if (result.type === 'error') term.writeln(red(result.content || 'Error'));
                        term.write('$ ');
                    }
                }
                else if (charCode === 127) { // Backspace
                    if (commandRef.current.length > 0) {
                        commandRef.current = commandRef.current.slice(0, -1);
                        term.write('\b \b');
                    }
                }
                else if (data === '\x1b[A') { // Up
                    if (historyRef.current.length > 0) {
                        if (historyIndexRef.current > 0) historyIndexRef.current--;
                        const prevCmd = historyRef.current[historyIndexRef.current];
                        term.write('\r\x1b[K$ ' + prevCmd);
                        commandRef.current = prevCmd;
                    }
                }
                else if (data === '\x1b[B') { // Down
                    if (historyIndexRef.current < historyRef.current.length) {
                        historyIndexRef.current++;
                        const nextCmd = historyIndexRef.current < historyRef.current.length ? historyRef.current[historyIndexRef.current] : '';
                        term.write('\r\x1b[K$ ' + nextCmd);
                        commandRef.current = nextCmd;
                    }
                }
                else if (charCode >= 32 && charCode !== 127) {
                    commandRef.current += data;
                    term.write(data);
                }
            });

            restoreSession();
        };


        // --- 3. LIFECYCLE ---

        // Resize Observer: Triggers init ONCE dimensions exist
        const resizeObserver = new ResizeObserver(() => {
            if (terminalRef.current && terminalRef.current.clientWidth > 0 && terminalRef.current.clientHeight > 0) {
                if (!xtermRef.current) {
                    initTerminal();
                } else {
                    try { fitAddonRef.current?.fit(); } catch (e) { }
                }
            }
        });

        if (terminalRef.current) {
            resizeObserver.observe(terminalRef.current);
        }

        // Broadcast Interval
        tipIntervalRef.current = setInterval(() => {
            if (busyRef.current || !xtermRef.current) return;
            const term = xtermRef.current;

            const randomTip = TIPS[Math.floor(Math.random() * TIPS.length)];
            term.write(`\r\x1b[K`);
            term.writeln(dim(randomTip));
            term.write(`$ ${commandRef.current}`);
        }, 300000);

        // Status Interval
        statusIntervalRef.current = setInterval(() => {
            setStatusInfo(prev => ({
                ...prev,
                time: new Date().toLocaleTimeString()
            }));
        }, 1000);

        return () => {
            resizeObserver.disconnect();
            if (tipIntervalRef.current) clearInterval(tipIntervalRef.current);
            if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
            stopAllMonitors();
            xtermRef.current?.dispose();
            xtermRef.current = null;
        };
    }, []);

    return { terminalRef, statusInfo };
}
