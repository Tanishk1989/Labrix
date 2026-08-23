export function boundedPositiveInteger(
  value: string | undefined,
  fallback: number,
  options: { min?: number; max: number },
): number {
  const min = options.min ?? 1;
  if (!value || !/^\d+$/.test(value)) return fallback;
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > options.max) {
    return fallback;
  }
  return parsed;
}
