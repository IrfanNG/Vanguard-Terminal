Vanguard Terminal
A high-performance, web-based systems monitoring CLI built for the 2026 developer ecosystem.

Vanguard Terminal is a minimalist, keyboard-driven dashboard that bridges the gap between traditional GUIs and professional command-line interfaces. It provides real-time website health audits, performance tracking, and persistent system monitoring through a clean, obsidian-themed terminal environment.

🚀 Features
Real-Time Performance Audits: Integrates with Google PageSpeed Insights to provide LCP, CLS, and SEO metrics directly in the terminal.

Active Monitoring (Daemon Mode): Background processes that ping URLs every 60 seconds to track uptime and response latency.

Persistent Environment: Custom aliases and monitoring settings are saved via LocalStorage, ensuring session recovery on refresh.

Advanced CLI UX: Supports command history (Up/Down arrows), ANSI color-coded outputs, and interactive loaders.

SEO & Security Checks: Built-in commands to verify SSL certificates and metadata health.

🛠️ Technical Stack
Framework: Next.js 16 (App Router)

Terminal Engine: Xterm.js

Language: TypeScript

Styling: Tailwind CSS (Minimalist Obsidian Theme)

APIs: Google PageSpeed Insights, custom Next.js API Routes

🏗️ Architecture & Challenges
Building a terminal in a modern web framework presents unique engineering hurdles. Here is how I solved them:

1. The SSR Hydration Bridge
Xterm.js is a browser-only library that requires access to the window and document objects.

Solution: Implemented Dynamic Imports with ssr: false to ensure the terminal only initializes on the client-side, preventing Next.js hydration mismatches.

2. Memory-Safe Background Tasks
Managing background "monitoring" intervals in a React environment can easily lead to memory leaks and duplicate processes.

Solution: Developed a custom useTerminal hook that utilizes the useEffect cleanup pattern. All active setInterval monitors are tracked in a registry and destroyed when the component unmounts.

3. API Security
To protect sensitive API keys (like Google PageSpeed), I avoided all client-side fetching for third-party tools.

Solution: Architected a Next.js API Gateway. The terminal sends requests to /api/scan, which handles the authenticated request server-side, keeping the ENV variables hidden from the browser.

Command,Description
neofetch,Display system information and the Vanguard Shield.
scan [url],Run a live performance and SEO audit on a website.
monitor [url],Start a real-time heartbeat monitor (60s interval).
alias [key]=[url],"Map a short name to a long URL (e.g., alias work=https://mysite.com)."
clear,Wipe the terminal buffer.
help,View all available system commands.