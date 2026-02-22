const RANGE_TO_DAYS: Record<string, number | null> = {
  "7d": 7,
  "14d": 14,
  "30d": 30,
  "90d": 90,
  "all": null,
};

export function resolveRangeDays(range?: string): number | null {
  const normalized = (range ?? "14d").trim().toLowerCase();
  return RANGE_TO_DAYS[normalized] ?? 14;
}

export function rangeStart(days: number | null): Date | null {
  if (!days) {
    return null;
  }

  const start = new Date();
  start.setUTCDate(start.getUTCDate() - (days - 1));
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

export function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}
