"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Label } from "@/components/ui/label";
import { ScoreBadge } from "@/components/shared/ScoreBadge";
import type { ScoreMensalRowNormalized } from "@/server/queries/score";
import { formatDecimal } from "@/lib/utils";

type Dept = { id: number; name: string };
type MonthItem = { id: number; value: string };

interface Props {
  scoreRows: ScoreMensalRowNormalized[];
  departments: Dept[];
  months: MonthItem[];
  filters: { month?: string; department_id?: number };
}

export function ScoreClientPage({ scoreRows, departments, months, filters }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 rounded-md border p-4">
        <div className="space-y-1">
          <Label className="text-xs">Mês</Label>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={filters.month ?? ""}
            onChange={(e) => setFilter("month", e.target.value)}
          >
            <option value="">Todos os meses</option>
            {months.map((m) => <option key={m.id} value={m.value}>{m.value}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Departamento</Label>
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            value={filters.department_id ?? ""}
            onChange={(e) => setFilter("department_id", e.target.value)}
          >
            <option value="">Todos</option>
            {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-3 py-2 text-left font-medium">Mês</th>
              <th className="px-3 py-2 text-left font-medium">Departamento</th>
              <th className="px-3 py-2 text-center font-medium">Concluídas</th>
              <th className="px-3 py-2 text-center font-medium">Meta</th>
              <th className="px-3 py-2 text-center font-medium">Visitação %</th>
              <th className="px-3 py-2 text-center font-medium">Atend.</th>
              <th className="px-3 py-2 text-center font-medium">Média Nota</th>
              <th className="px-3 py-2 text-center font-medium">Atend. %</th>
              <th className="px-3 py-2 text-center font-medium">Penalidades</th>
              <th className="px-3 py-2 text-center font-medium">Qualidade %</th>
              <th className="px-3 py-2 text-center font-medium">Score Final</th>
            </tr>
          </thead>
          <tbody>
            {scoreRows.map((row) => (
              <tr
                key={`${row.department_id}-${row.month}`}
                className="border-b last:border-0 hover:bg-muted/30"
              >
                <td className="px-3 py-2 font-mono">{row.month}</td>
                <td className="px-3 py-2 font-medium">{row.department_name}</td>
                <td className="px-3 py-2 text-center">{row.concluidas}</td>
                <td className="px-3 py-2 text-center">{row.meta_visitas_mes}</td>
                <td className="px-3 py-2 text-center">{formatDecimal(row.visitacao_pct)}%</td>
                <td className="px-3 py-2 text-center">{row.total_atendimentos}</td>
                <td className="px-3 py-2 text-center">{formatDecimal(row.media_nota)}</td>
                <td className="px-3 py-2 text-center">{formatDecimal(row.atendimento_pct)}%</td>
                <td className="px-3 py-2 text-center text-red-600 font-medium">
                  {row.soma_penalidades > 0 ? row.soma_penalidades : "-"}
                </td>
                <td className="px-3 py-2 text-center">{formatDecimal(row.qualidade_pct)}%</td>
                <td className="px-3 py-2 text-center">
                  <ScoreBadge score={row.score_final} />
                </td>
              </tr>
            ))}
            {scoreRows.length === 0 && (
              <tr>
                <td colSpan={11} className="px-3 py-8 text-center text-muted-foreground">
                  Sem dados de score para os filtros aplicados. Registre visitas, atendimentos e erros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {scoreRows.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Score Final = Visitação% × peso + Atendimento% × peso + Qualidade% × peso (arredondado para 2 casas)
        </p>
      )}
    </>
  );
}
