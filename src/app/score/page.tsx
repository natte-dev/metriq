import { getScoreMensal } from "@/server/queries/score";
import { listDepartments, listMonths } from "@/server/actions/listas";
import { ScoreClientPage } from "@/components/score/ScoreClientPage";

export default async function ScorePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string; department_id?: string }>;
}) {
  const sp = await searchParams;
  const filters = {
    month: sp.month,
    department_id: sp.department_id ? parseInt(sp.department_id) : undefined,
  };

  const [scoreRows, departments, months] = await Promise.all([
    getScoreMensal(filters),
    listDepartments(),
    listMonths(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Score Mensal</h1>
        <p className="text-muted-foreground">
          Pontuação calculada por departamento e mês conforme as fórmulas da planilha.
        </p>
      </div>
      <ScoreClientPage
        scoreRows={scoreRows}
        departments={departments}
        months={months}
        filters={filters}
      />
    </div>
  );
}
