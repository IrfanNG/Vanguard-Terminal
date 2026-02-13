export const GREEN = '\x1b[32m';
export const RED = '\x1b[31m';
export const CYAN = '\x1b[36m';
export const BOLD = '\x1b[1m';
export const RESET = '\x1b[0m';

export const green = (text: string) => `${GREEN}${text}${RESET}`;
export const red = (text: string) => `${RED}${text}${RESET}`;
export const cyan = (text: string) => `${CYAN}${text}${RESET}`;
export const bold = (text: string) => `${BOLD}${text}${RESET}`;
