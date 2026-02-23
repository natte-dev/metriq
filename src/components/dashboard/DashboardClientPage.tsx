"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreBadge } from "@/components/shared/ScoreBadge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import {
  MapPin,
  Headphones,
  AlertTriangle,
  Trophy,
  BarChart2,
  TrendingUp,
} from "lucide-react";
import { formatMonth, formatDecimal } from "@/lib/utils";

type MonthItem = { id: number; value: string };

type MonthData = {
  month: string;
  scoreRows: {
    department_id: number;
    department_name: string;
    score_final: number;
    visitacao_pct: number;
    atendimento_pct: number;
    qualidade_pct: number;
    soma_penalidades: number;
  }[];
  totalVisitas: number;
  totalAtendimentos: number;
  totalErros: number;
  scoreMediaGeral: number;
  topDept: {
    department_name: string;
    score_final: number;
    visitacao_pct: number;
    atendimento_pct: number;
    qualidade_pct: number;
  } | null;
};

type PeriodData = {
  months: string[];
  deptSummaries: {
    department_id: number;
    department_name: string;
    score_medio: number;
    visitacao_pct: number;
    atendimento_pct: number;
    qualidade_pct: number;
    soma_penalidades: number;
  }[];
  totalVisitas: number;
  totalAtendimentos: number;
  totalErros: number;
  scoreMediaGeral: number;
  topDept: {
    department_name: string;
    score_medio: number;
    visitacao_pct: number;
    atendimento_pct: number;
    qualidade_pct: number;
  } | null;
} | null;

interface Props {
  view: "month" | "3months" | "6months" | "year";
  months: MonthItem[];
  currentMonth: string;
  monthData: MonthData | null;
  periodData: PeriodData;
}

const VIEW_OPTIONS = [
  { value: "month", label: "Mensal" },
  { value: "3months", label: "3 Meses" },
  { value: "6months", label: "6 Meses" },
  { value: "year", label: "Ano Atual" },
] as const;

export function DashboardClientPage({
  view,
  months,
  currentMonth,
  monthData,
  periodData,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setView(v: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", v);
    router.push(`${pathname}?${params.toString()}`);
  }

  function setMonth(m: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", m);
    params.set("view", "month");
    router.push(`${pathname}?${params.toString()}`);
  }

  const totalVisitas =
    monthData?.totalVisitas ?? periodData?.totalVisitas ?? 0;
  const totalAtendimentos =
    monthData?.totalAtendimentos ?? periodData?.totalAtendimentos ?? 0;
  const totalErros = monthData?.totalErros ?? periodData?.totalErros ?? 0;
  const scoreMedia =
    monthData?.scoreMediaGeral ?? periodData?.scoreMediaGeral ?? 0;

  const topDeptName =
    (monthData?.topDept as { department_name: string } | null)
      ?.department_name ??
    (periodData?.topDept as { department_name: string } | null)
      ?.department_name ??
    null;

  const scoreRows = monthData?.scoreRows ?? periodData?.deptSummaries ?? [];
  const getScore = (row: typeof scoreRows[0]) =>
    "score_final" in row ? row.score_final : (row as { score_medio: number }).score_medio;

  const periodLabel =
    view === "month"
      ? formatMonth(currentMonth)
      : view === "3months"
      ? "Ultimos 3 Meses"
      : view === "6months"
      ? "Ultimos 6 Meses"
      : "Ano Atual";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Visao Geral</h1>
          <p className="text-muted-foreground">
            Metas e scores por departamento
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Periodo</Label>
            <div className="flex gap-1">
              {VIEW_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  size="sm"
                  variant={view === opt.value ? "default" : "outline"}
                  onClick={() => setView(opt.value)}
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>
          {view === "month" && (
            <div className="space-y-1">
              <Label className="text-xs">Mes</Label>
              <select
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={currentMonth}
                onChange={(e) => setMonth(e.target.value)}
              >
                {months.map((m) => (
                  <option key={m.id} value={m.value}>
                    {m.value}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Visitas</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVisitas}</div>
            <p className="text-xs text-muted-foreground">{periodLabel}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Atendimentos</CardTitle>
            <Headphones className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAtendimentos}</div>
            <p className="text-xs text-muted-foreground">{periodLabel}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erros</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalErros}</div>
            <p className="text-xs text-muted-foreground">{periodLabel}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Medio</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <ScoreBadge score={scoreMedia} />
            </div>
            <p className="text-xs text-muted-foreground">media geral</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Department */}
      {topDeptName && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 pb-2">
            <Trophy className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            <CardTitle className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
              Melhor Departamento - {periodLabel}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
              {topDeptName}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Score by department */}
      {scoreRows.length > 0 ? (
        <div>
          <h2 className="mb-4 text-xl font-semibold">
            Score por Departamento - {periodLabel}
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {scoreRows.map((row) => {
              const score = getScore(row);
              return (
                <Card key={row.department_id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-base">
                      {row.department_name}
                      <ScoreBadge score={score} />
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Visitacao</span>
                      <span>{formatDecimal(row.visitacao_pct)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Atendimento</span>
                      <span>{formatDecimal(row.atendimento_pct)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Qualidade</span>
                      <span>{formatDecimal(row.qualidade_pct)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Penalidades</span>
                      <span>{row.soma_penalidades} pts</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <TrendingUp className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Sem dados para {periodLabel}</h3>
            <p className="text-muted-foreground">
              Registre visitas, atendimentos e erros para ver o score.
            </p>
            <div className="mt-4 flex gap-2">
              <Link
                href="/visitas"
                className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
              >
                Registrar Visitas
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
