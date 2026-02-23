import {
  listDepartments,
  listMonths,
  listTipoErro,
} from "@/server/actions/listas";
import { listErros } from "@/server/actions/erros";
import { listResponsaveis } from "@/server/actions/responsaveis";
import { listClientes } from "@/server/actions/clientes";
import { ErrosClientPage } from "@/components/erros/ErrosClientPage";

export default async function ErrosPage({
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

  const [data, departments, months, tipoErros, responsaveis, clientes] =
    await Promise.all([
      listErros(filters),
      listDepartments(),
      listMonths(),
      listTipoErro(),
      listResponsaveis(true),
      listClientes(true),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Erros</h1>
        <p className="text-muted-foreground">
          Registre e acompanhe os erros por departamento.
        </p>
      </div>
      <ErrosClientPage
        data={data}
        departments={departments}
        months={months}
        tipoErros={tipoErros}
        responsaveis={responsaveis}
        clientes={clientes}
        filters={filters}
      />
    </div>
  );
}