export const ALIAS_KEY = 'vanguard_aliases';
export const MONITOR_KEY = 'vanguard_monitors';

export function loadAliases(): Record<string, string> {
    if (typeof window === 'undefined') return {};
    try {
        const raw = localStorage.getItem(ALIAS_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch (e) {
        console.error('Failed to load aliases:', e);
        return {};
    }
}

export function saveAliases(aliases: Record<string, string>) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(ALIAS_KEY, JSON.stringify(aliases));
    } catch (e) {
        console.error('Failed to save aliases:', e);
    }
}

export function loadMonitoredUrls(): string[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(MONITOR_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        console.error('Failed to load monitors:', e);
        return [];
    }
}

export function saveMonitoredUrls(urls: string[]) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(MONITOR_KEY, JSON.stringify(urls));
    } catch (e) {
        console.error('Failed to save monitors:', e);
    }
}
