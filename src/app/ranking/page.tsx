import { getRankingWithBonus } from "@/server/queries/ranking";
import { RankingClientPage } from "@/components/ranking/RankingClientPage";
import type { PeriodType } from "@/lib/period-utils";
import {
  getCurrentYear,
  getCurrentQuarter,
  getCurrentSemester,
} from "@/lib/period-utils";

export default async function RankingPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    year?: string;
    period?: string;
  }>;
}) {
  const sp = await searchParams;
  const type = (sp.type ?? "trimestral") as PeriodType;
  const year = sp.year ? parseInt(sp.year) : getCurrentYear();
  const period =
    sp.period
      ? parseInt(sp.period)
      : type === "trimestral"
      ? getCurrentQuarter()
      : type === "semestral"
      ? getCurrentSemester()
      : undefined;

  const rankingRows = await getRankingWithBonus(type, year, period);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ranking</h1>
        <p className="text-muted-foreground">
          Classificação dos departamentos com cálculo de bônus.
        </p>
      </div>
      <RankingClientPage
        rankingRows={rankingRows}
        currentType={type}
        currentYear={year}
        currentPeriod={period}
      />
    </div>
  );
}
