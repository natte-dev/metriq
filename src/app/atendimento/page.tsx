import {
  listDepartments,
  listMonths,
  listNotas,
} from "@/server/actions/listas";
import {
  listAtendimentos,
  getAtendimentoStats,
} from "@/server/actions/atendimentos";
import { listResponsaveis } from "@/server/actions/responsaveis";
import { listClientes } from "@/server/actions/clientes";
import { AtendimentoClientPage } from "@/components/atendimento/AtendimentoClientPage";

export default async function AtendimentoPage({
  searchParams,
}: {
  searchParams: Promise<{
    month?: string;
    department_id?: string;
    page?: string;
  }>;
}) {
  const sp = await searchParams;
  const filters = {
    month: sp.month,
    department_id: sp.department_id ? parseInt(sp.department_id) : undefined,
    page: sp.page ? parseInt(sp.page) : 1,
    limit: 20,
  };

  const [data, departments, months, notas, stats, responsaveis, clientes] =
    await Promise.all([
      listAtendimentos(filters),
      listDepartments(),
      listMonths(),
      listNotas(),
      getAtendimentoStats({
        month: filters.month,
        department_id: filters.department_id,
      }),
      listResponsaveis(true),
      listClientes(true),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Atendimento</h1>
        <p className="text-muted-foreground">
          Registre avaliacoes de atendimento por departamento.
        </p>
      </div>
      <AtendimentoClientPage
        data={data}
        departments={departments}
        months={months}
        notas={notas}
        responsaveis={responsaveis}
        clientes={clientes}
        stats={stats}
        filters={filters}
      />
    </div>
  );
}