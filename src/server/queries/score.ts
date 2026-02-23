import { prisma } from "@/lib/prisma";

export type ScoreMensalRow = {
  department_id: number;
  department_name: string;
  month: string;
  concluidas: bigint | number;
  meta_visitas_mes: number;
  visitacao_pct: number;
  total_atendimentos: bigint | number;
  media_nota: number;
  escala_atendimento_max: number;
  atendimento_pct: number;
  soma_penalidades: number;
  qualidade_pct: number;
  score_final: number;
};

export type ScoreMensalRowNormalized = {
  department_id: number;
  department_name: string;
  month: string;
  concluidas: number;
  meta_visitas_mes: number;
  visitacao_pct: number;
  total_atendimentos: number;
  media_nota: number;
  escala_atendimento_max: number;
  atendimento_pct: number;
  soma_penalidades: number;
  qualidade_pct: number;
  score_final: number;
};

function normalizeRow(row: ScoreMensalRow): ScoreMensalRowNormalized {
  return {
    ...row,
    concluidas: Number(row.concluidas),
    total_atendimentos: Number(row.total_atendimentos),
    visitacao_pct: Number(row.visitacao_pct),
    media_nota: Number(row.media_nota),
    atendimento_pct: Number(row.atendimento_pct),
    soma_penalidades: Number(row.soma_penalidades),
    qualidade_pct: Number(row.qualidade_pct),
    score_final: Number(row.score_final),
    escala_atendimento_max: Number(row.escala_atendimento_max),
    meta_visitas_mes: Number(row.meta_visitas_mes),
  };
}

export async function getScoreMensal(filters?: {
  month?: string;
  department_id?: number;
}): Promise<ScoreMensalRowNormalized[]> {
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (filters?.month) {
    conditions.push("month = ?");
    values.push(filters.month);
  }
  if (filters?.department_id) {
    conditions.push("department_id = ?");
    values.push(filters.department_id);
  }

  const where =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const rows = await prisma.$queryRawUnsafe<ScoreMensalRow[]>(
    `SELECT * FROM v_score_mensal ${where} ORDER BY month DESC, department_name ASC`,
    ...values
  );

  return rows.map(normalizeRow);
}

export async function getScoreMensalForMonth(
  month: string
): Promise<ScoreMensalRowNormalized[]> {
  return getScoreMensal({ month });
}
