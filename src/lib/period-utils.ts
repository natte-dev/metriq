export type PeriodType = "trimestral" | "semestral" | "anual";

export function formatYearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function getMonthsForPeriod(
  year: number,
  type: PeriodType,
  period?: number
): string[] {
  if (type === "trimestral") {
    const q = period ?? 1;
    const startMonth = (q - 1) * 3 + 1;
    return [0, 1, 2].map((i) => formatYearMonth(year, startMonth + i));
  }
  if (type === "semestral") {
    const s = period ?? 1;
    const startMonth = s === 1 ? 1 : 7;
    return Array.from({ length: 6 }, (_, i) =>
      formatYearMonth(year, startMonth + i)
    );
  }
  // anual
  return Array.from({ length: 12 }, (_, i) => formatYearMonth(year, i + 1));
}

export function getPeriodLabel(
  type: PeriodType,
  year: number,
  period?: number
): string {
  if (type === "trimestral") {
    return `Q${period ?? 1}/${year}`;
  }
  if (type === "semestral") {
    return `S${period ?? 1}/${year}`;
  }
  return `${year}`;
}

export function getCurrentQuarter(): number {
  const month = new Date().getMonth() + 1;
  return Math.ceil(month / 3);
}

export function getCurrentSemester(): number {
  const month = new Date().getMonth() + 1;
  return month <= 6 ? 1 : 2;
}

export function getCurrentYear(): number {
  return new Date().getFullYear();
}
