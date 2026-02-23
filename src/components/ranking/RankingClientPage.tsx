"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScoreBadge } from "@/components/shared/ScoreBadge";
import type { RankingRowNormalized } from "@/server/queries/ranking";
import type { PeriodType } from "@/lib/period-utils";
import { getPeriodLabel, getCurrentYear } from "@/lib/period-utils";
import { formatDecimal, formatCurrency } from "@/lib/utils";
import { Trophy, Medal, Crown } from "lucide-react";

interface Props {
  rankingRows: RankingRowNormalized[];
  currentType: PeriodType;
  currentYear: number;
  currentPeriod?: number;
}

const CURRENT_YEAR = getCurrentYear();
const YEARS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1];

function PeriodSelector({
  type,
  year,
  period,
}: {
  type: PeriodType;
  year: number;
  period?: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function navigate(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => params.set(k, v));
    router.push(`/ranking?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border p-3">
      <div className="space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Ano</p>
        <select
          className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          value={year}
          onChange={(e) => navigate({ year: e.target.value })}
        >
          {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {type === "trimestral" && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Trimestre</p>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={period ?? 1}
            onChange={(e) => navigate({ period: e.target.value })}
          >
            {[1, 2, 3, 4].map((q) => (
              <option key={q} value={q}>Q{q} ({["Jan-Mar", "Abr-Jun", "Jul-Set", "Out-Dez"][q - 1]})</option>
            ))}
          </select>
        </div>
      )}

      {type === "semestral" && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground">Semestre</p>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={period ?? 1}
            onChange={(e) => navigate({ period: e.target.value })}
          >
            <option value={1}>S1 (Jan-Jun)</option>
            <option value={2}>S2 (Jul-Dez)</option>
          </select>
        </div>
      )}

      <div className="ml-auto">
        <Badge variant="outline" className="text-sm">
          Período: {getPeriodLabel(type, year, period)}
        </Badge>
      </div>
    </div>
  );
}

function RankingTable({
  rows,
  type,
  year,
  period,
}: {
  rows: RankingRowNormalized[];
  type: PeriodType;
  year: number;
  period?: number;
}) {
  const winner = rows.find((r) => r.is_winner);

  return (
    <div className="space-y-4">
      <PeriodSelector type={type} year={year} period={period} />

      {/* Winner Banner */}
      {winner && (
        <Card className="border-yellow-300 bg-gradient-to-r from-yellow-50 to-amber-50">
          <CardContent className="flex items-center gap-4 py-4">
            <Crown className="h-10 w-10 text-yellow-500 shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-yellow-700 font-medium">VENCEDOR — {getPeriodLabel(type, year, period)}</p>
              <p className="text-2xl font-bold text-yellow-900">{winner.department_name}</p>
              <p className="text-sm text-yellow-700">
                Score Médio: <strong>{formatDecimal(winner.score_medio)}</strong>
              </p>
            </div>
            {winner.bonus != null && winner.bonus > 0 && (
              <div className="text-right">
                <p className="text-xs text-yellow-700">Bônus</p>
                <p className="text-2xl font-bold text-yellow-900">{formatCurrency(winner.bonus)}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ranking Table */}
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2 text-center font-medium w-12">Pos.</th>
              <th className="px-3 py-2 text-left font-medium">Departamento</th>
              <th className="px-3 py-2 text-center font-medium">Score Médio</th>
              <th className="px-3 py-2 text-center font-medium">Visitação Média</th>
              <th className="px-3 py-2 text-center font-medium">Penalidades</th>
              <th className="px-3 py-2 text-center font-medium">Bônus</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.department_id}
                className={`border-b last:border-0 hover:bg-muted/30 ${
                  row.is_winner ? "bg-yellow-50" : ""
                }`}
              >
                <td className="px-3 py-2 text-center">
                  {row.rank_position === 1 ? (
                    <Trophy className="h-5 w-5 text-yellow-500 mx-auto" />
                  ) : row.rank_position === 2 ? (
                    <Medal className="h-5 w-5 text-slate-400 mx-auto" />
                  ) : row.rank_position === 3 ? (
                    <Medal className="h-5 w-5 text-amber-700 mx-auto" />
                  ) : (
                    <span className="text-muted-foreground">{row.rank_position}</span>
                  )}
                </td>
                <td className="px-3 py-2 font-medium">
                  {row.department_name}
                  {row.is_winner && (
                    <Badge variant="warning" className="ml-2 text-xs">Vencedor</Badge>
                  )}
                </td>
                <td className="px-3 py-2 text-center">
                  <ScoreBadge score={row.score_medio} />
                </td>
                <td className="px-3 py-2 text-center">{formatDecimal(row.avg_visitacao_pct)}%</td>
                <td className="px-3 py-2 text-center">
                  {row.total_penalidades > 0 ? (
                    <span className="text-red-600 font-medium">{row.total_penalidades}</span>
                  ) : (
                    <span className="text-green-600">0</span>
                  )}
                </td>
                <td className="px-3 py-2 text-center">
                  {row.bonus != null && row.bonus > 0 ? (
                    <span className="font-medium text-green-700">{formatCurrency(row.bonus)}</span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                  Sem dados de ranking para este período. Registre dados de visitas, atendimentos e erros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {rows.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Desempate: 1) Score Médio ↓ 2) Visitação Média ↓ 3) Penalidades ↑ 4) Nome Alfabético
        </p>
      )}
    </div>
  );
}

export function RankingClientPage({
  rankingRows,
  currentType,
  currentYear,
  currentPeriod,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function changeType(type: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("type", type);
    params.delete("period");
    router.push(`/ranking?${params.toString()}`);
  }

  return (
    <Tabs value={currentType} onValueChange={changeType}>
      <TabsList>
        <TabsTrigger value="trimestral">Trimestral</TabsTrigger>
        <TabsTrigger value="semestral">Semestral</TabsTrigger>
        <TabsTrigger value="anual">Anual</TabsTrigger>
      </TabsList>

      <TabsContent value="trimestral" className="mt-4">
        <RankingTable rows={rankingRows} type="trimestral" year={currentYear} period={currentPeriod} />
      </TabsContent>
      <TabsContent value="semestral" className="mt-4">
        <RankingTable rows={rankingRows} type="semestral" year={currentYear} period={currentPeriod} />
      </TabsContent>
      <TabsContent value="anual" className="mt-4">
        <RankingTable rows={rankingRows} type="anual" year={currentYear} period={currentPeriod} />
      </TabsContent>
    </Tabs>
  );
}
