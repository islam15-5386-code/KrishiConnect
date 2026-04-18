export function formatBanglaNumber(value: number | string): string {
  const parsed = typeof value === 'string' ? Number(value) : value;

  if (Number.isNaN(parsed)) {
    return String(value);
  }

  return parsed.toLocaleString('bn-BD');
}
