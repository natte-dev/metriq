"use server";

import { prisma } from "@/lib/prisma";
import { getScoreMensalForMonth } from "@/server/queries/score";

export async function getDashboardData(month: string) {
  const [scoreRows, totalVisitas, totalAtendimentos, totalErros] =
    await Promise.all([
      getScoreMensalForMonth(month),
      prisma.visita.count({ where: { month } }),
      prisma.atendimento.count({ where: { month } }),
      prisma.erro.count({ where: { month } }),
    ]);

  const scoreMediaGeral =
    scoreRows.length > 0
      ? scoreRows.reduce((sum, r) => sum + r.score_final, 0) / scoreRows.length
      : 0;

  const topDept =
    scoreRows.length > 0
      ? scoreRows.reduce((best, r) =>
          r.score_final > best.score_final ? r : best
        )
      : null;

  return {
    month,
    scoreRows,
    totalVisitas,
    totalAtendimentos,
    totalErros,
    scoreMediaGeral: Math.round(scoreMediaGeral * 100) / 100,
    topDept,
  };
}

export async function getDashboardPeriodData(months: string[]) {
  if (months.length === 0) return null;

  const whereMonths = { month: { in: months } };

  const [scoreRows, totalVisitas, totalAtendimentos, totalErros] =
    await Promise.all([
      Promise.all(months.map((m) => getScoreMensalForMonth(m))).then((all) =>
        all.flat()
      ),
      prisma.visita.count({ where: whereMonths }),
      prisma.atendimento.count({ where: whereMonths }),
      prisma.erro.count({ where: whereMonths }),
    ]);

  // Group scores by department and compute averages
  const deptMap = new Map<
    number,
    {
      department_id: number;
      department_name: string;
      scores: number[];
      visitacao_pcts: number[];
      atendimento_pcts: number[];
      qualidade_pcts: number[];
      soma_penalidades: number;
    }
  >();

  for (const row of scoreRows) {
    const existing = deptMap.get(row.department_id);
    if (existing) {
      existing.scores.push(row.score_final);
      existing.visitacao_pcts.push(row.visitacao_pct);
      existing.atendimento_pcts.push(row.atendimento_pct);
      existing.qualidade_pcts.push(row.qualidade_pct);
      existing.soma_penalidades += row.soma_penalidades;
    } else {
      deptMap.set(row.department_id, {
        department_id: row.department_id,
        department_name: row.department_name,
        scores: [row.score_final],
        visitacao_pcts: [row.visitacao_pct],
        atendimento_pcts: [row.atendimento_pct],
        qualidade_pcts: [row.qualidade_pct],
        soma_penalidades: row.soma_penalidades,
      });
    }
  }

  const avg = (arr: number[]) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

  const deptSummaries = Array.from(deptMap.values()).map((d) => ({
    department_id: d.department_id,
    department_name: d.department_name,
    score_medio: Math.round(avg(d.scores) * 100) / 100,
    visitacao_pct: Math.round(avg(d.visitacao_pcts) * 100) / 100,
    atendimento_pct: Math.round(avg(d.atendimento_pcts) * 100) / 100,
    qualidade_pct: Math.round(avg(d.qualidade_pcts) * 100) / 100,
    soma_penalidades: d.soma_penalidades,
  }));

  const scoreMediaGeral =
    deptSummaries.length > 0 ? avg(deptSummaries.map((d) => d.score_medio)) : 0;

  const topDept =
    deptSummaries.length > 0
      ? deptSummaries.reduce((best, r) =>
          r.score_medio > best.score_medio ? r : best
        )
      : null;

  return {
    months,
    deptSummaries,
    totalVisitas,
    totalAtendimentos,
    totalErros,
    scoreMediaGeral: Math.round(scoreMediaGeral * 100) / 100,
    topDept,
  };
}
