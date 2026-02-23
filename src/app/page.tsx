import { listMonths } from "@/server/actions/listas";
import { getDashboardData, getDashboardPeriodData } from "@/server/actions/dashboard";
import { DashboardClientPage } from "@/components/dashboard/DashboardClientPage";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    view?: string;
    month?: string;
  }>;
}) {
  const sp = await searchParams;
  const view = (sp.view ?? "month") as "month" | "3months" | "6months" | "year";
  const months = await listMonths();

  if (view === "month") {
    const currentMonthVal = sp.month ?? (months[0]?.value ?? new Date().toISOString().slice(0, 7));
    const data = await getDashboardData(currentMonthVal);
    return (
      <DashboardClientPage
        view={view}
        months={months}
        currentMonth={currentMonthVal}
        monthData={data}
        periodData={null}
      />
    );
  }

  // Period views: last 3 months, 6 months, or current year
  const now = new Date();
  let selectedMonths: string[] = [];

  if (view === "3months") {
    for (let i = 2; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      selectedMonths.push(d.toISOString().slice(0, 7));
    }
  } else if (view === "6months") {
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      selectedMonths.push(d.toISOString().slice(0, 7));
    }
  } else if (view === "year") {
    const year = now.getFullYear();
    for (let m = 1; m <= 12; m++) {
      selectedMonths.push(`${year}-${String(m).padStart(2, "0")}`);
    }
  }

  // Filter to months that exist in DB
  const monthValues = new Set(months.map((m) => m.value));
  selectedMonths = selectedMonths.filter((m) => monthValues.has(m));

  const periodData = await getDashboardPeriodData(selectedMonths);

  return (
    <DashboardClientPage
      view={view}
      months={months}
      currentMonth={sp.month ?? months[0]?.value ?? ""}
      monthData={null}
      periodData={periodData}
    />
  );
}
