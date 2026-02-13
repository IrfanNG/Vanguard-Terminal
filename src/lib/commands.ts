export type CommandResult = {
  type: 'text' | 'clear' | 'error';
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
        content: `AVAILABLE COMMANDS:
------------------
help        List available commands
clear       Clear terminal buffer
scan [url]  Perform mock site health scan
`,
      };
    case 'clear':
      return { type: 'clear' };
    case 'scan':
      const url = args[0];
      if (!url) {
        return {
          type: 'error',
          content: 'USAGE: scan [url]',
        };
      }
      return {
        type: 'text',
        content: `Initializing Vanguard Scan on ${url}...\r\n[SUCCESS] Site is healthy.`,
      };
    default:
      return {
        type: 'error',
        content: `UNKNOWN COMMAND: '${cmd}'. Type 'help' for assistance.`,
      };
  }
}
