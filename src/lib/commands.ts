import { green, red, cyan, bold, RESET } from './ansi';

export type CommandResult = {
  type: 'text' | 'clear' | 'error' | 'async';
  content?: string;
};

export function executeCommand(input: string): CommandResult {
  const trimmed = input.trim();
  if (!trimmed) return { type: 'text', content: '' };

  const [cmd, ...args] = trimmed.split(/\s+/);

  switch (cmd.toLowerCase()) {
    case 'help':
      return {
        type: 'text',
        content: `
${bold('AVAILABLE COMMANDS:')}
------------------
${cyan('help')}        List available commands
${cyan('clear')}       Clear terminal buffer
${cyan('scan [url]')}  Analyze site performance & SEO
${cyan('neofetch')}    Display system information
`,
      };
    case 'clear':
      return { type: 'clear' };
    case 'scan':
      const url = args[0];
      if (!url) {
        return {
          type: 'error',
          content: `USAGE: scan [url]`,
        };
      }
      return {
        type: 'async',
        content: url,
      };
    case 'neofetch':
      const logo = [
        `      /\\      `,
        `     /  \\     `,
        `    / ⬡  \\    `,
        `   /______\\   `,
        `   |      |   `,
        `   |  \\/  |   `,
        `   |______|   `
      ];

      const stats = [
        `${cyan('OS')}:       VanguardOS v2.0`,
        `${cyan('Shell')}:    V-SH 1.0`,
        `${cyan('Kernel')}:   Obsidian 0.10.0`,
        `${cyan('Status')}:   ${green('● Online')}`,
        `${cyan('Uptime')}:   ${green('██████████')} 99.9%`,
        `${cyan('Terminal')}: Xterm.js 5.3`
      ];

      // Combine logo and stats side-by-side
      const lines = [];
      const maxRows = Math.max(logo.length, stats.length);

      for (let i = 0; i < maxRows; i++) {
        const logoLine = logo[i] || ' '.repeat(14);
        const statsLine = stats[i] || '';
        lines.push(`${logoLine}   ${statsLine}`);
      }

      return {
        type: 'text',
        content: `\r\n${lines.join('\r\n')}\r\n`,
      };
    default:
      return {
        type: 'error',
        content: `UNKNOWN COMMAND: '${cmd}'. Type 'help' for assistance.`,
      };
  }
}
