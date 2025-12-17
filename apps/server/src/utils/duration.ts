/**
 * Tiny duration parser.
 *
 * Supports values like: 15m, 1h, 30d, 10s.
 * If you need more formats, use a library like `ms`.
 */

export function durationToMs(duration: string): number {
  const match = /^([0-9]+)\s*(s|m|h|d)$/i.exec(duration.trim());
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const value = Number(match[1]);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    case 'd':
      return value * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Unsupported duration unit: ${unit}`);
  }
}
