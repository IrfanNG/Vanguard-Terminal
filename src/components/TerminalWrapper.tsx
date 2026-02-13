'use client';

import dynamic from 'next/dynamic';

const Terminal = dynamic(() => import('./Terminal'), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-[#0a0a0a] text-[#00ff41] p-4 font-mono flex items-center justify-center">
            INITIALIZING VANGUARD SYSTEM...
        </div>
    ),
});

export default function TerminalWrapper() {
    return <Terminal />;
}
