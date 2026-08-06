/** Duration / time helpers */

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function ms(parts: {
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  milliseconds?: number;
}): number {
  const {
    days = 0,
    hours = 0,
    minutes = 0,
    seconds = 0,
    milliseconds = 0,
  } = parts;
  return (
    days * 86_400_000 +
    hours * 3_600_000 +
    minutes * 60_000 +
    seconds * 1_000 +
    milliseconds
  );
}

/** Parse simple TTL strings like `15m`, `7d`, `1h` */
export function parseTtl(ttl: string): number {
  const match = /^(\d+)(ms|s|m|h|d)$/.exec(ttl.trim());
  if (!match) {
    throw new Error(`Invalid TTL: ${ttl}`);
  }
  const rawValue = match[1];
  const unit = match[2];
  if (rawValue === undefined || unit === undefined) {
    throw new Error(`Invalid TTL: ${ttl}`);
  }
  const value = Number(rawValue);
  switch (unit) {
    case 'ms':
      return value;
    case 's':
      return value * 1_000;
    case 'm':
      return value * 60_000;
    case 'h':
      return value * 3_600_000;
    case 'd':
      return value * 86_400_000;
    default:
      throw new Error(`Invalid TTL unit: ${unit}`);
  }
}
