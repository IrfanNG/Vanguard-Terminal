'use client';
import { useTerminal } from '@/hooks/useTerminal';
import 'xterm/css/xterm.css';

export default function TerminalComponent() {
    const { terminalRef, statusInfo } = useTerminal();

    return (
        <div
            className="w-screen h-screen bg-[#0a0a0a] flex flex-col overflow-hidden"
        >
            <div
                ref={terminalRef}
                className="flex-1 w-full"
                style={{ overflow: 'hidden' }}
            />

            {/* Status Bar */}
            <div className="h-6 w-full bg-[#111] border-t border-[#333] flex items-center justify-between px-2 text-xs font-mono text-[#666]">
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${statusInfo.monitorCount > 0 ? 'bg-green-500 animate-pulse' : 'bg-[#333]'}`}></span>
                    <span className="text-[#00ff41]">
                        {statusInfo.monitorCount} active monitor{statusInfo.monitorCount !== 1 ? 's' : ''}
                    </span>
                </div>
                <div>
                    {statusInfo.time}
                </div>
            </div>
        </div>
    );
}
