'use client';
import { useTerminal } from '@/hooks/useTerminal';
import 'xterm/css/xterm.css';

export default function TerminalComponent() {
    const { terminalRef } = useTerminal();

    return (
        <div
            ref={terminalRef}
            className="w-full h-full bg-[#0a0a0a]"
            style={{
                width: '100vw',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                justifyContent: 'flex-start',
            }}
        />
    );
}
