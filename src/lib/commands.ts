import { green, red, cyan, bold, dim, RESET } from './ansi';

export type CommandResult = {
  type: 'text' | 'clear' | 'error' | 'async';
  content?: string;
};

export function executeCommand(input: string, aliases: Record<string, string> = {}): CommandResult {
  const trimmed = input.trim();
  if (!trimmed) return { type: 'text', content: '' };

  // 1. Alias Resolution
  const parts = trimmed.split(/\s+/);
  const rawCmd = parts[0];
  let resolvedCmd = rawCmd;
  let resolvedArgs = parts.slice(1);

  if (aliases[rawCmd]) {
    // If alias exists, use it. simple replacement for now.
    // e.g. alias gs="scan google.com" -> input "gs" -> "scan google.com"
    const aliasContent = aliases[rawCmd];
    const aliasParts = aliasContent.split(/\s+/);
    resolvedCmd = aliasParts[0];
    resolvedArgs = [...aliasParts.slice(1), ...resolvedArgs];
  } else {
    // If no alias, use original
  }

  const cmd = resolvedCmd.toLowerCase();

  // Reconstruct args for logic that needs raw string
  const args = resolvedArgs;

  switch (cmd) {
    case 'help':
      return {
        type: 'text',
        content: `
${bold('AVAILABLE COMMANDS:')}
------------------
${cyan('help')}                  List available commands
${cyan('clear')}                 Clear terminal buffer
${cyan('scan [url]')}            Analyze site performance & SEO
${cyan('monitor [url]')}         Start real-time monitoring
${cyan('monitor --stop')}        Stop all monitors
${cyan('monitor --list')}        List active monitors
${cyan('alias [key]=[value]')}   Create command alias
${cyan('unalias [key]')}         Remove alias
${cyan('alias')}                 List all aliases
${cyan('neofetch')}              Display system information
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
        content: args.join(' '), // Pass full args string
      };
    case 'monitor':
      if (args[0] === '--stop') {
        return { type: 'async', content: '--stop' };
      }
      if (args[0] === '--list') {
        return { type: 'async', content: '--list' };
      }
      if (!args[0]) {
        return { type: 'error', content: 'USAGE: monitor [url] | --stop | --list' };
      }
      return { type: 'async', content: args[0] };

    case 'alias':
      if (args.length === 0) {
        // List aliases
        const list = Object.entries(aliases)
          .map(([k, v]) => `  ${cyan(k)} = '${v}'`)
          .join('\r\n');
        return {
          type: 'text',
          content: list ? `${bold('ACTIVE ALIASES:')}\r\n${list}` : dim('No aliases defined.'),
        };
      }
      // Set alias: alias gs=scan google.com
      // We need to parse by first '='
      // Join args back first because they might have spaces
      const fullArgs = args.join(' ');
      const eqIndex = fullArgs.indexOf('=');

      if (eqIndex === -1) {
        return { type: 'error', content: "USAGE: alias [name]=[command]" };
      }

      const key = fullArgs.substring(0, eqIndex).trim();
      const val = fullArgs.substring(eqIndex + 1).trim();

      if (!key || !val) {
        return { type: 'error', content: "Invalid alias format." };
      }

      return {
        type: 'text',
        content: `ALIAS_SET:${key}|${val}`, // Special protocol for hook to handle
      };

    case 'unalias':
      if (!args[0]) return { type: 'error', content: "USAGE: unalias [name]" };
      return {
        type: 'text',
        content: `ALIAS_REMOVE:${args[0]}`, // Special protocol
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
