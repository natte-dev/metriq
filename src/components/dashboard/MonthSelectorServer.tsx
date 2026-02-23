"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { formatMonth } from "@/lib/utils";

interface MonthSelectorServerProps {
  months: { id: number; value: string }[];
  currentMonth: string;
}

export function MonthSelectorServer({
  months,
  currentMonth,
}: MonthSelectorServerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", value);
    router.push(`/?${params.toString()}`);
  }

  return (
    <select
      value={currentMonth}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {months.map((m) => (
        <option key={m.id} value={m.value}>
          {formatMonth(m.value)}
        </option>
      ))}
    </select>
  );
}
