import {
  listDepartments,
  listMonths,
  listStatusVisita,
  listSemanas,
  listNotas,
  listTipoErro,
  listDepartmentPasswords,
} from "@/server/actions/listas";
import { listResponsaveis } from "@/server/actions/responsaveis";
import { listClientes } from "@/server/actions/clientes";
import { ListasClientPage } from "@/components/listas/ListasClientPage";

export default async function ListasPage() {
  const [departments, months, statusVisita, semanas, notas, tipoErro, responsaveis, clientes, deptPasswords] =
    await Promise.all([
      listDepartments(),
      listMonths(),
      listStatusVisita(),
      listSemanas(),
      listNotas(),
      listTipoErro(),
      listResponsaveis(),
      listClientes(),
      listDepartmentPasswords(),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Listas</h1>
        <p className="text-muted-foreground">
          Gerencie todas as listas usadas nos formularios do sistema.
        </p>
      </div>
      <ListasClientPage
        departments={departments}
        months={months}
        statusVisita={statusVisita}
        semanas={semanas}
        notas={notas}
        tipoErro={tipoErro}
        responsaveis={responsaveis}
        clientes={clientes}
        deptPasswords={deptPasswords}
      />
    </div>
  );
}