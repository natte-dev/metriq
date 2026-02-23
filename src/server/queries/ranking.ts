import { prisma } from "@/lib/prisma";
import type { PeriodType } from "@/lib/period-utils";
import { getMonthsForPeriod } from "@/lib/period-utils";

export type RankingRow = {
  rank_position: bigint | number;
  department_id: number;
  department_name: string;
  score_medio: number;
  avg_visitacao_pct: number;
  total_penalidades: number;
  is_winner: number | boolean;
  bonus?: number | null;
};

export type RankingRowNormalized = {
  rank_position: number;
  department_id: number;
  department_name: string;
  score_medio: number;
  avg_visitacao_pct: number;
  total_penalidades: number;
  is_winner: boolean;
  bonus?: number | null;
};

function normalizeRow(row: RankingRow): RankingRowNormalized {
  return {
    ...row,
    rank_position: Number(row.rank_position),
    score_medio: Number(row.score_medio),
    avg_visitacao_pct: Number(row.avg_visitacao_pct),
    total_penalidades: Number(row.total_penalidades),
    is_winner: Boolean(row.is_winner),
    bonus: row.bonus != null ? Number(row.bonus) : null,
  };
}

export async function getRanking(months: string[]): Promise<RankingRowNormalized[]> {
  if (months.length === 0) return [];

  const placeholders = months.map(() => "?").join(",");

  const rows = await prisma.$queryRawUnsafe<RankingRow[]>(
    `
    WITH period_scores AS (
      SELECT
        department_id,
        department_name,
        month,
        score_final,
        visitacao_pct,
        soma_penalidades
      FROM v_score_mensal
      WHERE month IN (${placeholders})
    ),
    aggregated AS (
      SELECT
        department_id,
        department_name,
        ROUND(AVG(score_final), 2)       AS score_medio,
        ROUND(AVG(visitacao_pct), 4)     AS avg_visitacao_pct,
        SUM(soma_penalidades)            AS total_penalidades
      FROM period_scores
      GROUP BY department_id, department_name
    ),
    ranked AS (
      SELECT
        department_id,
        department_name,
        score_medio,
        avg_visitacao_pct,
        total_penalidades,
        ROW_NUMBER() OVER (
          ORDER BY
            score_medio         DESC,
            avg_visitacao_pct   DESC,
            total_penalidades   ASC,
            department_name     ASC
        ) AS rank_position
      FROM aggregated
    )
    SELECT
      rank_position,
      department_id,
      department_name,
      score_medio,
      avg_visitacao_pct,
      total_penalidades,
      CASE
        WHEN rank_position = 1 AND score_medio > 0
        THEN TRUE ELSE FALSE
      END AS is_winner
    FROM ranked
    ORDER BY rank_position
    `,
    ...months
  );

  return rows.map(normalizeRow);
}

export async function getRankingWithBonus(
  type: PeriodType,
  year: number,
  period?: number
): Promise<RankingRowNormalized[]> {
  const months = getMonthsForPeriod(year, type, period);
  const [rows, params] = await Promise.all([
    getRanking(months),
    prisma.appParams.findFirst(),
  ]);

  const bonusMap: Record<PeriodType, number> = {
    trimestral: Number(params?.bonus_trimestral ?? 0),
    semestral: Number(params?.bonus_semestral ?? 0),
    anual: Number(params?.bonus_anual ?? 0),
  };

  return rows.map((row) => ({
    ...row,
    bonus: row.is_winner ? bonusMap[type] : null,
  }));
}
